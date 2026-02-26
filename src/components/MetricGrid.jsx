import React from 'react';
import { Metric } from './shared';

/**
 * Grid of Metric cards.
 *
 * Props:
 *  - metrics: array of { label, value, sub?, accent?, large? }
 *  - columns: number (default: metrics.length, max 6)
 */
export default function MetricGrid({ metrics, columns }) {
  const cols = columns || Math.min(metrics.length, 6);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {metrics.map((m, i) => (
        <Metric key={i} label={m.label} value={m.value} sub={m.sub} accent={m.accent} large={m.large} />
      ))}
    </div>
  );
}
