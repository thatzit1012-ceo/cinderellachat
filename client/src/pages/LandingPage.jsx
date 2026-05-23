import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import CountdownTimer from '../components/CountdownTimer';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { state, remaining } = useServiceState();
  const navigate = useNavigate();

  const handleEnter = () => {
    if (state === 'open') navigate('/questions');
  };

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <h1 className={styles.title}>Cinderella Chat</h1>
          <p className={styles.subtitle}>신데렐라 채팅</p>
        </div>

        <p className={styles.tagline}>자정이 되면, 마법이 풀립니다.</p>

        <CountdownTimer remaining={remaining} state={state} />

        <button
          className={`${styles.enterBtn} ${state === 'open' ? styles.active : styles.disabled}`}
          onClick={handleEnter}
          disabled={state !== 'open'}
        >
          {state === 'open' ? '✦ 무도회 입장' : '무도회 준비 중...'}
        </button>

        <p className={styles.hint}>
          {state === 'open'
            ? '오늘의 무도회가 열렸습니다. 자정에 모든 것이 사라집니다.'
            : '매일 오전 7시에 무도회가 열립니다.'}
        </p>
      </div>

      <footer className={styles.footer}>
        www.cinderellachat.com
      </footer>
    </div>
  );
}
