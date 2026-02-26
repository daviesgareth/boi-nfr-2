// ---------------------------------------------------------------------------
// Data access layer: matching statistics queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

function getMatchingStats() {
  const totalRow = db.prepare("SELECT COUNT(*) AS total_contracts FROM contracts").get();
  const uniqueRow = db.prepare("SELECT COUNT(DISTINCT customer_id) AS unique_customers FROM contracts").get();
  const repeatRow = db.prepare(`
    SELECT COUNT(*) AS repeat_customers
    FROM (SELECT customer_id FROM contracts GROUP BY customer_id HAVING COUNT(*) > 1)
  `).get();

  const total = totalRow.total_contracts || 0;
  const unique = uniqueRow.unique_customers || 0;
  const repeat = repeatRow.repeat_customers || 0;
  const repeat_rate = unique > 0 ? Math.round((repeat / unique) * 10000) / 100 : 0;

  const methods = db.prepare(`
    SELECT match_method AS method, COUNT(*) AS pairs, confidence
    FROM matching_log
    GROUP BY match_method, confidence
    ORDER BY pairs DESC
  `).all();

  return { total_contracts: total, unique_customers: unique, repeat_customers: repeat, repeat_rate, methods };
}

function getMatchingLog() {
  return db.prepare(`
    SELECT * FROM matching_log ORDER BY created_at DESC LIMIT 100
  `).all();
}

module.exports = { getMatchingStats, getMatchingLog };
