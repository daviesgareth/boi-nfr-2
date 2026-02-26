// ---------------------------------------------------------------------------
// Status routes: DB health + exclusion counts
// ---------------------------------------------------------------------------
const express = require('express');
const { asyncHandler } = require('../middleware/error-handler');
const { getStatus, getExclusionCounts } = require('../dal/status-queries');

const router = express.Router();

router.get('/api/status', asyncHandler((req, res) => {
  res.json(getStatus());
}));

router.get('/api/exclusion-counts', asyncHandler((req, res) => {
  res.json(getExclusionCounts());
}));

module.exports = router;
