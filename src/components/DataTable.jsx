import React from 'react';
import { TblH, MiniBar, nfrColor, fN, C } from './shared';

/**
 * Reusable CSS Grid data table with built-in column types.
 *
 * Props:
 *  - columns: array of { key, label, width, type?, render?, align? }
 *    Types: 'text' (default), 'number', 'nfr', 'minibar', 'custom'
 *    render: (value, row, rowIndex) => ReactNode
 *  - data: array of row objects
 *  - onRowClick: optional (row) => void
 */
export default function DataTable({ columns, data, onRowClick }) {
  const colDefs = columns.map(c => ({ l: c.label, w: c.width }));
  const gridCols = columns.map(c => c.width).join(' ');

  function renderCell(col, row, value, rowIndex) {
    if (col.render) return col.render(value, row, rowIndex);

    switch (col.type) {
      case 'number':
        return <div style={{ color: C.textMid, textAlign: col.align || 'left' }}>{fN(value)}</div>;
      case 'nfr':
        return <div style={{ fontWeight: 700, color: nfrColor(value), textAlign: col.align || 'left' }}>{value}%</div>;
      case 'minibar':
        return <MiniBar value={value} />;
      default:
        return <div style={{ fontWeight: 600, color: C.navy }}>{value}</div>;
    }
  }

  return (
    <div>
      <TblH cols={colDefs} />
      {data.map((row, i) => (
        <div
          key={i}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          style={{
            display: 'grid',
            gridTemplateColumns: gridCols,
            padding: '10px 16px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: i % 2 ? C.bg : C.white,
            alignItems: 'center',
            fontSize: 12,
            cursor: onRowClick ? 'pointer' : undefined,
          }}
        >
          {columns.map((col, ci) => (
            <div key={ci}>{renderCell(col, row, row[col.key], i)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
