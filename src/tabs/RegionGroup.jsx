import React from 'react';
import { fN, C } from '../components/shared';
import MetricGrid from '../components/MetricGrid';
import ChartCard from '../components/ChartCard';
import NFRBarChart from '../components/NFRBarChart';
import DataTable from '../components/DataTable';
import useNFRData from '../hooks/useNFRData';

export default function RegionGroup() {
  const { data: regions } = useNFRData('/api/nfr/by-region', { defaultValue: [] });
  const { data: groups } = useNFRData('/api/nfr/by-dealer-group', { defaultValue: [] });
  const { data: national } = useNFRData('/api/nfr/national');

  const bestRegion = regions.length > 0 ? regions.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;
  const bestGroup = groups.length > 0 ? groups.reduce((a, b) => a.nfr_rate > b.nfr_rate ? a : b) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <MetricGrid columns={3} metrics={[
        { label: 'National NFR', value: national ? `${national.nfr_rate}%` : '--', sub: national ? `${fN(national.retained)} retained` : '', accent: C.green },
        { label: 'Best Region', value: bestRegion ? `${bestRegion.nfr_rate}%` : '--', sub: bestRegion ? bestRegion.region : '', accent: C.teal },
        { label: 'Best Dealer Group', value: bestGroup ? `${bestGroup.nfr_rate}%` : '--', sub: bestGroup ? bestGroup.dealer_group : '', accent: C.purple },
      ]} />

      <ChartCard title="Regional Performance" subtitle="NFR rate by UK region">
        <NFRBarChart data={regions} categoryKey="region" height={420} yAxisWidth={140} />
      </ChartCard>

      <ChartCard title="Dealer Group Performance" subtitle="Top performing dealer groups by NFR">
        <DataTable
          columns={[
            { key: '_rank', label: '#', width: '40px', render: (_, __, idx) => <div style={{ fontWeight: 600, color: C.textMuted }}>{idx + 1}</div> },
            { key: 'dealer_group', label: 'Dealer Group', width: '1.3fr' },
            { key: 'ended', label: 'Ended', width: '80px', type: 'number' },
            { key: 'retained', label: 'Retained', width: '80px', type: 'number' },
            { key: 'same_dealer', label: 'Same Dlr', width: '70px', render: v => <div style={{ color: C.green }}>{v}</div> },
            { key: 'diff_dealer', label: 'Diff Dlr', width: '70px', render: v => <div style={{ color: C.amber }}>{v}</div> },
            { key: 'nfr_rate', label: 'NFR %', width: '65px', type: 'nfr' },
            { key: 'nfr_rate', label: 'Performance', width: '120px', type: 'minibar' },
          ]}
          data={groups}
        />
      </ChartCard>
    </div>
  );
}
