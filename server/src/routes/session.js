const express = require('express');
const router = express.Router();
const { getKSTDateString, getServiceState } = require('../utils/time');
const { getTodayQuestions } = require('../db/queries');

// GET /api/session/today
router.get('/today', async (req, res) => {
  try {
    const { state, remaining } = getServiceState();
    const date = getKSTDateString();
    const questions = await getTodayQuestions();
    res.json({ date, state, remaining, questions });
  } catch (err) {
    console.error('session/today error:', err.message);
    res.status(500).json({ error: 'server_error' });
  }
});

module.exports = router;
