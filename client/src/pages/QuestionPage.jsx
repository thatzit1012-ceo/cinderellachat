import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '../i18n/useT';
import styles from './QuestionPage.module.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export default function QuestionPage() {
  const navigate = useNavigate();
  const { t, lang } = useT();
  const [questions, setQuestions] = useState([]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${SERVER_URL}/api/session/today`)
      .then((r) => r.json())
      .then((data) => {
        if (data.state !== 'open') {
          navigate('/');
          return;
        }
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch(() => navigate('/'));
  }, []);

  const handleSelect = (questionId, code) => {
    const newAnswers = { ...answers, [questionId]: code };
    setAnswers(newAnswers);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      sessionStorage.setItem('cc_answers', JSON.stringify(newAnswers));
      navigate('/nickname');
    }
  };

  if (loading) return <div className={styles.loading}>{t('loadingBall')}</div>;

  const q = questions[step];
  const progress = ((step) / questions.length) * 100;
  const qText = (item) => lang === 'en' && item.text_en ? item.text_en : item.text_ko;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}>←</button>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.stepLabel}>{step + 1} / {questions.length}</span>
      </div>

      <div className={styles.content}>
        <p className={styles.qLabel}>{t('questionLabel')} {step + 1}</p>
        <h2 className={styles.question}>{qText(q)}</h2>

        <div className={styles.options}>
          {q.options.map((opt) => (
            <button
              key={opt.code}
              className={`${styles.option} ${answers[q.id] === opt.code ? styles.selected : ''}`}
              onClick={() => handleSelect(q.id, opt.code)}
            >
              <span className={styles.optCode}>{opt.code}</span>
              <span className={styles.optText}>{qText(opt)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
