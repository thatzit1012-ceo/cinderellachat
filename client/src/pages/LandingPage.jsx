import { useNavigate } from 'react-router-dom';
import { useServiceState } from '../hooks/useServiceState';
import CountdownTimer from '../components/CountdownTimer';
import styles from './LandingPage.module.css';

const FEATURES = [
  {
    icon: '🎭',
    title: '완전 익명',
    desc: '이름도, 얼굴도, 계정도 필요 없습니다. 오직 닉네임 하나로 입장합니다.',
  },
  {
    icon: '🌏',
    title: '글로벌 K-컬처',
    desc: '전 세계 K-컬처 팬들과 같은 공간에서 대화합니다. 언어 장벽 없이.',
  },
  {
    icon: '🎯',
    title: '취향 매칭',
    desc: '3가지 질문에 답하면 같은 취향의 사람들과 자동으로 같은 방에 배정됩니다.',
  },
  {
    icon: '🕛',
    title: '자정 소멸',
    desc: '오늘 나눈 모든 대화는 자정에 완전히 사라집니다. 서버에도 남지 않습니다.',
  },
];

const STEPS = [
  {
    num: '01',
    title: '질문 답변',
    desc: '오늘의 K-컬처 질문 3가지에 답하세요. 답변이 당신의 방을 결정합니다.',
  },
  {
    num: '02',
    title: '닉네임 설정',
    desc: '오늘 하루만 쓸 닉네임을 정하세요. 다음날엔 기억되지 않습니다.',
  },
  {
    num: '03',
    title: '채팅방 입장',
    desc: '같은 답변을 선택한 최대 5명과 함께하는 프라이빗 채팅방에 입장합니다.',
  },
  {
    num: '04',
    title: '자정에 소멸',
    desc: '00:00 KST — 모든 대화, 모든 닉네임, 모든 방이 흔적 없이 사라집니다.',
  },
];

export default function LandingPage() {
  const { state, remaining } = useServiceState();
  const navigate = useNavigate();

  const handleEnter = () => {
    if (state === 'open') navigate('/questions');
  };

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
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

          <a href="#about" className={styles.scrollDown} aria-label="더 알아보기">
            <span className={styles.scrollIcon}>↓</span>
            <span>서비스 소개</span>
          </a>
        </div>
      </section>

      {/* ── 서비스 소개 ──────────────────────────────── */}
      <section id="about" className={styles.section}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>WHAT IS THIS?</p>
          <h2 className={styles.sectionTitle}>신데렐라 채팅이란?</h2>
          <p className={styles.introText}>
            신데렐라 채팅은 <strong>매일 딱 하루만 열리는 익명 채팅 서비스</strong>입니다.<br />
            전 세계 K-컬처 팬들이 취향에 따라 방을 나누고, 자정이 되면 모든 것이 사라집니다.<br />
            계정도, 기록도, 흔적도 없습니다. 오직 오늘 이 순간만 존재합니다.
          </p>
          <div className={styles.introBadges}>
            <span className={styles.badge}>🕐 매일 07:00 오픈</span>
            <span className={styles.badge}>🕛 00:00 전체 소멸</span>
            <span className={styles.badge}>👤 완전 익명</span>
            <span className={styles.badge}>🌍 글로벌</span>
          </div>
        </div>
      </section>

      {/* ── 특징 ─────────────────────────────────────── */}
      <section className={`${styles.section} ${styles.sectionDark}`}>
        <div className={styles.sectionInner}>
          <p className={styles.sectionEyebrow}>FEATURES</p>
          <h2 className={styles.sectionTitle}>이런 서비스입니다</h2>
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
          <p className={styles.sectionEyebrow}>HOW TO USE</p>
          <h2 className={styles.sectionTitle}>이용 방법</h2>
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
          <p className={styles.sectionEyebrow}>RULES</p>
          <h2 className={styles.sectionTitle}>이용 규칙</h2>
          <div className={styles.rules}>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✓</span>
              <p>방 최대 인원은 <strong>5명</strong>입니다. 초과 시 대기자로 입장하며, 자리가 나면 자동 참여 전환됩니다.</p>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✓</span>
              <p>귓속말은 하루 <strong>5회</strong>로 제한됩니다.</p>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✓</span>
              <p>방장은 부적절한 참여자를 <strong>강퇴</strong>할 수 있습니다.</p>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✓</span>
              <p>모든 채팅은 자정(00:00 KST)에 <strong>완전 삭제</strong>됩니다. 스크린샷 등 외부 유출에 유의하세요.</p>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✗</span>
              <p>혐오 발언, 음란물, 개인정보 요구, 스팸은 즉시 강퇴 대상입니다.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <div className={styles.sectionInner}>
          <h2 className={styles.ctaTitle}>오늘의 무도회에 초대합니다</h2>
          <p className={styles.ctaDesc}>자정이 되면 모든 것이 사라집니다. 지금 이 순간만 존재합니다.</p>
          <button
            className={`${styles.enterBtn} ${styles.ctaBtn} ${state === 'open' ? styles.active : styles.disabled}`}
            onClick={handleEnter}
            disabled={state !== 'open'}
          >
            {state === 'open' ? '✦ 무도회 입장' : `오전 7시에 열립니다`}
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className={styles.footer}>
        <p className={styles.footerLogo}>Cinderella Chat</p>
        <p className={styles.footerSub}>매일 07:00 ~ 00:00 KST · 글로벌 익명 채팅</p>
        <p className={styles.footerCopy}>© 2026 www.cinderellachat.com · All rights reserved.</p>
      </footer>

    </div>
  );
}
