const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./env');
const { initDB, db } = require('./db');
const { runMatching } = require('./matching');
const { computeNFR } = require('./nfr');
const routes = require('./routes/index');

const app = express();

// ─── Security headers (CSP, X-Frame-Options, HSTS, etc.) ────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],     // Vite injects inline scripts
      styleSrc: ["'self'", "'unsafe-inline'"],       // Inline styles used throughout
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ─── CORS — restrict to known origins ────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    // In production, reject unknown origins
    if (config.isProd) return callback(new Error('Not allowed by CORS'));
    // In development, allow all
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

// ─── HTTPS enforcement (behind reverse proxy) ───────────────────────────────
if (config.isProd) {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, 'https://' + req.header('host') + req.url);
    }
    next();
  });
}

// ─── Compression ─────────────────────────────────────────────────────────────
app.use(compression());

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ─── Rate limiting ───────────────────────────────────────────────────────────
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                     // 10 attempts per window
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 200,                    // 200 requests per minute
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Unauthenticated health endpoint ─────────────────────────────────────────
app.get('/health', (req, res) => {
  try {
    const result = db.prepare('SELECT 1 AS ok').get();
    if (result && result.ok === 1) {
      return res.json({ status: 'healthy', db: 'ok', uptime: Math.floor(process.uptime()) });
    }
    res.status(503).json({ status: 'unhealthy', db: 'query failed' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', db: err.message });
  }
});

// ─── Static files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public'), config.isProd ? { maxAge: '1d' } : {}));

app.use(express.static(path.join(__dirname, '..', 'dist'), {
  maxAge: config.isProd ? '7d' : 0,
  immutable: config.isProd,
}));

// ─── SPA fallback ────────────────────────────────────────────────────────────
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// ─── API routes ──────────────────────────────────────────────────────────────
app.use(routes);

// ─── Initialize database ────────────────────────────────────────────────────
initDB();

// Auto-recompute NFR if contracts exist but nfr_results is empty
try {
  const contractCount = db.prepare('SELECT COUNT(*) AS c FROM contracts').get().c;
  const nfrCount = db.prepare('SELECT COUNT(*) AS c FROM nfr_results').get().c;
  if (contractCount > 0 && nfrCount === 0) {
    console.log(`Found ${contractCount} contracts but 0 NFR results — recomputing...`);
    runMatching();
    const computed = computeNFR();
    console.log(`Recomputed NFR for ${computed} contracts`);
  }
} catch (e) {
  console.error('Auto-recompute check failed:', e.message);
}

// ─── Start server ────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port} [${config.isProd ? 'production' : 'development'}]`);
});

// ─── Graceful shutdown ───────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`${signal} received — shutting down gracefully...`);
  server.close(() => {
    try { db.close(); } catch (e) { /* already closed */ }
    console.log('Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
