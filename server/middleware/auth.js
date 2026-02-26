// ---------------------------------------------------------------------------
// JWT authentication + role authorization middleware
// ---------------------------------------------------------------------------
const jwt = require('jsonwebtoken');
const config = require('../env');

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRY = config.jwtExpiry;

/**
 * Middleware: validates Bearer token and sets req.user
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware factory: restricts access to specified roles
 * Usage: requireRole('admin') or requireRole('admin', 'analyst')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Sign a JWT token for a user
 */
function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

module.exports = { authenticate, requireRole, signToken, JWT_SECRET };
