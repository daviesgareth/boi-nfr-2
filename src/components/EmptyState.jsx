import React from 'react';
import { C } from './shared';

/**
 * Empty state placeholder with optional CTA.
 * Props:
 *  - title: string
 *  - description: string
 *  - action: { label, onClick } — optional button
 */
export default function EmptyState({ title, description, action }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 24px',
      background: C.white,
      borderRadius: 12,
      border: `1px solid ${C.border}`,
    }}>
      <h3 style={{ color: C.navy, marginBottom: 8, fontSize: 16 }}>{title || 'No data'}</h3>
      {description && <p style={{ color: C.textMuted, marginBottom: action ? 20 : 0, fontSize: 13 }}>{description}</p>}
      {action && (
        <button onClick={action.onClick} style={{
          padding: '10px 24px',
          background: C.navy,
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontFamily: 'var(--font)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}>
          {action.label}
        </button>
      )}
    </div>
  );
}
