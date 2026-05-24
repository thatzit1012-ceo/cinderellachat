import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export function useSocket({
  roomId, userToken, nickname,
  onHistory, onMessage, onUserJoined, onUserLeft,
  onWatcherPromoted, onCountUpdated, onMidnight,
  onUsersList, onKicked,
}) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userToken) return;

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.emit('room:join', { roomId, nickname, userToken });

    socket.on('room:history',          onHistory);
    socket.on('message:receive',       onMessage);
    socket.on('whisper:receive',       onMessage);
    socket.on('room:user_joined',      onUserJoined);
    socket.on('room:user_left',        onUserLeft);
    socket.on('room:watcher_promoted', onWatcherPromoted);
    socket.on('room:count_updated',    onCountUpdated);
    socket.on('midnight:close',        onMidnight);
    socket.on('room:users',            onUsersList);
    socket.on('room:kicked',           onKicked);

    return () => {
      socket.emit('room:leave');
      socket.disconnect();
    };
  }, [roomId, userToken]);

  const sendMessage = useCallback((content) => {
    socketRef.current?.emit('message:send', { content });
  }, []);

  const sendWhisper = useCallback((targetSocketId, content) => {
    socketRef.current?.emit('whisper:send', { targetSocketId, content });
  }, []);

  const sendKick = useCallback((targetSocketId) => {
    socketRef.current?.emit('room:kick', { targetSocketId });
  }, []);

  return { sendMessage, sendWhisper, sendKick };
}
