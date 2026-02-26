// ---------------------------------------------------------------------------
// Data access layer: audit log queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

function logAction(userId, username, action, category, detail) {
  return db.prepare(
    'INSERT INTO audit_log (user_id, username, action, category, detail) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, username, action, category, detail);
}

function getAuditLog({ limit = 50, offset = 0, category = null } = {}) {
  let sql = 'SELECT * FROM audit_log';
  const params = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);
  return db.prepare(sql).all(...params);
}

function getAuditCount(category = null) {
  let sql = 'SELECT COUNT(*) AS total FROM audit_log';
  const params = [];
  if (category) {
    sql += ' WHERE category = ?';
    params.push(category);
  }
  return db.prepare(sql).get(...params).total;
}

module.exports = { logAction, getAuditLog, getAuditCount };
