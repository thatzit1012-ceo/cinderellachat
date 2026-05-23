// AWS Lambda — 매일 00:00 KST (= 15:00 UTC) 자동 실행
// EventBridge 규칙: cron(0 15 * * ? *)
//
// 실행 순서:
// 1. Redis에 midnight:close 발행 → 서버가 모든 소켓 강제 종료
// 2. 분석 데이터 저장 (analytics_daily)
// 3. FK 순서대로 삭제: messages → users → rooms → question_sets → sessions
// 4. 다음 날 세션 사전 생성

const { Pool } = require('pg');
const { createClient } = require('redis');

function getKSTDateString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getYesterdayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() - 1);
  return kst.toISOString().slice(0, 10);
}

function getTomorrowKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCDate(kst.getUTCDate() + 1);
  return kst.toISOString().slice(0, 10);
}

exports.handler = async (event) => {
  const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }, // AWS RDS
    max: 5,
    connectionTimeoutMillis: 10000,
  });

  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();

  const today = getYesterdayKST(); // 자정 직후이므로 삭제 대상은 어제 날짜
  const tomorrow = getKSTDateString();

  console.log(`[midnight-cleanup] target date: ${today}, next session: ${tomorrow}`);

  try {
    // ── Step 1: 소켓 강제 종료 신호 ──────────────────────────
    await redis.publish('midnight:close', JSON.stringify({ date: today }));
    console.log('[midnight-cleanup] Redis midnight:close published');

    // ── Step 2: 분석 데이터 저장 ─────────────────────────────
    await saveAnalytics(pool, today);
    console.log('[midnight-cleanup] Analytics saved');

    // ── Step 3: 데이터 삭제 (FK 순서 준수) ───────────────────
    const deleted = await deleteSessionData(pool, today);
    console.log('[midnight-cleanup] Deleted:', deleted);

    // ── Step 4: 내일 세션 사전 생성 (디폴트 질문 포함) ────────
    await seedNextSession(pool, tomorrow);
    console.log('[midnight-cleanup] Next session seeded:', tomorrow);

    return {
      statusCode: 200,
      body: JSON.stringify({ status: 'success', cleaned: today, next: tomorrow, ...deleted }),
    };
  } catch (err) {
    console.error('[midnight-cleanup] ERROR:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ status: 'error', message: err.message }),
    };
  } finally {
    await redis.disconnect();
    await pool.end();
  }
};

async function saveAnalytics(pool, date) {
  const [rooms, users, msgs] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM rooms WHERE session_id = $1', [date]),
    pool.query('SELECT COUNT(*) FROM users WHERE session_id = $1', [date]),
    pool.query(
      `SELECT COUNT(*) FROM messages
       WHERE room_id IN (SELECT room_id FROM rooms WHERE session_id = $1)`,
      [date]
    ),
  ]);

  const peakResult = await pool.query(
    `SELECT MAX(current_count) as peak FROM rooms WHERE session_id = $1`,
    [date]
  );

  await pool.query(
    `INSERT INTO analytics_daily (date, total_rooms, total_users, peak_users, total_messages)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (date) DO UPDATE
     SET total_rooms=$2, total_users=$3, peak_users=$4, total_messages=$5`,
    [
      date,
      parseInt(rooms.rows[0].count),
      parseInt(users.rows[0].count),
      parseInt(peakResult.rows[0].peak || 0),
      parseInt(msgs.rows[0].count),
    ]
  );
}

async function deleteSessionData(pool, date) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const msgResult = await client.query(
      `DELETE FROM messages
       WHERE room_id IN (SELECT room_id FROM rooms WHERE session_id = $1)`,
      [date]
    );

    const userResult = await client.query(
      `DELETE FROM users WHERE session_id = $1`,
      [date]
    );

    const roomResult = await client.query(
      `DELETE FROM rooms WHERE session_id = $1`,
      [date]
    );

    const qsResult = await client.query(
      `DELETE FROM question_sets WHERE session_id = $1`,
      [date]
    );

    const sessionResult = await client.query(
      `DELETE FROM sessions WHERE session_id = $1`,
      [date]
    );

    await client.query('COMMIT');

    return {
      deletedMessages:     msgResult.rowCount,
      deletedUsers:        userResult.rowCount,
      deletedRooms:        roomResult.rowCount,
      deletedQuestionSets: qsResult.rowCount,
      deletedSessions:     sessionResult.rowCount,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedNextSession(pool, tomorrow) {
  const openAt  = new Date(`${tomorrow}T07:00:00+09:00`);
  const closeAt = new Date(`${tomorrow}T24:00:00+09:00`);

  // 세션 생성
  await pool.query(
    `INSERT INTO sessions (session_id, open_at, close_at, max_per_room)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_id) DO NOTHING`,
    [tomorrow, openAt, closeAt, 5]
  );

  // 관리자가 질문을 등록하지 않은 경우를 대비한 디폴트 질문 세트 삽입
  const existing = await pool.query(
    `SELECT 1 FROM question_sets WHERE session_id = $1 AND is_active = TRUE`,
    [tomorrow]
  );

  if (existing.rows.length === 0) {
    const defaultQuestions = getDefaultQuestions();
    await pool.query(
      `INSERT INTO question_sets (session_id, questions, approved_by, approved_at, is_active)
       VALUES ($1, $2, 'system', NOW(), TRUE)`,
      [tomorrow, JSON.stringify(defaultQuestions)]
    );
    console.log(`[midnight-cleanup] Default questions seeded for ${tomorrow}`);
  }
}

function getDefaultQuestions() {
  return [
    {
      id: 'q1',
      text_ko: '만약에 내 연인이 다 좋은데, 가난해...당신의 선택은?',
      text_en: 'Your partner is great in every way, but poor. What do you choose?',
      options: [
        { code: 'A', text_ko: '난 오케이, 사랑만 있다면 극복 가능하다.', text_en: "I'm okay, love can overcome anything." },
        { code: 'B', text_ko: '말도 안된다. 지금 세상은 돈 없으면 사랑도 오래 못간다.', text_en: "No way. In today's world, love can't last without money." },
        { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
      ],
    },
    {
      id: 'q2',
      text_ko: '처음 만났다. 근데 맘에 든다. 어디까지는 오케이?',
      text_en: 'You just met someone and you like them. How far is okay on the first meeting?',
      options: [
        { code: 'A', text_ko: '내 짝이라면, 첫 만남에 키스도 가능하다고 생각한다.', text_en: "If they're the one, a kiss on the first meeting is fine." },
        { code: 'B', text_ko: '그래도 처음인데, 그건 아니다. 손 잡는 정도까지...', text_en: 'Still the first time — holding hands is the limit.' },
        { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
      ],
    },
    {
      id: 'q3',
      text_ko: '키스를 할때, 내 역할은?',
      text_en: 'When kissing, what is your role?',
      options: [
        { code: 'A', text_ko: '리드를 하는 편이다.', text_en: 'I tend to take the lead.' },
        { code: 'B', text_ko: '상대에게 맡기는 편이다.', text_en: 'I tend to let the other person lead.' },
        { code: 'X', text_ko: '이 질문에는 답변 없음', text_en: 'No answer for this question' },
      ],
    },
  ];
}
