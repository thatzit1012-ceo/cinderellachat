import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NicknamePage.module.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function NicknamePage() {
  const navigate = useNavigate();
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
    checking: '확인 중...',
    available: '✓ 사용 가능한 닉네임입니다.',
    taken: '이미 이 방에서 사용 중인 닉네임입니다.',
    invalid: '닉네임은 2자 이상이어야 합니다.',
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <button className={styles.back} onClick={() => navigate('/questions')}>← 돌아가기</button>

        <div className={styles.top}>
          <h2 className={styles.title}>닉네임을 정해주세요</h2>
          <p className={styles.desc}>오늘 하루만 사용할 가면입니다. 자정에 사라집니다.</p>
        </div>

        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            placeholder="닉네임 입력 (최대 20자)"
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
            <p className={styles.roomLabel}>배정될 채팅방</p>
            <p className={styles.roomInfo}>
              현재 입장 인원 <strong>{roomInfo.currentCount}</strong> / {roomInfo.maxCount}명
            </p>
            {roomInfo.currentCount >= roomInfo.maxCount && (
              <p className={styles.watchingNotice}>⚠ 방이 꽉 찼습니다. 대기(보기 전용) 모드로 입장합니다.</p>
            )}
          </div>
        )}

        <button
          className={`${styles.enterBtn} ${status === 'available' ? styles.active : styles.inactive}`}
          onClick={handleEnter}
          disabled={status !== 'available'}
        >
          ✦ 무도회 입장
        </button>
      </div>
    </div>
  );
}
