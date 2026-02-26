// ---------------------------------------------------------------------------
// Data access layer: audit log queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

function logAction(userId, username, action, category, detail) {
  return db.prepare(
    'INSERT INTO audit_log (user_id, username, action, category, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, username, action, category, detail);
}

function getAuditLog({ limit = 50, offset = 0, category = null, username = null } = {}) {
  let sql = 'SELECT * FROM audit_log';
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (username) {
    conditions.push('username = ?');
    params.push(username);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function getAuditCount({ category = null, username = null } = {}) {
  let sql = 'SELECT COUNT(*) AS total FROM audit_log';
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('category = ?');
    params.push(category);
  }
  if (username) {
    conditions.push('username = ?');
    params.push(username);
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  return db.prepare(sql).get(...params).total;
}

function getAuditUsers() {
  return db.prepare(
    'SELECT DISTINCT username FROM audit_log ORDER BY username ASC'
  ).all().map(r => r.username);
}

module.exports = { logAction, getAuditLog, getAuditCount, getAuditUsers };
