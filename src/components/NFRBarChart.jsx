import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CustomTooltip, nfrColor, C, axisProps } from './shared';

/**
 * Reusable horizontal bar chart with NFR traffic-light coloring.
 *
 * Props:
 *  - data: array of objects
 *  - categoryKey: string — the data key for the Y-axis labels (e.g. 'region', 'make')
 *  - valueKey: string — the data key for bar values (default: 'nfr_rate')
 *  - height: number — chart height (default: auto-calculated from data.length)
 *  - yAxisWidth: number — Y-axis label width (default: 130)
 *  - formatValue: function — X-axis formatter (default: v => `${v}%`)
 *  - colorFn: function — bar color function (default: nfrColor based on value)
 *  - colors: array — static color array (overrides colorFn)
 *  - barName: string — tooltip label (default: 'NFR %')
 *  - layout: 'vertical' | 'horizontal' — chart layout (default: 'vertical' = horizontal bars)
 */
export default function NFRBarChart({
  data,
  categoryKey,
  valueKey = 'nfr_rate',
  height,
  yAxisWidth = 130,
  formatValue = v => `${v}%`,
  colorFn,
  colors,
  barName = 'NFR %',
  layout = 'vertical',
}) {
  const chartHeight = height || Math.max(250, data.length * 32);

  const getColor = (entry, i) => {
    if (colors) return colors[i % colors.length];
    if (colorFn) return colorFn(entry[valueKey]);
    return nfrColor(entry[valueKey]);
  };

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={data} layout={layout}>
        <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
        {layout === 'vertical' ? (
          <>
            <XAxis type="number" {...axisProps} tickFormatter={formatValue} />
            <YAxis
              dataKey={categoryKey}
              type="category"
              width={yAxisWidth}
              tick={{ fill: C.textMid, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} {...axisProps} />
            <YAxis {...axisProps} tickFormatter={formatValue} />
          </>
        )}
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey={valueKey} name={barName} radius={layout === 'vertical' ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getColor(entry, i)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
