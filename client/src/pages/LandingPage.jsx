import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import { useT } from '../i18n/useT';
import CountdownTimer from '../components/CountdownTimer';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const { state, remaining } = useServiceState();
  const navigate = useNavigate();
  const { t } = useT();

  const handleEnter = () => {
    if (state === 'open') navigate('/questions');
  };

  const FEATURES = [
    { icon: '🎭', title: t('f1Title'), desc: t('f1Desc') },
    { icon: '🌏', title: t('f2Title'), desc: t('f2Desc') },
    { icon: '🎯', title: t('f3Title'), desc: t('f3Desc') },
    { icon: '🕛', title: t('f4Title'), desc: t('f4Desc') },
  ];

  const STEPS = [
    { num: '01', title: t('s1Title'), desc: t('s1Desc') },
    { num: '02', title: t('s2Title'), desc: t('s2Desc') },
    { num: '03', title: t('s3Title'), desc: t('s3Desc') },
    { num: '04', title: t('s4Title'), desc: t('s4Desc') },
  ];

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.logo}>
            <h1 className={styles.title}>Cinderella Chat</h1>
            <p className={styles.subtitle}>신데렐라 채팅</p>
          </div>

          <p className={styles.tagline}>{t('tagline')}</p>

          <CountdownTimer remaining={remaining} state={state} />

          <button
            className={`${styles.enterBtn} ${state === 'open' ? styles.active : styles.disabled}`}
            onClick={handleEnter}
            disabled={state !== 'open'}
          >
            {state === 'open' ? t('enterBtn') : t('preparingBtn')}
          </button>

          <p className={styles.hint}>
            {state === 'open' ? t('openHint') : t('closedHint')}
          </p>

          <a href="#about" className={styles.scrollDown} aria-label={t('scrollDown')}>
            <span className={styles.scrollIcon}>↓</span>
            <span>{t('scrollDown')}</span>
          </a>
        </div>
      </section>

      {/* ── 서비스 소개 ──────────────────────────────── */}
      <section id="about" className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>{t('aboutEyebrow')}</p>
          <h2 className={styles.sectionTitle}>{t('aboutTitle')}</h2>
          <p className={styles.introText}>
            {t('aboutText').split('\n').map((line, i) => (
              <span key={i}>{line}{i < 2 && <br />}</span>
            ))}
          </p>
          <div className={styles.introBadges}>
            <span className={styles.badge}>{t('badge1')}</span>
            <span className={styles.badge}>{t('badge2')}</span>
            <span className={styles.badge}>{t('badge3')}</span>
            <span className={styles.badge}>{t('badge4')}</span>
          </div>
        </div>
      </section>

      {/* ── 특징 ─────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>{t('featuresEyebrow')}</p>
          <h2 className={styles.sectionTitle}>{t('featuresTitle')}</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이용 방법 ────────────────────────────────── */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>{t('stepsEyebrow')}</p>
          <h2 className={styles.sectionTitle}>{t('stepsTitle')}</h2>
          <div className={styles.steps}>
            {STEPS.map((step, i) => (
              <div key={step.num} className={styles.step}>
                <div className={styles.stepLeft}>
                  <span className={styles.stepNum}>{step.num}</span>
                  {i < STEPS.length - 1 && <span className={styles.stepLine} />}
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDesc}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 이용 규칙 ────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>{t('rulesEyebrow')}</p>
          <h2 className={styles.sectionTitle}>{t('rulesTitle')}</h2>
          <div className={styles.rules}>
            {['r1','r2','r3','r4'].map((key) => (
              <div key={key} className={styles.ruleItem}>
                <span className={styles.ruleIcon}>✓</span>
                <p dangerouslySetInnerHTML={{ __html: t(key).replace(/5명|5|최대/g, (m) => `<strong>${m}</strong>`) }} />
              </div>
            ))}
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✗</span>
              <p>{t('r5')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaTitle}>{t('ctaTitle')}</h2>
          <p className={styles.ctaDesc}>{t('ctaDesc')}</p>
          <button
            className={`${styles.enterBtn} ${styles.ctaBtn} ${state === 'open' ? styles.active : styles.disabled}`}
            onClick={handleEnter}
            disabled={state !== 'open'}
          >
            {state === 'open' ? t('enterBtn') : t('ctaClosedBtn')}
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className={styles.footer}>
        <p className={styles.footerLogo}>Cinderella Chat</p>
        <p className={styles.footerSub}>{t('footerSub')}</p>
        <p className={styles.footerCopy}>© 2026 www.cinderellachat.com · All rights reserved.</p>
      </footer>

    </div>
  );
}
