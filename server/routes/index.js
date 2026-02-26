// ---------------------------------------------------------------------------
// Route aggregator: wires all route modules + middleware (auth + params)
// ---------------------------------------------------------------------------
const express = require('express');
const { parseNFRParams } = require('../middleware/params');
const { authenticate, requireRole } = require('../middleware/auth');
const { errorHandler } = require('../middleware/error-handler');
const { activityLogger } = require('../middleware/activity-logger');

const authRoutes = require('./auth');
const userRoutes = require('./users');
const nfrRoutes = require('./nfr');
const explorerRoutes = require('./explorer');
const matchingRoutes = require('./matching');
const uploadRoutes = require('./upload');
const statusRoutes = require('./status');
const adminRoutes = require('./admin');

const router = express.Router();

// --- Public routes (no auth required) ---
router.use(authRoutes);

// --- All routes below require authentication ---
router.use(authenticate);

// Parse window + exclusion params for data routes
router.use(parseNFRParams);

// Lightweight activity tracking (throttled, fire-and-forget)
router.use(activityLogger);

// All authenticated users can read data
router.use(statusRoutes);
router.use(nfrRoutes);
router.use(explorerRoutes);
router.use(matchingRoutes);

// Admin-only: gate upload and user management by role
// Applied as path-scoped middleware so it only triggers for matching paths
router.use('/api/upload', requireRole('admin'));
router.use(uploadRoutes);
router.use('/api/users', requireRole('admin'));
router.use(userRoutes);
router.use('/api/admin', requireRole('admin'));
router.use(adminRoutes);

// Error handler (must be last)
router.use(errorHandler);

module.exports = router;
