import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import { useSocket } from '../hooks/useSocket';
import { useT } from '../i18n/useT';
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
  const { t } = useT();
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
      addSystemMsg(`${n}${w ? t('sysJoinedWatching') : t('sysJoined')}`),
    onUserLeft: ({ nickname: n }) =>
      addSystemMsg(`${n}${t('sysLeft')}`),
    onWatcherPromoted: ({ nickname: n }) => {
      addSystemMsg(`${n}${t('sysPromoted')}`);
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
    addSystemMsg(t('sysWhisperSent')(whisperTarget.nickname, whisperRemaining - 1));
    setWhisperTarget(null);
    setWhisperInput('');
  };

  const handleKick = (user) => {
    setKickConfirm(user);
  };

  const confirmKick = () => {
    if (!kickConfirm) return;
    sendKick(kickConfirm.socketId);
    addSystemMsg(t('sysKicked')(kickConfirm.nickname));
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
        <h2 className={styles.endedTitle}>{t('kickedTitle')}</h2>
        <p className={styles.endedSub}>{t('kickedSub')}</p>
        <button className={styles.endedBtn} onClick={() => navigate('/')}>{t('goHome')}</button>
      </div>
    );
  }

  if (ended) {
    return (
      <div className={styles.ended}>
        <h2 className={styles.endedTitle}>{t('endedTitle')}</h2>
        <p className={styles.endedSub}>{t('endedSub')}</p>
        <button className={styles.endedBtn} onClick={() => navigate('/')}>{t('goHome')}</button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <CountdownBar remaining={remaining} />

      <div className={styles.roomHeader}>
        <div className={styles.roomMeta}>
          <span className={styles.roomNick}>🎭 {nickname}</span>
          {isHost && <span className={styles.hostBadge}>{t('hostBadge')}</span>}
          <button
            className={`${styles.roomCount} ${showUsers ? styles.roomCountActive : ''}`}
            onClick={() => setShowUsers((v) => !v)}
            title={t('participants')}
          >
            {roomCount.currentCount} / {roomCount.maxCount}{t('people')}
          </button>
          {isWatching && <span className={styles.watchingBadge}>{t('watchingBadge')}</span>}
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
          <button className={styles.leaveBtn} onClick={() => navigate('/')}>{t('leave')}</button>
        </div>
      </div>

      {showUsers && (
        <div className={styles.usersPanel}>
          <div className={styles.usersPanelHeader}>
            <span>{t('participants')} ({roomUsers.length}{t('people')})</span>
            <button className={styles.closeBtn} onClick={() => setShowUsers(false)}>✕</button>
          </div>
          {roomUsers.map((u) => (
            <div key={u.socketId} className={styles.userRow}>
              <div className={styles.userInfo}>
                <span className={styles.userNick}>{u.nickname}</span>
                <div className={styles.userBadges}>
                  {u.isHost && <span className={styles.hostTag}>{t('hostTag')}</span>}
                  {u.isWatching && <span className={styles.watchTag}>{t('watchTag')}</span>}
                  {u.nickname === nickname && <span className={styles.meTag}>{t('meTag')}</span>}
                </div>
              </div>
              {u.nickname !== nickname && !isWatching && (
                <div className={styles.userActions}>
                  <button
                    className={styles.whisperBtn}
                    onClick={() => { handleWhisperOpen(u); setShowUsers(false); }}
                  >
                    {t('whisperBtn')}
                  </button>
                  {isHost && !u.isHost && (
                    <button
                      className={styles.kickBtn}
                      onClick={() => handleKick(u)}
                    >
                      {t('kickBtn')}
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
          <p className={styles.empty}>{t('emptyChat')}</p>
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
          <p className={styles.watchingNote}>{t('watchingNote')}</p>
        ) : (
          <>
            <textarea
              className={styles.textInput}
              placeholder={t('messageInput')}
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
                {t('send')}
              </button>
            </div>
          </>
        )}
      </div>

      {whisperTarget && (
        <div className={styles.modalOverlay} onClick={() => setWhisperTarget(null)}>
          <div className={styles.whisperModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.whisperModalHeader}>
              <span>🤫 {whisperTarget.nickname}{t('whisperTo')}</span>
              <span className={styles.whisperCount}>{t('whisperRemaining')} {whisperRemaining}{t('whisperTimes')}</span>
            </div>
            <textarea
              className={styles.whisperTextarea}
              placeholder={t('whisperPlaceholder')}
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
              <button className={styles.cancelBtn} onClick={() => setWhisperTarget(null)}>{t('cancel')}</button>
              <button
                className={`${styles.sendBtn} ${whisperInput.trim() ? styles.sendActive : ''}`}
                onClick={handleWhisperSend}
                disabled={!whisperInput.trim() || whisperRemaining <= 0}
              >
                {t('whisperSend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {kickConfirm && (
        <div className={styles.modalOverlay} onClick={() => setKickConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.confirmText}>{t('kickConfirm')(kickConfirm.nickname)}</p>
            <div className={styles.confirmBtns}>
              <button className={styles.cancelBtn} onClick={() => setKickConfirm(null)}>{t('cancel')}</button>
              <button className={styles.kickConfirmBtn} onClick={confirmKick}>{t('kickConfirmBtn')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
