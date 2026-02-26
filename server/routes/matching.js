// ---------------------------------------------------------------------------
// Matching routes: customer matching statistics & log
// ---------------------------------------------------------------------------
const express = require('express');
const { asyncHandler } = require('../middleware/error-handler');
const { getMatchingStats, getMatchingLog } = require('../dal/matching-queries');

const router = express.Router();

router.get('/api/matching/stats', asyncHandler((req, res) => {
  res.json(getMatchingStats());
}));

router.get('/api/matching/log', asyncHandler((req, res) => {
  res.json(getMatchingLog());
}));

module.exports = router;
