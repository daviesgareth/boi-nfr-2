// ---------------------------------------------------------------------------
// Async error wrapper + Express error handler
// ---------------------------------------------------------------------------
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Wraps an async route handler so thrown errors are passed to next()
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Express error handler middleware (must be registered last)
 * - In production: hides internal details, returns error ID for support reference
 * - In development: returns full error message for debugging
 */
function errorHandler(err, req, res, _next) {
  const errorId = crypto.randomBytes(4).toString('hex');
  const status = err.status || 500;
  const user = req.user ? req.user.username : 'anonymous';

  // Always log the full error server-side
  console.error(`[${errorId}] ${req.method} ${req.path} (user: ${user}):`, err.message || err);

  // Multer file size/type errors — always safe to show
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 100 MB.' });
  }
  if (err.message && err.message.startsWith('Invalid file')) {
    return res.status(400).json({ error: err.message });
  }

  // In production, hide internal error details for 500s
  if (isProd && status >= 500) {
    return res.status(500).json({
      error: 'Internal server error',
      errorId,
    });
  }

  // In development or for 4xx errors, return the actual message
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(isProd ? { errorId } : {}),
  });
}

module.exports = { asyncHandler, errorHandler };
