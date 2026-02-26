// ---------------------------------------------------------------------------
// Admin routes: data overview, database purge, audit log
// ---------------------------------------------------------------------------
const express = require('express');
const fs = require('fs');
const path = require('path');
const { db } = require('../db');
const { asyncHandler } = require('../middleware/error-handler');
const { logAction, getAuditLog, getAuditCount, getAuditUsers } = require('../dal/audit-queries');

const router = express.Router();

// GET /api/admin/data-overview — database health + counts
router.get('/api/admin/data-overview', asyncHandler((req, res) => {
  const contracts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      COUNT(DISTINCT customer_id) AS customers,
      MIN(start_date) AS earliest_contract,
      MAX(end_date) AS latest_contract,
      MAX(imported_at) AS last_import
    FROM contracts
  `).get();

  const nfr = db.prepare('SELECT COUNT(*) AS total FROM nfr_results').get();
  const matching = db.prepare('SELECT COUNT(*) AS total FROM matching_log').get();
  const users = db.prepare('SELECT COUNT(*) AS total FROM users').get();
  const auditEntries = db.prepare('SELECT COUNT(*) AS total FROM audit_log').get();

  // Open contracts count
  const openContracts = db.prepare('SELECT COUNT(*) AS total FROM contracts WHERE is_open = 1').get();

  // Database file size
  const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
  const dbPath = path.join(dataDir, 'nfr.db');
  let dbSizeBytes = 0;
  try { dbSizeBytes = fs.statSync(dbPath).size; } catch (e) { /* ignore */ }

  res.json({
    contracts: contracts.total,
    customers: contracts.customers,
    open_contracts: openContracts.total,
    earliest_contract: contracts.earliest_contract,
    latest_contract: contracts.latest_contract,
    last_import: contracts.last_import,
    nfr_results: nfr.total,
    matching_log: matching.total,
    users: users.total,
    audit_entries: auditEntries.total,
    db_size_bytes: dbSizeBytes,
  });
}));

// POST /api/admin/purge — clear all contract/NFR/matching data
router.post('/api/admin/purge', asyncHandler((req, res) => {
  const { confirm } = req.body;
  if (confirm !== 'PURGE') {
    return res.status(400).json({ error: 'Must send { confirm: "PURGE" } to confirm' });
  }

  const contractCount = db.prepare('SELECT COUNT(*) AS c FROM contracts').get().c;

  db.exec('DELETE FROM nfr_results');
  db.exec('DELETE FROM matching_log');
  db.exec('DELETE FROM contracts');
  db.exec('VACUUM');

  const detail = `Purged all data: ${contractCount.toLocaleString()} contracts, NFR results, and matching log cleared`;
  logAction(req.user.id, req.user.username, 'data_purge', 'purge', detail);

  res.json({ success: true, purged_contracts: contractCount });
}));

// GET /api/admin/audit-log — paginated audit log with category + username filters
router.get('/api/admin/audit-log', asyncHandler((req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);
  const offset = parseInt(req.query.offset) || 0;
  const category = req.query.category || null;
  const username = req.query.username || null;

  const entries = getAuditLog({ limit, offset, category, username });
  const total = getAuditCount({ category, username });
  const users = getAuditUsers();

  res.json({ entries, total, limit, offset, users });
}));

module.exports = router;
