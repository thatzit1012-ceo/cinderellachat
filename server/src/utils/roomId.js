const crypto = require('crypto');

// room_id = SHA256(날짜_q1:코드_q2:코드_q3:코드)
function generateRoomId(date, answers) {
  const parts = Object.entries(answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([q, code]) => `${q}:${code}`)
    .join('_');
  const raw = `${date}_${parts}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { generateRoomId };
