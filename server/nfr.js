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

  // New window definitions: each has its own lookback AND lookahead in days
  const WINDOWS = {
    'core':  { lookback: 91,  lookahead: 30 },   // -3 months / +1 month
    '6_1':   { lookback: 183, lookahead: 30 },   // -6 months / +1 month
    '3_3':   { lookback: 91,  lookahead: 91 },   // -3 months / +3 months
    '3_6':   { lookback: 91,  lookahead: 183 },  // -3 months / +6 months
    '3_12':  { lookback: 91,  lookahead: 365 },  // -3 months / +12 months
  };

  // Find the widest window bounds for candidate search
  const maxLookback = Math.max(...Object.values(WINDOWS).map(w => w.lookback));
  const maxLookahead = Math.max(...Object.values(WINDOWS).map(w => w.lookahead));

  const results = [];

  for (const contract of closedContracts) {
    if (!contract.end_date) continue;

    const endDate = new Date(contract.end_date);
    const endMs = endDate.getTime();
    const customerContracts = contractsByCustomer[contract.customer_id] || [];

    // Find candidates within the widest possible window
    const windowStartMax = endMs - (maxLookback * DAY_MS);
    const windowEndMax = endMs + (maxLookahead * DAY_MS);

    let closestMatch = null;
    let closestDiff = Infinity;

    const candidates = [];
    for (const other of customerContracts) {
      if (other.contract_id === contract.contract_id) continue;
      if (!other.start_date) continue;

      const otherStart = new Date(other.start_date);
      const otherStartMs = otherStart.getTime();

      if (otherStartMs >= windowStartMax && otherStartMs <= windowEndMax) {
        const diff = Math.abs(otherStartMs - endMs);
        candidates.push({ contract: other, startMs: otherStartMs, diff });

        if (diff < closestDiff) {
          closestDiff = diff;
          closestMatch = other;
        }
      }
    }

    // Determine retention for each window (per-window lookback and lookahead)
    const retained = {};
    for (const [windowKey, { lookback, lookahead }] of Object.entries(WINDOWS)) {
      const wStart = endMs - (lookback * DAY_MS);
      const wEnd = endMs + (lookahead * DAY_MS);

      retained[windowKey] = 0;
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
      retained_core: retained['core'],
      retained_6_1: retained['6_1'],
      retained_3_3: retained['3_3'],
      retained_3_6: retained['3_6'],
      retained_3_12: retained['3_12'],
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
      contract_id, retained_core, retained_6_1, retained_3_3, retained_3_6, retained_3_12,
      next_contract_id, same_dealer, brand_loyal, transition
    ) VALUES (
      @contract_id, @retained_core, @retained_6_1, @retained_3_3, @retained_3_6, @retained_3_12,
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
