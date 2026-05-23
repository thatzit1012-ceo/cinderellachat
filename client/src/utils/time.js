export function getKST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

export function getServiceState() {
  const kst = getKST();
  const totalSec = kst.getHours() * 3600 + kst.getMinutes() * 60 + kst.getSeconds();
  const OPEN_SEC = 7 * 3600;
  const CLOSE_SEC = 24 * 3600;

  if (totalSec >= OPEN_SEC) {
    return { state: 'open', remaining: CLOSE_SEC - totalSec };
  } else {
    return { state: 'waiting', remaining: OPEN_SEC - totalSec };
  }
}

export function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return { h, m, s };
}
