const XLSX = require('xlsx');
const { db } = require('./db');

// Region mapping: postcode prefix -> region
// Order matters: check 2-letter prefixes before 1-letter
const REGION_MAP_2LETTER = {
  // Scotland
  AB: 'Scotland', DD: 'Scotland', DG: 'Scotland', EH: 'Scotland',
  FK: 'Scotland', HS: 'Scotland', IV: 'Scotland', KA: 'Scotland',
  KW: 'Scotland', KY: 'Scotland', ML: 'Scotland', PA: 'Scotland',
  PH: 'Scotland', TD: 'Scotland', ZE: 'Scotland',
  // Northern Ireland
  BT: 'Northern Ireland',
  // Wales
  CF: 'Wales', LD: 'Wales', LL: 'Wales', NP: 'Wales', SA: 'Wales', SY: 'Wales',
  // North East
  NE: 'North East', SR: 'North East', DH: 'North East', DL: 'North East', TS: 'North East',
  // Yorkshire & Humber
  HU: 'Yorkshire & Humber', DN: 'Yorkshire & Humber', HD: 'Yorkshire & Humber',
  HX: 'Yorkshire & Humber', LS: 'Yorkshire & Humber', WF: 'Yorkshire & Humber',
  BD: 'Yorkshire & Humber', YO: 'Yorkshire & Humber', HG: 'Yorkshire & Humber',
  // North West
  PR: 'North West', BL: 'North West', BB: 'North West', OL: 'North West',
  WA: 'North West', WN: 'North West', SK: 'North West', CW: 'North West',
  CH: 'North West', FY: 'North West', LA: 'North West', CA: 'North West',
  // East Midlands
  NG: 'East Midlands', DE: 'East Midlands', LE: 'East Midlands',
  NN: 'East Midlands', LN: 'East Midlands',
  // West Midlands
  CV: 'West Midlands', DY: 'West Midlands', ST: 'West Midlands',
  TF: 'West Midlands', WS: 'West Midlands', WV: 'West Midlands', WR: 'West Midlands',
  // East of England
  CB: 'East of England', CO: 'East of England', CM: 'East of England',
  IP: 'East of England', NR: 'East of England', PE: 'East of England',
  SG: 'East of England', SS: 'East of England', AL: 'East of England',
  // South East
  MK: 'South East', OX: 'South East', HP: 'South East', RG: 'South East',
  SL: 'South East', GU: 'South East', BN: 'South East', RH: 'South East',
  TN: 'South East', CT: 'South East', ME: 'South East', DA: 'South East',
  KT: 'South East', PO: 'South East',
  // South West
  SO: 'South West', BH: 'South West', SP: 'South West', DT: 'South West',
  BA: 'South West', BS: 'South West', GL: 'South West', SN: 'South West',
  EX: 'South West', TQ: 'South West', PL: 'South West', TR: 'South West',
  TA: 'South West',
  // London
  SW: 'London', SE: 'London', EC: 'London', WC: 'London', NW: 'London',
  EN: 'London', HA: 'London', UB: 'London', TW: 'London', IG: 'London',
  RM: 'London', BR: 'London', CR: 'London', SM: 'London', WD: 'London',
};

const REGION_MAP_1LETTER = {
  G: 'Scotland',
  S: 'Yorkshire & Humber',
  M: 'North West', L: 'North West',
  B: 'West Midlands',
  N: 'London', E: 'London', W: 'London',
};

function getRegion(postcode) {
  if (!postcode) return null;
  // Extract alphabetic prefix from postcode
  const match = postcode.match(/^([A-Z]+)/i);
  if (!match) return null;
  const prefix = match[1].toUpperCase();

  // Check 2-letter prefix first
  if (prefix.length >= 2) {
    const twoLetter = prefix.substring(0, 2);
    if (REGION_MAP_2LETTER[twoLetter]) {
      return REGION_MAP_2LETTER[twoLetter];
    }
  }

  // Check 1-letter prefix
  const oneLetter = prefix.substring(0, 1);
  if (REGION_MAP_1LETTER[oneLetter]) {
    return REGION_MAP_1LETTER[oneLetter];
  }

  return null;
}

function getAgreementType(financeType, residualAmount) {
  if (financeType === 'HP' && residualAmount > 0) return 'Select (PCP)';
  if (financeType === 'HP' && residualAmount <= 0) return 'HP Loan';
  if (financeType === 'LS') return 'Lease';
  if (financeType === 'PL') return 'Personal Loan';
  return financeType || null;
}

function getTermBand(termMonths) {
  if (termMonths == null) return null;
  if (termMonths >= 12 && termMonths <= 24) return '12-24 mo';
  if (termMonths >= 25 && termMonths <= 36) return '25-36 mo';
  if (termMonths >= 37 && termMonths <= 48) return '37-48 mo';
  if (termMonths >= 49 && termMonths <= 60) return '49-60 mo';
  if (termMonths > 60) return '60+ mo';
  return null;
}

function excelSerialToISO(serial) {
  if (serial == null || serial === '' || isNaN(serial)) return null;
  const num = Number(serial);
  if (num <= 0) return null;
  const date = new Date((num - 25569) * 86400 * 1000);
  // Format as YYYY-MM-DD
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function computeEndedEarly(isClosed, startDate, endDate, termMonths) {
  if (!isClosed || !startDate || !endDate || termMonths == null) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Expected end: start_date + term_months * 30.44 days - 60 days buffer
  const expectedEndMs = start.getTime() + (termMonths * 30.44 * 86400 * 1000) - (60 * 86400 * 1000);
  return end.getTime() < expectedEndMs ? 1 : 0;
}

function ingestFile(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO contracts (
      contract_id, sortname, phone, postcode, bank_sortcode, account_number,
      start_date, end_date, term_months, credit_amount, residual_amount,
      finance_type, agreement_type, new_used, make, model, dealer_ref,
      dealer_name, dealer_group, is_open, how_closed, ended_early, region, term_band
    ) VALUES (
      @contract_id, @sortname, @phone, @postcode, @bank_sortcode, @account_number,
      @start_date, @end_date, @term_months, @credit_amount, @residual_amount,
      @finance_type, @agreement_type, @new_used, @make, @model, @dealer_ref,
      @dealer_name, @dealer_group, @is_open, @how_closed, @ended_early, @region, @term_band
    )
  `);

  let count = 0;

  const insertAll = db.transaction((records) => {
    for (const record of records) {
      insert.run(record);
      count++;
    }
  });

  const records = rows.map((row) => {
    const contractId = row['AgreeRedact'] != null ? String(row['AgreeRedact']) : null;
    if (!contractId) return null;

    const startDate = excelSerialToISO(row['LASTAMENDEDTIME']);
    const endDate = excelSerialToISO(row['End Date (or scheduled end date)']);
    const financeType = row['FINANCETYPE'] || null;
    const creditAmount = row['CREDITAMT'] != null ? Number(row['CREDITAMT']) : null;
    const termMonths = row['TERM (MONTHS)'] != null ? Number(row['TERM (MONTHS)']) : null;
    const residualAmount = row['RESIDUALAMT'] != null ? Number(row['RESIDUALAMT']) : null;
    const make = row['MAKE'] || null;
    const model = row['MODEL1'] || null;
    const dealerRef = row['DEALERREF_'] != null ? String(row['DEALERREF_']).trim() : null;
    const dealerName = row['DEALERNAME'] || null;
    const dealerGroup = row['DealerLink'] != null ? String(row['DealerLink']).trim() : null;
    const sortname = row['SORTNAME'] || null;
    const phone = row['Phone Dummy'] != null ? String(row['Phone Dummy']) : null;
    const bankSortcode = row['BANKSORTCODE'] != null ? String(row['BANKSORTCODE']) : null;
    const accountNumber = row['Account False'] != null ? String(row['Account False']) : null;

    let postcode = row['Mock PC'] != null ? String(row['Mock PC']).trim().toUpperCase() : null;

    let newUsed = row['NEWUSED'] != null ? String(row['NEWUSED']).trim() : null;
    if (newUsed === '' || newUsed === ' ') newUsed = null;

    const openClosedRaw = row['Open or Closed (Still Open8/0Closed/Closed6_'] || '';
    const isOpen = openClosedRaw.includes('Still Open') ? 1 : 0;
    const howClosed = row['How Closed (if applicable)'] || null;

    const agreementType = getAgreementType(financeType, residualAmount || 0);
    const region = getRegion(postcode);
    const termBand = getTermBand(termMonths);
    const endedEarly = computeEndedEarly(isOpen === 0, startDate, endDate, termMonths);

    return {
      contract_id: contractId,
      sortname,
      phone,
      postcode,
      bank_sortcode: bankSortcode,
      account_number: accountNumber,
      start_date: startDate,
      end_date: endDate,
      term_months: termMonths,
      credit_amount: creditAmount,
      residual_amount: residualAmount,
      finance_type: financeType,
      agreement_type: agreementType,
      new_used: newUsed,
      make,
      model,
      dealer_ref: dealerRef,
      dealer_name: dealerName,
      dealer_group: dealerGroup,
      is_open: isOpen,
      how_closed: howClosed,
      ended_early: endedEarly,
      region,
      term_band: termBand,
    };
  }).filter(Boolean);

  insertAll(records);

  return count;
}

module.exports = { ingestFile };
