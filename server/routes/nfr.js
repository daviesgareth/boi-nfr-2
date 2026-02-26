// ---------------------------------------------------------------------------
// NFR routes: 14 endpoints for retention analytics
// ---------------------------------------------------------------------------
const express = require('express');
const { asyncHandler } = require('../middleware/error-handler');
const nfr = require('../dal/nfr-queries');

const router = express.Router();

router.get('/api/nfr/national', asyncHandler((req, res) => {
  res.json(nfr.getNational(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-year', asyncHandler((req, res) => {
  res.json(nfr.getByYear(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-region', asyncHandler((req, res) => {
  res.json(nfr.getByRegion(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-agreement', asyncHandler((req, res) => {
  res.json(nfr.getByAgreement(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-term', asyncHandler((req, res) => {
  res.json(nfr.getByTerm(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-dealer-group', asyncHandler((req, res) => {
  res.json(nfr.getByDealerGroup(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-dealer', asyncHandler((req, res) => {
  res.json(nfr.getByDealer(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-make', asyncHandler((req, res) => {
  res.json(nfr.getByMake(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-fuel', asyncHandler((req, res) => {
  res.json(nfr.getByFuel(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/by-customer-type', asyncHandler((req, res) => {
  res.json(nfr.getByCustomerType(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/transitions', asyncHandler((req, res) => {
  res.json(nfr.getTransitions(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/termination', asyncHandler((req, res) => {
  res.json(nfr.getTermination(req.retainedCol, req.exclusionClause));
}));

router.get('/api/nfr/at-risk', asyncHandler((req, res) => {
  res.json(nfr.getAtRisk(req.exclusionClause));
}));

router.get('/api/nfr/window-comparison', asyncHandler((req, res) => {
  res.json(nfr.getWindowComparison(req.exclusionClause));
}));

module.exports = router;
