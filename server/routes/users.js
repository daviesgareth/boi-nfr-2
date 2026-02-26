// ---------------------------------------------------------------------------
// User management routes (admin only)
// ---------------------------------------------------------------------------
const express = require('express');
const bcrypt = require('bcryptjs');
const { asyncHandler } = require('../middleware/error-handler');
const users = require('../dal/user-queries');

const router = express.Router();

// GET /api/users — list all users
router.get('/api/users', asyncHandler((req, res) => {
  res.json(users.listUsers());
}));

// POST /api/users — create a new user
router.post('/api/users', asyncHandler((req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  const validRoles = ['admin', 'analyst', 'viewer'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Allowed: ' + validRoles.join(', ') });
  }

  // Check for duplicates
  const existing = users.findByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const user = users.createUser(username, email, hash, role || 'viewer');
  res.status(201).json(user);
}));

// PUT /api/users/:id — update a user (role, email)
router.put('/api/users/:id', asyncHandler((req, res) => {
  const { id } = req.params;
  const { email, role } = req.body;

  const existing = users.findById(id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  const validRoles = ['admin', 'analyst', 'viewer'];
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Allowed: ' + validRoles.join(', ') });
  }

  // Prevent removing last admin
  if (existing.role === 'admin' && role && role !== 'admin') {
    const adminCount = users.countAdmins();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last admin user' });
    }
  }

  const updated = users.updateUser(id, { email, role });
  res.json(updated);
}));

// PUT /api/users/:id/password — update a user's password
router.put('/api/users/:id/password', asyncHandler((req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = users.findById(id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  const hash = bcrypt.hashSync(password, 10);
  users.updatePassword(id, hash);
  res.json({ success: true });
}));

// DELETE /api/users/:id — delete a user
router.delete('/api/users/:id', asyncHandler((req, res) => {
  const { id } = req.params;

  const existing = users.findById(id);
  if (!existing) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prevent deleting self
  if (existing.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Prevent removing last admin
  if (existing.role === 'admin') {
    const adminCount = users.countAdmins();
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin user' });
    }
  }

  users.deleteUser(id);
  res.json({ success: true });
}));

module.exports = router;
