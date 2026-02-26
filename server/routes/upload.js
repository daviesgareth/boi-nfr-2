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
const { logAction } = require('../dal/audit-queries');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── File validation ─────────────────────────────────────────────────────────
const ALLOWED_MIMES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream', // Some systems report XLSX as this
];

const ALLOWED_EXTS = ['.csv', '.xls', '.xlsx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTS.includes(ext)) {
    return cb(new Error(`Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTS.join(', ')}`));
  }
  if (!ALLOWED_MIMES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type "${file.mimetype}". Upload a CSV or Excel file.`));
  }
  cb(null, true);
};

// Sanitise filename — strip special chars, limit length
function sanitiseFilename(original) {
  const ext = path.extname(original).toLowerCase();
  const base = path.basename(original, path.extname(original))
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 80);
  return `${Date.now()}-${base}${ext}`;
}

// Configure multer with validation + size limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, sanitiseFilename(file.originalname)),
});

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
    files: 1,
  },
});

// ─── Upload endpoint ─────────────────────────────────────────────────────────
router.post('/api/upload', upload.single('file'), asyncHandler((req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  const mode = req.query.mode === 'merge' ? 'merge' : 'replace'; // Whitelist mode values

  if (mode === 'replace') {
    db.exec('DELETE FROM nfr_results');
    db.exec('DELETE FROM matching_log');
    db.exec('DELETE FROM contracts');
    console.log('Cleared existing data (replace mode)');
  }

  const ingestCount = ingestFile(filePath);
  const matchStats = runMatching();
  computeNFR();

  // Clean up uploaded file after processing
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore cleanup errors */ }

  const detail = `Uploaded file (${mode} mode): ${ingestCount.toLocaleString()} contracts ingested, ${matchStats.unique_customers.toLocaleString()} customers matched`;
  logAction(req.user.id, req.user.username, 'data_upload', 'upload', detail);

  res.json({ success: true, contracts: ingestCount, customers: matchStats.unique_customers, mode });
}));

module.exports = router;
