import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend, Cell, Line, PieChart, Pie } from 'recharts';
import { Crd, Sec, CustomTooltip, Callout, nfrColor, fN, C, axisProps } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import NFRBarChart from '../components/NFRBarChart';
import StatCard from '../components/StatCard';
import LoadingState from '../components/LoadingState';
import useNFRData from '../hooks/useNFRData';
import { useFilters } from '../contexts/FilterContext';

const WINDOW_LABELS = {
  'core': '-3/+1 mo', '6_1': '-6/+1 mo', '3_6': '-3/+6 mo',
  '3_9': '-3/+9 mo', '3_12': '-3/+12 mo', '3_18': '-3/+18 mo',
};
const WINDOW_DEFS = {
  'core': { lookback: '3 months', lookahead: '1 month' },
  '6_1': { lookback: '6 months', lookahead: '1 month' },
  '3_6': { lookback: '3 months', lookahead: '6 months' },
  '3_9': { lookback: '3 months', lookahead: '9 months' },
  '3_12': { lookback: '3 months', lookahead: '12 months' },
  '3_18': { lookback: '3 months', lookahead: '18 months' },
};

const WIN_COLORS = [C.navy, C.iceDark, C.teal, C.purple, C.green, C.amber];
const FUEL_COLORS = [C.navy, '#3B82F6', C.teal, '#10B981', C.amber, C.purple, '#EC4899', '#6366F1', '#F97316', '#78716C'];

export default function Overview() {
  const { window: win } = useFilters();
  const { data: national, loading } = useNFRData('/api/nfr/national');
  const { data: yearly } = useNFRData('/api/nfr/by-year', { defaultValue: [] });
  const { data: transitions } = useNFRData('/api/nfr/transitions', { defaultValue: [] });
  const { data: termination } = useNFRData('/api/nfr/termination');
  const { data: agreements } = useNFRData('/api/nfr/by-agreement', { defaultValue: [] });
  const { data: windowComp } = useNFRData('/api/nfr/window-comparison', { skipWindow: true, defaultValue: [] });
  const { data: fuelData } = useNFRData('/api/nfr/by-fuel', { defaultValue: [] });
  const { data: custTypeData } = useNFRData('/api/nfr/by-customer-type', { defaultValue: [] });

  if (loading || !national) return <LoadingState />;

  const wl = WINDOW_LABELS[win] || 'Core (-3/+1)';
  const wd = WINDOW_DEFS[win] || WINDOW_DEFS['core'];
  const earlyMultiplier = termination && termination.full_term?.nfr_rate > 0
    ? (termination.early?.nfr_rate / termination.full_term.nfr_rate).toFixed(0)
    : null;

  const fuelSorted = [...fuelData].sort((a, b) => (b.ended || 0) - (a.ended || 0));
  const fuelPie = fuelSorted.map((f, i) => ({
    name: f.fuel_type || 'Unknown',
    value: f.ended || 0,
    fill: FUEL_COLORS[i % FUEL_COLORS.length],
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* NFR Definition Callout */}
      <Callout type="info">
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>NFR KPI Definition</div>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: C.navy }}>Northridge Finance Retention (NFR)</strong> = % of ended contracts where the same customer started a new contract within a window from <strong>{wd.lookback} before</strong> the end date to <strong>{wd.lookahead} after</strong>.
        </p>
      </Callout>

      {/* KPI Metrics */}
      <MetricGrid columns={4} metrics={[
        { label: `NFR @ ${wl}`, value: `${national.nfr_rate}%`, sub: `${fN(national.retained)} of ${fN(national.ended)} renewed`, accent: C.green, large: true },
        { label: 'Ended Contracts', value: fN(national.ended), sub: 'Total closed', accent: C.navy },
        { label: 'Retained', value: fN(national.retained), sub: `${national.nfr_rate}% retention`, accent: C.teal },
        { label: 'Early Terminators', value: earlyMultiplier ? `${earlyMultiplier}\u00d7 more likely` : '\u2014', sub: 'to renew vs full-term', accent: C.amber },
      ]} />

      {/* Trend Chart + Transitions */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        <ChartCard title="Annual NFR Trend" subtitle="Year-over-year NFR performance">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="year" {...axisProps} />
              <YAxis yAxisId="left" {...axisProps} />
              <YAxis yAxisId="right" orientation="right" {...axisProps} domain={[0, 'auto']} unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="ended" name="Ended" fill={C.navy} radius={[6, 6, 0, 0]} opacity={0.7} />
              <Bar yAxisId="left" dataKey="retained" name="Retained" fill={C.iceDark} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" dataKey="nfr_rate" name="NFR %" stroke={C.green} strokeWidth={3} dot={{ r: 4, fill: C.green }} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="New/Used Transitions" footer="Most customers follow Used → Used. Minimal cross-over between new and used.">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={transitions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis type="number" {...axisProps} />
              <YAxis dataKey="transition" type="category" width={120} {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Retained" fill={C.navy} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Fuel Type & Customer Type */}
      {(fuelSorted.length > 0 || custTypeData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {fuelSorted.length > 0 && (
            <Crd>
              <Sec sub="NFR retention rate by fuel type">Fuel Type Breakdown</Sec>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={fuelPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35} stroke="none">
                        {fuelPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fN(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ textAlign: 'center', fontSize: 10, color: C.textMuted, marginTop: 2 }}>Volume by fuel</div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 55px', gap: '0', fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '0 0 6px', borderBottom: `1px solid ${C.borderLight}` }}>
                    <div>Fuel</div>
                    <div style={{ textAlign: 'right' }}>Ended</div>
                    <div style={{ textAlign: 'right' }}>NFR %</div>
                  </div>
                  {fuelSorted.map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 55px', padding: '6px 0', borderBottom: `1px solid ${C.borderLight}`, fontSize: 12, alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: FUEL_COLORS[i % FUEL_COLORS.length], flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: C.navy, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fuel_type || 'Unknown'}</span>
                      </div>
                      <div style={{ textAlign: 'right', color: C.textMid }}>{fN(f.ended)}</div>
                      <div style={{ textAlign: 'right', fontWeight: 700, color: nfrColor(f.nfr_rate) }}>{f.nfr_rate}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </Crd>
          )}

          {custTypeData.length > 0 && (
            <Crd>
              <Sec sub="NFR retention rate by customer type">Customer Type Breakdown</Sec>
              <NFRBarChart data={custTypeData} categoryKey="customer_type" yAxisWidth={110} />
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${custTypeData.length}, 1fr)`, gap: 8, marginTop: 12 }}>
                {custTypeData.map((ct, i) => (
                  <StatCard key={i} label={ct.customer_type || 'Unknown'} value={`${ct.nfr_rate}%`} sub={`${fN(ct.ended)} ended`} color={nfrColor(ct.nfr_rate)} />
                ))}
              </div>
            </Crd>
          )}
        </div>
      )}

      {/* Window Comparison */}
      {windowComp.length > 0 && (
        <ChartCard title="Window Comparison" subtitle="NFR rate across different lookback windows (all use +1 month lookahead)"
          footer="Wider lookback windows capture more renewals. Compare windows to understand how timing affects measured retention.">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${windowComp.length}, 1fr)`, gap: 12, marginBottom: 20 }}>
            {windowComp.map((w, i) => (
              <StatCard key={w.key} label={w.label} value={`${w.nfr_rate}%`} sub={`${fN(w.retained)} / ${fN(w.ended)} retained`} color={WIN_COLORS[i % WIN_COLORS.length]} />
            ))}
          </div>
          <NFRBarChart data={windowComp} categoryKey="label" colors={WIN_COLORS} yAxisWidth={100} height={220} />
        </ChartCard>
      )}

      {/* Termination Comparison */}
      <Crd>
        <Sec>Termination Type Comparison</Sec>
        {termination && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
            {[
              { label: 'Early Terminators', data: termination.early, color: C.amber },
              { label: 'Full Term', data: termination.full_term, color: C.navy }
            ].map(({ label, data, color }) => {
              const barPct = Math.min(data.nfr_rate * 5, 100);
              const textInside = barPct >= 25;
              return (
                <div key={label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: nfrColor(data.nfr_rate) }}>{data.nfr_rate}%</span>
                  </div>
                  <div style={{ background: C.bg, borderRadius: 4, height: 28, position: 'relative' }}>
                    <div style={{ width: `${barPct}%`, height: '100%', background: color, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: textInside ? 8 : 0 }}>
                      {textInside && <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{fN(data.retained)} / {fN(data.ended)}</span>}
                    </div>
                    {!textInside && <span style={{ position: 'absolute', top: '50%', left: `calc(${barPct}% + 8px)`, transform: 'translateY(-50%)', fontSize: 11, color: C.textMid, fontWeight: 600 }}>{fN(data.retained)} / {fN(data.ended)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {earlyMultiplier && (
          <Callout type="red">
            <div style={{ fontSize: 12, color: C.textMid }}>
              <strong style={{ color: C.red }}>Critical:</strong> Early terminators are <strong>{earlyMultiplier}{'\u00d7'} more likely</strong> to renew.
            </div>
          </Callout>
        )}
      </Crd>

      {/* Agreement Type Chart */}
      <ChartCard title="NFR by Agreement Type">
        <NFRBarChart data={agreements} categoryKey="agreement_type" height={220} yAxisWidth={120} />
      </ChartCard>
    </div>
  );
}
