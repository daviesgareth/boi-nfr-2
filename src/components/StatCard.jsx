import React from 'react';
import { C } from './shared';

/**
 * Stat card with colored left border accent.
 *
 * Props:
 *  - label: string — small uppercase label
 *  - value: string/number — large display value
 *  - sub: string — optional subtitle
 *  - color: string — accent color for border + value
 *  - children: optional extra content below
 */
export default function StatCard({ label, value, sub, color, children }) {
  return (
    <div style={{
      background: C.bg,
      borderRadius: 10,
      padding: '14px 16px',
      borderLeft: `4px solid ${color || C.navy}`,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || C.navy, lineHeight: 1.2, marginTop: 4 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{sub}</div>
      )}
      {children}
    </div>
  );
}
