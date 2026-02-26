// ---------------------------------------------------------------------------
// Auth routes: login, refresh, me (public — no auth required)
// ---------------------------------------------------------------------------
const express = require('express');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/error-handler');
const { authenticate, signToken } = require('../middleware/auth');
const { findByUsername, updatePassword, updateLastLogin } = require('../dal/user-queries');
const { logAction } = require('../dal/audit-queries');

const router = express.Router();

// POST /api/auth/login — authenticate with username + password
router.post('/api/auth/login', asyncHandler((req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = findByUsername(username);
  if (!user) {
    logAction(null, username, 'login_failed', 'login', `Failed login attempt for unknown user "${username}"`);
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    logAction(user.id, username, 'login_failed', 'login', 'Failed login attempt — incorrect password');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  updateLastLogin(user.id);
  logAction(user.id, user.username, 'login_success', 'login', `Logged in (role: ${user.role})`);

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
  res.json({ user: { id: user.id, username: user.username, email: user.email, role: user.role } });
}));

// PUT /api/auth/password — change own password (requires valid token + current password)
router.put('/api/auth/password', authenticate, asyncHandler((req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const user = findByUsername(req.user.username);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }

  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  updatePassword(user.id, hash);
  logAction(user.id, user.username, 'password_self_change', 'user', 'User changed their own password');
  res.json({ message: 'Password changed successfully' });
}));

module.exports = router;
