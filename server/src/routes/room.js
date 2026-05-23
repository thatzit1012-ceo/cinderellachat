const express = require('express');
const router = express.Router();
const { generateRoomId } = require('../utils/roomId');
const { getKSTDateString, getServiceState } = require('../utils/time');
const { getOrCreateTodaySession, getOrCreateRoom, getRoomById } = require('../db/queries');

// POST /api/room/assign
router.post('/assign', async (req, res) => {
  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'answers required' });
    }

    const { state } = getServiceState();
    if (state !== 'open') {
      return res.status(403).json({ error: 'service_not_open' });
    }

    const date = getKSTDateString();
    const session = await getOrCreateTodaySession();
    const roomId = generateRoomId(date, answers);
    const room = await getOrCreateRoom(roomId, answers, date, session.max_per_room);

    const status = room.current_count >= room.max_count ? 'watching' : 'available';

    res.json({
      roomId: room.room_id,
      date,
      answers,
      currentCount: room.current_count,
      maxCount: room.max_count,
      status,
    });
  } catch (err) {
    console.error('room/assign error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

// GET /api/room/:roomId/history
router.get('/:roomId/history', async (req, res) => {
  try {
    const { getRecentMessages } = require('../db/queries');
    const messages = await getRecentMessages(req.params.roomId);
    res.json({ messages });
  } catch (err) {
    console.error('room/history error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
