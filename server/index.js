const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./db');
const routes = require('./routes');

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

// API routes
app.use(routes);

// SPA fallback - serve index.html for client-side routes (Express 5 syntax)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Initialize database and start server
initDB();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
