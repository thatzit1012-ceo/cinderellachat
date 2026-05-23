function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`connected: ${socket.id}`);

    // 방 입장
    socket.on('room:join', ({ roomId, nickname, userToken }) => {
      socket.join(roomId);
      socket.to(roomId).emit('room:user_joined', { nickname });
      // TODO: DB 유저 상태 업데이트, 방 인원 초과 시 watching 전환
    });

    // 메시지 전송
    socket.on('message:send', ({ roomId, content, userToken, nickname }) => {
      const message = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        nickname,
        content,
        createdAt: new Date().toISOString(),
        isWhisper: false,
      };
      io.to(roomId).emit('message:receive', message);
      // TODO: DB 저장
    });

    // 귓속말
    socket.on('whisper:send', ({ targetSocketId, content, nickname }) => {
      socket.to(targetSocketId).emit('whisper:receive', { from: nickname, content });
      // TODO: 하루 5회 제한 검증
    });

    // 방 퇴장
    socket.on('room:leave', ({ roomId, nickname }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('room:user_left', { nickname });
      // TODO: DB 유저 상태 업데이트, 방장 승계
    });

    socket.on('disconnect', () => {
      console.log(`disconnected: ${socket.id}`);
    });
  });
}

module.exports = registerSocketHandlers;
