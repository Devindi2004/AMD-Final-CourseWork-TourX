const { verifyAccessToken } = require('../lib/tokens');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing bearer token', code: 'NO_TOKEN' });
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired access token', code: 'TOKEN_EXPIRED' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `This action requires one of the following roles: ${roles.join(', ')}`,
        code: 'FORBIDDEN_ROLE',
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
