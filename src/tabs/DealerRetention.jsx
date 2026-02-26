import React, { useState } from 'react';
import { Callout, nfrColor, fN, C } from '../components/shared';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import useNFRData from '../hooks/useNFRData';

export default function DealerRetention() {
  const { data: dealers } = useNFRData('/api/nfr/by-dealer', { defaultValue: [] });
  const [search, setSearch] = useState('');

  const filtered = dealers.filter(d =>
    d.dealer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Callout type="info">
        <div style={{ fontSize: 13, color: C.textMid, lineHeight: 1.7 }}>
          <strong style={{ color: C.navy }}>Lost to Dealer:</strong>{' '}
          <span style={{ color: C.green, fontWeight: 600 }}>Dealer Retained</span> = same dealer.{' '}
          <span style={{ color: C.amber, fontWeight: 600 }}>Northridge Retained (diff)</span> = different dealer.
        </div>
      </Callout>

      <ChartCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.navy }}>Dealer Retention Analysis</div>
          <input
            type="text"
            placeholder="Search dealers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
              fontSize: 12, fontFamily: 'var(--font)', width: 220, color: C.navy, outline: 'none',
            }}
          />
        </div>

        <DataTable
          columns={[
            { key: 'dealer_name', label: 'Dealer', width: '1.3fr' },
            { key: 'ended', label: 'Ended', width: '65px', type: 'number' },
            { key: 'same_dealer_retained', label: 'Same Dlr', width: '80px', render: v => <div style={{ color: C.green, fontWeight: 600 }}>{v}</div> },
            { key: 'diff_dealer_retained', label: 'Diff Dlr', width: '80px', render: v => <div style={{ color: C.amber, fontWeight: 600 }}>{v}</div> },
            { key: 'total_retained', label: 'Total', width: '60px', type: 'number' },
            { key: 'nfr_rate', label: 'NFR %', width: '68px', type: 'nfr' },
            { key: 'dealer_retained_pct', label: 'Dlr Ret %', width: '80px', render: v => <div style={{ fontWeight: 600, color: C.textMid }}>{v || 0}%</div> },
            {
              key: 'same_dealer_retained', label: 'Split', width: '120px',
              render: (_, row) => {
                const total = (row.same_dealer_retained || 0) + (row.diff_dealer_retained || 0);
                const samePct = total > 0 ? ((row.same_dealer_retained || 0) / total * 100) : 0;
                return (
                  <div style={{ display: 'flex', height: 7, borderRadius: 3, overflow: 'hidden', background: C.borderLight }}>
                    {samePct > 0 && <div style={{ width: `${samePct}%`, background: C.green }} />}
                    {samePct < 100 && total > 0 && <div style={{ width: `${100 - samePct}%`, background: C.amber }} />}
                  </div>
                );
              },
            },
          ]}
          data={filtered}
        />

        {/* Color legend */}
        <div style={{ display: 'flex', gap: 18, padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
            <div style={{ width: 10, height: 5, borderRadius: 2, background: C.green }} /> Dealer Retained
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: C.textMuted }}>
            <div style={{ width: 10, height: 5, borderRadius: 2, background: C.amber }} /> Northridge (diff)
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
