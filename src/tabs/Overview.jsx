import React, { useMemo } from 'react';
import {
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ZAxis, Cell,
} from 'recharts';
import { Crd, Sec, CustomTooltip, Callout, nfrColor, fN, C, axisProps } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import LoadingState from '../components/LoadingState';
import useNFRData from '../hooks/useNFRData';
import { useFilters } from '../contexts/FilterContext';

const WINDOW_LABELS = {
  'core': '-3/+1', '6_1': '-6/+1', '3_6': '-3/+6',
  '3_9': '-3/+9', '3_12': '-3/+12', '3_18': '-3/+18',
};

// Quadrant colours
const Q_COLORS = {
  star: C.green,       // high volume, high rate
  opportunity: C.red,  // high volume, low rate
  niche: C.teal,       // low volume, high rate
  watch: '#94A3B8',    // low volume, low rate
};

function quadrant(ended, nfr_rate, medianVol, avgRate) {
  const highVol = ended >= medianVol;
  const highRate = nfr_rate >= avgRate;
  if (highVol && highRate) return 'star';
  if (highVol && !highRate) return 'opportunity';
  if (!highVol && highRate) return 'niche';
  return 'watch';
}

function median(arr) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Custom scatter tooltip
const ScatterTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,53,95,0.1)',
      fontSize: 12, lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 700, color: C.navy, marginBottom: 2 }}>{d.name}</div>
      <div style={{ color: C.textMid }}>Volume: <strong>{fN(d.ended)}</strong> contracts</div>
      <div style={{ color: C.textMid }}>NFR: <strong style={{ color: nfrColor(d.nfr_rate) }}>{d.nfr_rate}%</strong></div>
      <div style={{ color: C.textMid }}>Retained: <strong>{fN(d.retained)}</strong></div>
    </div>
  );
};

// Custom curve tooltip
const CurveTooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const label = d.month === 0 ? 'At end date' : d.month > 0 ? `+${d.month} months after` : `${d.month} months before`;
  return (
    <div style={{
      background: 'white', border: `1px solid ${C.border}`, borderRadius: 8,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,53,95,0.1)',
      fontSize: 12, lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 700, color: C.navy }}>{label}</div>
      <div style={{ color: C.textMid }}>Cumulative retention: <strong style={{ color: C.green }}>{d.rate}%</strong></div>
      <div style={{ color: C.textMuted }}>{fN(d.count)} matched this month ({fN(d.cumulative)} total)</div>
    </div>
  );
};

export default function Overview() {
  const { window: win } = useFilters();
  const { data: national, loading } = useNFRData('/api/nfr/national');
  const { data: curveData } = useNFRData('/api/nfr/retention-curve');
  const { data: trend, loading: trendLoading } = useNFRData('/api/nfr/trend', { defaultValue: [] });
  const { data: regions } = useNFRData('/api/nfr/by-region', { defaultValue: [] });
  const { data: dealerGroups } = useNFRData('/api/nfr/by-dealer-group', { defaultValue: [] });

  // Compute scatter data for regions
  const scatterData = useMemo(() => {
    if (!regions.length) return { points: [], medianVol: 0, avgRate: 0 };
    const vols = regions.map(r => r.ended);
    const medianVol = median(vols);
    const totalEnded = regions.reduce((s, r) => s + r.ended, 0);
    const totalRetained = regions.reduce((s, r) => s + r.retained, 0);
    const avgRate = totalEnded > 0 ? Math.round((totalRetained / totalEnded) * 10000) / 100 : 0;

    const points = regions.map(r => ({
      name: r.region,
      ended: r.ended,
      nfr_rate: r.nfr_rate,
      retained: r.retained,
      q: quadrant(r.ended, r.nfr_rate, medianVol, avgRate),
    }));
    return { points, medianVol, avgRate };
  }, [regions]);

  // Compute trend direction
  const trendDirection = useMemo(() => {
    if (trend.length < 2) return null;
    const recent = trend.slice(-3);
    const prior = trend.slice(-6, -3);
    if (prior.length === 0) return null;
    const recentAvg = recent.reduce((s, r) => s + r.nfr_rate, 0) / recent.length;
    const priorAvg = prior.reduce((s, r) => s + r.nfr_rate, 0) / prior.length;
    const diff = recentAvg - priorAvg;
    return { diff: Math.round(diff * 100) / 100, up: diff > 0 };
  }, [trend]);

  if (loading || !national) return <LoadingState />;

  const wl = WINDOW_LABELS[win] || '-3/+1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. KPI Headline Row */}
      <MetricGrid columns={4} metrics={[
        {
          label: `NFR Rate (${wl})`,
          value: `${national.nfr_rate}%`,
          sub: `${fN(national.retained)} of ${fN(national.ended)} retained`,
          accent: nfrColor(national.nfr_rate),
          large: true,
        },
        {
          label: 'Ended Contracts',
          value: fN(national.ended),
          sub: 'In selected period',
          accent: C.navy,
        },
        {
          label: 'Retained',
          value: fN(national.retained),
          sub: 'Customers who renewed',
          accent: C.teal,
        },
        {
          label: 'Trend',
          value: trendDirection
            ? `${trendDirection.up ? '\u25B2' : '\u25BC'} ${Math.abs(trendDirection.diff)}pp`
            : '\u2014',
          sub: trendDirection
            ? `vs prior 3 months${trendDirection.up ? ' \u2014 improving' : ' \u2014 declining'}`
            : 'Not enough data',
          accent: trendDirection ? (trendDirection.up ? C.green : C.red) : C.textMuted,
        },
      ]} />

      {/* 2. Retention Curve — the centrepiece */}
      {curveData && curveData.curve && (
        <ChartCard
          title="Retention Curve"
          subtitle="When do customers come back? Cumulative % of ended contracts matched to a new contract by months relative to end date"
        >
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={curveData.curve} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.navy} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={C.navy} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis
                dataKey="month"
                {...axisProps}
                label={{ value: 'Months from contract end', position: 'insideBottom', offset: -2, style: { fontSize: 11, fill: C.textMuted } }}
                tickFormatter={v => v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`}
              />
              <YAxis {...axisProps} unit="%" domain={[0, 'auto']} />
              <Tooltip content={<CurveTooltipContent />} />
              <ReferenceLine x={0} stroke={C.amber} strokeDasharray="4 4" strokeWidth={2} label={{ value: 'End date', position: 'top', style: { fontSize: 10, fill: C.amber, fontWeight: 600 } }} />
              <Area type="monotone" dataKey="rate" stroke={C.navy} strokeWidth={2.5} fill="url(#curveGrad)" dot={false} activeDot={{ r: 5, fill: C.navy }} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 24, padding: '12px 0 0', justifyContent: 'center' }}>
            {[
              { label: 'At end date', month: 0 },
              { label: '+3 months', month: 3 },
              { label: '+6 months', month: 6 },
              { label: '+12 months', month: 12 },
              { label: '+18 months', month: 18 },
            ].map(({ label, month }) => {
              const point = curveData.curve.find(p => p.month === month);
              return point ? (
                <div key={month} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.navy }}>{point.rate}%</div>
                  <div style={{ fontSize: 10, color: C.textMuted, fontWeight: 600 }}>{label}</div>
                </div>
              ) : null;
            })}
          </div>
        </ChartCard>
      )}

      {/* 3. Volume vs Rate — Scatter Quadrant */}
      <ChartCard
        title="Where to Focus"
        subtitle="Each dot is a region. Size = volume. Top-right = performing well. Bottom-right = biggest opportunity to improve."
      >
        <div style={{ display: 'flex', gap: 12, padding: '0 0 8px', flexWrap: 'wrap' }}>
          {[
            { color: Q_COLORS.star, label: 'Stars', desc: 'High vol, high NFR' },
            { color: Q_COLORS.opportunity, label: 'Opportunities', desc: 'High vol, low NFR' },
            { color: Q_COLORS.niche, label: 'Niche', desc: 'Low vol, high NFR' },
            { color: Q_COLORS.watch, label: 'Watch', desc: 'Low vol, low NFR' },
          ].map(({ color, label, desc }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontWeight: 600, color: C.navy }}>{label}</span>
              <span style={{ color: C.textMuted }}>({desc})</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis
              dataKey="ended" type="number" name="Volume" {...axisProps}
              label={{ value: 'Ended contracts (volume)', position: 'insideBottom', offset: -8, style: { fontSize: 11, fill: C.textMuted } }}
              tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            />
            <YAxis
              dataKey="nfr_rate" type="number" name="NFR %" {...axisProps} unit="%"
              label={{ value: 'NFR Rate %', angle: -90, position: 'insideLeft', offset: 15, style: { fontSize: 11, fill: C.textMuted } }}
            />
            <ZAxis dataKey="ended" range={[60, 400]} />
            <Tooltip content={<ScatterTooltipContent />} />
            {scatterData.avgRate > 0 && (
              <ReferenceLine y={scatterData.avgRate} stroke={C.textMuted} strokeDasharray="4 4"
                label={{ value: `Avg ${scatterData.avgRate}%`, position: 'right', style: { fontSize: 10, fill: C.textMuted } }}
              />
            )}
            {scatterData.medianVol > 0 && (
              <ReferenceLine x={scatterData.medianVol} stroke={C.textMuted} strokeDasharray="4 4" />
            )}
            <Scatter data={scatterData.points} shape="circle">
              {scatterData.points.map((p, i) => (
                <Cell key={i} fill={Q_COLORS[p.q]} fillOpacity={0.8} stroke={Q_COLORS[p.q]} strokeWidth={1} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Monthly Trend */}
      {trend.length > 0 && (
        <ChartCard title="NFR Trend Over Time" subtitle="Monthly retention rate — is it improving?">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
              <XAxis dataKey="month" {...axisProps} interval={Math.max(0, Math.floor(trend.length / 12))} />
              <YAxis {...axisProps} unit="%" domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="nfr_rate" name="NFR %" stroke={C.navy} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: C.navy }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
