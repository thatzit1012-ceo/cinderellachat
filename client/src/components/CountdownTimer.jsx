import { formatTime } from '../utils/time';
import { useT } from '../i18n/useT';
import styles from './CountdownTimer.module.css';

export default function CountdownTimer({ remaining, state }) {
  const { t } = useT();
  const { h, m, s } = formatTime(remaining);
  const label = state === 'open' ? t('untilMidnight') : t('untilOpen');

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
