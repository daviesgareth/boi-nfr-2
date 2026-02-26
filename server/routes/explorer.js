// ---------------------------------------------------------------------------
// Explorer route: flexible NFR data explorer with dynamic filters
// ---------------------------------------------------------------------------
const express = require('express');
const { asyncHandler } = require('../middleware/error-handler');
const { getExplorerData, ALLOWED_GROUP_BY } = require('../dal/nfr-queries');

const router = express.Router();

router.get('/api/explorer', asyncHandler((req, res) => {
  const { groupBy, year, region, make, agreement_type, term_band, new_used, termination, fuel_type, customer_type } = req.query;

  if (!groupBy) {
    return res.status(400).json({ error: 'groupBy parameter is required' });
  }

  const result = getExplorerData(req.retainedCol, req.exclusionConditions, {
    groupBy,
    filters: { year, region, make, agreement_type, term_band, new_used, termination, fuel_type, customer_type },
  });

  if (result === null) {
    return res.status(400).json({ error: 'Invalid groupBy value. Allowed: ' + Object.keys(ALLOWED_GROUP_BY).join(', ') });
  }

  res.json(result);
}));

module.exports = router;
