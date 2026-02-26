const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'nfr.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');

function initDB() {
  // Create contracts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contracts (
      contract_id TEXT PRIMARY KEY,
      customer_id TEXT,
      sortname TEXT,
      phone TEXT,
      postcode TEXT,
      bank_sortcode TEXT,
      account_number TEXT,
      start_date TEXT,
      end_date TEXT,
      term_months INTEGER,
      credit_amount REAL,
      residual_amount REAL,
      finance_type TEXT,
      agreement_type TEXT,
      new_used TEXT,
      make TEXT,
      model TEXT,
      dealer_ref TEXT,
      dealer_name TEXT,
      dealer_group TEXT,
      is_open INTEGER,
      how_closed TEXT,
      ended_early INTEGER,
      region TEXT,
      term_band TEXT,
      imported_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create nfr_results table
  db.exec(`
    CREATE TABLE IF NOT EXISTS nfr_results (
      contract_id TEXT PRIMARY KEY REFERENCES contracts(contract_id),
      retained_1mo INTEGER DEFAULT 0,
      retained_3mo INTEGER DEFAULT 0,
      retained_6mo INTEGER DEFAULT 0,
      retained_12mo INTEGER DEFAULT 0,
      next_contract_id TEXT,
      same_dealer INTEGER,
      brand_loyal INTEGER,
      transition TEXT,
      computed_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create matching_log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS matching_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id_a TEXT,
      contract_id_b TEXT,
      match_method TEXT,
      confidence TEXT,
      customer_id_assigned TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Create indexes on contracts
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_contracts_customer_id ON contracts(customer_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_postcode ON contracts(postcode);
    CREATE INDEX IF NOT EXISTS idx_contracts_phone ON contracts(phone);
    CREATE INDEX IF NOT EXISTS idx_contracts_sortname ON contracts(sortname);
    CREATE INDEX IF NOT EXISTS idx_contracts_bank ON contracts(bank_sortcode, account_number);
    CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
    CREATE INDEX IF NOT EXISTS idx_contracts_dealer_group ON contracts(dealer_group);
    CREATE INDEX IF NOT EXISTS idx_contracts_make ON contracts(make);
    CREATE INDEX IF NOT EXISTS idx_contracts_region ON contracts(region);
    CREATE INDEX IF NOT EXISTS idx_contracts_agreement_type ON contracts(agreement_type);
    CREATE INDEX IF NOT EXISTS idx_contracts_term_band ON contracts(term_band);
    CREATE INDEX IF NOT EXISTS idx_contracts_new_used ON contracts(new_used);
    CREATE INDEX IF NOT EXISTS idx_contracts_is_open ON contracts(is_open);
  `);

  console.log('Database initialized successfully');
}

module.exports = { db, initDB };
