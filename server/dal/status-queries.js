// ---------------------------------------------------------------------------
// Data access layer: status & exclusion count queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

function getStatus() {
  return db.prepare(`
    SELECT
      COUNT(*) AS total_contracts,
      COUNT(DISTINCT customer_id) AS total_customers,
      MAX(imported_at) AS last_import
    FROM contracts
  `).get();
}

function getExclusionCounts() {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN age_over_75 = 1 THEN 1 ELSE 0 END) AS over75,
      SUM(CASE WHEN in_arrears = 1 THEN 1 ELSE 0 END) AS arrears,
      SUM(CASE WHEN is_deceased = 1 THEN 1 ELSE 0 END) AS deceased,
      SUM(CASE WHEN marketing_optout = 1 THEN 1 ELSE 0 END) AS optout
    FROM contracts
  `).get();

  return {
    total: row.total || 0,
    over75: row.over75 || 0,
    arrears: row.arrears || 0,
    deceased: row.deceased || 0,
    optout: row.optout || 0,
  };
}

module.exports = { getStatus, getExclusionCounts };
