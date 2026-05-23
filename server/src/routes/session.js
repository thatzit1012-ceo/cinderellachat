const express = require('express');
const router = express.Router();
const { getKSTDateString, getServiceState } = require('../utils/time');
const { DEFAULT_QUESTIONS } = require('../db/defaultQuestions');

// GET /api/session/today
// 오늘 서비스 상태 + 질문 세트 반환
router.get('/today', (req, res) => {
  const { state, remaining } = getServiceState();
  const date = getKSTDateString();

  // TODO: DB에서 오늘 승인된 질문 세트 조회, 없으면 DEFAULT_QUESTIONS 사용
  const questions = DEFAULT_QUESTIONS;

  res.json({ date, state, remaining, questions });
});

module.exports = router;
