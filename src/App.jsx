import React, { useState, useEffect, useCallback } from 'react';
import { fetchAPI } from './api';
import Overview from './tabs/Overview';
import RegionGroup from './tabs/RegionGroup';
import DealerRetention from './tabs/DealerRetention';
import AtRisk from './tabs/AtRisk';
import Explorer from './tabs/Explorer';
import AgreementTerm from './tabs/AgreementTerm';
import CustomerMatching from './tabs/CustomerMatching';
import UploadModal from './components/UploadModal';
import { Upload } from 'lucide-react';

const TABS = [
  { id: 'overview', label: 'NFR Overview' },
  { id: 'region', label: 'Region & Group' },
  { id: 'dealer', label: 'Dealer Retention' },
  { id: 'atrisk', label: 'At-Risk Pipeline' },
  { id: 'explorer', label: 'Data Explorer' },
  { id: 'agreement', label: 'Agreement & Term' },
  { id: 'matching', label: 'Customer Matching' },
];

const selStyle = {
  background: 'var(--white)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--navy)',
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  outline: 'none',
  minWidth: 150,
  fontFamily: 'var(--font)',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [window, setWindow] = useState('core');
  const [status, setStatus] = useState(null);
  const [showUpload, setShowUpload] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchAPI('/api/status');
      setStatus(s);
    } catch (e) {
      // DB may be empty
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const onUploadComplete = () => {
    setShowUpload(false);
    loadStatus();
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <Overview window={window} />;
      case 'region': return <RegionGroup window={window} />;
      case 'dealer': return <DealerRetention window={window} />;
      case 'atrisk': return <AtRisk />;
      case 'explorer': return <Explorer window={window} />;
      case 'agreement': return <AgreementTerm window={window} />;
      case 'matching': return <CustomerMatching />;
      default: return null;
    }
  };

  const tabStyle = (active) => ({
    padding: '8px 18px',
    borderRadius: '8px 8px 0 0',
    border: 'none',
    borderBottom: active ? '3px solid var(--navy)' : '3px solid transparent',
    background: active ? 'rgba(0,53,95,0.06)' : 'transparent',
    color: active ? 'var(--navy)' : 'var(--text-light)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    fontFamily: 'var(--font)',
    transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* White Header */}
      <div style={{
        background: 'var(--white)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,53,95,0.08)',
        borderBottom: '1px solid var(--border)'
      }}>
        {/* Top bar */}
        <div style={{ padding: '0 36px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <img src="/NORTHRIDGE-BRAND-IDENTITY-COLOUR.webp" alt="Northridge Finance" style={{ height: 28 }} />
            <div style={{ width: 1, height: 28, background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>NFR Retention Dashboard</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Customer Retention Intelligence</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Window</span>
              <select value={window} onChange={e => setWindow(e.target.value)} style={selStyle}>
                <option value="core">Core (−3/+1 mo)</option>
                <option value="6_1">−6/+1 months</option>
                <option value="3_3">−3/+3 months</option>
                <option value="3_6">−3/+6 months</option>
                <option value="3_12">−3/+12 months</option>
              </select>
            </div>
            {status && (
              <div style={{
                padding: '5px 14px',
                background: 'var(--green-bg)',
                border: '1px solid rgba(13,150,104,0.25)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--green)',
                fontWeight: 600
              }}>
                {status.total_contracts?.toLocaleString()} Contracts
              </div>
            )}
            <button
              onClick={() => setShowUpload(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                background: 'var(--navy)',
                border: 'none',
                borderRadius: 8,
                color: '#FFFFFF',
                fontFamily: 'var(--font)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Upload size={13} />
              Upload Data
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div style={{ padding: '0 36px', display: 'flex', gap: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={tabStyle(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ padding: '22px 36px 60px', maxWidth: 1480, margin: '0 auto' }}>
        {!status || status.total_contracts === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            background: 'var(--card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            boxShadow: '0 1px 3px rgba(0,53,95,0.05)'
          }}>
            <h2 style={{ color: 'var(--navy)', marginBottom: 8 }}>Welcome to NFR Retention Dashboard</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Upload your contract data to get started</p>
            <button
              onClick={() => setShowUpload(true)}
              style={{
                padding: '12px 32px',
                background: 'var(--navy)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontFamily: 'var(--font)',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Upload CSV or Excel File
            </button>
          </div>
        ) : renderTab()}
      </main>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onComplete={onUploadComplete} />}
    </div>
  );
}
