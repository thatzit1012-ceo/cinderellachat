const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'secret';

// 단순 Bearer 토큰 검증 (운영 시 JWT로 교체 권장)
function adminAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';

  if (!token || token !== ADMIN_TOKEN_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

module.exports = { adminAuth, ADMIN_PASSWORD, ADMIN_TOKEN_SECRET };
