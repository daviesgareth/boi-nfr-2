import React from 'react';

// V1-style color constants (matching CSS vars)
const C = {
  navy: '#00355F', navyDark: '#002440', navyLight: '#0A4A7A',
  ice: '#A8D8EA', iceDark: '#6BC0D6',
  white: '#FFFFFF', bg: '#F4F6F9',
  border: '#E0E5EC', borderLight: '#EDF0F4',
  text: '#00355F', textMid: '#3D5A7C', textLight: '#7A8FA6', textMuted: '#9FAFC0',
  green: '#0D9668', greenBg: '#ECFDF5',
  amber: '#D97706', amberBg: '#FFFBEB',
  red: '#DC2626', redBg: '#FEF2F2',
  purple: '#7C3AED', teal: '#0D9488',
};

// Chart color array
export const CC = [C.navy, C.iceDark, C.green, C.amber, C.red, C.purple, C.teal, '#EC4899'];

// NFR traffic-light color
export const nfrColor = (rate) => rate >= 5 ? C.green : rate >= 2.5 ? C.amber : C.red;

// Format number with commas
export const fN = (n) => n == null ? '0' : Number(n).toLocaleString();

// Accent-striped KPI metric card (V1 style)
export const Metric = ({ label, value, sub, accent, large }) => (
  <div style={{
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: large ? '22px 24px' : '16px 20px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,53,95,0.05)'
  }}>
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent || C.navy }} />
    <div style={{ fontSize: 11, color: C.textLight, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: large ? 32 : 26, fontWeight: 700, color: C.navy, lineHeight: 1.15 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>{sub}</div>}
  </div>
);

// Card with shadow (V1 style)
export const Crd = ({ children, style }) => (
  <div style={{
    background: C.white,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 22,
    boxShadow: '0 1px 3px rgba(0,53,95,0.05)',
    ...style
  }}>
    {children}
  </div>
);

// Section header (V1 style)
export const Sec = ({ children, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <h2 style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>{children}</h2>
    {sub && <p style={{ fontSize: 12, color: C.textMuted, margin: '4px 0 0' }}>{sub}</p>}
  </div>
);

// CSS Grid table header (V1 style)
export const TblH = ({ cols }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: cols.map(c => c.w).join(' '),
    padding: '10px 16px',
    background: `${C.navy}08`,
    borderRadius: '8px 8px 0 0'
  }}>
    {cols.map((c, i) => (
      <div key={i} style={{
        fontSize: 10,
        fontWeight: 700,
        color: C.navy,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>{c.l}</div>
    ))}
  </div>
);

// 6px-radius toggle pill (V1 style)
export const Pill = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{
    padding: '4px 12px',
    borderRadius: 6,
    border: `1px solid ${active ? C.navy : C.border}`,
    background: active ? `${C.navy}0C` : C.white,
    color: active ? C.navy : C.textMuted,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    transition: 'all 0.12s'
  }}>
    {children}
  </button>
);

// Custom tooltip (V1 shadow style)
export const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 20px rgba(0,53,95,0.12)'
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 12, color: C.textMid, display: 'flex', gap: 8, marginTop: 3 }}>
          <span style={{ color: p.color || C.textLight }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: C.navy }}>
            {typeof p.value === 'number' ? (p.value > 999 ? fN(p.value) : p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Callout box component
export const Callout = ({ type = 'info', children }) => {
  const styles = {
    info: { bg: `${C.navy}08`, border: `${C.navy}12` },
    amber: { bg: C.amberBg, border: `${C.amber}30` },
    red: { bg: C.redBg, border: `${C.red}20` },
  };
  const s = styles[type] || styles.info;
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 12, padding: 18 }}>
      {children}
    </div>
  );
};

// V1-style inline mini progress bar
export const MiniBar = ({ value, max = 10 }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: 6, background: C.borderLight, borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: nfrColor(value), borderRadius: 3 }} />
    </div>
  );
};

// V1-style chart axis props
export const axisProps = {
  tick: { fill: '#7A8FA6', fontSize: 11 },
  axisLine: false,
  tickLine: false,
};

// Live password-policy checklist — shows tick/cross for each rule as the user types
export const PasswordChecklist = ({ value, compact }) => {
  const rules = [
    { label: '8+ characters', met: value.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(value) },
    { label: 'Lowercase letter', met: /[a-z]/.test(value) },
    { label: 'Number', met: /[0-9]/.test(value) },
  ];
  if (!value) return null;
  const gap = compact ? 2 : 4;
  const fontSize = compact ? 10 : 11;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap, marginTop: 4 }}>
      {rules.map((r) => (
        <span key={r.label} style={{
          display: 'inline-flex', alignItems: 'center', gap: 3,
          fontSize, fontWeight: 600,
          color: r.met ? C.green : C.textMuted,
          transition: 'color 0.15s',
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: compact ? 12 : 14, height: compact ? 12 : 14, borderRadius: '50%',
            background: r.met ? C.greenBg : C.bg,
            border: `1px solid ${r.met ? C.green : C.border}`,
            fontSize: compact ? 7 : 8, lineHeight: 1, transition: 'all 0.15s',
          }}>
            {r.met ? '\u2713' : ''}
          </span>
          {r.label}
        </span>
      ))}
    </div>
  );
};

// Re-export C for direct color access
export { C };
