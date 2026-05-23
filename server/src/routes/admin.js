const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { adminAuth, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET } = require('../middleware/adminAuth');
const { getKSTDateString } = require('../utils/time');
const { DEFAULT_QUESTIONS } = require('../db/defaultQuestions');

// ── POST /api/admin/login ────────────────────────────────────
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'invalid_password' });
  }
  res.json({ token: ADMIN_TOKEN_SECRET });
});

// ── GET /api/admin/dashboard ─────────────────────────────────
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const date = getKSTDateString();

    const [session, rooms, users, qset] = await Promise.all([
      pool.query('SELECT * FROM sessions WHERE session_id = $1', [date]),
      pool.query('SELECT COUNT(*), SUM(current_count) as total_users FROM rooms WHERE session_id = $1', [date]),
      pool.query('SELECT COUNT(*) FROM users WHERE session_id = $1', [date]),
      pool.query('SELECT * FROM question_sets WHERE session_id = $1 ORDER BY created_at DESC LIMIT 5', [date]),
    ]);

    const analytics = await pool.query(
      'SELECT * FROM analytics_daily ORDER BY date DESC LIMIT 7'
    );

    res.json({
      today: date,
      session: session.rows[0] || null,
      roomCount: parseInt(rooms.rows[0].count),
      activeUsers: parseInt(rooms.rows[0].total_users || 0),
      totalUsers: parseInt(users.rows[0].count),
      questionSets: qset.rows,
      analytics: analytics.rows,
    });
  } catch (err) {
    console.error('admin/dashboard error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ── GET /api/admin/questions/candidates ──────────────────────
// 오늘 또는 내일 날짜의 질문 후보 목록 반환
router.get('/questions/candidates', adminAuth, async (req, res) => {
  try {
    const date = req.query.date || getKSTDateString();
    const result = await pool.query(
      'SELECT * FROM question_sets WHERE session_id = $1 ORDER BY created_at DESC',
      [date]
    );

    res.json({
      date,
      candidates: result.rows,
      default: DEFAULT_QUESTIONS,
    });
  } catch (err) {
    console.error('admin/questions/candidates error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ── POST /api/admin/questions/save ───────────────────────────
// 질문 세트 저장 (아직 미승인)
router.post('/questions/save', adminAuth, async (req, res) => {
  try {
    const { questions, date } = req.body;
    const targetDate = date || getKSTDateString();

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions required' });
    }

    // 세션이 없으면 생성
    const openAt  = new Date(`${targetDate}T07:00:00+09:00`);
    const closeAt = new Date(`${targetDate}T24:00:00+09:00`);
    await pool.query(
      `INSERT INTO sessions (session_id, open_at, close_at) VALUES ($1, $2, $3)
       ON CONFLICT (session_id) DO NOTHING`,
      [targetDate, openAt, closeAt]
    );

    const result = await pool.query(
      `INSERT INTO question_sets (session_id, questions, is_active)
       VALUES ($1, $2, FALSE) RETURNING *`,
      [targetDate, JSON.stringify(questions)]
    );

    res.json({ saved: result.rows[0] });
  } catch (err) {
    console.error('admin/questions/save error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ── POST /api/admin/questions/approve ────────────────────────
router.post('/questions/approve', adminAuth, async (req, res) => {
  try {
    const { setId, roomLimit, maxPerRoom, date } = req.body;
    const targetDate = date || getKSTDateString();

    if (!setId) return res.status(400).json({ error: 'setId required' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 기존 활성 세트 비활성화
      await client.query(
        'UPDATE question_sets SET is_active = FALSE WHERE session_id = $1',
        [targetDate]
      );

      // 선택한 세트 승인
      await client.query(
        `UPDATE question_sets
         SET is_active = TRUE, approved_by = 'admin', approved_at = NOW()
         WHERE set_id = $1`,
        [setId]
      );

      // 세션 설정 업데이트
      await client.query(
        `UPDATE sessions
         SET room_limit = $1, max_per_room = $2
         WHERE session_id = $3`,
        [roomLimit || 100, maxPerRoom || 5, targetDate]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ approved: true, date: targetDate });
  } catch (err) {
    console.error('admin/questions/approve error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// ── PUT /api/admin/settings ──────────────────────────────────
router.put('/settings', adminAuth, async (req, res) => {
  try {
    const { roomLimit, maxPerRoom, date } = req.body;
    const targetDate = date || getKSTDateString();

    await pool.query(
      `UPDATE sessions SET room_limit = $1, max_per_room = $2 WHERE session_id = $3`,
      [roomLimit, maxPerRoom, targetDate]
    );

    res.json({ updated: true });
  } catch (err) {
    console.error('admin/settings error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
