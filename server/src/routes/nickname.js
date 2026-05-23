const express = require('express');
const router = express.Router();
const { isNicknameTaken } = require('../db/queries');

// GET /api/nickname/check?nickname=xxx&roomId=yyy
router.get('/check', async (req, res) => {
  try {
    const { nickname, roomId } = req.query;

    if (!nickname || nickname.trim().length < 2 || nickname.trim().length > 20) {
      return res.json({ available: false, reason: 'invalid_length' });
    }
    if (!roomId) return res.json({ available: true });

    const taken = await isNicknameTaken(nickname.trim(), roomId);
    res.json({ available: !taken });
  } catch (err) {
    console.error('nickname/check error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
