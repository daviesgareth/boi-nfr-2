// ---------------------------------------------------------------------------
// Environment validation — runs at startup, fails fast if misconfigured
// ---------------------------------------------------------------------------
const crypto = require('crypto');

const isProd = process.env.NODE_ENV === 'production';

function getEnv(name, fallback = null, { secret = false } = {}) {
  const val = process.env[name];
  if (val) return val;

  if (!fallback) {
    throw new Error(`[FATAL] Required environment variable missing: ${name}`);
  }

  if (secret && isProd) {
    throw new Error(`[FATAL] Secret "${name}" must be set in production — do not use defaults`);
  }

  if (secret) {
    console.warn(`[WARN] Using default for "${name}" — set this in production!`);
  }

  return fallback;
}

// ─── Validated config ────────────────────────────────────────────────────────

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  isProd,
  jwtSecret: getEnv('JWT_SECRET', 'nfr-dev-secret-' + crypto.randomBytes(8).toString('hex'), { secret: true }),
  jwtExpiry: process.env.JWT_EXPIRY || '8h',
  adminPassword: getEnv('ADMIN_PASSWORD', 'changeme', { secret: true }),
  dataDir: process.env.DATA_DIR || require('path').join(__dirname, '..', 'data'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3001,http://localhost:5173').split(',').map(s => s.trim()),
};

module.exports = config;
