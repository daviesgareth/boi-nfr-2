import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { Metric, Crd, Sec, TblH, Callout, fN, C } from '../components/shared';

const confidenceBadge = (conf) => {
  const colors = {
    'Very High': { bg: '#dcfce7', color: '#166534' },
    'High': { bg: '#dbeafe', color: '#1e40af' },
    'Moderate': { bg: '#fef3c7', color: '#92400e' },
  };
  const c = colors[conf] || colors['Moderate'];
  return (
    <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.bg, color: c.color }}>
      {conf}
    </span>
  );
};

const METHODS = [
  { method: 'Bank Account (No Name)', label: 'Bank Account (No Name)', desc: 'Same sort code + account number only (strict format: 6-digit SC, 6-8 digit AN)', confidence: 'Very High' },
  { method: 'Bank Account', label: 'Bank Account + Surname', desc: 'Same sort code + account number + matching surname', confidence: 'Very High' },
  { method: 'Name + Phone', label: 'Name + Phone', desc: 'Exact sortname + phone match (excluding placeholder numbers)', confidence: 'High' },
  { method: 'Name + Postcode', label: 'Name + Postcode', desc: 'Exact sortname + postcode (excluding common names with 5+ occurrences)', confidence: 'High' },
  { method: 'Surname + Phone + Postcode', label: 'Surname + Phone + Postcode', desc: 'Same surname + phone + postcode (household/family matching)', confidence: 'Moderate' },
  { method: 'Fuzzy Name + Phone', label: 'Fuzzy Name + Phone', desc: 'Same surname + first 3 chars of firstname + phone or postcode', confidence: 'Moderate' },
];

export default function CustomerMatching() {
  const [stats, setStats] = useState(null);
  const [exclCounts, setExclCounts] = useState(null);

  useEffect(() => {
    fetchAPI('/api/matching/stats').then(setStats).catch(() => {});
    fetchAPI('/api/exclusion-counts').then(setExclCounts).catch(() => {});
  }, []);

  if (!stats) return <p style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Navy-tinted callout header */}
      <Callout type="info">
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>AI/ML Customer Identity Resolution</div>
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          Customer matching uses a Union-Find algorithm with 6 signal types to link contracts belonging to the same customer. Multiple contracts can be assigned the same customer ID. The algorithm runs server-side after each data upload, and customer IDs are mutable.
        </div>
      </Callout>

      {/* Accent-Striped Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Metric label="Total Contracts" value={fN(stats.total_contracts)} accent={C.navy} />
        <Metric label="Unique Customers" value={fN(stats.unique_customers)} accent={C.green} />
        <Metric label="Repeat Customers" value={fN(stats.repeat_customers)} sub={`${stats.repeat_rate}% repeat rate`} accent={C.amber} />
        <Metric label="Linked Contracts" value={fN(stats.linked_contracts || stats.total_contracts - stats.unique_customers)} sub={`${((1 - stats.unique_customers / stats.total_contracts) * 100).toFixed(1)}%`} accent={C.purple} />
      </div>

      {/* Methods Table — CSS Grid */}
      <Crd>
        <Sec>Matching Methods</Sec>
        <TblH cols={[
          { l: 'Method', w: '1.2fr' },
          { l: 'Signal', w: '2fr' },
          { l: 'Confidence', w: '100px' },
          { l: 'Match Pairs', w: '100px' },
        ]} />
        {METHODS.map((m, i) => {
          const methodStats = stats.methods?.find(s => s.method === m.method);
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr 100px 100px',
              padding: '10px 16px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: i % 2 ? C.bg : C.white,
              alignItems: 'center',
              fontSize: 12
            }}>
              <div style={{ fontWeight: 600, color: C.navy }}>{m.label}</div>
              <div style={{ color: C.textMid }}>{m.desc}</div>
              <div>{confidenceBadge(m.confidence)}</div>
              <div style={{ fontWeight: 600, color: C.textMid }}>{fN(methodStats?.pairs || 0)}</div>
            </div>
          );
        })}
      </Crd>

      {/* Exclusion Counts */}
      {exclCounts && (
        <Crd>
          <Sec sub="Contracts flagged for each exclusion category">Exclusion Flags</Sec>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Over 75 at End', count: exclCounts.over75, color: C.red },
              { label: 'In Arrears', count: exclCounts.arrears, color: C.amber },
              { label: 'Deceased', count: exclCounts.deceased, color: C.textMid },
              { label: 'Marketing Opt-out', count: exclCounts.optout, color: C.purple },
            ].map(({ label, count, color }) => {
              const pct = exclCounts.total > 0 ? ((count / exclCounts.total) * 100).toFixed(1) : 0;
              return (
                <div key={label} style={{
                  background: C.bg,
                  borderRadius: 10,
                  padding: '14px 16px',
                  borderLeft: `4px solid ${color}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: C.navy, lineHeight: 1.2, marginTop: 4 }}>{fN(count)}</div>
                  <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{pct}% of {fN(exclCounts.total)} contracts</div>
                </div>
              );
            })}
          </div>
          {exclCounts.over75 === 0 && exclCounts.arrears === 0 && exclCounts.deceased === 0 && exclCounts.optout === 0 && (
            <Callout type="amber">
              <div style={{ fontSize: 12, color: C.textMid }}>
                <strong style={{ color: C.amber }}>Note:</strong> No exclusion flags are currently populated. Re-upload source data with the relevant columns to enable filtering.
              </div>
            </Callout>
          )}
        </Crd>
      )}
    </div>
  );
}
