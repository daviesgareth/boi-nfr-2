import React from 'react';
import { Crd, Sec, C } from './shared';

/**
 * Card wrapper for charts — combines Crd + Sec header + chart content.
 *
 * Props:
 *  - title: string
 *  - subtitle: string — optional
 *  - footer: string/ReactNode — optional bottom note
 *  - children: chart content
 *  - style: additional card styles
 */
export default function ChartCard({ title, subtitle, footer, children, style }) {
  return (
    <Crd style={style}>
      {title && <Sec sub={subtitle}>{title}</Sec>}
      {children}
      {footer && (
        <div style={{ marginTop: 12, padding: 12, background: `${C.navy}06`, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{footer}</div>
        </div>
      )}
    </Crd>
  );
}
