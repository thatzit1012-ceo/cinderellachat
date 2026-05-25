import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import styles from './NicknamePage.module.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function NicknamePage() {
  const navigate = useNavigate();
  const { t } = useT();
  const [nickname, setNickname] = useState('');
  const [status, setStatus] = useState('idle'); // idle | checking | available | taken | invalid
  const [roomInfo, setRoomInfo] = useState(null);
  const debounceRef = useRef(null);
  const answers = JSON.parse(sessionStorage.getItem('cc_answers') || '{}');

  useEffect(() => {
    if (!Object.keys(answers).length) {
      navigate('/questions');
      return;
    }
    // 방 배정 미리 계산
    fetch(`${SERVER_URL}/api/room/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    })
      .then((r) => r.json())
      .then(setRoomInfo)
      .catch(() => navigate('/'));
  }, []);

  const handleChange = (e) => {
    const val = e.target.value.slice(0, 20);
    setNickname(val);

    if (!val.trim()) { setStatus('idle'); return; }
    if (val.trim().length < 2) { setStatus('invalid'); return; }

    setStatus('checking');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetch(`${SERVER_URL}/api/nickname/check?nickname=${encodeURIComponent(val)}&roomId=${roomInfo?.roomId || ''}`)
        .then((r) => r.json())
        .then((data) => setStatus(data.available ? 'available' : 'taken'))
        .catch(() => setStatus('idle'));
    }, 400);
  };

  const handleEnter = () => {
    if (status !== 'available') return;
    const userToken = crypto.randomUUID();
    sessionStorage.setItem('cc_nickname', nickname);
    sessionStorage.setItem('cc_token', userToken);
    sessionStorage.setItem('cc_room', JSON.stringify(roomInfo));
    navigate('/chat');
  };

  const statusMsg = {
    idle: '',
    checking: t('statusChecking'),
    available: t('statusAvailable'),
    taken: t('statusTaken'),
    invalid: t('statusInvalid'),
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate('/questions')}>{t('back')}</button>

        <div className={styles.top}>
          <h2 className={styles.title}>{t('nicknameTitle')}</h2>
          <p className={styles.desc}>{t('nicknameDesc')}</p>
        </div>

        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            placeholder={t('nicknamePlaceholder')}
            value={nickname}
            onChange={handleChange}
            maxLength={20}
            autoFocus
          />
          <span className={`${styles.statusMsg} ${styles[status]}`}>
            {statusMsg[status]}
          </span>
        </div>

        {roomInfo && (
          <div className={styles.roomPreview}>
            <p className={styles.roomLabel}>{t('roomPreviewLabel')}</p>
            <p className={styles.roomInfo}>
              {t('roomCurrentCount')} <strong>{roomInfo.currentCount}</strong> / {roomInfo.maxCount}{t('people')}
            </p>
            {roomInfo.currentCount >= roomInfo.maxCount && (
              <p className={styles.watchingNotice}>{t('roomFull')}</p>
            )}
          </div>
        )}

        <button
          className={`${styles.enterBtn} ${status === 'available' ? styles.active : styles.inactive}`}
          onClick={handleEnter}
          disabled={status !== 'available'}
        >
          {t('enterBtn')}
        </button>
      </div>
    </div>
  );
}
