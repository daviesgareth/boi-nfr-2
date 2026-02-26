// ---------------------------------------------------------------------------
// Upload route: file ingest + matching + NFR computation
// ---------------------------------------------------------------------------
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../db');
const { ingestFile } = require('../ingest');
const { runMatching } = require('../matching');
const { computeNFR } = require('../nfr');
const { asyncHandler } = require('../middleware/error-handler');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

router.post('/api/upload', upload.single('file'), asyncHandler((req, res) => {
  const filePath = req.file.path;
  const mode = req.query.mode || 'replace';

  if (mode === 'replace') {
    db.exec('DELETE FROM nfr_results');
    db.exec('DELETE FROM matching_log');
    db.exec('DELETE FROM contracts');
    console.log('Cleared existing data (replace mode)');
  }

  const ingestCount = ingestFile(filePath);
  const matchStats = runMatching();
  computeNFR();
  res.json({ success: true, contracts: ingestCount, customers: matchStats.unique_customers, mode });
}));

module.exports = router;
