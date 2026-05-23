import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import { useSocket } from '../hooks/useSocket';
import CountdownBar from '../components/CountdownBar';
import styles from './ChatRoomPage.module.css';

export default function ChatRoomPage() {
  const navigate = useNavigate();
  const { remaining } = useServiceState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [roomCount, setRoomCount] = useState({ currentCount: 0, maxCount: 5 });
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef(null);

  const nickname  = sessionStorage.getItem('cc_nickname') || '';
  const userToken = sessionStorage.getItem('cc_token')    || '';
  const roomInfo  = JSON.parse(sessionStorage.getItem('cc_room') || '{}');

  useEffect(() => {
    if (!nickname || !userToken || !roomInfo.roomId) navigate('/');
  }, []);

  useEffect(() => {
    if (remaining <= 0) setEnded(true);
  }, [remaining]);

  const addSystemMsg = useCallback((content) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), system: true, content }]);
  }, []);

  const { sendMessage } = useSocket({
    roomId:   roomInfo.roomId,
    userToken,
    nickname,
    onHistory: ({ history, isWatching: watching }) => {
      setMessages(history.map((m) => ({
        id: m.message_id,
        nickname: m.nickname,
        content: m.content,
        createdAt: m.created_at,
        isWhisper: m.is_whisper,
      })));
      setIsWatching(watching);
    },
    onMessage: (msg) => setMessages((prev) => [...prev, msg]),
    onUserJoined: ({ nickname: n, isWatching: w }) =>
      addSystemMsg(`${n}님이 ${w ? '대기자로 ' : ''}입장했습니다.`),
    onUserLeft: ({ nickname: n }) =>
      addSystemMsg(`${n}님이 퇴장했습니다.`),
    onWatcherPromoted: ({ nickname: n }) => {
      addSystemMsg(`${n}님이 대기에서 참여자로 전환됐습니다.`);
      if (n === nickname) setIsWatching(false);
    },
    onCountUpdated: ({ currentCount, maxCount }) =>
      setRoomCount({ currentCount, maxCount }),
    onMidnight: () => setEnded(true),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isWatching) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (ended) {
    return (
      <div className={styles.ended}>
        <h2 className={styles.endedTitle}>오늘의 무도회가 끝났습니다.</h2>
        <p className={styles.endedSub}>모든 채팅이 사라졌습니다. 내일 오전 7시에 다시 만나요.</p>
        <button className={styles.endedBtn} onClick={() => navigate('/')}>처음으로</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CountdownBar remaining={remaining} />

      <div className={styles.roomHeader}>
        <div className={styles.roomMeta}>
          <span className={styles.roomNick}>🎭 {nickname}</span>
          <span className={styles.roomCount}>
            {roomCount.currentCount} / {roomCount.maxCount}명
          </span>
          {isWatching && <span className={styles.watchingBadge}>대기 중 (보기 전용)</span>}
        </div>
        <button className={styles.leaveBtn} onClick={() => navigate('/')}>퇴장</button>
      </div>

      <div className={styles.messages}>
        {messages.length === 0 && (
          <p className={styles.empty}>첫 번째로 말을 걸어보세요.</p>
        )}
        {messages.map((msg) =>
          msg.system ? (
            <div key={msg.id} className={styles.systemMsg}>{msg.content}</div>
          ) : (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.nickname === nickname ? styles.mine : styles.theirs} ${msg.isWhisper ? styles.whisper : ''}`}
            >
              {msg.nickname !== nickname && (
                <span className={styles.msgNick}>{msg.nickname}{msg.isWhisper ? ' 🤫' : ''}</span>
              )}
              <div className={styles.bubble}>{msg.content}</div>
              <span className={styles.msgTime}>
                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                {msg.isWhisper && <span className={styles.whisperLabel}> 귓속말</span>}
              </span>
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>

      <div className={`${styles.inputArea} ${isWatching ? styles.watchingInput : ''}`}>
        {isWatching ? (
          <p className={styles.watchingNote}>대기 중에는 메시지를 보낼 수 없습니다. 자리가 나면 자동으로 참여자로 전환됩니다.</p>
        ) : (
          <>
            <textarea
              className={styles.textInput}
              placeholder="메시지 입력... (최대 140자, Enter로 전송)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={140}
              rows={2}
            />
            <div className={styles.inputFooter}>
              <span className={styles.charCount}>{input.length} / 140</span>
              <button
                className={`${styles.sendBtn} ${input.trim() ? styles.sendActive : ''}`}
                onClick={handleSend}
                disabled={!input.trim()}
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
