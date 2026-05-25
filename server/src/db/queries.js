const pool = require('./pool');
const { getKSTDateString } = require('../utils/time');
const { DEFAULT_QUESTIONS } = require('./defaultQuestions');

// ─── Session ───────────────────────────────────────────────

async function getOrCreateTodaySession(maxPerRoom = 5) {
  const date = getKSTDateString();
  const existing = await pool.query('SELECT * FROM sessions WHERE session_id = $1', [date]);
  if (existing.rows[0]) return existing.rows[0];

  // KST 기준 오늘 07:00 / 내일 00:00 (UTC로 저장)
  const openAt  = new Date(`${date}T07:00:00+09:00`);
  const closeAt = new Date(`${date}T24:00:00+09:00`);

  const result = await pool.query(
    `INSERT INTO sessions (session_id, open_at, close_at, max_per_room)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [date, openAt, closeAt, maxPerRoom]
  );
  return result.rows[0];
}

async function getTodayQuestions() {
  const date = getKSTDateString();
  const result = await pool.query(
    `SELECT questions FROM question_sets
     WHERE session_id = $1 AND is_active = TRUE
     ORDER BY approved_at DESC LIMIT 1`,
    [date]
  );
  return result.rows[0]?.questions || DEFAULT_QUESTIONS;
}

// ─── Room ───────────────────────────────────────────────────

async function getOrCreateRoom(roomId, answers, sessionId, maxCount) {
  const existing = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
  if (existing.rows[0]) return existing.rows[0];

  const result = await pool.query(
    `INSERT INTO rooms (room_id, session_id, answer_combo, max_count)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [roomId, sessionId, JSON.stringify(answers), maxCount]
  );
  return result.rows[0];
}

async function getRoomById(roomId) {
  const result = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
  return result.rows[0] || null;
}

async function incrementRoomCount(roomId) {
  await pool.query(
    'UPDATE rooms SET current_count = current_count + 1 WHERE room_id = $1',
    [roomId]
  );
}

async function decrementRoomCount(roomId) {
  await pool.query(
    'UPDATE rooms SET current_count = GREATEST(current_count - 1, 0) WHERE room_id = $1',
    [roomId]
  );
}

// ─── User ───────────────────────────────────────────────────

async function createUser(userToken, nickname, roomId, sessionId, isWatching) {
  const status = isWatching ? 'watching' : 'active';
  const result = await pool.query(
    `INSERT INTO users (user_token, nickname, room_id, session_id, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [userToken, nickname, roomId, sessionId, status]
  );
  return result.rows[0];
}

async function getUserByToken(userToken) {
  const result = await pool.query('SELECT * FROM users WHERE user_token = $1', [userToken]);
  return result.rows[0] || null;
}

async function setUserLeft(userToken) {
  await pool.query(
    "UPDATE users SET status = 'left' WHERE user_token = $1",
    [userToken]
  );
}

async function isNicknameTaken(nickname, roomId) {
  const result = await pool.query(
    `SELECT 1 FROM users
     WHERE nickname = $1 AND room_id = $2 AND status != 'left'`,
    [nickname, roomId]
  );
  return result.rows.length > 0;
}

async function getFirstWatchingUser(roomId) {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE room_id = $1 AND status = 'watching'
     ORDER BY joined_at ASC LIMIT 1`,
    [roomId]
  );
  return result.rows[0] || null;
}

async function promoteWatcher(userToken) {
  await pool.query(
    "UPDATE users SET status = 'active' WHERE user_token = $1",
    [userToken]
  );
}

async function getHostOfRoom(roomId) {
  const result = await pool.query(
    `SELECT * FROM users
     WHERE room_id = $1 AND status = 'active'
     ORDER BY joined_at ASC LIMIT 1`,
    [roomId]
  );
  return result.rows[0] || null;
}

async function incrementWhisperCount(userToken) {
  const result = await pool.query(
    `UPDATE users SET whisper_count = whisper_count + 1
     WHERE user_token = $1 RETURNING whisper_count`,
    [userToken]
  );
  return result.rows[0]?.whisper_count || 0;
}

// ─── Message ────────────────────────────────────────────────

async function saveMessage(roomId, userToken, nickname, content, isWhisper = false, targetToken = null) {
  const result = await pool.query(
    `INSERT INTO messages (room_id, user_token, nickname, content, is_whisper, target_token)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [roomId, userToken, nickname, content, isWhisper, targetToken]
  );
  return result.rows[0];
}

async function updateMessageTranslations(messageId, translations) {
  await pool.query(
    'UPDATE messages SET translations = $1 WHERE message_id = $2',
    [JSON.stringify(translations), messageId]
  );
}

async function getRecentMessages(roomId, limit = 50) {
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE room_id = $1 AND is_whisper = FALSE
     ORDER BY created_at DESC LIMIT $2`,
    [roomId, limit]
  );
  return result.rows.reverse();
}

// ─── Analytics ──────────────────────────────────────────────

async function saveAnalytics(date) {
  const rooms   = await pool.query('SELECT COUNT(*) FROM rooms WHERE session_id = $1', [date]);
  const users   = await pool.query('SELECT COUNT(*) FROM users WHERE session_id = $1', [date]);
  const msgs    = await pool.query(`SELECT COUNT(*) FROM messages WHERE room_id IN (SELECT room_id FROM rooms WHERE session_id = $1)`, [date]);

  await pool.query(
    `INSERT INTO analytics_daily (date, total_rooms, total_users, total_messages)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (date) DO UPDATE
     SET total_rooms=$2, total_users=$3, total_messages=$4`,
    [date, rooms.rows[0].count, users.rows[0].count, msgs.rows[0].count]
  );
}

module.exports = {
  getOrCreateTodaySession, getTodayQuestions,
  getOrCreateRoom, getRoomById, incrementRoomCount, decrementRoomCount,
  createUser, getUserByToken, setUserLeft, isNicknameTaken,
  getFirstWatchingUser, promoteWatcher, getHostOfRoom, incrementWhisperCount,
  saveMessage, updateMessageTranslations, getRecentMessages,
  saveAnalytics,
};
