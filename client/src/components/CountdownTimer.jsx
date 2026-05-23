import { formatTime } from '../utils/time';
import styles from './CountdownTimer.module.css';

export default function CountdownTimer({ remaining, state }) {
  const { h, m, s } = formatTime(remaining);
  const label = state === 'open' ? '자정 소멸까지' : '무도회 입장까지';

  return (
    <div className={`${styles.wrap} ${state === 'open' ? styles.open : styles.waiting}`}>
      <p className={styles.label}>{label}</p>
      <div className={styles.clock}>
        <span className={styles.digit}>{h}</span>
        <span className={styles.sep}>:</span>
        <span className={styles.digit}>{m}</span>
        <span className={styles.sep}>:</span>
        <span className={styles.digit}>{s}</span>
      </div>
    </div>
  );
}
