import React from 'react';
import { C } from './shared';
import MultiSelect from './MultiSelect';

const selectStyle = {
  background: '#FFFFFF',
  border: '1px solid #E0E5EC',
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

/**
 * Reusable filter panel with select dropdowns in a grid.
 *
 * Props:
 *  - filters: array of { key, label, options?, placeholder, multi? }
 *  - values: object — current filter values (string for single, string[] for multi)
 *  - onChange: (key, value) => void
 *  - onReset: () => void
 *  - title: string (default: 'Filters')
 *  - columns: number (default: 5)
 *  - customRenderers: object — { [key]: (value, onChange) => ReactNode }
 */
export default function FilterPanel({ filters, values, onChange, onReset, title = 'Filters', columns = 5, customRenderers = {} }) {
  const activeCount = Object.values(values).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v);
  }).length;

  return (
    <div style={{ background: `${C.navy}08`, border: `1px solid ${C.navy}12`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy, margin: 0 }}>{title}</div>
          {activeCount > 0 && (
            <span style={{ padding: '4px 12px', background: C.amberBg, color: C.amber, borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
              {activeCount} filter{activeCount > 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <button onClick={onReset} style={{
          padding: '4px 14px',
          border: `1px solid ${C.border}`,
          borderRadius: 6,
          background: activeCount > 0 ? C.navy : C.white,
          color: activeCount > 0 ? C.white : C.textMuted,
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font)',
        }}>
          Reset All
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
        {filters.map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              {f.label}
            </div>
            {customRenderers[f.key] ? (
              customRenderers[f.key](values[f.key], (v) => onChange(f.key, v))
            ) : f.multi ? (
              <MultiSelect
                options={f.options || []}
                selected={values[f.key] || []}
                onChange={(v) => onChange(f.key, v)}
                placeholder={f.placeholder}
              />
            ) : (
              <select style={selectStyle} value={values[f.key] || ''} onChange={e => onChange(f.key, e.target.value)}>
                <option value="">{f.placeholder}</option>
                {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
