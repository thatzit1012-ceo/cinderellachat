const express = require('express');
const router = express.Router();

// GET /api/nickname/check?nickname=xxx&roomId=yyy
router.get('/check', (req, res) => {
  const { nickname, roomId } = req.query;
  if (!nickname || nickname.length < 1 || nickname.length > 20) {
    return res.json({ available: false, reason: 'invalid_length' });
  }
  // TODO: DB에서 해당 roomId 내 닉네임 중복 확인
  res.json({ available: true });
});

module.exports = router;
