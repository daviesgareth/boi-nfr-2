const { db } = require('./db');

function mapNewUsed(code) {
  if (!code) return null;
  const upper = code.toUpperCase().trim();
  if (upper === 'N') return 'New';
  if (upper === 'U') return 'Used';
  return code;
}

function computeNFR() {
  // Get all closed contracts
  const closedContracts = db.prepare(
    'SELECT * FROM contracts WHERE is_open = 0 AND customer_id IS NOT NULL'
  ).all();

  // Build a lookup of all contracts by customer_id
  const contractsByCustomer = {};
  const allContracts = db.prepare('SELECT * FROM contracts WHERE customer_id IS NOT NULL').all();
  for (const c of allContracts) {
    if (!contractsByCustomer[c.customer_id]) {
      contractsByCustomer[c.customer_id] = [];
    }
    contractsByCustomer[c.customer_id].push(c);
  }

  const DAY_MS = 86400 * 1000;
  const WINDOWS = {
    '1mo': 30,
    '3mo': 91,
    '6mo': 183,
    '12mo': 365,
  };
  const LOOKBACK = 183; // 6 months lookback before end_date

  const results = [];

  for (const contract of closedContracts) {
    if (!contract.end_date) continue;

    const endDate = new Date(contract.end_date);
    const endMs = endDate.getTime();
    const customerContracts = contractsByCustomer[contract.customer_id] || [];

    // Find other contracts where start_date falls within the window
    // Window: [end_date - 183 days, end_date + window_days]
    // We use the largest window (12mo = 365 days) to find all candidates
    const windowStart = endMs - (LOOKBACK * DAY_MS);
    const windowEnd12mo = endMs + (WINDOWS['12mo'] * DAY_MS);

    let closestMatch = null;
    let closestDiff = Infinity;

    const candidates = [];
    for (const other of customerContracts) {
      if (other.contract_id === contract.contract_id) continue;
      if (!other.start_date) continue;

      const otherStart = new Date(other.start_date);
      const otherStartMs = otherStart.getTime();

      if (otherStartMs >= windowStart && otherStartMs <= windowEnd12mo) {
        const diff = Math.abs(otherStartMs - endMs);
        candidates.push({ contract: other, startMs: otherStartMs, diff });

        if (diff < closestDiff) {
          closestDiff = diff;
          closestMatch = other;
        }
      }
    }

    // Determine retention for each window
    const retained = {
      '1mo': 0,
      '3mo': 0,
      '6mo': 0,
      '12mo': 0,
    };

    for (const windowKey of Object.keys(WINDOWS)) {
      const windowDays = WINDOWS[windowKey];
      const wStart = endMs - (LOOKBACK * DAY_MS);
      const wEnd = endMs + (windowDays * DAY_MS);

      for (const cand of candidates) {
        if (cand.startMs >= wStart && cand.startMs <= wEnd) {
          retained[windowKey] = 1;
          break;
        }
      }
    }

    // Compute attributes of the closest next contract
    let sameDealerVal = null;
    let brandLoyalVal = null;
    let transitionVal = null;
    let nextContractId = null;

    if (closestMatch) {
      nextContractId = closestMatch.contract_id;

      // Same dealer: same dealer_ref or dealer_name
      sameDealerVal = 0;
      if (contract.dealer_ref && closestMatch.dealer_ref &&
          contract.dealer_ref === closestMatch.dealer_ref) {
        sameDealerVal = 1;
      } else if (contract.dealer_name && closestMatch.dealer_name &&
                 contract.dealer_name === closestMatch.dealer_name) {
        sameDealerVal = 1;
      }

      // Brand loyal: same make
      brandLoyalVal = 0;
      if (contract.make && closestMatch.make &&
          contract.make.toUpperCase() === closestMatch.make.toUpperCase()) {
        brandLoyalVal = 1;
      }

      // Transition
      const oldNU = mapNewUsed(contract.new_used);
      const newNU = mapNewUsed(closestMatch.new_used);
      if (oldNU && newNU) {
        transitionVal = `${oldNU} \u2192 ${newNU}`;
      }
    }

    results.push({
      contract_id: contract.contract_id,
      retained_1mo: retained['1mo'],
      retained_3mo: retained['3mo'],
      retained_6mo: retained['6mo'],
      retained_12mo: retained['12mo'],
      next_contract_id: nextContractId,
      same_dealer: sameDealerVal,
      brand_loyal: brandLoyalVal,
      transition: transitionVal,
    });
  }

  // Write results to DB in a transaction
  const deleteAll = db.prepare('DELETE FROM nfr_results');
  const insertResult = db.prepare(`
    INSERT INTO nfr_results (
      contract_id, retained_1mo, retained_3mo, retained_6mo, retained_12mo,
      next_contract_id, same_dealer, brand_loyal, transition
    ) VALUES (
      @contract_id, @retained_1mo, @retained_3mo, @retained_6mo, @retained_12mo,
      @next_contract_id, @same_dealer, @brand_loyal, @transition
    )
  `);

  const writeResults = db.transaction(() => {
    deleteAll.run();
    for (const r of results) {
      insertResult.run(r);
    }
  });

  writeResults();

  return results.length;
}

module.exports = { computeNFR };
