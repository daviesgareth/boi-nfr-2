import React from 'react';
import { Crd, Sec, Callout, fN, C } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import useNFRData from '../hooks/useNFRData';

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
  const { data: stats, loading: statsLoading } = useNFRData('/api/matching/stats', { skipWindow: true });
  const { data: exclCounts } = useNFRData('/api/exclusion-counts', { skipWindow: true });

  if (statsLoading || !stats) return <LoadingState />;

  // Build methods table data by joining METHODS with stats
  const methodsData = METHODS.map(m => {
    const methodStats = stats.methods?.find(s => s.method === m.method);
    return { ...m, pairs: methodStats?.pairs || 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Callout type="info">
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>AI/ML Customer Identity Resolution</div>
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          Customer matching uses a Union-Find algorithm with 6 signal types to link contracts belonging to the same customer. Multiple contracts can be assigned the same customer ID. The algorithm runs server-side after each data upload, and customer IDs are mutable.
        </div>
      </Callout>

      <MetricGrid columns={4} metrics={[
        { label: 'Total Contracts', value: fN(stats.total_contracts), accent: C.navy },
        { label: 'Unique Customers', value: fN(stats.unique_customers), accent: C.green },
        { label: 'Repeat Customers', value: fN(stats.repeat_customers), sub: `${stats.repeat_rate}% repeat rate`, accent: C.amber },
        { label: 'Linked Contracts', value: fN(stats.linked_contracts || stats.total_contracts - stats.unique_customers), sub: `${((1 - stats.unique_customers / stats.total_contracts) * 100).toFixed(1)}%`, accent: C.purple },
      ]} />

      {/* Methods Table */}
      <Crd>
        <Sec>Matching Methods</Sec>
        <DataTable
          columns={[
            { key: 'label', label: 'Method', width: '1.2fr' },
            { key: 'desc', label: 'Signal', width: '2fr', render: v => <div style={{ color: C.textMid }}>{v}</div> },
            { key: 'confidence', label: 'Confidence', width: '100px', render: v => confidenceBadge(v) },
            { key: 'pairs', label: 'Match Pairs', width: '100px', type: 'number' },
          ]}
          data={methodsData}
        />
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
            ].map(({ label, count, color }) => (
              <StatCard
                key={label}
                label={label}
                value={fN(count)}
                sub={`${exclCounts.total > 0 ? ((count / exclCounts.total) * 100).toFixed(1) : 0}% of ${fN(exclCounts.total)} contracts`}
                color={color}
              />
            ))}
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
