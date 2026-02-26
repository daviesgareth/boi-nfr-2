import React from 'react';
import { Crd, Sec, nfrColor, fN, C, CC } from '../components/shared';
import ChartCard from '../components/ChartCard';
import NFRBarChart from '../components/NFRBarChart';
import DataTable from '../components/DataTable';
import useNFRData from '../hooks/useNFRData';

export default function AgreementTerm() {
  const { data: agreements } = useNFRData('/api/nfr/by-agreement', { defaultValue: [] });
  const { data: terms } = useNFRData('/api/nfr/by-term', { defaultValue: [] });

  const bestAgreement = agreements.length > 0 ? agreements.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;
  const bestTerm = terms.length > 0 ? terms.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Agreement Type Cards — side-bar accent style */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(agreements.length || 4, 6)}, 1fr)`, gap: 12 }}>
        {agreements.map((a, i) => (
          <div key={i} style={{
            background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: '0 1px 3px rgba(0,53,95,0.05)',
          }}>
            <div style={{ width: 4, height: 44, borderRadius: 2, background: CC[i % CC.length], flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textLight, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{a.agreement_type}</div>
              <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{fN(a.retained)} / {fN(a.ended)}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: nfrColor(a.nfr_rate) }}>{a.nfr_rate}%</div>
          </div>
        ))}
      </div>

      {/* Term Length Chart */}
      <ChartCard title="NFR by Term Length" subtitle="Retention rate by contract term length">
        <NFRBarChart data={terms} categoryKey="term_band" layout="horizontal" height={280} />
      </ChartCard>

      {/* Best Performing Segments */}
      <Crd>
        <Sec>Best Performing Segments</Sec>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {bestAgreement && (
            <div style={{ padding: 16, background: C.bg, borderRadius: 8, borderLeft: `4px solid ${nfrColor(bestAgreement.nfr_rate)}` }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Best Agreement Type</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginTop: 4 }}>{bestAgreement.agreement_type}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: nfrColor(bestAgreement.nfr_rate), marginTop: 2 }}>{bestAgreement.nfr_rate}% NFR</div>
            </div>
          )}
          {bestTerm && (
            <div style={{ padding: 16, background: C.bg, borderRadius: 8, borderLeft: `4px solid ${nfrColor(bestTerm.nfr_rate)}` }}>
              <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>Best Term Band</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.navy, marginTop: 4 }}>{bestTerm.term_band}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: nfrColor(bestTerm.nfr_rate), marginTop: 2 }}>{bestTerm.nfr_rate}% NFR</div>
            </div>
          )}
        </div>
      </Crd>

      {/* Term Band Detail Table */}
      <ChartCard title="Term Band Detail">
        <DataTable
          columns={[
            { key: 'term_band', label: 'Term Band', width: '1fr' },
            { key: 'ended', label: 'Ended', width: '90px', type: 'number' },
            { key: 'retained', label: 'Retained', width: '90px', type: 'number' },
            { key: 'nfr_rate', label: 'NFR %', width: '80px', type: 'nfr' },
            { key: 'nfr_rate', label: 'Performance', width: '150px', type: 'minibar' },
          ]}
          data={terms}
        />
      </ChartCard>
    </div>
  );
}
