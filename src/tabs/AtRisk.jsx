import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CustomTooltip, Callout, fN, C, axisProps } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import useNFRData from '../hooks/useNFRData';

export default function AtRisk() {
  const { data, loading } = useNFRData('/api/nfr/at-risk', { skipWindow: true });

  if (loading || !data) return <LoadingState />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Callout type="amber">
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>Pipeline:</strong> After NFR publish, AMs have <strong style={{ color: C.amber }}>1 month</strong> to impact. {fN(data.total)} contracts ending within 6 months.
        </div>
      </Callout>

      <MetricGrid columns={4} metrics={[
        { label: 'Total At-Risk', value: fN(data.total), sub: 'Ending within 6 months', accent: C.red },
        { label: 'PCP Ending', value: fN(data.segments?.pcp_ending || 0), sub: 'Highest renewal potential', accent: C.amber },
        { label: 'Optimal Term (37-48mo)', value: fN(data.segments?.optimal_term || 0), sub: 'Best performing term band', accent: C.green },
        { label: 'Early Terminators', value: fN(data.segments?.early_term || 0), sub: 'Higher retention likelihood', accent: C.navy },
      ]} />

      <ChartCard title="Monthly Expiry Forecast" subtitle="Contracts expiring by month">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis dataKey="month" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill={C.navy} radius={[6, 6, 0, 0]} barSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
