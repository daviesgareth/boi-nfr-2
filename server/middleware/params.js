// ---------------------------------------------------------------------------
// Shared parameter helpers: window mapping + exclusion clause building
// ---------------------------------------------------------------------------

const RETAINED_COL_MAP = {
  'core': 'retained_core',
  '6_1': 'retained_6_1',
  '3_3': 'retained_3_3',
  '3_6': 'retained_3_6',
  '3_12': 'retained_3_12',
  '9mo': 'retained_9mo',
  'r13mo': 'retained_r13mo',
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
 * Express middleware: attaches retainedCol and exclusionClause to req
 */
function parseNFRParams(req, res, next) {
  req.retainedCol = getRetainedCol(req.query.window);
  req.exclusionClause = buildExclusionClause(req.query);
  req.exclusionConditions = getExclusionConditions(req.query);
  next();
}

module.exports = {
  getRetainedCol,
  getExclusionConditions,
  buildExclusionClause,
  parseNFRParams,
  RETAINED_COL_MAP,
};
