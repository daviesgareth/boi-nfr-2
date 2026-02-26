// ---------------------------------------------------------------------------
// Data access layer: user CRUD queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

function findByUsername(username) {
  return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
}

function findById(id) {
  return db.prepare("SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?").get(id);
}

function listUsers() {
  return db.prepare("SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY created_at DESC").all();
}

function createUser(username, email, passwordHash, role = 'viewer') {
  const result = db.prepare(
    "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)"
  ).run(username, email, passwordHash, role);
  return findById(result.lastInsertRowid);
}

function updateUser(id, { username, email, role }) {
  const sets = [];
  const params = [];
  if (username !== undefined) { sets.push('username = ?'); params.push(username); }
  if (email !== undefined) { sets.push('email = ?'); params.push(email); }
  if (role !== undefined) { sets.push('role = ?'); params.push(role); }
  if (sets.length === 0) return findById(id);

  sets.push("updated_at = datetime('now')");
  params.push(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return findById(id);
}

function updatePassword(id, passwordHash) {
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, id);
}

function deleteUser(id) {
  return db.prepare("DELETE FROM users WHERE id = ?").run(id);
}

function countAdmins() {
  return db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
}

module.exports = { findByUsername, findById, listUsers, createUser, updateUser, updatePassword, deleteUser, countAdmins };
