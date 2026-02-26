import React, { useState, useRef, useEffect } from 'react';
import { C } from './shared';
import { ChevronDown, X } from 'lucide-react';

/**
 * Multi-select dropdown with checkboxes.
 *
 * Props:
 *  - options: string[] — available values
 *  - selected: string[] — currently selected values
 *  - onChange: (string[]) => void
 *  - placeholder: string
 */
export default function MultiSelect({ options = [], selected = [], onChange, placeholder = 'All' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (val) => {
    if (selected.includes(val)) onChange(selected.filter(v => v !== val));
    else onChange([...selected, val]);
  };

  const label = selected.length === 0
    ? placeholder
    : selected.length <= 2
      ? selected.join(', ')
      : `${selected.length} selected`;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
          width: '100%', padding: '6px 10px', borderRadius: 8,
          border: `1px solid ${selected.length > 0 ? C.navy : '#E0E5EC'}`,
          background: selected.length > 0 ? `${C.navy}08` : '#FFFFFF',
          color: selected.length > 0 ? C.navy : '#7A8FA6',
          cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
          textAlign: 'left', outline: 'none',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {selected.length > 0 && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              style={{ display: 'flex', alignItems: 'center', padding: 1, borderRadius: 3, cursor: 'pointer' }}
              title="Clear"
            >
              <X size={11} />
            </span>
          )}
          <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
        </span>
      </button>

      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: '#FFFFFF', border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,53,95,0.12)', zIndex: 200,
          maxHeight: 220, overflowY: 'auto', padding: '4px 0',
        }}>
          {options.map(opt => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 10px',
                  background: active ? `${C.navy}08` : 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font)', fontSize: 12, color: active ? C.navy : C.textMid,
                  fontWeight: active ? 600 : 500, textAlign: 'left', transition: 'background 0.08s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#F4F6F9'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `2px solid ${active ? C.navy : '#D0D5DD'}`,
                  background: active ? C.navy : '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ color: 'white', fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{'\u2713'}</span>}
                </div>
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
