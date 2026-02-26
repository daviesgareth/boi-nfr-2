import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend, Cell, Line } from 'recharts';
import { Metric, Crd, Sec, CustomTooltip, Callout, nfrColor, fN, C, axisProps } from '../components/shared';

const WINDOW_LABELS = { '1mo': '1 Month', '3mo': '3 Months', '6mo': '6 Months', '12mo': '12 Months' };

export default function Overview({ window: win }) {
  const [national, setNational] = useState(null);
  const [yearly, setYearly] = useState([]);
  const [transitions, setTransitions] = useState([]);
  const [termination, setTermination] = useState(null);
  const [agreements, setAgreements] = useState([]);

  useEffect(() => {
    fetchAPI(`/api/nfr/national?window=${win}`).then(setNational).catch(() => {});
    fetchAPI(`/api/nfr/by-year?window=${win}`).then(setYearly).catch(() => {});
    fetchAPI(`/api/nfr/transitions?window=${win}`).then(setTransitions).catch(() => {});
    fetchAPI(`/api/nfr/termination?window=${win}`).then(setTermination).catch(() => {});
    fetchAPI(`/api/nfr/by-agreement?window=${win}`).then(setAgreements).catch(() => {});
  }, [win]);

  if (!national) return <p style={{ textAlign: 'center', padding: 40, color: C.textMuted }}>Loading...</p>;

  const wl = WINDOW_LABELS[win] || '6 Months';
  const earlyMultiplier = termination && termination.full_term?.nfr_rate > 0
    ? (termination.early?.nfr_rate / termination.full_term.nfr_rate).toFixed(0)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* NFR Definition Callout */}
      <Callout type="info">
        <div style={{ fontSize: 13, fontWeight: 700, color: C.navy, marginBottom: 4 }}>NFR KPI Definition</div>
        <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7, margin: 0 }}>
          <strong style={{ color: C.navy }}>Northridge Finance Retention (NFR)</strong> = % of ended contracts where the same customer started a new contract within a window from <strong>6 months before</strong> the end date to <strong>{wl} after</strong>.
        </p>
      </Callout>

      {/* Accent-Striped KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <Metric large label={`NFR @ ${wl}`} value={`${national.nfr_rate}%`} sub={`${fN(national.retained)} of ${fN(national.ended)} renewed`} accent={C.green} />
        <Metric label="Ended Contracts" value={fN(national.ended)} sub="Total closed" accent={C.navy} />
        <Metric label="Retained" value={fN(national.retained)} sub={`${national.nfr_rate}% retention`} accent={C.teal} />
        <Metric label="Early Terminators" value={earlyMultiplier ? `${earlyMultiplier}\u00d7 more likely` : '\u2014'} sub="to renew vs full-term" accent={C.amber} />
      </div>

      {/* Trend Chart + Transitions in 2fr/1fr grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
        {/* Annual Trend */}
        <Crd>
          <Sec sub="Year-over-year NFR performance">Annual NFR Trend</Sec>
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
        </Crd>

        {/* Transitions */}
        <Crd>
          <Sec>New/Used Transitions</Sec>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={transitions} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis type="number" {...axisProps} />
              <YAxis dataKey="transition" type="category" width={120} {...axisProps} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Retained" fill={C.navy} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 14, padding: 12, background: `${C.navy}06`, borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>Most customers follow Used → Used. Minimal cross-over between new and used.</div>
          </div>
        </Crd>
      </div>

      {/* Termination Comparison */}
      <Crd>
        <Sec>Termination Type Comparison</Sec>
        {termination && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '12px 0' }}>
            {[
              { label: 'Early Terminators', data: termination.early, color: C.amber },
              { label: 'Full Term', data: termination.full_term, color: C.navy }
            ].map(({ label, data, color }) => (
              <div key={label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.textMid }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: nfrColor(data.nfr_rate) }}>{data.nfr_rate}%</span>
                </div>
                <div style={{ background: C.bg, borderRadius: 4, height: 28, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(data.nfr_rate * 5, 100)}%`, height: '100%', background: color, borderRadius: 4, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                    <span style={{ fontSize: 11, color: 'white', fontWeight: 600 }}>{fN(data.retained)} / {fN(data.ended)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Critical callout */}
        {earlyMultiplier && (
          <Callout type="red">
            <div style={{ fontSize: 12, color: C.textMid }}>
              <strong style={{ color: C.red }}>Critical:</strong> Early terminators are <strong>{earlyMultiplier}\u00d7 more likely</strong> to renew.
            </div>
          </Callout>
        )}
      </Crd>

      {/* Agreement Type Chart */}
      <Crd>
        <Sec>NFR by Agreement Type</Sec>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={agreements} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis type="number" {...axisProps} tickFormatter={v => `${v}%`} />
            <YAxis dataKey="agreement_type" type="category" width={120} tick={{ fill: C.textMid, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nfr_rate" name="NFR %" radius={[0, 6, 6, 0]}>
              {agreements.map((entry, i) => (
                <Cell key={i} fill={nfrColor(entry.nfr_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Crd>
    </div>
  );
}
