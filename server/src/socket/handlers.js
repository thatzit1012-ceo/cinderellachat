const {
  getOrCreateTodaySession,
  getOrCreateRoom,
  getRoomById,
  incrementRoomCount,
  decrementRoomCount,
  createUser,
  getUserByToken,
  setUserLeft,
  getFirstWatchingUser,
  promoteWatcher,
  getHostOfRoom,
  incrementWhisperCount,
  saveMessage,
  updateMessageTranslations,
  getRecentMessages,
} = require('../db/queries');
const { getKSTDateString } = require('../utils/time');
const { translateToAll } = require('../utils/translate');

// socketId → { userToken, roomId, nickname, isWatching } 매핑 (메모리)
const socketMap = new Map();

async function broadcastRoomUsers(io, roomId) {
  const users = [];
  for (const [sid, ctx] of socketMap.entries()) {
    if (ctx.roomId === roomId) {
      users.push({ socketId: sid, nickname: ctx.nickname, isWatching: ctx.isWatching });
    }
  }
  const host = await getHostOfRoom(roomId);
  const result = users.map(u => ({
    ...u,
    isHost: !u.isWatching && host?.nickname === u.nickname,
  }));
  io.to(roomId).emit('room:users', result);
}

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {

    // ── 방 입장 ────────────────────────────────────────────
    socket.on('room:join', async ({ roomId, nickname, userToken }) => {
      try {
        const sessionId = getKSTDateString();
        const session = await getOrCreateTodaySession();
        const room = await getOrCreateRoom(roomId, {}, sessionId, session.max_per_room);

        const isWatching = room.current_count >= room.max_count;

        await createUser(userToken, nickname, roomId, sessionId, isWatching);

        if (!isWatching) {
          await incrementRoomCount(roomId);
        }

        socketMap.set(socket.id, { userToken, roomId, nickname, isWatching });
        socket.join(roomId);

        // 입장한 유저에게 최근 메시지 전달
        const history = await getRecentMessages(roomId);
        socket.emit('room:history', { history, isWatching });

        // 방 전체에 입장 알림
        socket.to(roomId).emit('room:user_joined', { nickname, isWatching });

        // 현재 방 인원 수 브로드캐스트
        const updatedRoom = await getRoomById(roomId);
        io.to(roomId).emit('room:count_updated', {
          currentCount: updatedRoom.current_count,
          maxCount: updatedRoom.max_count,
        });

        await broadcastRoomUsers(io, roomId);
      } catch (err) {
        console.error('room:join error:', err.message);
        socket.emit('error', { message: 'join_failed' });
      }
    });

    // ── 메시지 전송 ─────────────────────────────────────────
    socket.on('message:send', async ({ content }) => {
      try {
        const ctx = socketMap.get(socket.id);
        if (!ctx) return;

        const { userToken, roomId, nickname } = ctx;
        const user = await getUserByToken(userToken);
        if (!user || user.status !== 'active') return;

        if (!content || typeof content !== 'string') return;
        const trimmed = content.trim().slice(0, 140);
        if (!trimmed) return;

        const msg = await saveMessage(roomId, userToken, nickname, trimmed);

        io.to(roomId).emit('message:receive', {
          id: msg.message_id,
          nickname,
          content: trimmed,
          translations: {},
          createdAt: msg.created_at,
          isWhisper: false,
        });

        // 백그라운드 번역 (메시지 전송 속도에 영향 없음)
        translateToAll(trimmed).then(async (translations) => {
          if (Object.keys(translations).length === 0) return;
          await updateMessageTranslations(msg.message_id, translations);
          io.to(roomId).emit('message:translated', { id: msg.message_id, translations });
        }).catch((err) => console.error('translate error:', err.message));
      } catch (err) {
        console.error('message:send error:', err.message);
      }
    });

    // ── 귓속말 ─────────────────────────────────────────────
    socket.on('whisper:send', async ({ targetSocketId, content }) => {
      try {
        const ctx = socketMap.get(socket.id);
        if (!ctx) return;

        const { userToken, roomId, nickname } = ctx;
        const user = await getUserByToken(userToken);
        if (!user || user.status !== 'active') return;

        const targetCtx = socketMap.get(targetSocketId);
        if (!targetCtx || targetCtx.roomId !== roomId) return;

        const whisperCount = await incrementWhisperCount(userToken);
        if (whisperCount > 5) {
          socket.emit('whisper:limit_reached');
          return;
        }

        const trimmed = content?.trim().slice(0, 140);
        if (!trimmed) return;

        await saveMessage(roomId, userToken, nickname, trimmed, true, targetCtx.userToken);

        const whisperMsg = {
          id: Date.now().toString(),
          nickname,
          content: trimmed,
          createdAt: new Date().toISOString(),
          isWhisper: true,
          remainingCount: 5 - whisperCount,
        };
        socket.emit('whisper:receive', whisperMsg);
        io.to(targetSocketId).emit('whisper:receive', { ...whisperMsg, from: nickname });
      } catch (err) {
        console.error('whisper:send error:', err.message);
      }
    });

    // ── 방장 강퇴 ──────────────────────────────────────────
    socket.on('room:kick', async ({ targetSocketId }) => {
      try {
        const ctx = socketMap.get(socket.id);
        if (!ctx) return;

        const { userToken, roomId, nickname } = ctx;
        const host = await getHostOfRoom(roomId);
        if (host?.user_token !== userToken) {
          socket.emit('error', { message: 'not_host' });
          return;
        }

        const targetCtx = socketMap.get(targetSocketId);
        if (!targetCtx || targetCtx.roomId !== roomId) return;
        if (targetSocketId === socket.id) return;

        io.to(targetSocketId).emit('room:kicked', { by: nickname });
      } catch (err) {
        console.error('room:kick error:', err.message);
      }
    });

    // ── 퇴장 ───────────────────────────────────────────────
    socket.on('room:leave', async () => {
      await handleLeave(socket, io);
    });

    socket.on('disconnect', async () => {
      await handleLeave(socket, io);
    });

    // ── 자정 강제 종료 (Lambda → Redis pub/sub → 서버) ─────
    // 서버에서 직접 브로드캐스트로도 처리
    socket.on('admin:midnight_close', () => {
      io.emit('midnight:close');
    });
  });
}

async function handleLeave(socket, io) {
  const ctx = socketMap.get(socket.id);
  if (!ctx) return;

  const { userToken, roomId, nickname } = ctx;
  socketMap.delete(socket.id);

  try {
    const user = await getUserByToken(userToken);
    if (!user || user.status === 'left') return;

    await setUserLeft(userToken);

    if (user.status === 'active') {
      await decrementRoomCount(roomId);

      // 대기자가 있으면 자동 승격
      const watcher = await getFirstWatchingUser(roomId);
      if (watcher) {
        await promoteWatcher(watcher.user_token);
        await incrementRoomCount(roomId);

        for (const [sid, sctx] of socketMap.entries()) {
          if (sctx.userToken === watcher.user_token) {
            socketMap.set(sid, { ...sctx, isWatching: false });
            break;
          }
        }

        io.to(roomId).emit('room:watcher_promoted', { nickname: watcher.nickname });
      }
    }

    socket.to(roomId).emit('room:user_left', { nickname });

    const updatedRoom = await getRoomById(roomId);
    if (updatedRoom) {
      io.to(roomId).emit('room:count_updated', {
        currentCount: updatedRoom.current_count,
        maxCount: updatedRoom.max_count,
      });
    }

    await broadcastRoomUsers(io, roomId);
  } catch (err) {
    console.error('handleLeave error:', err.message);
  }
}

module.exports = registerSocketHandlers;
