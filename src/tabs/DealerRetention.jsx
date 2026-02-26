import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { Crd, Sec, TblH, Callout, nfrColor, fN, C } from '../components/shared';

export default function DealerRetention({ window: win }) {
  const [dealers, setDealers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAPI(`/api/nfr/by-dealer?window=${win}`).then(setDealers).catch(() => {});
  }, [win]);

  const filtered = dealers.filter(d =>
    d.dealer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Info callout */}
      <Callout type="info">
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>Lost to Dealer:</strong>{' '}
          <span style={{ color: C.green, fontWeight: 600 }}>Dealer Retained</span> = same dealer.{' '}
          <span style={{ color: C.amber, fontWeight: 600 }}>Northridge Retained (diff)</span> = different dealer.
        </div>
      </Callout>

      <Crd>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Sec>Dealer Retention Analysis</Sec>
          <input
            type="text"
            placeholder="Search dealers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px',
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              fontSize: 12,
              fontFamily: 'var(--font)',
              width: 220,
              color: C.navy,
              outline: 'none'
            }}
          />
        </div>

        {/* CSS Grid Table */}
        <TblH cols={[
          { l: 'Dealer', w: '1.3fr' },
          { l: 'Ended', w: '65px' },
          { l: 'Same Dlr', w: '80px' },
          { l: 'Diff Dlr', w: '80px' },
          { l: 'Total', w: '60px' },
          { l: 'NFR %', w: '68px' },
          { l: 'Dlr Ret %', w: '80px' },
          { l: 'Split', w: '120px' },
        ]} />
        {filtered.map((d, i) => {
          const total = (d.same_dealer_retained || 0) + (d.diff_dealer_retained || 0);
          const samePct = total > 0 ? ((d.same_dealer_retained || 0) / total * 100) : 0;
          return (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '1.3fr 65px 80px 80px 60px 68px 80px 120px',
              padding: '10px 16px',
              borderBottom: `1px solid ${C.borderLight}`,
              background: i % 2 ? C.bg : C.white,
              alignItems: 'center',
              fontSize: 12
            }}>
              <div style={{ fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.dealer_name}</div>
              <div style={{ color: C.textMid }}>{fN(d.ended)}</div>
              <div style={{ color: C.green, fontWeight: 600 }}>{d.same_dealer_retained}</div>
              <div style={{ color: C.amber, fontWeight: 600 }}>{d.diff_dealer_retained}</div>
              <div style={{ fontWeight: 600, color: C.textMid }}>{d.total_retained}</div>
              <div style={{ fontWeight: 700, color: nfrColor(d.nfr_rate) }}>{d.nfr_rate}%</div>
              <div style={{ fontWeight: 600, color: C.textMid }}>{d.dealer_retained_pct || 0}%</div>
              <div>
                <div style={{ display: 'flex', height: 7, borderRadius: 3, overflow: 'hidden', background: C.borderLight }}>
                  {samePct > 0 && <div style={{ width: `${samePct}%`, background: C.green }} />}
                  {samePct < 100 && total > 0 && <div style={{ width: `${100 - samePct}%`, background: C.amber }} />}
                </div>
              </div>
            </div>
          );
        })}
        {/* Color legend */}
        <div style={{ display: 'flex', gap: 18, padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
            <div style={{ width: 10, height: 5, borderRadius: 2, background: C.green }} /> Dealer Retained
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
            <div style={{ width: 10, height: 5, borderRadius: 2, background: C.amber }} /> Northridge (diff)
          </div>
        </div>
      </Crd>
    </div>
  );
}
