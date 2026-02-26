import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Crd, Sec, TblH, CustomTooltip, nfrColor, fN, C, axisProps, MiniBar, CC } from '../components/shared';

export default function AgreementTerm({ window: win, excludeParam = '' }) {
  const [agreements, setAgreements] = useState([]);
  const [terms, setTerms] = useState([]);

  useEffect(() => {
    fetchAPI(`/api/nfr/by-agreement?window=${win}${excludeParam}`).then(setAgreements).catch(() => {});
    fetchAPI(`/api/nfr/by-term?window=${win}${excludeParam}`).then(setTerms).catch(() => {});
  }, [win, excludeParam]);

  const bestAgreement = agreements.length > 0 ? agreements.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;
  const bestTerm = terms.length > 0 ? terms.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Agreement Type Cards — side-bar accent style */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(agreements.length || 4, 6)}, 1fr)`, gap: 12 }}>
        {agreements.map((a, i) => (
          <div key={i} style={{
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
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
      <Crd>
        <Sec sub="Retention rate by contract term length">NFR by Term Length</Sec>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={terms}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} />
            <XAxis dataKey="term_band" {...axisProps} />
            <YAxis unit="%" {...axisProps} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="nfr_rate" name="NFR %" radius={[6, 6, 0, 0]}>
              {terms.map((entry, i) => (
                <Cell key={i} fill={nfrColor(entry.nfr_rate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Crd>

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

      {/* Term Band Detail — CSS Grid Table */}
      <Crd>
        <Sec>Term Band Detail</Sec>
        <TblH cols={[
          { l: 'Term Band', w: '1fr' },
          { l: 'Ended', w: '90px' },
          { l: 'Retained', w: '90px' },
          { l: 'NFR %', w: '80px' },
          { l: 'Performance', w: '150px' },
        ]} />
        {terms.map((t, i) => (
          <div key={i} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 90px 90px 80px 150px',
            padding: '10px 16px',
            borderBottom: `1px solid ${C.borderLight}`,
            background: i % 2 ? C.bg : C.white,
            alignItems: 'center',
            fontSize: 12
          }}>
            <div style={{ fontWeight: 600, color: C.navy }}>{t.term_band}</div>
            <div style={{ color: C.textMid }}>{fN(t.ended)}</div>
            <div style={{ fontWeight: 600, color: C.textMid }}>{fN(t.retained)}</div>
            <div style={{ fontWeight: 700, color: nfrColor(t.nfr_rate) }}>{t.nfr_rate}%</div>
            <div><MiniBar value={t.nfr_rate} /></div>
          </div>
        ))}
      </Crd>
    </div>
  );
}
