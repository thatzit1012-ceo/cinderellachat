import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export function useSocket({ roomId, userToken, nickname, onMessage, onUserJoined, onUserLeft, onMidnight }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userToken) return;

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.emit('room:join', { roomId, nickname, userToken });

    socket.on('message:receive', onMessage);
    socket.on('whisper:receive', onMessage);
    socket.on('room:user_joined', onUserJoined);
    socket.on('room:user_left', onUserLeft);
    socket.on('midnight:close', onMidnight);

    return () => {
      socket.emit('room:leave', { roomId, nickname });
      socket.disconnect();
    };
  }, [roomId, userToken]);

  const sendMessage = useCallback((content) => {
    socketRef.current?.emit('message:send', { roomId, content, userToken, nickname });
  }, [roomId, userToken, nickname]);

  const sendWhisper = useCallback((targetSocketId, content) => {
    socketRef.current?.emit('whisper:send', { targetSocketId, content, nickname });
  }, [nickname]);

  return { sendMessage, sendWhisper };
}
