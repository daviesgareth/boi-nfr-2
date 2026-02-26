// ---------------------------------------------------------------------------
// Data access layer: all NFR SQL queries
// ---------------------------------------------------------------------------
const { db } = require('../db');

/** Helper: compute NFR rate to 2dp */
function nfrRate(retained, ended) {
  return ended > 0 ? Math.round(((retained || 0) / ended) * 10000) / 100 : 0;
}

// ---------------------------------------------------------------------------
// Generic "NFR by dimension" — shared by 6+ endpoints
// ---------------------------------------------------------------------------
function getNFRByDimension(retainedCol, excl, { groupExpr, groupKey, extraWhere = '', orderBy = null, limit = null }) {
  const order = orderBy || `(CAST(SUM(n.${retainedCol}) AS REAL) / COUNT(*)) DESC`;
  const lim = limit ? ` LIMIT ${limit}` : '';
  const extra = extraWhere ? ` AND ${extraWhere}` : '';

  const rows = db.prepare(`
    SELECT
      ${groupExpr} AS grp,
      COUNT(*) AS ended,
      SUM(n.${retainedCol}) AS retained
    FROM contracts c
    JOIN nfr_results n ON n.contract_id = c.contract_id
    WHERE c.is_open = 0${excl}${extra}
    GROUP BY ${groupExpr}
    ORDER BY ${order}${lim}
  `).all();

  return rows.map(r => ({
    [groupKey]: r.grp,
    ended: r.ended,
    retained: r.retained || 0,
    nfr_rate: nfrRate(r.retained, r.ended),
  }));
}

// ---------------------------------------------------------------------------
// National NFR
// ---------------------------------------------------------------------------
function getNational(retainedCol, excl) {
  const row = db.prepare(`
    SELECT COUNT(*) AS ended, SUM(n.${retainedCol}) AS retained
    FROM contracts c
    JOIN nfr_results n ON n.contract_id = c.contract_id
    WHERE c.is_open = 0${excl}
  `).get();

  return {
    ended: row.ended || 0,
    retained: row.retained || 0,
    nfr_rate: nfrRate(row.retained, row.ended),
  };
}

// ---------------------------------------------------------------------------
// By-year
// ---------------------------------------------------------------------------
function getByYear(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "substr(c.end_date, 1, 4)",
    groupKey: 'year',
    orderBy: "substr(c.end_date, 1, 4)",
  });
}

// ---------------------------------------------------------------------------
// By-region
// ---------------------------------------------------------------------------
function getByRegion(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.region",
    groupKey: 'region',
  });
}

// ---------------------------------------------------------------------------
// By-agreement
// ---------------------------------------------------------------------------
function getByAgreement(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.agreement_type",
    groupKey: 'agreement_type',
  });
}

// ---------------------------------------------------------------------------
// By-term (custom sort)
// ---------------------------------------------------------------------------
function getByTerm(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.term_band",
    groupKey: 'term_band',
    orderBy: `CASE c.term_band
      WHEN '12-24 mo' THEN 1
      WHEN '25-36 mo' THEN 2
      WHEN '37-48 mo' THEN 3
      WHEN '49-60 mo' THEN 4
      WHEN '60+ mo' THEN 5
      ELSE 6
    END`,
  });
}

// ---------------------------------------------------------------------------
// By-dealer-group (top 50, with same/diff dealer)
// ---------------------------------------------------------------------------
function getByDealerGroup(retainedCol, excl) {
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

  return rows.map(r => ({
    dealer_group: r.dealer_group,
    ended: r.ended,
    retained: r.retained || 0,
    same_dealer: r.same_dealer || 0,
    diff_dealer: r.diff_dealer || 0,
    nfr_rate: nfrRate(r.retained, r.ended),
  }));
}

// ---------------------------------------------------------------------------
// By-dealer (top 100)
// ---------------------------------------------------------------------------
function getByDealer(retainedCol, excl) {
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

  return rows.map(r => {
    const totalRetained = r.total_retained || 0;
    return {
      dealer_name: r.dealer_name,
      ended: r.ended,
      same_dealer_retained: r.same_dealer_retained || 0,
      diff_dealer_retained: r.diff_dealer_retained || 0,
      total_retained: totalRetained,
      nfr_rate: nfrRate(totalRetained, r.ended),
      dealer_retained_pct: nfrRate(r.same_dealer_retained, r.ended),
    };
  });
}

// ---------------------------------------------------------------------------
// By-make (top 30)
// ---------------------------------------------------------------------------
function getByMake(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.make",
    groupKey: 'make',
    extraWhere: "c.make IS NOT NULL AND c.make != ''",
    limit: 30,
  });
}

// ---------------------------------------------------------------------------
// By-fuel
// ---------------------------------------------------------------------------
function getByFuel(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.fuel_type",
    groupKey: 'fuel_type',
    extraWhere: "c.fuel_type IS NOT NULL AND c.fuel_type != ''",
  });
}

// ---------------------------------------------------------------------------
// By-customer-type
// ---------------------------------------------------------------------------
function getByCustomerType(retainedCol, excl) {
  return getNFRByDimension(retainedCol, excl, {
    groupExpr: "c.customer_type",
    groupKey: 'customer_type',
    extraWhere: "c.customer_type IS NOT NULL AND c.customer_type != ''",
  });
}

// ---------------------------------------------------------------------------
// Transitions
// ---------------------------------------------------------------------------
function getTransitions(retainedCol, excl) {
  return db.prepare(`
    SELECT n.transition, COUNT(*) AS count
    FROM nfr_results n
    JOIN contracts c ON c.contract_id = n.contract_id
    WHERE n.${retainedCol} = 1${excl}
    GROUP BY n.transition
    ORDER BY count DESC
  `).all();
}

// ---------------------------------------------------------------------------
// Termination (early vs full-term)
// ---------------------------------------------------------------------------
function getTermination(retainedCol, excl) {
  const earlyRow = db.prepare(`
    SELECT COUNT(*) AS ended, SUM(n.${retainedCol}) AS retained
    FROM contracts c
    JOIN nfr_results n ON n.contract_id = c.contract_id
    WHERE c.is_open = 0 AND c.ended_early = 1${excl}
  `).get();

  const fullRow = db.prepare(`
    SELECT COUNT(*) AS ended, SUM(n.${retainedCol}) AS retained
    FROM contracts c
    JOIN nfr_results n ON n.contract_id = c.contract_id
    WHERE c.is_open = 0 AND c.ended_early = 0${excl}
  `).get();

  return {
    early: {
      ended: earlyRow.ended || 0,
      retained: earlyRow.retained || 0,
      nfr_rate: nfrRate(earlyRow.retained, earlyRow.ended),
    },
    full_term: {
      ended: fullRow.ended || 0,
      retained: fullRow.retained || 0,
      nfr_rate: nfrRate(fullRow.retained, fullRow.ended),
    },
  };
}

// ---------------------------------------------------------------------------
// At-risk (open contracts expiring in next 6 months)
// ---------------------------------------------------------------------------
function getAtRisk(excl) {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonths = new Date();
  sixMonths.setMonth(sixMonths.getMonth() + 6);
  const sixMonthsStr = sixMonths.toISOString().slice(0, 10);

  const monthly = db.prepare(`
    SELECT substr(end_date, 1, 7) AS month, COUNT(*) AS count
    FROM contracts c
    WHERE c.is_open = 1 AND c.end_date >= ? AND c.end_date <= ?${excl}
    GROUP BY month ORDER BY month
  `).all(today, sixMonthsStr);

  const totalRow = db.prepare(`
    SELECT COUNT(*) AS total
    FROM contracts c
    WHERE c.is_open = 1 AND c.end_date >= ? AND c.end_date <= ?${excl}
  `).get(today, sixMonthsStr);

  const pcpRow = db.prepare(`
    SELECT COUNT(*) AS count
    FROM contracts c
    WHERE c.is_open = 1 AND c.end_date >= ? AND c.end_date <= ?
      AND c.agreement_type = 'Select (PCP)'${excl}
  `).get(today, sixMonthsStr);

  const optimalRow = db.prepare(`
    SELECT COUNT(*) AS count
    FROM contracts c
    WHERE c.is_open = 1 AND c.end_date >= ? AND c.end_date <= ?
      AND c.term_band = '37-48 mo'${excl}
  `).get(today, sixMonthsStr);

  return {
    monthly,
    total: totalRow.total || 0,
    segments: {
      pcp_ending: pcpRow.count || 0,
      optimal_term: optimalRow.count || 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Window comparison
// ---------------------------------------------------------------------------
function getWindowComparison(excl) {
  const windowsToCompare = [
    { label: '3 Month', key: '3mo', col: 'retained_core' },
    { label: '6 Month', key: '6mo', col: 'retained_6_1' },
    { label: '9 Month', key: '9mo', col: 'retained_9mo' },
    { label: '13 Month', key: 'r13mo', col: 'retained_r13mo' },
  ];

  return windowsToCompare.map(w => {
    const row = db.prepare(`
      SELECT COUNT(*) AS ended, SUM(n.${w.col}) AS retained
      FROM contracts c
      JOIN nfr_results n ON n.contract_id = c.contract_id
      WHERE c.is_open = 0${excl}
    `).get();

    return {
      label: w.label,
      key: w.key,
      ended: row.ended || 0,
      retained: row.retained || 0,
      nfr_rate: nfrRate(row.retained, row.ended),
    };
  });
}

// ---------------------------------------------------------------------------
// Explorer (dynamic groupBy + filters)
// ---------------------------------------------------------------------------
const ALLOWED_GROUP_BY = {
  year: "substr(c.end_date, 1, 4)",
  region: "c.region",
  make: "c.make",
  agreement_type: "c.agreement_type",
  term_band: "c.term_band",
  new_used: "c.new_used",
  dealer_group: "c.dealer_group",
  dealer_name: "c.dealer_name",
  termination: "CASE WHEN c.ended_early = 1 THEN 'Early Termination' ELSE 'Full Term' END",
  fuel_type: "c.fuel_type",
  customer_type: "c.customer_type",
};

function getExplorerData(retainedCol, exclusionConditions, { groupBy, filters }) {
  const groupExpr = ALLOWED_GROUP_BY[groupBy];
  if (!groupExpr) return null; // invalid groupBy

  const conditions = ['c.is_open = 0'];
  const params = [];

  const { year, region, make, agreement_type, term_band, new_used, termination, fuel_type, customer_type } = filters;

  if (year) { conditions.push("substr(c.end_date, 1, 4) = ?"); params.push(year); }
  if (region) { conditions.push("c.region = ?"); params.push(region); }
  if (make) { conditions.push("c.make = ?"); params.push(make); }
  if (agreement_type) { conditions.push("c.agreement_type = ?"); params.push(agreement_type); }
  if (term_band) { conditions.push("c.term_band = ?"); params.push(term_band); }
  if (new_used) { conditions.push("c.new_used = ?"); params.push(new_used); }
  if (termination === 'early') conditions.push("c.ended_early = 1");
  else if (termination === 'full') conditions.push("c.ended_early = 0");
  if (fuel_type) { conditions.push("c.fuel_type = ?"); params.push(fuel_type); }
  if (customer_type) { conditions.push("c.customer_type = ?"); params.push(customer_type); }

  conditions.push(...exclusionConditions);

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

  return rows.map(r => ({
    group: r.group,
    ended: r.ended,
    retained: r.retained || 0,
    nfr_rate: nfrRate(r.retained, r.ended),
  }));
}

module.exports = {
  getNational,
  getByYear,
  getByRegion,
  getByAgreement,
  getByTerm,
  getByDealerGroup,
  getByDealer,
  getByMake,
  getByFuel,
  getByCustomerType,
  getTransitions,
  getTermination,
  getAtRisk,
  getWindowComparison,
  getExplorerData,
  ALLOWED_GROUP_BY,
};
