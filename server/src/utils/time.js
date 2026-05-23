// KST 기준 서비스 상태 계산 (서버는 UTC, KST = UTC+9)
function getKSTDate() {
  const now = new Date();
  return new Date(now.getTime() + 9 * 60 * 60 * 1000);
}

function getKSTDateString() {
  const kst = getKSTDate();
  return kst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function getServiceState() {
  const kst = getKSTDate();
  const totalSec = kst.getUTCHours() * 3600 + kst.getUTCMinutes() * 60 + kst.getUTCSeconds();
  const OPEN_SEC = 7 * 3600;   // 07:00 KST
  const CLOSE_SEC = 24 * 3600; // 00:00 KST

  if (totalSec >= OPEN_SEC) {
    return { state: 'open', remaining: CLOSE_SEC - totalSec };
  } else {
    return { state: 'waiting', remaining: OPEN_SEC - totalSec };
  }
}

module.exports = { getKSTDate, getKSTDateString, getServiceState };
