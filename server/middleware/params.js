// ---------------------------------------------------------------------------
// Shared parameter helpers: window mapping + exclusion/timeframe clause building
// ---------------------------------------------------------------------------

const RETAINED_COL_MAP = {
  'core': 'retained_core',
  '6_1': 'retained_6_1',
  '3_6': 'retained_3_6',
  '3_9': 'retained_3_9',
  '3_12': 'retained_3_12',
  '3_18': 'retained_3_18',
};

function getRetainedCol(window) {
  return RETAINED_COL_MAP[window] || 'retained_core';
}

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
      case 'consumer': conditions.push("COALESCE(c.customer_type, '') != 'Consumer'"); break;
      case 'company': conditions.push("COALESCE(c.customer_type, '') != 'Company'"); break;
      case 'soletrader': conditions.push("COALESCE(c.customer_type, '') != 'Sole Trader'"); break;
    }
  }
  return conditions;
}

function buildExclusionClause(query) {
  const conditions = getExclusionConditions(query);
  return conditions.length > 0 ? ' AND ' + conditions.join(' AND ') : '';
}

/**
 * Build a date-range WHERE clause based on the timeframe parameter.
 * Applied to c.end_date for NFR queries (closed contracts).
 */
function getTimeframeCondition(query) {
  const tf = query.timeframe || 'rolling13';
  switch (tf) {
    case 'thisYear': {
      const year = new Date().getFullYear();
      return `substr(c.end_date, 1, 4) = '${year}'`;
    }
    case 'lastYear': {
      const year = new Date().getFullYear() - 1;
      return `substr(c.end_date, 1, 4) = '${year}'`;
    }
    case 'all':
      return null;
    case 'rolling13':
    default: {
      const d = new Date();
      d.setMonth(d.getMonth() - 13);
      return `c.end_date >= '${d.toISOString().slice(0, 10)}'`;
    }
  }
}

function buildTimeframeClause(query) {
  const cond = getTimeframeCondition(query);
  return cond ? ` AND ${cond}` : '';
}

/**
 * Express middleware: attaches retainedCol, exclusionClause, filterClause to req
 *
 * - req.exclusionClause: just population exclusions (for at-risk, matching, etc.)
 * - req.filterClause: exclusions + timeframe date filter (for NFR queries)
 * - req.filterConditions: array form of filterClause (for explorer)
 */
function parseNFRParams(req, res, next) {
  req.retainedCol = getRetainedCol(req.query.window);
  req.exclusionClause = buildExclusionClause(req.query);
  req.filterClause = req.exclusionClause + buildTimeframeClause(req.query);

  // Array form for explorer
  const conditions = getExclusionConditions(req.query);
  const tfCondition = getTimeframeCondition(req.query);
  if (tfCondition) conditions.push(tfCondition);
  req.filterConditions = conditions;

  next();
}

module.exports = {
  getRetainedCol,
  getExclusionConditions,
  buildExclusionClause,
  getTimeframeCondition,
  buildTimeframeClause,
  parseNFRParams,
  RETAINED_COL_MAP,
};
