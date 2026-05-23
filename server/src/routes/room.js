const express = require('express');
const router = express.Router();
const { generateRoomId } = require('../utils/roomId');
const { getKSTDateString, getServiceState } = require('../utils/time');

// POST /api/room/assign
// 답변 조합으로 방 ID 계산 후 방 정보 반환
router.post('/assign', (req, res) => {
  const { answers } = req.body; // { q1: 'A', q2: 'B', q3: 'A' }
  if (!answers) return res.status(400).json({ error: 'answers required' });

  const { state } = getServiceState();
  if (state !== 'open') {
    return res.status(403).json({ error: 'service_not_open' });
  }

  const date = getKSTDateString();
  const roomId = generateRoomId(date, answers);

  // TODO: DB에서 방 현황 조회 (currentCount, maxCount)
  res.json({
    roomId,
    date,
    answers,
    currentCount: 0,
    maxCount: 5,
    status: 'available', // available | watching
  });
});

module.exports = router;
