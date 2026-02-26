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

const FUEL_MAP = {
  'P': 'Petrol', 'D': 'Diesel', 'E': 'Electric',
  'F': 'Petrol/Bio Ethanol', 'G': 'Petrol/CNG',
  'H': 'Hybrid (Petrol/Electric)', 'X': 'Petrol/Plugin Electric',
  'Y': 'Diesel/Electric', 'Z': 'Diesel/Plugin Electric',
  'B': 'Bi Fuel (Petrol/LPG)',
};

const CUST_TYPE_MAP = {
  'H': 'Consumer', 'C': 'Company', 'ST': 'Sole Trader',
};

function getAprBand(apr) {
  if (apr == null || apr === '' || isNaN(apr)) return null;
  const v = Number(apr);
  if (v <= 0) return null;
  if (v < 5) return '0-5%';
  if (v < 10) return '5-10%';
  if (v < 15) return '10-15%';
  if (v < 20) return '15-20%';
  return '20%+';
}

function getDepositBand(deposit, creditAmt) {
  if (deposit == null || creditAmt == null || creditAmt <= 0) return null;
  const d = Number(deposit);
  if (isNaN(d) || d <= 0) return 'No deposit';
  const pct = (d / (d + Number(creditAmt))) * 100;
  if (pct < 10) return '<10%';
  if (pct < 20) return '10-20%';
  if (pct < 30) return '20-30%';
  return '30%+';
}

function getRepaymentBand(repayment) {
  if (repayment == null || repayment === '' || isNaN(repayment)) return null;
  const v = Number(repayment);
  if (v <= 0) return null;
  if (v < 200) return '<£200';
  if (v < 300) return '£200-300';
  if (v < 400) return '£300-400';
  if (v < 500) return '£400-500';
  return '£500+';
}

function getMileageBand(mileage) {
  if (mileage == null || mileage === '' || isNaN(mileage)) return null;
  const v = Number(mileage);
  if (v <= 0) return null;
  if (v < 10000) return '<10k';
  if (v < 30000) return '10-30k';
  if (v < 60000) return '30-60k';
  if (v < 100000) return '60-100k';
  return '100k+';
}

function getVehicleAgeBand(age) {
  if (age == null || age === '' || isNaN(age)) return null;
  const v = Number(age);
  if (v < 0) return null;
  if (v === 0) return 'New';
  if (v <= 2) return '1-2 years';
  if (v <= 5) return '3-5 years';
  if (v <= 10) return '6-10 years';
  return '10+ years';
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
      dealer_name, dealer_group, is_open, how_closed, ended_early, region, term_band,
      cust_age_at_app, age_over_75, in_arrears, is_deceased, marketing_optout,
      fuel_type, customer_type,
      apr, apr_band, cash_deposit, deposit_band, px_value, has_px,
      repayment, repayment_band, merc_type, mileage, mileage_band,
      vehicle_age, vehicle_age_band, gender, marital_status, occupation,
      owner_tenant, rep_code
    ) VALUES (
      @contract_id, @sortname, @phone, @postcode, @bank_sortcode, @account_number,
      @start_date, @end_date, @term_months, @credit_amount, @residual_amount,
      @finance_type, @agreement_type, @new_used, @make, @model, @dealer_ref,
      @dealer_name, @dealer_group, @is_open, @how_closed, @ended_early, @region, @term_band,
      @cust_age_at_app, @age_over_75, @in_arrears, @is_deceased, @marketing_optout,
      @fuel_type, @customer_type,
      @apr, @apr_band, @cash_deposit, @deposit_band, @px_value, @has_px,
      @repayment, @repayment_band, @merc_type, @mileage, @mileage_band,
      @vehicle_age, @vehicle_age_band, @gender, @marital_status, @occupation,
      @owner_tenant, @rep_code
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

    // Exclusion flags
    const custAgeAtApp = row['CUST AGE AT APP'] != null ? Number(row['CUST AGE AT APP']) : null;
    const ageOver75 = (custAgeAtApp != null && termMonths != null &&
      custAgeAtApp + Math.ceil(termMonths / 12) > 75) ? 1 : 0;

    // Fuel type — Excel column is PETROLDIESEL, not FUELTYPE
    const fuelCode = row['PETROLDIESEL'] != null ? String(row['PETROLDIESEL']).trim().toUpperCase() : null;
    const fuelType = fuelCode ? (FUEL_MAP[fuelCode] || fuelCode) : null;

    // Customer type — Excel column is HIRERTYPE_, not CUSTOMERTYPE
    const custTypeCode = row['HIRERTYPE_'] != null ? String(row['HIRERTYPE_']).trim().toUpperCase() : null;
    const customerType = custTypeCode ? (CUST_TYPE_MAP[custTypeCode] || custTypeCode) : null;

    // Financial details
    const apr = row['APR'] != null ? Number(row['APR']) : null;
    const cashDeposit = row['CASHDEPOSIT'] != null ? Number(row['CASHDEPOSIT']) : null;
    const pxValue = row['PX'] != null ? Number(row['PX']) : null;
    const repayment = row['Repayment'] != null ? Number(row['Repayment']) : null;

    // Vehicle details
    const mercType = row['MERCTYPE'] || null;
    const mileage = row['MILEAGE'] != null && row['MILEAGE'] !== '' ? Number(row['MILEAGE']) : null;
    const vehicleAge = row['AGE'] != null && row['AGE'] !== '' ? Number(row['AGE']) : null;

    // Demographics
    const gender = row['MALEFEMALE'] != null ? String(row['MALEFEMALE']).trim().toUpperCase() : null;
    const maritalStatus = row['MARITALSTATUS'] || null;
    const occupation = row['OCCUPATION'] || null;
    const ownerTenant = row['OWNERTENANT'] != null ? String(row['OWNERTENANT']).trim().toUpperCase() : null;
    const repCode = row['REP'] != null ? String(row['REP']).trim() : null;

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
      cust_age_at_app: custAgeAtApp,
      age_over_75: ageOver75,
      in_arrears: 0,
      is_deceased: 0,
      marketing_optout: 0,
      fuel_type: fuelType,
      customer_type: customerType,
      apr: apr,
      apr_band: getAprBand(apr),
      cash_deposit: cashDeposit,
      deposit_band: getDepositBand(cashDeposit, creditAmount),
      px_value: pxValue,
      has_px: (pxValue != null && pxValue > 0) ? 1 : 0,
      repayment: repayment,
      repayment_band: getRepaymentBand(repayment),
      merc_type: mercType,
      mileage: mileage,
      mileage_band: getMileageBand(mileage),
      vehicle_age: vehicleAge,
      vehicle_age_band: getVehicleAgeBand(vehicleAge),
      gender: gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender,
      marital_status: maritalStatus,
      occupation: occupation,
      owner_tenant: ownerTenant === 'O' ? 'Owner' : ownerTenant === 'T' ? 'Tenant' : ownerTenant,
      rep_code: repCode,
    };
  }).filter(Boolean);

  insertAll(records);

  return count;
}

module.exports = { ingestFile };
