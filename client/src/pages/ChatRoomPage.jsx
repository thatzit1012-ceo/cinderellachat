import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import { useSocket } from '../hooks/useSocket';
import CountdownBar from '../components/CountdownBar';
import styles from './ChatRoomPage.module.css';

const LANGUAGES = [
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
];

function detectBrowserLang() {
  const bl = navigator.language || 'en';
  if (bl.startsWith('ko')) return 'ko';
  if (bl.startsWith('ja')) return 'ja';
  if (bl.startsWith('zh')) return 'zh-CN';
  if (bl.startsWith('es')) return 'es';
  if (bl.startsWith('th')) return 'th';
  return 'en';
}

export default function ChatRoomPage() {
  const navigate = useNavigate();
  const { remaining } = useServiceState();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isWatching, setIsWatching] = useState(false);
  const [roomCount, setRoomCount] = useState({ currentCount: 0, maxCount: 5 });
  const [ended, setEnded] = useState(false);
  const [roomUsers, setRoomUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [whisperTarget, setWhisperTarget] = useState(null);
  const [whisperInput, setWhisperInput] = useState('');
  const [whisperRemaining, setWhisperRemaining] = useState(5);
  const [kicked, setKicked] = useState(false);
  const [kickConfirm, setKickConfirm] = useState(null);
  const [langPref, setLangPref] = useState(() => localStorage.getItem('cc_lang') || detectBrowserLang());
  const [showLangMenu, setShowLangMenu] = useState(false);
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

  const { sendMessage, sendWhisper, sendKick } = useSocket({
    roomId:   roomInfo.roomId,
    userToken,
    nickname,
    onHistory: ({ history, isWatching: watching }) => {
      setMessages(history.map((m) => ({
        id: m.message_id,
        nickname: m.nickname,
        content: m.content,
        translations: m.translations || {},
        createdAt: m.created_at,
        isWhisper: m.is_whisper,
      })));
      setIsWatching(watching);
    },
    onMessage: (msg) => {
      if (msg.isWhisper && msg.remainingCount !== undefined) {
        setWhisperRemaining(msg.remainingCount);
      }
      setMessages((prev) => [...prev, { ...msg, translations: msg.translations || {} }]);
    },
    onTranslated: ({ id, translations }) => {
      setMessages((prev) => prev.map((m) => m.id === id ? { ...m, translations } : m));
    },
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
    onUsersList: (users) => setRoomUsers(users),
    onKicked: () => setKicked(true),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showLangMenu) return;
    const close = () => setShowLangMenu(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showLangMenu]);

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

  const handleWhisperOpen = (user) => {
    setWhisperTarget(user);
    setWhisperInput('');
  };

  const handleWhisperSend = () => {
    if (!whisperInput.trim() || !whisperTarget) return;
    sendWhisper(whisperTarget.socketId, whisperInput.trim());
    addSystemMsg(`귓속말을 ${whisperTarget.nickname}님께 보냈습니다. (남은 횟수: ${whisperRemaining - 1}회)`);
    setWhisperTarget(null);
    setWhisperInput('');
  };

  const handleKick = (user) => {
    setKickConfirm(user);
  };

  const confirmKick = () => {
    if (!kickConfirm) return;
    sendKick(kickConfirm.socketId);
    addSystemMsg(`${kickConfirm.nickname}님을 강퇴했습니다.`);
    setKickConfirm(null);
  };

  const myInfo = roomUsers.find((u) => u.nickname === nickname);
  const isHost = myInfo?.isHost || false;

  const handleLangSelect = (code) => {
    setLangPref(code);
    localStorage.setItem('cc_lang', code);
    setShowLangMenu(false);
  };

  const displayContent = (msg) => {
    if (langPref === 'ko' || !msg.translations) return msg.content;
    return msg.translations[langPref] || msg.content;
  };

  const currentLang = LANGUAGES.find((l) => l.code === langPref);

  if (kicked) {
    return (
      <div className={styles.ended}>
        <h2 className={styles.endedTitle}>방에서 퇴장되었습니다.</h2>
        <p className={styles.endedSub}>방장에 의해 강퇴되었습니다.</p>
        <button className={styles.endedBtn} onClick={() => navigate('/')}>처음으로</button>
      </div>
    );
  }

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
          {isHost && <span className={styles.hostBadge}>방장</span>}
          <button
            className={`${styles.roomCount} ${showUsers ? styles.roomCountActive : ''}`}
            onClick={() => setShowUsers((v) => !v)}
            title="참여자 목록"
          >
            {roomCount.currentCount} / {roomCount.maxCount}명
          </button>
          {isWatching && <span className={styles.watchingBadge}>대기 중 (보기 전용)</span>}
        </div>
        <div className={styles.headerRight}>
          <div className={styles.langSelector}>
            <button
              className={styles.langBtn}
              onClick={() => setShowLangMenu((v) => !v)}
              title="언어 선택"
            >
              {currentLang?.flag} {currentLang?.label}
            </button>
            {showLangMenu && (
              <div className={styles.langMenu}>
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    className={`${styles.langOption} ${langPref === lang.code ? styles.langActive : ''}`}
                    onClick={() => handleLangSelect(lang.code)}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button className={styles.leaveBtn} onClick={() => navigate('/')}>퇴장</button>
        </div>
      </div>

      {showUsers && (
        <div className={styles.usersPanel}>
          <div className={styles.usersPanelHeader}>
            <span>참여자 ({roomUsers.length}명)</span>
            <button className={styles.closeBtn} onClick={() => setShowUsers(false)}>✕</button>
          </div>
          {roomUsers.map((u) => (
            <div key={u.socketId} className={styles.userRow}>
              <div className={styles.userInfo}>
                <span className={styles.userNick}>{u.nickname}</span>
                <div className={styles.userBadges}>
                  {u.isHost && <span className={styles.hostTag}>방장</span>}
                  {u.isWatching && <span className={styles.watchTag}>대기</span>}
                  {u.nickname === nickname && <span className={styles.meTag}>나</span>}
                </div>
              </div>
              {u.nickname !== nickname && !isWatching && (
                <div className={styles.userActions}>
                  <button
                    className={styles.whisperBtn}
                    onClick={() => { handleWhisperOpen(u); setShowUsers(false); }}
                    title="귓속말"
                  >
                    🤫 귓속말
                  </button>
                  {isHost && !u.isHost && (
                    <button
                      className={styles.kickBtn}
                      onClick={() => handleKick(u)}
                      title="강퇴"
                    >
                      강퇴
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
              <div className={styles.bubble}>{displayContent(msg)}</div>
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

      {whisperTarget && (
        <div className={styles.modalOverlay} onClick={() => setWhisperTarget(null)}>
          <div className={styles.whisperModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.whisperModalHeader}>
              <span>🤫 {whisperTarget.nickname}님께 귓속말</span>
              <span className={styles.whisperCount}>남은 횟수 {whisperRemaining}회</span>
            </div>
            <textarea
              className={styles.whisperTextarea}
              placeholder="귓속말 내용 (최대 140자)"
              value={whisperInput}
              onChange={(e) => setWhisperInput(e.target.value)}
              maxLength={140}
              rows={3}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWhisperSend(); }
              }}
            />
            <div className={styles.whisperModalFooter}>
              <button className={styles.cancelBtn} onClick={() => setWhisperTarget(null)}>취소</button>
              <button
                className={`${styles.sendBtn} ${whisperInput.trim() ? styles.sendActive : ''}`}
                onClick={handleWhisperSend}
                disabled={!whisperInput.trim() || whisperRemaining <= 0}
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {kickConfirm && (
        <div className={styles.modalOverlay} onClick={() => setKickConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>{kickConfirm.nickname}님을 강퇴하시겠습니까?</p>
            <div className={styles.confirmBtns}>
              <button className={styles.cancelBtn} onClick={() => setKickConfirm(null)}>취소</button>
              <button className={styles.kickConfirmBtn} onClick={confirmKick}>강퇴</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
