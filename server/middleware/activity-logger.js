// ---------------------------------------------------------------------------
// Lightweight user activity logger — tracks high-level feature usage
// Throttled: logs at most once per user per route per 5 minutes
// ---------------------------------------------------------------------------
const { logAction } = require('../dal/audit-queries');

// Map API paths to human-readable feature names
const TRACKED_ROUTES = {
  '/api/nfr/national': 'Viewed Overview',
  '/api/nfr/by-region': 'Viewed Region & Group',
  '/api/nfr/by-dealer-group': 'Viewed Dealer Retention',
  '/api/nfr/at-risk': 'Viewed At-Risk Pipeline',
  '/api/explorer': 'Used Data Explorer',
  '/api/nfr/by-agreement': 'Viewed Agreement & Term',
  '/api/matching/stats': 'Viewed Customer Matching',
  '/api/admin/data-overview': 'Viewed Data Management',
  '/api/admin/audit-log': 'Viewed Audit Log',
};

// Throttle: userId:route → timestamp
const lastLogged = new Map();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

function activityLogger(req, res, next) {
  if (req.method !== 'GET') return next();
  if (!req.user) return next();

  const path = req.path;
  const feature = TRACKED_ROUTES[path];
  if (!feature) return next();

  const key = `${req.user.id}:${path}`;
  const now = Date.now();
  const last = lastLogged.get(key) || 0;

  if (now - last > THROTTLE_MS) {
    lastLogged.set(key, now);
    // Fire-and-forget — don't slow down the request
    try {
      logAction(req.user.id, req.user.username, 'page_view', 'activity', feature);
    } catch (_) { /* ignore logging errors */ }
  }

  next();
}

module.exports = { activityLogger };
