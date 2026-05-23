import { formatTime } from '../utils/time';
import styles from './CountdownBar.module.css';

export default function CountdownBar({ remaining }) {
  const { h, m, s } = formatTime(remaining);
  const isWarning = remaining <= 10 * 60;
  const isDanger = remaining <= 5 * 60;
  const isCritical = remaining <= 60;

  return (
    <div className={`${styles.bar} ${isDanger ? styles.danger : ''} ${isCritical ? styles.critical : ''}`}>
      <span className={styles.icon}>✦</span>
      <span className={styles.text}>자정에 모든 채팅이 사라집니다</span>
      <span className={styles.clock}>{h} : {m} : {s}</span>
      {isWarning && (
        <span className={styles.warn}>{isDanger ? '⚠ 곧 소멸' : '곧 소멸'}</span>
      )}
    </div>
  );
}
