const { db } = require('./db');

// Union-Find data structure with path compression and union by rank
class UnionFind {
  constructor() {
    this.parent = {};
    this.rank = {};
  }

  find(x) {
    if (!(x in this.parent)) {
      this.parent[x] = x;
      this.rank[x] = 0;
    }
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX === rootY) return false;

    // Union by rank
    if (this.rank[rootX] < this.rank[rootY]) {
      this.parent[rootX] = rootY;
    } else if (this.rank[rootX] > this.rank[rootY]) {
      this.parent[rootY] = rootX;
    } else {
      this.parent[rootY] = rootX;
      this.rank[rootX]++;
    }
    return true;
  }
}

function getSurname(sortname) {
  if (!sortname) return null;
  const parts = sortname.trim().split(/\s+/);
  return parts[0] || null;
}

function getFirstnamePrefix(sortname) {
  if (!sortname) return null;
  const parts = sortname.trim().split(/\s+/);
  if (parts.length < 2) return null;
  return parts[1].substring(0, 3);
}

const PLACEHOLDER_PHONES = new Set([
  '00000000000',
  '00000011621',
  '0000000000',
  '',
]);

function isValidPhone(phone) {
  if (!phone) return false;
  return !PLACEHOLDER_PHONES.has(phone);
}

function runMatching() {
  const contracts = db.prepare('SELECT * FROM contracts').all();
  const uf = new UnionFind();
  const matchPairs = [];

  // Initialize all contracts in union-find
  for (const c of contracts) {
    uf.find(c.contract_id);
  }

  // Build lookup indices
  const byContractId = {};
  for (const c of contracts) {
    byContractId[c.contract_id] = c;
  }

  // ---- Pass 0: Bank Account (No Name) Match (Very High) ----
  // Strict format validation: 6-digit sort code, 6-8 digit account number
  const SORTCODE_RE = /^\d{6}$/;
  const ACCOUNT_RE = /^\d{6,8}$/;
  const bankNoNameGroups = {};
  for (const c of contracts) {
    const sc = (c.bank_sortcode || '').trim().replace(/-/g, '');
    const an = (c.account_number || '').trim();
    if (SORTCODE_RE.test(sc) && ACCOUNT_RE.test(an)) {
      const key = `${sc}|${an}`;
      if (!bankNoNameGroups[key]) bankNoNameGroups[key] = [];
      bankNoNameGroups[key].push(c);
    }
  }
  for (const key of Object.keys(bankNoNameGroups)) {
    const group = bankNoNameGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (uf.union(group[i].contract_id, group[j].contract_id)) {
          matchPairs.push({
            contract_id_a: group[i].contract_id,
            contract_id_b: group[j].contract_id,
            match_method: 'Bank Account (No Name)',
            confidence: 'Very High',
          });
        }
      }
    }
  }

  // ---- Pass 1: Bank Account Match + Surname (Very High) ----
  const bankGroups = {};
  for (const c of contracts) {
    if (c.bank_sortcode && c.account_number &&
        c.bank_sortcode.trim() !== '' && c.account_number.trim() !== '') {
      const key = `${c.bank_sortcode}|${c.account_number}`;
      if (!bankGroups[key]) bankGroups[key] = [];
      bankGroups[key].push(c);
    }
  }
  for (const key of Object.keys(bankGroups)) {
    const group = bankGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const surnameA = getSurname(group[i].sortname);
        const surnameB = getSurname(group[j].sortname);
        if (surnameA && surnameB && surnameA.toUpperCase() === surnameB.toUpperCase()) {
          if (uf.union(group[i].contract_id, group[j].contract_id)) {
            matchPairs.push({
              contract_id_a: group[i].contract_id,
              contract_id_b: group[j].contract_id,
              match_method: 'Bank Account',
              confidence: 'Very High',
            });
          }
        }
      }
    }
  }

  // ---- Pass 2: Name + Phone (High) ----
  const namePhoneGroups = {};
  for (const c of contracts) {
    if (c.sortname && isValidPhone(c.phone)) {
      const key = `${c.sortname.toUpperCase()}|${c.phone}`;
      if (!namePhoneGroups[key]) namePhoneGroups[key] = [];
      namePhoneGroups[key].push(c);
    }
  }
  for (const key of Object.keys(namePhoneGroups)) {
    const group = namePhoneGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (uf.union(group[i].contract_id, group[j].contract_id)) {
          matchPairs.push({
            contract_id_a: group[i].contract_id,
            contract_id_b: group[j].contract_id,
            match_method: 'Name + Phone',
            confidence: 'High',
          });
        }
      }
    }
  }

  // ---- Pass 3: Name + Postcode (High) ----
  // Count name occurrences first to exclude common names
  const nameCounts = {};
  for (const c of contracts) {
    if (c.sortname) {
      const key = c.sortname.toUpperCase();
      nameCounts[key] = (nameCounts[key] || 0) + 1;
    }
  }

  const namePostcodeGroups = {};
  for (const c of contracts) {
    if (c.sortname && c.postcode) {
      const nameKey = c.sortname.toUpperCase();
      if (nameCounts[nameKey] >= 5) continue; // Exclude common names
      const key = `${nameKey}|${c.postcode.toUpperCase()}`;
      if (!namePostcodeGroups[key]) namePostcodeGroups[key] = [];
      namePostcodeGroups[key].push(c);
    }
  }
  for (const key of Object.keys(namePostcodeGroups)) {
    const group = namePostcodeGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (uf.union(group[i].contract_id, group[j].contract_id)) {
          matchPairs.push({
            contract_id_a: group[i].contract_id,
            contract_id_b: group[j].contract_id,
            match_method: 'Name + Postcode',
            confidence: 'High',
          });
        }
      }
    }
  }

  // ---- Pass 4: Surname + Phone + Postcode (Moderate) ----
  const surnamePhonePostcodeGroups = {};
  for (const c of contracts) {
    const surname = getSurname(c.sortname);
    if (surname && isValidPhone(c.phone) && c.postcode && c.postcode.trim() !== '') {
      const key = `${surname.toUpperCase()}|${c.phone}|${c.postcode.toUpperCase()}`;
      if (!surnamePhonePostcodeGroups[key]) surnamePhonePostcodeGroups[key] = [];
      surnamePhonePostcodeGroups[key].push(c);
    }
  }
  for (const key of Object.keys(surnamePhonePostcodeGroups)) {
    const group = surnamePhonePostcodeGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (uf.union(group[i].contract_id, group[j].contract_id)) {
          matchPairs.push({
            contract_id_a: group[i].contract_id,
            contract_id_b: group[j].contract_id,
            match_method: 'Surname + Phone + Postcode',
            confidence: 'Moderate',
          });
        }
      }
    }
  }

  // ---- Pass 5: Fuzzy Name + Phone (Moderate) ----
  // Group by surname + first 3 chars of firstname + (phone OR postcode)
  const fuzzyGroups = {};
  for (const c of contracts) {
    const surname = getSurname(c.sortname);
    const fnPrefix = getFirstnamePrefix(c.sortname);
    if (!surname || !fnPrefix) continue;

    const baseKey = `${surname.toUpperCase()}|${fnPrefix.toUpperCase()}`;

    // Match via phone
    if (isValidPhone(c.phone)) {
      const phoneKey = `${baseKey}|P:${c.phone}`;
      if (!fuzzyGroups[phoneKey]) fuzzyGroups[phoneKey] = [];
      fuzzyGroups[phoneKey].push(c);
    }

    // Match via postcode
    if (c.postcode && c.postcode.trim() !== '') {
      const pcKey = `${baseKey}|PC:${c.postcode.toUpperCase()}`;
      if (!fuzzyGroups[pcKey]) fuzzyGroups[pcKey] = [];
      fuzzyGroups[pcKey].push(c);
    }
  }
  for (const key of Object.keys(fuzzyGroups)) {
    const group = fuzzyGroups[key];
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (uf.union(group[i].contract_id, group[j].contract_id)) {
          matchPairs.push({
            contract_id_a: group[i].contract_id,
            contract_id_b: group[j].contract_id,
            match_method: 'Fuzzy Name + Phone',
            confidence: 'Moderate',
          });
        }
      }
    }
  }

  // ---- Assign customer IDs ----
  // Group contracts by their root in union-find
  const rootGroups = {};
  for (const c of contracts) {
    const root = uf.find(c.contract_id);
    if (!rootGroups[root]) rootGroups[root] = [];
    rootGroups[root].push(c.contract_id);
  }

  // Assign customer IDs and update DB
  const updateCustomerId = db.prepare('UPDATE contracts SET customer_id = ? WHERE contract_id = ?');
  const clearMatchingLog = db.prepare('DELETE FROM matching_log');
  const insertMatchLog = db.prepare(`
    INSERT INTO matching_log (contract_id_a, contract_id_b, match_method, confidence, customer_id_assigned)
    VALUES (?, ?, ?, ?, ?)
  `);

  const assignAndLog = db.transaction(() => {
    let custIndex = 0;
    for (const root of Object.keys(rootGroups)) {
      const custId = `CUST-${custIndex}`;
      for (const contractId of rootGroups[root]) {
        updateCustomerId.run(custId, contractId);
      }
      custIndex++;
    }

    // Rebuild matching log
    clearMatchingLog.run();
    for (const pair of matchPairs) {
      const rootId = uf.find(pair.contract_id_a);
      // Find the customer_id for this root
      let custIdx = 0;
      let assignedCustId = null;
      for (const root of Object.keys(rootGroups)) {
        if (root === rootId) {
          assignedCustId = `CUST-${custIdx}`;
          break;
        }
        custIdx++;
      }
      insertMatchLog.run(
        pair.contract_id_a,
        pair.contract_id_b,
        pair.match_method,
        pair.confidence,
        assignedCustId
      );
    }
  });

  assignAndLog();

  // Compute stats
  const methodCounts = {};
  for (const pair of matchPairs) {
    methodCounts[pair.match_method] = (methodCounts[pair.match_method] || 0) + 1;
  }

  return {
    total_contracts: contracts.length,
    unique_customers: Object.keys(rootGroups).length,
    match_pairs_by_method: methodCounts,
  };
}

module.exports = { runMatching };
