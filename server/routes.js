const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('./db');
const { ingestFile } = require('./ingest');
const { runMatching } = require('./matching');
const { computeNFR } = require('./nfr');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ---------------------------------------------------------------------------
// Helper: map window parameter to retained column name
// ---------------------------------------------------------------------------
function getRetainedCol(window) {
  const map = {
    'core': 'retained_core',
    '6_1': 'retained_6_1',
    '3_3': 'retained_3_3',
    '3_6': 'retained_3_6',
    '3_12': 'retained_3_12',
    '9mo': 'retained_9mo',
    'r13mo': 'retained_r13mo',
  };
  return map[window] || 'retained_core';
}

// ---------------------------------------------------------------------------
// Helper: build exclusion WHERE conditions from ?exclude=over75,arrears,...
// ---------------------------------------------------------------------------
function getExclusionConditions(query) {
  const conditions = [];
  const excludeStr = query.exclude || '';
  const exclusions = excludeStr.split(',').filter(Boolean);
  for (const ex of exclusions) {
    switch (ex) {
      case 'over75': conditions.push('c.age_over_75 = 0'); break;
      case 'arrears': conditions.push('c.in_arrears = 0'); break;
      case 'deceased': conditions.push('c.is_deceased = 0'); break;
      case 'optout': conditions.push('c.marketing_optout = 0'); break;
    }
  }
  return conditions;
}

function buildExclusionClause(query) {
  const conditions = getExclusionConditions(query);
  return conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '';
}

// ---------------------------------------------------------------------------
// POST /api/upload  -- ingest a file, run matching & NFR computation
// ---------------------------------------------------------------------------
router.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const filePath = req.file.path;
    const ingestCount = ingestFile(filePath);
    const matchStats = runMatching();
    computeNFR();
    res.json({ success: true, contracts: ingestCount, customers: matchStats.unique_customers });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/status  -- high-level DB status
// ---------------------------------------------------------------------------
router.get('/api/status', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total_contracts,
        COUNT(DISTINCT customer_id) AS total_customers,
        MAX(imported_at) AS last_import
      FROM contracts
    `).get();
    res.json(row);
  } catch (err) {
    console.error('Status error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/national  -- overall NFR rate
// ---------------------------------------------------------------------------
router.get('/api/nfr/national', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const row = db.prepare(`
      SELECT
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
    `).get();

    const ended = row.ended || 0;
    const retained = row.retained || 0;
    const nfr_rate = ended > 0 ? Math.round((retained / ended) * 10000) / 100 : 0;

    res.json({ ended, retained, nfr_rate });
  } catch (err) {
    console.error('National NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-year  -- NFR rate by year of contract end
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-year', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        substr(c.end_date, 1, 4) AS year,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY year
      ORDER BY year
    `).all();

    const result = rows.map(r => ({
      year: r.year,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-year NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-region  -- NFR rate by region
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-region', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.region,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY c.region
      ORDER BY (CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC
    `).all();

    const result = rows.map(r => ({
      region: r.region,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-region NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-agreement  -- NFR rate by agreement type
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-agreement', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.agreement_type,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY c.agreement_type
      ORDER BY (CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC
    `).all();

    const result = rows.map(r => ({
      agreement_type: r.agreement_type,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-agreement NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-term  -- NFR rate by term band (custom sort)
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-term', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.term_band,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY c.term_band
      ORDER BY
        CASE c.term_band
          WHEN '12-24 mo' THEN 1
          WHEN '25-36 mo' THEN 2
          WHEN '37-48 mo' THEN 3
          WHEN '49-60 mo' THEN 4
          WHEN '60+ mo' THEN 5
          ELSE 6
        END
    `).all();

    const result = rows.map(r => ({
      term_band: r.term_band,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-term NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-dealer-group  -- NFR rate by dealer group (top 50)
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-dealer-group', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.dealer_group,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained,
        SUM(CASE WHEN n.${retainedCol} = 1 AND n.same_dealer = 1 THEN 1 ELSE 0 END) AS same_dealer,
        SUM(CASE WHEN n.${retainedCol} = 1 AND (n.same_dealer = 0 OR n.same_dealer IS NULL) THEN 1 ELSE 0 END) AS diff_dealer
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY c.dealer_group
      ORDER BY (CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC
      LIMIT 50
    `).all();

    const result = rows.map(r => ({
      dealer_group: r.dealer_group,
      ended: r.ended,
      retained: r.retained || 0,
      same_dealer: r.same_dealer || 0,
      diff_dealer: r.diff_dealer || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-dealer-group NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-dealer  -- NFR rate by dealer name (top 100)
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-dealer', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.dealer_name,
        COUNT(*) AS ended,
        SUM(CASE WHEN n.${retainedCol} = 1 AND n.same_dealer = 1 THEN 1 ELSE 0 END) AS same_dealer_retained,
        SUM(CASE WHEN n.${retainedCol} = 1 AND (n.same_dealer = 0 OR n.same_dealer IS NULL) THEN 1 ELSE 0 END) AS diff_dealer_retained,
        SUM(n.${retainedCol}) AS total_retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
      GROUP BY c.dealer_name
      ORDER BY COUNT(*) DESC
      LIMIT 100
    `).all();

    const result = rows.map(r => {
      const totalRetained = r.total_retained || 0;
      return {
        dealer_name: r.dealer_name,
        ended: r.ended,
        same_dealer_retained: r.same_dealer_retained || 0,
        diff_dealer_retained: r.diff_dealer_retained || 0,
        total_retained: totalRetained,
        nfr_rate: r.ended > 0 ? Math.round((totalRetained / r.ended) * 10000) / 100 : 0,
        dealer_retained_pct: totalRetained > 0 ? Math.round(((r.same_dealer_retained || 0) / totalRetained) * 10000) / 100 : 0
      };
    });

    res.json(result);
  } catch (err) {
    console.error('By-dealer NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/by-make  -- NFR rate by vehicle make (top 30)
// ---------------------------------------------------------------------------
router.get('/api/nfr/by-make', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        c.make,
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
        AND c.make IS NOT NULL
        AND c.make != ''
      GROUP BY c.make
      ORDER BY (CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC
      LIMIT 30
    `).all();

    const result = rows.map(r => ({
      make: r.make,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('By-make NFR error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/transitions  -- retention transition breakdown
// ---------------------------------------------------------------------------
router.get('/api/nfr/transitions', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);
    const rows = db.prepare(`
      SELECT
        n.transition,
        COUNT(*) AS count
      FROM nfr_results n
      JOIN contracts c ON c.contract_id = n.contract_id
      WHERE n.${retainedCol} = 1${excl}
      GROUP BY n.transition
      ORDER BY count DESC
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('Transitions error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/termination  -- NFR rate split by early vs full-term
// ---------------------------------------------------------------------------
router.get('/api/nfr/termination', (req, res) => {
  try {
    const retainedCol = getRetainedCol(req.query.window);
    const excl = buildExclusionClause(req.query);

    const earlyRow = db.prepare(`
      SELECT
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0 AND c.ended_early = 1${excl}
    `).get();

    const fullRow = db.prepare(`
      SELECT
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0 AND c.ended_early = 0${excl}
    `).get();

    const earlyEnded = earlyRow.ended || 0;
    const earlyRetained = earlyRow.retained || 0;
    const fullEnded = fullRow.ended || 0;
    const fullRetained = fullRow.retained || 0;

    res.json({
      early: {
        ended: earlyEnded,
        retained: earlyRetained,
        nfr_rate: earlyEnded > 0 ? Math.round((earlyRetained / earlyEnded) * 10000) / 100 : 0
      },
      full_term: {
        ended: fullEnded,
        retained: fullRetained,
        nfr_rate: fullEnded > 0 ? Math.round((fullRetained / fullEnded) * 10000) / 100 : 0
      }
    });
  } catch (err) {
    console.error('Termination error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/at-risk  -- contracts expiring within next 6 months
// ---------------------------------------------------------------------------
router.get('/api/nfr/at-risk', (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    const sixMonthsStr = sixMonths.toISOString().slice(0, 10);

    // Build at-risk exclusion clause (uses contracts directly, no alias needed — add alias)
    const exclConditions = getExclusionConditions(req.query);
    const exclStr = exclConditions.length > 0 ? ' AND ' + exclConditions.join(' AND ').replace(/\bc\./g, '') : '';

    // Monthly breakdown of at-risk contracts
    const monthly = db.prepare(`
      SELECT
        substr(end_date, 1, 7) AS month,
        COUNT(*) AS count
      FROM contracts c
      WHERE c.is_open = 1
        AND c.end_date >= ?
        AND c.end_date <= ?${buildExclusionClause(req.query)}
      GROUP BY month
      ORDER BY month
    `).all(today, sixMonthsStr);

    // Total at-risk
    const totalRow = db.prepare(`
      SELECT COUNT(*) AS total
      FROM contracts c
      WHERE c.is_open = 1
        AND c.end_date >= ?
        AND c.end_date <= ?${buildExclusionClause(req.query)}
    `).get(today, sixMonthsStr);

    // Segment: PCP ending
    const pcpRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM contracts c
      WHERE c.is_open = 1
        AND c.end_date >= ?
        AND c.end_date <= ?
        AND c.agreement_type = 'Select (PCP)'${buildExclusionClause(req.query)}
    `).get(today, sixMonthsStr);

    // Segment: optimal term band
    const optimalRow = db.prepare(`
      SELECT COUNT(*) AS count
      FROM contracts c
      WHERE c.is_open = 1
        AND c.end_date >= ?
        AND c.end_date <= ?
        AND c.term_band = '37-48 mo'${buildExclusionClause(req.query)}
    `).get(today, sixMonthsStr);

    res.json({
      monthly,
      total: totalRow.total || 0,
      segments: {
        pcp_ending: pcpRow.count || 0,
        optimal_term: optimalRow.count || 0
      }
    });
  } catch (err) {
    console.error('At-risk error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/nfr/window-comparison  -- NFR rates across comparison windows
// ---------------------------------------------------------------------------
router.get('/api/nfr/window-comparison', (req, res) => {
  try {
    const excl = buildExclusionClause(req.query);

    // Map comparison labels to actual retained columns
    // 3mo -> core (same: -3/+1), 6mo -> 6_1 (same: -6/+1), 9mo and r13mo are new
    const windowsToCompare = [
      { label: '3 Month', key: '3mo', col: 'retained_core' },
      { label: '6 Month', key: '6mo', col: 'retained_6_1' },
      { label: '9 Month', key: '9mo', col: 'retained_9mo' },
      { label: '13 Month', key: 'r13mo', col: 'retained_r13mo' },
    ];

    const results = windowsToCompare.map(w => {
      const row = db.prepare(`
        SELECT
          COUNT(*) AS ended,
          SUM(n.${w.col}) AS retained
        FROM contracts c
        JOIN nfr_results n ON n.contract_id = c.contract_id
        WHERE c.is_open = 0${excl}
      `).get();

      const ended = row.ended || 0;
      const retained = row.retained || 0;
      return {
        label: w.label,
        key: w.key,
        ended,
        retained,
        nfr_rate: ended > 0 ? Math.round((retained / ended) * 10000) / 100 : 0,
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Window comparison error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/explorer  -- flexible NFR data explorer with dynamic filters
// ---------------------------------------------------------------------------
router.get('/api/explorer', (req, res) => {
  try {
    const { year, region, make, agreement_type, term_band, new_used, termination, groupBy } = req.query;
    const retainedCol = getRetainedCol(req.query.window);

    if (!groupBy) {
      return res.status(400).json({ error: 'groupBy parameter is required' });
    }

    // Validate groupBy against allowed columns to prevent SQL injection
    const allowedGroupBy = {
      year: "substr(c.end_date, 1, 4)",
      region: "c.region",
      make: "c.make",
      agreement_type: "c.agreement_type",
      term_band: "c.term_band",
      new_used: "c.new_used",
      dealer_group: "c.dealer_group",
      dealer_name: "c.dealer_name",
      termination: "CASE WHEN c.ended_early = 1 THEN 'Early Termination' ELSE 'Full Term' END"
    };

    const groupExpr = allowedGroupBy[groupBy];
    if (!groupExpr) {
      return res.status(400).json({ error: 'Invalid groupBy value. Allowed: ' + Object.keys(allowedGroupBy).join(', ') });
    }

    const conditions = ['c.is_open = 0'];
    const params = [];

    if (year) {
      conditions.push("substr(c.end_date, 1, 4) = ?");
      params.push(year);
    }
    if (region) {
      conditions.push("c.region = ?");
      params.push(region);
    }
    if (make) {
      conditions.push("c.make = ?");
      params.push(make);
    }
    if (agreement_type) {
      conditions.push("c.agreement_type = ?");
      params.push(agreement_type);
    }
    if (term_band) {
      conditions.push("c.term_band = ?");
      params.push(term_band);
    }
    if (new_used) {
      conditions.push("c.new_used = ?");
      params.push(new_used);
    }
    if (termination === 'early') {
      conditions.push("c.ended_early = 1");
    } else if (termination === 'full') {
      conditions.push("c.ended_early = 0");
    }

    // Add exclusion conditions
    const exclConds = getExclusionConditions(req.query);
    conditions.push(...exclConds);

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT
        ${groupExpr} AS "group",
        COUNT(*) AS ended,
        SUM(n.${retainedCol}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE ${whereClause}
      GROUP BY ${groupExpr}
      ORDER BY (CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC
    `;

    const rows = db.prepare(sql).all(...params);

    const result = rows.map(r => ({
      group: r.group,
      ended: r.ended,
      retained: r.retained || 0,
      nfr_rate: r.ended > 0 ? Math.round(((r.retained || 0) / r.ended) * 10000) / 100 : 0
    }));

    res.json(result);
  } catch (err) {
    console.error('Explorer error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/exclusion-counts  -- counts per exclusion category
// ---------------------------------------------------------------------------
router.get('/api/exclusion-counts', (req, res) => {
  try {
    const row = db.prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN age_over_75 = 1 THEN 1 ELSE 0 END) AS over75,
        SUM(CASE WHEN in_arrears = 1 THEN 1 ELSE 0 END) AS arrears,
        SUM(CASE WHEN is_deceased = 1 THEN 1 ELSE 0 END) AS deceased,
        SUM(CASE WHEN marketing_optout = 1 THEN 1 ELSE 0 END) AS optout
      FROM contracts
    `).get();

    res.json({
      total: row.total || 0,
      over75: row.over75 || 0,
      arrears: row.arrears || 0,
      deceased: row.deceased || 0,
      optout: row.optout || 0,
    });
  } catch (err) {
    console.error('Exclusion counts error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/matching/stats  -- matching summary statistics
// ---------------------------------------------------------------------------
router.get('/api/matching/stats', (req, res) => {
  try {
    const totalRow = db.prepare("SELECT COUNT(*) AS total_contracts FROM contracts").get();
    const uniqueRow = db.prepare("SELECT COUNT(DISTINCT customer_id) AS unique_customers FROM contracts").get();
    const repeatRow = db.prepare(`
      SELECT COUNT(*) AS repeat_customers
      FROM (
        SELECT customer_id
        FROM contracts
        GROUP BY customer_id
        HAVING COUNT(*) > 1
      )
    `).get();

    const total = totalRow.total_contracts || 0;
    const unique = uniqueRow.unique_customers || 0;
    const repeat = repeatRow.repeat_customers || 0;
    const repeat_rate = unique > 0 ? Math.round((repeat / unique) * 10000) / 100 : 0;

    const methods = db.prepare(`
      SELECT
        match_method AS method,
        COUNT(*) AS pairs,
        confidence
      FROM matching_log
      GROUP BY match_method, confidence
      ORDER BY pairs DESC
    `).all();

    res.json({
      total_contracts: total,
      unique_customers: unique,
      repeat_customers: repeat,
      repeat_rate,
      methods
    });
  } catch (err) {
    console.error('Matching stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/matching/log  -- last 100 matching log entries
// ---------------------------------------------------------------------------
router.get('/api/matching/log', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT *
      FROM matching_log
      ORDER BY created_at DESC
      LIMIT 100
    `).all();

    res.json(rows);
  } catch (err) {
    console.error('Matching log error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
