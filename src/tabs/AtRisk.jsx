import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Metric, Crd, Sec, CustomTooltip, Callout, fN, C, axisProps } from '../components/shared';

export default function AtRisk() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAPI('/api/nfr/at-risk').then(setData).catch(() => {});
  }, []);

  if (!data) return <p style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Amber callout instead of navy card */}
      <Callout type="amber">
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>Pipeline:</strong> After NFR publish, AMs have <strong style={{ color: C.amber }}>1 month</strong> to impact. {fN(data.total)} contracts ending within 6 months.
        </div>
      </Callout>

      {/* Accent-Striped Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Metric label="Total At-Risk" value={fN(data.total)} sub="Ending within 6 months" accent={C.red} />
        <Metric label="PCP Ending" value={fN(data.segments?.pcp_ending || 0)} sub="Highest renewal potential" accent={C.amber} />
        <Metric label="Optimal Term (37-48mo)" value={fN(data.segments?.optimal_term || 0)} sub="Best performing term band" accent={C.green} />
        <Metric label="Early Terminators" value={fN(data.segments?.early_term || 0)} sub="Higher retention likelihood" accent={C.navy} />
      </div>

      {/* Monthly Expiry Chart */}
      <Crd>
        <Sec sub="Contracts expiring by month">Monthly Expiry Forecast</Sec>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthly || []}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis dataKey="month" {...axisProps} />
            <YAxis {...axisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Contracts" fill={C.navy} radius={[6, 6, 0, 0]} barSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </Crd>
    </div>
  );
}
