import { formatTime } from '../utils/time';
import { useT } from '../i18n/useT';
import styles from './CountdownBar.module.css';

export default function CountdownBar({ remaining }) {
  const { t } = useT();
  const { h, m, s } = formatTime(remaining);
  const isWarning = remaining <= 10 * 60;
  const isDanger = remaining <= 5 * 60;
  const isCritical = remaining <= 60;

  return (
    <div className={`${styles.bar} ${isDanger ? styles.danger : ''} ${isCritical ? styles.critical : ''}`}>
      <span className={styles.icon}>✦</span>
      <span className={styles.text}>{t('chatDisappears')}</span>
      <span className={styles.clock}>{h} : {m} : {s}</span>
      {isWarning && (
        <span className={styles.warn}>{isDanger ? t('soonGoneWarn') : t('soonGone')}</span>
      )}
    </div>
  );
}
