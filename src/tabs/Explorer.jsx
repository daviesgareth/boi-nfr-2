import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Metric, Crd, Sec, TblH, Pill, CustomTooltip, Callout, nfrColor, fN, C, axisProps, MiniBar } from '../components/shared';

const GROUP_OPTIONS = [
  { id: 'make', label: 'Make' },
  { id: 'region', label: 'Region' },
  { id: 'agreement_type', label: 'Agreement' },
  { id: 'term_band', label: 'Term' },
  { id: 'year', label: 'Year' },
  { id: 'new_used', label: 'New/Used' },
  { id: 'termination', label: 'Termination' },
];

const INITIAL_FILTERS = { year: '', region: '', make: '', agreement_type: '', term_band: '', new_used: '', termination: '' };

const exSel = {
  background: '#FFFFFF',
  border: `1px solid #E0E5EC`,
  borderRadius: 8,
  color: '#00355F',
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none',
  width: '100%',
  fontFamily: 'var(--font)',
};

export default function Explorer({ window: win, excludeParam = '' }) {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [groupBy, setGroupBy] = useState('make');
  const [data, setData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});

  useEffect(() => {
    Promise.all([
      fetchAPI(`/api/nfr/by-region?window=${win}${excludeParam}`).catch(() => []),
      fetchAPI(`/api/nfr/by-agreement?window=${win}${excludeParam}`).catch(() => []),
      fetchAPI(`/api/nfr/by-term?window=${win}${excludeParam}`).catch(() => []),
      fetchAPI(`/api/nfr/by-year?window=${win}${excludeParam}`).catch(() => []),
      fetchAPI(`/api/nfr/by-make?window=${win}${excludeParam}`).catch(() => []),
    ]).then(([regions, agreements, terms, years, makes]) => {
      setFilterOptions({
        regions: regions.map(r => r.region).filter(Boolean),
        agreements: agreements.map(a => a.agreement_type).filter(Boolean),
        terms: terms.map(t => t.term_band).filter(Boolean),
        years: years.map(y => String(y.year)).filter(Boolean),
        makes: makes.map(m => m.make).filter(Boolean),
      });
    });
  }, [win, excludeParam]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('groupBy', groupBy);
    params.set('window', win);
    // Append exclusions
    if (excludeParam) {
      const excl = excludeParam.replace(/^&/, '').split('=');
      if (excl.length === 2) params.set(excl[0], excl[1]);
    }
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    fetchAPI(`/api/explorer?${params}`).then(setData).catch(() => setData([]));
  }, [filters, groupBy, win, excludeParam]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const resetFilters = () => setFilters(INITIAL_FILTERS);
  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const chartHeight = Math.max(250, data.length * 32);

  // Compute totals from data
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
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Navy-tinted Filter Header */}
      <div style={{ background: `${C.navy}08`, border: `1px solid ${C.navy}12`, borderRadius: 12, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sec>Data Explorer</Sec>
            {activeFilterCount > 0 && (
              <span style={{ padding: '4px 12px', background: C.amberBg, color: C.amber, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
              </span>
            )}
          </div>
          <button onClick={resetFilters} style={{
            padding: '4px 14px',
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            background: activeFilterCount > 0 ? C.navy : C.white,
            color: activeFilterCount > 0 ? C.white : C.textMuted,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font)',
          }}>
            Reset All
          </button>
        </div>

        {/* 7-column filter grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
          {FILTER_DEFS.map(f => (
            <div key={f.key}>
              <div style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.label}</div>
              {f.key === 'new_used' ? (
                <select style={exSel} value={filters.new_used} onChange={e => updateFilter('new_used', e.target.value)}>
                  <option value="">Both</option>
                  <option value="N">New</option>
                  <option value="U">Used</option>
                </select>
              ) : f.key === 'termination' ? (
                <select style={exSel} value={filters.termination} onChange={e => updateFilter('termination', e.target.value)}>
                  <option value="">All</option>
                  <option value="early">Early</option>
                  <option value="full">Full Term</option>
                </select>
              ) : (
                <select style={exSel} value={filters[f.key]} onChange={e => updateFilter(f.key, e.target.value)}>
                  <option value="">{f.placeholder}</option>
                  {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Group By Pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {GROUP_OPTIONS.map(opt => (
          <Pill key={opt.id} active={groupBy === opt.id} onClick={() => setGroupBy(opt.id)}>
            {opt.label}
          </Pill>
        ))}
      </div>

      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Metric label="Ended" value={fN(totals.ended)} accent={C.navy} />
        <Metric label="Retained" value={fN(totals.retained)} sub={totals.ended > 0 ? `${(totals.retained / totals.ended * 100).toFixed(2)}% NFR` : ''} accent={C.green} />
        <Metric label="Same Dealer" value={fN(totals.sameDlr)} sub={totals.retained > 0 ? `${(totals.sameDlr / totals.retained * 100).toFixed(0)}% of retained` : ''} accent={C.teal} />
        <Metric label="Brand Loyal" value={fN(totals.brandLoyal)} sub={totals.retained > 0 ? `${(totals.brandLoyal / totals.retained * 100).toFixed(0)}% of retained` : ''} accent={C.purple} />
      </div>

      {/* Chart */}
      {data.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>No data matches the current filters.</div>
      ) : (
        <Crd>
          <Sec>NFR by {GROUP_OPTIONS.find(o => o.id === groupBy)?.label}</Sec>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis type="number" {...axisProps} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="group" type="category" width={130} tick={{ fill: C.textMid, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="nfr_rate" name="NFR %" radius={[0, 6, 6, 0]}>
                {data.map((entry, i) => (
                  <Cell key={i} fill={nfrColor(entry.nfr_rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Crd>
      )}

      {/* Data Table — CSS Grid */}
      {data.length > 0 && (
        <Crd>
          <Sec>Detail Table</Sec>
          <TblH cols={[
            { l: 'Group', w: '1fr' },
            { l: 'Ended', w: '90px' },
            { l: 'Retained', w: '90px' },
            { l: 'NFR %', w: '90px' },
            { l: 'Performance', w: '150px' },
          ]} />
          {data.map((d, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1fr 90px 90px 90px 150px',
              padding: '10px 16px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: i % 2 ? C.bg : C.white,
              alignItems: 'center',
              fontSize: 12
            }}>
              <div style={{ fontWeight: 600, color: C.navy }}>{d.group}</div>
              <div style={{ color: C.textMid }}>{fN(d.ended)}</div>
              <div style={{ fontWeight: 600, color: C.textMid }}>{fN(d.retained)}</div>
              <div style={{ fontWeight: 700, color: nfrColor(d.nfr_rate) }}>{d.nfr_rate}%</div>
              <div><MiniBar value={d.nfr_rate} /></div>
            </div>
          ))}
        </Crd>
      )}
    </div>
  );
}
