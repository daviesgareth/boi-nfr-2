import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Metric, Crd, Sec, TblH, CustomTooltip, nfrColor, fN, C, axisProps, MiniBar } from '../components/shared';

export default function RegionGroup({ window: win, excludeParam = '' }) {
  const [regions, setRegions] = useState([]);
  const [groups, setGroups] = useState([]);
  const [national, setNational] = useState(null);

  useEffect(() => {
    fetchAPI(`/api/nfr/by-region?window=${win}${excludeParam}`).then(setRegions).catch(() => {});
    fetchAPI(`/api/nfr/by-dealer-group?window=${win}${excludeParam}`).then(setGroups).catch(() => {});
    fetchAPI(`/api/nfr/national?window=${win}${excludeParam}`).then(setNational).catch(() => {});
  }, [win, excludeParam]);

  const bestRegion = regions.length > 0 ? regions.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;
  const bestGroup = groups.length > 0 ? groups.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <Metric label="National NFR" value={national ? `${national.nfr_rate}%` : '--'} sub={national ? `${fN(national.retained)} retained` : ''} accent={C.green} />
        <Metric label="Best Region" value={bestRegion ? `${bestRegion.nfr_rate}%` : '--'} sub={bestRegion ? bestRegion.region : ''} accent={C.teal} />
        <Metric label="Best Dealer Group" value={bestGroup ? `${bestGroup.nfr_rate}%` : '--'} sub={bestGroup ? bestGroup.dealer_group : ''} accent={C.purple} />
      </div>

      {/* Regional NFR Chart */}
      <Crd>
        <Sec sub="NFR rate by UK region">Regional Performance</Sec>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={regions} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis type="number" {...axisProps} tickFormatter={v => `${v}%`} />
            <YAxis dataKey="region" type="category" width={140} tick={{ fill: C.textMid, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nfr_rate" name="NFR %" radius={[0, 6, 6, 0]}>
              {regions.map((entry, i) => (
                <Cell key={i} fill={nfrColor(entry.nfr_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Crd>

      {/* Dealer Group Table — CSS Grid */}
      <Crd>
        <Sec sub="Top performing dealer groups by NFR">Dealer Group Performance</Sec>
        <TblH cols={[
          { l: '#', w: '40px' },
          { l: 'Dealer Group', w: '1.3fr' },
          { l: 'Ended', w: '80px' },
          { l: 'Retained', w: '80px' },
          { l: 'Same Dlr', w: '70px' },
          { l: 'Diff Dlr', w: '70px' },
          { l: 'NFR %', w: '65px' },
          { l: 'Performance', w: '120px' },
        ]} />
        {groups.map((g, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '40px 1.3fr 80px 80px 70px 70px 65px 120px',
            padding: '10px 16px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: i % 2 ? C.bg : C.white,
            alignItems: 'center',
            fontSize: 12
          }}>
            <div style={{ fontWeight: 600, color: C.textMuted }}>{i + 1}</div>
            <div style={{ fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.dealer_group}</div>
            <div style={{ color: C.textMid }}>{fN(g.ended)}</div>
            <div style={{ fontWeight: 600, color: C.textMid }}>{fN(g.retained)}</div>
            <div style={{ color: C.green }}>{g.same_dealer}</div>
            <div style={{ color: C.amber }}>{g.diff_dealer}</div>
            <div style={{ fontWeight: 700, color: nfrColor(g.nfr_rate) }}>{g.nfr_rate}%</div>
            <div><MiniBar value={g.nfr_rate} /></div>
          </div>
        ))}
      </Crd>
    </div>
  );
}
