// ---------------------------------------------------------------------------
// Auth routes: login, refresh, me (public — no auth required)
// ---------------------------------------------------------------------------
const express = require('express');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/error-handler');
const { authenticate, signToken } = require('../middleware/auth');
const { findByUsername } = require('../dal/user-queries');

const router = express.Router();

// POST /api/auth/login — authenticate with username + password
router.post('/api/auth/login', asyncHandler((req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role },
  });
}));

// POST /api/auth/refresh — issue a new token (requires valid existing token)
router.post('/api/auth/refresh', authenticate, asyncHandler((req, res) => {
  const user = findByUsername(req.user.username);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  const token = signToken(user);
  res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
}));

// GET /api/auth/me — return current user info from token
router.get('/api/auth/me', authenticate, asyncHandler((req, res) => {
  const user = findByUsername(req.user.username);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role });
}));

module.exports = router;
