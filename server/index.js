const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, db } = require('./db');
const { runMatching } = require('./matching');
const { computeNFR } = require('./nfr');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from public directory (logo etc)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve static files from Vite build output
app.use(express.static(path.join(__dirname, '..', 'dist')));

// SPA fallback for client-side routes — MUST be before API routes
// so /dashboard/*, /login, etc. get index.html without hitting auth middleware
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// API routes (auth middleware applies only to /api/* paths)
app.use(routes);

// Initialize database and start server
initDB();

// Auto-recompute NFR if contracts exist but nfr_results is empty/stale
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
