// ---------------------------------------------------------------------------
// Route aggregator: wires all route modules + shared middleware
// ---------------------------------------------------------------------------
const express = require('express');
const { parseNFRParams } = require('../middleware/params');
const { errorHandler } = require('../middleware/error-handler');

const nfrRoutes = require('./nfr');
const explorerRoutes = require('./explorer');
const matchingRoutes = require('./matching');
const uploadRoutes = require('./upload');
const statusRoutes = require('./status');

const router = express.Router();

// Parse window + exclusion params for all routes that need them
router.use(parseNFRParams);

// Wire route modules
router.use(statusRoutes);
router.use(nfrRoutes);
router.use(explorerRoutes);
router.use(matchingRoutes);
router.use(uploadRoutes);

// Error handler (must be last)
router.use(errorHandler);

module.exports = router;
