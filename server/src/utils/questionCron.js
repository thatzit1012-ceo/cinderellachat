const cron = require('node-cron');
const pool = require('../db/pool');
const { generateDailyQuestions } = require('./aiQuestions');

function getTomorrowKST() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() + 1);
  return kst.toISOString().slice(0, 10);
}

async function generateAndSave(targetDate) {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  console.log(`[questionCron] Generating AI questions for ${targetDate}...`);
  const questions = await generateDailyQuestions(targetDate);

  const openAt  = new Date(`${targetDate}T07:00:00+09:00`);
  const closeAt = new Date(`${targetDate}T24:00:00+09:00`);
  await pool.query(
    `INSERT INTO sessions (session_id, open_at, close_at)
     VALUES ($1, $2, $3) ON CONFLICT (session_id) DO NOTHING`,
    [targetDate, openAt, closeAt]
  );

  const result = await pool.query(
    `INSERT INTO question_sets (session_id, questions, is_active, source)
     VALUES ($1, $2, FALSE, 'ai') RETURNING *`,
    [targetDate, JSON.stringify(questions)]
  );

  console.log(`[questionCron] Saved set_id=${result.rows[0].set_id} for ${targetDate}`);
  return result.rows[0];
}

function startQuestionCron() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('[questionCron] ANTHROPIC_API_KEY not set — cron disabled');
    return;
  }

  // 매일 14:00 KST
  cron.schedule('0 14 * * *', async () => {
    try {
      await generateAndSave(getTomorrowKST());
    } catch (err) {
      console.error('[questionCron] ERROR:', err.message);
    }
  }, { timezone: 'Asia/Seoul' });

  console.log('[questionCron] Scheduled: daily 14:00 KST');
}

module.exports = { startQuestionCron, generateAndSave };
