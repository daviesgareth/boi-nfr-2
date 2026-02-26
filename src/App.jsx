import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI } from './api';
import Overview from './tabs/Overview';
import RegionGroup from './tabs/RegionGroup';
import DealerRetention from './tabs/DealerRetention';
import AtRisk from './tabs/AtRisk';
import Explorer from './tabs/Explorer';
import AgreementTerm from './tabs/AgreementTerm';
import CustomerMatching from './tabs/CustomerMatching';
import UploadModal from './components/UploadModal';
import { Upload, Filter, ChevronDown } from 'lucide-react';

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

const EXCLUSION_GROUPS = [
  {
    label: 'Population Filters',
    items: [
      { key: 'over75', label: 'Over 75 at end of term' },
      { key: 'arrears', label: 'In Arrears' },
      { key: 'deceased', label: 'Deceased' },
      { key: 'optout', label: 'Marketing Opt-out' },
    ],
  },
  {
    label: 'Customer Type',
    items: [
      { key: 'consumer', label: 'Consumer (Personal)' },
      { key: 'company', label: 'Company' },
      { key: 'soletrader', label: 'Sole Trader' },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [window, setWindow] = useState('core');
  const [status, setStatus] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [exclusions, setExclusions] = useState([]);
  const [showExclDropdown, setShowExclDropdown] = useState(false);
  const dropRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchAPI('/api/status');
      setStatus(s);
    } catch (e) {
      // DB may be empty
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowExclDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const onUploadComplete = () => {
    setShowUpload(false);
    loadStatus();
  };

  const toggleExclusion = (key) => {
    setExclusions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const clearExclusions = () => setExclusions([]);

  const excludeParam = exclusions.length > 0 ? `&exclude=${exclusions.join(',')}` : '';

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <Overview window={window} excludeParam={excludeParam} />;
      case 'region': return <RegionGroup window={window} excludeParam={excludeParam} />;
      case 'dealer': return <DealerRetention window={window} excludeParam={excludeParam} />;
      case 'atrisk': return <AtRisk excludeParam={excludeParam} />;
      case 'explorer': return <Explorer window={window} excludeParam={excludeParam} />;
      case 'agreement': return <AgreementTerm window={window} excludeParam={excludeParam} />;
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

  const exclCount = exclusions.length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Window selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Window</span>
              <select value={window} onChange={e => setWindow(e.target.value)} style={selStyle}>
                <option value="core">Core ({'\u2212'}3/+1 mo)</option>
                <option value="6_1">{'\u2212'}6/+1 months</option>
                <option value="3_3">{'\u2212'}3/+3 months</option>
                <option value="3_6">{'\u2212'}3/+6 months</option>
                <option value="3_12">{'\u2212'}3/+12 months</option>
                <option value="9mo">{'\u2212'}9/+1 months</option>
                <option value="r13mo">{'\u2212'}13/+1 months (rolling)</option>
              </select>
            </div>

            {/* Exclusion dropdown */}
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowExclDropdown(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: `1px solid ${exclCount > 0 ? 'var(--red)' : 'var(--border)'}`,
                  background: exclCount > 0 ? 'var(--red-bg)' : 'var(--white)',
                  color: exclCount > 0 ? 'var(--red)' : 'var(--text-light)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'var(--font)',
                  transition: 'all 0.12s',
                }}
              >
                <Filter size={13} />
                Exclusions{exclCount > 0 ? ` (${exclCount})` : ''}
                <ChevronDown size={13} style={{ transform: showExclDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {showExclDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 6,
                  background: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,53,95,0.12)',
                  width: 260,
                  padding: '8px 0',
                  zIndex: 200,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 14px 10px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)' }}>Exclude from NFR</span>
                    {exclCount > 0 && (
                      <button onClick={clearExclusions} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, color: 'var(--red)', fontWeight: 600, fontFamily: 'var(--font)',
                      }}>Clear all</button>
                    )}
                  </div>

                  {EXCLUSION_GROUPS.map((group, gi) => (
                    <div key={gi}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--text-light)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        padding: '10px 14px 4px',
                      }}>{group.label}</div>
                      {group.items.map(item => {
                        const active = exclusions.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            onClick={() => toggleExclusion(item.key)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 10,
                              width: '100%',
                              padding: '8px 14px',
                              background: active ? 'var(--red-bg)' : 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'var(--font)',
                              fontSize: 12,
                              color: active ? 'var(--red)' : 'var(--navy)',
                              fontWeight: active ? 600 : 500,
                              textAlign: 'left',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)'; }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                          >
                            {/* Checkbox indicator */}
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                              border: `2px solid ${active ? 'var(--red)' : 'var(--border)'}`,
                              background: active ? 'var(--red)' : 'var(--white)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.1s',
                            }}>
                              {active && <span style={{ color: 'white', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{'\u2713'}</span>}
                            </div>
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}

                  {/* Footer hint */}
                  <div style={{ padding: '8px 14px 4px', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                      Checked items are removed from all NFR calculations across every tab.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active exclusion pills (compact summary) */}
            {exclCount > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 300 }}>
                {exclusions.slice(0, 3).map(key => {
                  const def = EXCLUSION_GROUPS.flatMap(g => g.items).find(i => i.key === key);
                  return (
                    <span key={key} onClick={() => toggleExclusion(key)} style={{
                      padding: '3px 8px',
                      borderRadius: 5,
                      background: 'var(--red-bg)',
                      color: 'var(--red)',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}>
                      {'\u00d7'} {def?.label?.split(' ')[0] || key}
                    </span>
                  );
                })}
                {exclCount > 3 && (
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 5,
                    background: 'var(--red-bg)',
                    color: 'var(--red)',
                    fontSize: 10,
                    fontWeight: 600,
                  }}>+{exclCount - 3}</span>
                )}
              </div>
            )}

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
