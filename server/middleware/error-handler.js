// ---------------------------------------------------------------------------
// Async error wrapper + Express error handler
// ---------------------------------------------------------------------------

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
 */
function errorHandler(err, req, res, _next) {
  console.error(`${req.method} ${req.path} error:`, err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = { asyncHandler, errorHandler };
