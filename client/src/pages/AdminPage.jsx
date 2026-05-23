import { useState, useEffect } from 'react';
import styles from './AdminPage.module.css';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

// ── 로그인 화면 ───────────────────────────────────────────────
function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { setError('비밀번호가 틀렸습니다.'); return; }
      sessionStorage.setItem('admin_token', data.token);
      onLogin(data.token);
    } catch {
      setError('서버 연결 오류');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginWrap}>
      <h1 className={styles.loginTitle}>Cinderella Chat</h1>
      <p className={styles.loginSub}>관리자 패널</p>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <input
          type="password"
          className={styles.loginInput}
          placeholder="관리자 비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <p className={styles.loginError}>{error}</p>}
        <button className={styles.loginBtn} type="submit" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}

// ── 질문 에디터 ───────────────────────────────────────────────
function QuestionEditor({ questions, onChange }) {
  const addQuestion = () => {
    onChange([...questions, {
      id: `q${questions.length + 1}`,
      text_ko: '',
      text_en: '',
      options: [
        { code: 'A', text_ko: '', text_en: '' },
        { code: 'B', text_ko: '', text_en: '' },
        { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
      ],
    }]);
  };

  const removeQuestion = (idx) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx, field, value) => {
    const updated = questions.map((q, i) => i === idx ? { ...q, [field]: value } : q);
    onChange(updated);
  };

  const updateOption = (qIdx, oIdx, field, value) => {
    const updated = questions.map((q, i) => {
      if (i !== qIdx) return q;
      return {
        ...q,
        options: q.options.map((o, j) => j === oIdx ? { ...o, [field]: value } : o),
      };
    });
    onChange(updated);
  };

  const addOption = (qIdx) => {
    const q = questions[qIdx];
    const nonX = q.options.filter((o) => o.code !== 'X');
    if (nonX.length >= 4) return;
    const code = String.fromCharCode(65 + nonX.length);
    const newOpts = [
      ...nonX,
      { code, text_ko: '', text_en: '' },
      { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
    ];
    const updated = questions.map((q2, i) => i === qIdx ? { ...q2, options: newOpts } : q2);
    onChange(updated);
  };

  const removeOption = (qIdx, oIdx) => {
    const updated = questions.map((q, i) => {
      if (i !== qIdx) return q;
      return { ...q, options: q.options.filter((_, j) => j !== oIdx) };
    });
    onChange(updated);
  };

  // 방 조합 수 계산 (X 제외한 선택지 수의 곱)
  const combinations = questions.reduce((acc, q) => {
    const count = q.options.filter((o) => o.code !== 'X').length;
    return acc * (count || 1);
  }, 1);

  return (
    <div className={styles.editor}>
      <div className={styles.comboBadge}>
        방 조합 수: <strong>{combinations}개</strong>
        &nbsp;·&nbsp; 최대 입장: <strong>{combinations * 5}명</strong>
        <span className={styles.comboHint}>(각 방 5명 기준)</span>
      </div>

      {questions.map((q, qIdx) => (
        <div key={q.id} className={styles.qBlock}>
          <div className={styles.qHeader}>
            <span className={styles.qNum}>Q{qIdx + 1}</span>
            <button className={styles.removeBtn} onClick={() => removeQuestion(qIdx)} title="질문 삭제">✕</button>
          </div>
          <input
            className={styles.qInput}
            placeholder="질문 (한국어)"
            value={q.text_ko}
            onChange={(e) => updateQuestion(qIdx, 'text_ko', e.target.value)}
          />
          <input
            className={`${styles.qInput} ${styles.qInputEn}`}
            placeholder="Question (English)"
            value={q.text_en}
            onChange={(e) => updateQuestion(qIdx, 'text_en', e.target.value)}
          />

          <div className={styles.options}>
            {q.options.map((opt, oIdx) => (
              <div key={oIdx} className={`${styles.optRow} ${opt.code === 'X' ? styles.optX : ''}`}>
                <span className={styles.optCode}>{opt.code}</span>
                {opt.code === 'X' ? (
                  <span className={styles.optFixed}>이 질문에는 답변 없음 (자동 포함)</span>
                ) : (
                  <>
                    <input
                      className={styles.optInput}
                      placeholder="선택지 (한국어)"
                      value={opt.text_ko}
                      onChange={(e) => updateOption(qIdx, oIdx, 'text_ko', e.target.value)}
                    />
                    <input
                      className={`${styles.optInput} ${styles.optInputEn}`}
                      placeholder="Option (English)"
                      value={opt.text_en}
                      onChange={(e) => updateOption(qIdx, oIdx, 'text_en', e.target.value)}
                    />
                    <button className={styles.removeOptBtn} onClick={() => removeOption(qIdx, oIdx)}>✕</button>
                  </>
                )}
              </div>
            ))}
            {q.options.filter((o) => o.code !== 'X').length < 4 && (
              <button className={styles.addOptBtn} onClick={() => addOption(qIdx)}>+ 선택지 추가</button>
            )}
          </div>
        </div>
      ))}

      <button className={styles.addQBtn} onClick={addQuestion}>+ 질문 추가</button>
    </div>
  );
}

// ── 메인 관리자 패널 ──────────────────────────────────────────
function AdminPanel({ token }) {
  const [tab, setTab] = useState('questions'); // questions | dashboard
  const [dashboard, setDashboard] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [defaultQs, setDefaultQs] = useState([]);
  const [editingQuestions, setEditingQuestions] = useState([]);
  const [selectedSetId, setSelectedSetId] = useState(null);
  const [roomLimit, setRoomLimit] = useState(100);
  const [maxPerRoom, setMaxPerRoom] = useState(5);
  const [targetDate, setTargetDate] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  // 날짜 계산: KST 기준 내일
  useEffect(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
    now.setDate(now.getDate() + 1);
    const tomorrow = now.toISOString().slice(0, 10);
    setTargetDate(tomorrow);
  }, []);

  useEffect(() => {
    if (tab === 'dashboard') loadDashboard();
    if (tab === 'questions') loadCandidates();
  }, [tab, targetDate]);

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/dashboard`, { headers });
      const data = await res.json();
      setDashboard(data);
    } catch { setStatus('대시보드 로딩 오류'); }
  };

  const loadCandidates = async () => {
    if (!targetDate) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/questions/candidates?date=${targetDate}`, { headers });
      const data = await res.json();
      setCandidates(data.candidates || []);
      setDefaultQs(data.default || []);
      if (data.candidates.length > 0) {
        const active = data.candidates.find((c) => c.is_active) || data.candidates[0];
        setEditingQuestions(active.questions);
        setSelectedSetId(active.set_id);
      } else {
        setEditingQuestions(data.default || []);
        setSelectedSetId(null);
      }
    } catch { setStatus('질문 로딩 오류'); }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus('');
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/questions/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: editingQuestions, date: targetDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedSetId(data.saved.set_id);
      await loadCandidates();
      setStatus('✓ 저장됐습니다.');
    } catch (err) {
      setStatus(`저장 오류: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSetId) { setStatus('먼저 질문을 저장하세요.'); return; }
    setApproving(true);
    setStatus('');
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/questions/approve`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ setId: selectedSetId, roomLimit, maxPerRoom, date: targetDate }),
      });
      if (!res.ok) throw new Error('승인 실패');
      setStatus(`✅ ${targetDate} 질문 세트 최종 승인 완료. 오전 7시에 자동 적용됩니다.`);
    } catch (err) {
      setStatus(`승인 오류: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  // 방 조합 수 계산
  const combinations = editingQuestions.reduce((acc, q) => {
    const count = (q.options || []).filter((o) => o.code !== 'X').length;
    return acc * (count || 1);
  }, 1);

  const limitedCombinations = Math.min(combinations, roomLimit);
  const maxCapacity = limitedCombinations * maxPerRoom;

  return (
    <div className={styles.panel}>
      <header className={styles.panelHeader}>
        <h1 className={styles.panelTitle}>✦ Cinderella Chat 관리자</h1>
        <nav className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'questions' ? styles.tabActive : ''}`} onClick={() => setTab('questions')}>
            질문 관리
          </button>
          <button className={`${styles.tab} ${tab === 'dashboard' ? styles.tabActive : ''}`} onClick={() => setTab('dashboard')}>
            현황
          </button>
        </nav>
      </header>

      {/* ── 질문 관리 탭 ── */}
      {tab === 'questions' && (
        <div className={styles.content}>
          <div className={styles.topBar}>
            <div className={styles.dateWrap}>
              <label className={styles.label}>적용 날짜</label>
              <input
                type="date"
                className={styles.dateInput}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>

            {candidates.length > 0 && (
              <div className={styles.candidateSelect}>
                <label className={styles.label}>저장된 세트</label>
                <select
                  className={styles.select}
                  value={selectedSetId || ''}
                  onChange={(e) => {
                    const id = parseInt(e.target.value);
                    const found = candidates.find((c) => c.set_id === id);
                    if (found) { setEditingQuestions(found.questions); setSelectedSetId(id); }
                  }}
                >
                  {candidates.map((c) => (
                    <option key={c.set_id} value={c.set_id}>
                      세트 #{c.set_id} {c.is_active ? '✓ 승인됨' : '(미승인)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button className={styles.resetBtn} onClick={() => { setEditingQuestions(defaultQs); setSelectedSetId(null); }}>
              디폴트로 초기화
            </button>
          </div>

          <QuestionEditor questions={editingQuestions} onChange={setEditingQuestions} />

          <div className={styles.settingsRow}>
            <div className={styles.settingItem}>
              <label className={styles.label}>방 개수 상한</label>
              <input
                type="number" min="1" max="1000"
                className={styles.numInput}
                value={roomLimit}
                onChange={(e) => setRoomLimit(parseInt(e.target.value) || 1)}
              />
              <span className={styles.settingHint}>최대 {roomLimit}개 방</span>
            </div>
            <div className={styles.settingItem}>
              <label className={styles.label}>방당 최대 인원</label>
              <input
                type="number" min="1" max="20"
                className={styles.numInput}
                value={maxPerRoom}
                onChange={(e) => setMaxPerRoom(parseInt(e.target.value) || 1)}
              />
              <span className={styles.settingHint}>기본 5명</span>
            </div>
            <div className={styles.capacityPreview}>
              <span>조합 {combinations}개 → 상한 적용 {limitedCombinations}개 방</span>
              <strong>최대 입장 {maxCapacity}명</strong>
            </div>
          </div>

          {status && (
            <p className={`${styles.statusMsg} ${status.startsWith('✅') || status.startsWith('✓') ? styles.statusOk : styles.statusErr}`}>
              {status}
            </p>
          )}

          <div className={styles.actionRow}>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '💾 임시 저장'}
            </button>
            <button className={styles.approveBtn} onClick={handleApprove} disabled={approving || !selectedSetId}>
              {approving ? '승인 중...' : '✅ 최종 승인'}
            </button>
          </div>

          <p className={styles.approveNote}>
            최종 승인 후 당일 오전 7시에 자동 적용됩니다.
            관리자가 승인하지 않으면 디폴트 질문이 적용됩니다.
          </p>
        </div>
      )}

      {/* ── 현황 탭 ── */}
      {tab === 'dashboard' && (
        <div className={styles.content}>
          {!dashboard ? (
            <p className={styles.loading}>로딩 중...</p>
          ) : (
            <>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>오늘 총 방</p>
                  <p className={styles.statValue}>{dashboard.roomCount}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>현재 접속자</p>
                  <p className={styles.statValue}>{dashboard.activeUsers}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>오늘 총 참여자</p>
                  <p className={styles.statValue}>{dashboard.totalUsers}</p>
                </div>
                <div className={styles.statCard}>
                  <p className={styles.statLabel}>질문 세트 승인</p>
                  <p className={styles.statValue}>
                    {dashboard.questionSets.some((q) => q.is_active) ? '✅ 완료' : '⚠ 미승인'}
                  </p>
                </div>
              </div>

              {dashboard.analytics.length > 0 && (
                <div className={styles.analyticsTable}>
                  <h3 className={styles.sectionTitle}>최근 7일 통계</h3>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>날짜</th>
                        <th>방</th>
                        <th>유저</th>
                        <th>메시지</th>
                        <th>최대 동접</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.analytics.map((row) => (
                        <tr key={row.date}>
                          <td>{row.date}</td>
                          <td>{row.total_rooms}</td>
                          <td>{row.total_users}</td>
                          <td>{row.total_messages}</td>
                          <td>{row.peak_users}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── 엔트리 ────────────────────────────────────────────────────
export default function AdminPage() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin_token') || '');

  if (!token) return <AdminLogin onLogin={setToken} />;
  return <AdminPanel token={token} />;
}
