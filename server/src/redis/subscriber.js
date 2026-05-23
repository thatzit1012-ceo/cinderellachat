const { createClient } = require('redis');

let subscriber = null;

async function startRedisSubscriber(io) {
  if (!process.env.REDIS_URL) {
    console.log('[Redis] REDIS_URL not set — midnight:close via Redis disabled');
    return;
  }

  try {
    subscriber = createClient({ url: process.env.REDIS_URL });
    subscriber.on('error', (err) => console.error('[Redis] subscriber error:', err.message));
    await subscriber.connect();

    await subscriber.subscribe('midnight:close', (message) => {
      console.log('[Redis] midnight:close received:', message);
      // 연결된 모든 클라이언트에 자정 종료 신호 브로드캐스트
      io.emit('midnight:close', JSON.parse(message));
    });

    console.log('[Redis] subscribed to midnight:close');
  } catch (err) {
    console.error('[Redis] failed to connect:', err.message);
  }
}

async function stopRedisSubscriber() {
  if (subscriber) await subscriber.disconnect();
}

module.exports = { startRedisSubscriber, stopRedisSubscriber };
