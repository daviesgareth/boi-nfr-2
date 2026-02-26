import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { CustomTooltip, Callout, Crd, Sec, fN, C, CC, nfrColor, MiniBar, axisProps } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import useNFRData from '../hooks/useNFRData';
import { AlertTriangle, Clock, TrendingUp } from 'lucide-react';

const PIE_COLORS = [C.navy, C.iceDark, C.green, C.amber, C.red, C.purple, C.teal, '#EC4899'];

const PctTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);
  return (
    <div style={{
      background: C.white, border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,53,95,0.12)',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: C.textMid, display: 'flex', gap: 8, marginTop: 3 }}>
          <span style={{ color: p.color || C.textLight }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: C.navy }}>
            {fN(p.value)} ({total > 0 ? Math.round(p.value / total * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AtRisk() {
  const { data, loading } = useNFRData('/api/nfr/at-risk', { skipWindow: true });

  // Reshape monthlyByAgreement into stacked data
  const stackedMonthly = useMemo(() => {
    if (!data?.monthlyByAgreement) return [];
    const months = {};
    const agrTypes = new Set();
    for (const row of data.monthlyByAgreement) {
      if (!months[row.month]) months[row.month] = { month: row.month };
      months[row.month][row.agreement_type] = row.count;
      agrTypes.add(row.agreement_type);
    }
    return { data: Object.values(months), keys: [...agrTypes] };
  }, [data?.monthlyByAgreement]);

  if (loading || !data) return <LoadingState />;

  const expectedRetention = data.historicalNFR?.nfr_rate || 0;
  const expectedRetained = Math.round(data.total * expectedRetention / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Pipeline callout */}
      <Callout type="amber">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <AlertTriangle size={18} color={C.amber} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ color: C.navy }}>At-Risk Pipeline:</strong>{' '}
            <strong style={{ color: C.amber }}>{fN(data.total)}</strong> contracts ending within 6 months.
            Based on historical <strong>{expectedRetention}%</strong> NFR, expect ~<strong>{fN(expectedRetained)}</strong> to retain.
            <strong style={{ color: C.red }}> {fN(data.urgent)}</strong> are urgent (next 3 months).
          </div>
        </div>
      </Callout>

      {/* KPI row */}
      <MetricGrid columns={5} metrics={[
        { label: 'Total At-Risk', value: fN(data.total), sub: 'Ending within 6 months', accent: C.red },
        { label: 'Urgent (3 mo)', value: fN(data.urgent), sub: 'Immediate action needed', accent: C.amber },
        { label: 'PCP Ending', value: fN(data.segments?.pcp_ending || 0), sub: 'Highest renewal potential', accent: C.navy },
        { label: 'Expected to Retain', value: fN(expectedRetained), sub: `Based on ${expectedRetention}% historical NFR`, accent: C.green },
        { label: 'Historical NFR', value: `${expectedRetention}%`, sub: `${fN(data.historicalNFR?.ended)} ended contracts`, accent: C.teal },
      ]} />

      {/* Row: Stacked monthly + Pie by agreement */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <ChartCard title="Monthly Expiry by Product" subtitle="Stacked by agreement type">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stackedMonthly.data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<PctTooltip />} />
              {(stackedMonthly.keys || []).map((key, i) => (
                <Bar key={key} dataKey={key} name={key} stackId="a" fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Pipeline by Product" subtitle="Agreement type breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byAgreement || []}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={2}
              >
                {(data.byAgreement || []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val) => fN(val)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: By Region + By Make */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ChartCard title="At-Risk by Region" subtitle="Contract volume by region">
          <ResponsiveContainer width="100%" height={Math.max(200, (data.byRegion?.length || 0) * 32)}>
            <BarChart data={data.byRegion || []} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis dataKey="label" type="category" {...axisProps} width={100} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Contracts" fill={C.navy} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="At-Risk by Make" subtitle="Top 15 manufacturers">
          <ResponsiveContainer width="100%" height={Math.max(200, (data.byMake?.length || 0) * 32)}>
            <BarChart data={data.byMake || []} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis dataKey="label" type="category" {...axisProps} width={100} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Contracts" fill={C.iceDark} radius={[0, 6, 6, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Fuel type breakdown (compact) */}
      {data.byFuel && data.byFuel.length > 0 && (
        <ChartCard title="At-Risk by Fuel Type" subtitle="Pipeline by powertrain">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byFuel}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Contracts" fill={C.green} radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Dealer Group priority table */}
      {data.topDealerGroups && data.topDealerGroups.length > 0 && (
        <Crd>
          <Sec sub="Top 20 dealer groups by at-risk volume with historical retention context">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color={C.navy} />
              Dealer Group Priority
            </div>
          </Sec>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {['Rank', 'Dealer Group', 'At-Risk', 'Historical Ended', 'Historical NFR', 'Expected Retained', 'Priority'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px', textAlign: h === 'Dealer Group' ? 'left' : 'center',
                      fontSize: 10, fontWeight: 700, color: C.navy, textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.topDealerGroups.map((dg, i) => {
                  const expectedRet = Math.round(dg.at_risk_count * dg.hist_nfr / 100);
                  const priority = dg.at_risk_count >= 100 ? 'High' : dg.at_risk_count >= 50 ? 'Medium' : 'Low';
                  const prColor = priority === 'High' ? C.red : priority === 'Medium' ? C.amber : C.green;
                  return (
                    <tr key={dg.label} style={{ borderBottom: `1px solid ${C.borderLight}` }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: C.textMuted, fontWeight: 600 }}>{i + 1}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: C.navy }}>{dg.label}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: C.red }}>{fN(dg.at_risk_count)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: C.textMid }}>{fN(dg.hist_ended)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 11,
                          background: nfrColor(dg.hist_nfr) === C.green ? C.greenBg : nfrColor(dg.hist_nfr) === C.amber ? C.amberBg : C.redBg,
                          color: nfrColor(dg.hist_nfr),
                        }}>
                          {dg.hist_nfr}%
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: C.green }}>{fN(expectedRet)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                          background: prColor === C.red ? C.redBg : prColor === C.amber ? C.amberBg : C.greenBg,
                          color: prColor, textTransform: 'uppercase',
                        }}>
                          {priority}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Crd>
      )}
    </div>
  );
}
