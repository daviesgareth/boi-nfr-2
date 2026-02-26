import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { Pill, fN, C } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import NFRBarChart from '../components/NFRBarChart';
import DataTable from '../components/DataTable';
import FilterPanel from '../components/FilterPanel';
import EmptyState from '../components/EmptyState';
import useNFRData from '../hooks/useNFRData';
import { useFilters } from '../contexts/FilterContext';

const GROUP_OPTIONS = [
  { id: 'make', label: 'Make' },
  { id: 'region', label: 'Region' },
  { id: 'agreement_type', label: 'Agreement' },
  { id: 'term_band', label: 'Term' },
  { id: 'year', label: 'Year' },
  { id: 'new_used', label: 'New/Used' },
  { id: 'termination', label: 'Termination' },
  { id: 'fuel_type', label: 'Fuel Type' },
  { id: 'customer_type', label: 'Customer Type' },
];

const INITIAL_FILTERS = { year: '', region: '', make: '', agreement_type: '', term_band: '', new_used: '', termination: '', fuel_type: '', customer_type: '' };

const selectStyle = {
  background: '#FFFFFF', border: '1px solid #E0E5EC', borderRadius: 8,
  color: '#00355F', padding: '6px 10px', fontSize: 12, fontWeight: 600,
  cursor: 'pointer', outline: 'none', width: '100%', fontFamily: 'var(--font)',
};

export default function Explorer() {
  const { window: win, excludeParam } = useFilters();
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [groupBy, setGroupBy] = useState('make');
  const [data, setData] = useState([]);

  // Use useNFRData for filter option lists
  const { data: regionsData } = useNFRData('/api/nfr/by-region', { defaultValue: [] });
  const { data: agreementsData } = useNFRData('/api/nfr/by-agreement', { defaultValue: [] });
  const { data: termsData } = useNFRData('/api/nfr/by-term', { defaultValue: [] });
  const { data: yearsData } = useNFRData('/api/nfr/by-year', { defaultValue: [] });
  const { data: makesData } = useNFRData('/api/nfr/by-make', { defaultValue: [] });
  const { data: fuelsData } = useNFRData('/api/nfr/by-fuel', { defaultValue: [] });
  const { data: custTypesData } = useNFRData('/api/nfr/by-customer-type', { defaultValue: [] });

  const filterOptions = {
    regions: regionsData.map(r => r.region).filter(Boolean),
    agreements: agreementsData.map(a => a.agreement_type).filter(Boolean),
    terms: termsData.map(t => t.term_band).filter(Boolean),
    years: yearsData.map(y => String(y.year)).filter(Boolean),
    makes: makesData.map(m => m.make).filter(Boolean),
    fuels: fuelsData.map(f => f.fuel_type).filter(Boolean),
    custTypes: custTypesData.map(ct => ct.customer_type).filter(Boolean),
  };

  // Explorer-specific fetch with local filters + groupBy
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('groupBy', groupBy);
    params.set('window', win);
    if (excludeParam) {
      const excl = excludeParam.replace(/^&/, '').split('=');
      if (excl.length === 2) params.set(excl[0], excl[1]);
    }
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    fetchAPI(`/api/explorer?${params}`).then(setData).catch(() => setData([]));
  }, [filters, groupBy, win, excludeParam]);

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const totals = data.reduce((acc, d) => ({
    ended: acc.ended + (d.ended || 0),
    retained: acc.retained + (d.retained || 0),
    sameDlr: acc.sameDlr + (d.same_dealer || 0),
    brandLoyal: acc.brandLoyal + (d.brand_loyal || 0),
  }), { ended: 0, retained: 0, sameDlr: 0, brandLoyal: 0 });

  const FILTER_DEFS = [
    { key: 'year', label: 'Year', options: filterOptions.years, placeholder: 'All Years' },
    { key: 'region', label: 'Region', options: filterOptions.regions, placeholder: 'All Regions' },
    { key: 'make', label: 'Make', options: filterOptions.makes, placeholder: 'All Makes' },
    { key: 'agreement_type', label: 'Agreement', options: filterOptions.agreements, placeholder: 'All' },
    { key: 'term_band', label: 'Term', options: filterOptions.terms, placeholder: 'All Terms' },
    { key: 'new_used', label: 'New/Used', options: null, placeholder: 'Both' },
    { key: 'termination', label: 'Termination', options: null, placeholder: 'All' },
    { key: 'fuel_type', label: 'Fuel Type', options: filterOptions.fuels, placeholder: 'All Fuels' },
    { key: 'customer_type', label: 'Cust. Type', options: filterOptions.custTypes, placeholder: 'All Types' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FilterPanel
        title="Data Explorer"
        filters={FILTER_DEFS}
        values={filters}
        onChange={updateFilter}
        onReset={() => setFilters(INITIAL_FILTERS)}
        columns={5}
        customRenderers={{
          new_used: (val, onChange) => (
            <select style={selectStyle} value={val || ''} onChange={e => onChange(e.target.value)}>
              <option value="">Both</option>
              <option value="N">New</option>
              <option value="U">Used</option>
            </select>
          ),
          termination: (val, onChange) => (
            <select style={selectStyle} value={val || ''} onChange={e => onChange(e.target.value)}>
              <option value="">All</option>
              <option value="early">Early</option>
              <option value="full">Full Term</option>
            </select>
          ),
        }}
      />

      {/* Group By Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GROUP_OPTIONS.map(opt => (
          <Pill key={opt.id} active={groupBy === opt.id} onClick={() => setGroupBy(opt.id)}>
            {opt.label}
          </Pill>
        ))}
      </div>

      <MetricGrid columns={4} metrics={[
        { label: 'Ended', value: fN(totals.ended), accent: C.navy },
        { label: 'Retained', value: fN(totals.retained), sub: totals.ended > 0 ? `${(totals.retained / totals.ended * 100).toFixed(2)}% NFR` : '', accent: C.green },
        { label: 'Same Dealer', value: fN(totals.sameDlr), sub: totals.retained > 0 ? `${(totals.sameDlr / totals.retained * 100).toFixed(0)}% of retained` : '', accent: C.teal },
        { label: 'Brand Loyal', value: fN(totals.brandLoyal), sub: totals.retained > 0 ? `${(totals.brandLoyal / totals.retained * 100).toFixed(0)}% of retained` : '', accent: C.purple },
      ]} />

      {data.length === 0 ? (
        <EmptyState title="No data" description="No data matches the current filters." action={{ label: 'Reset Filters', onClick: () => setFilters(INITIAL_FILTERS) }} />
      ) : (
        <>
          <ChartCard title={`NFR by ${GROUP_OPTIONS.find(o => o.id === groupBy)?.label}`}>
            <NFRBarChart data={data} categoryKey="group" />
          </ChartCard>

          <ChartCard title="Detail Table">
            <DataTable
              columns={[
                { key: 'group', label: 'Group', width: '1fr' },
                { key: 'ended', label: 'Ended', width: '90px', type: 'number' },
                { key: 'retained', label: 'Retained', width: '90px', type: 'number' },
                { key: 'nfr_rate', label: 'NFR %', width: '90px', type: 'nfr' },
                { key: 'nfr_rate', label: 'Performance', width: '150px', type: 'minibar' },
              ]}
              data={data}
            />
          </ChartCard>
        </>
      )}
    </div>
  );
}
