import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import UploadModal from '../components/UploadModal';
import { Upload, Filter, ChevronDown, LogOut } from 'lucide-react';

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

export default function Header() {
  const { user, isAdmin, logout } = useAuth();
  const { window, setWindow, exclusions, toggleExclusion, clearExclusions } = useFilters();
  const [status, setStatus] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showExclDropdown, setShowExclDropdown] = useState(false);
  const dropRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      const s = await fetchAPI('/api/status');
      setStatus(s);
    } catch (e) { /* DB may be empty */ }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

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

  const exclCount = exclusions.length;

  return (
    <>
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
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${exclCount > 0 ? 'var(--red)' : 'var(--border)'}`,
                background: exclCount > 0 ? 'var(--red-bg)' : 'var(--white)',
                color: exclCount > 0 ? 'var(--red)' : 'var(--text-light)',
                cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)', transition: 'all 0.12s',
              }}
            >
              <Filter size={13} />
              Exclusions{exclCount > 0 ? ` (${exclCount})` : ''}
              <ChevronDown size={13} style={{ transform: showExclDropdown ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>

            {showExclDropdown && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,53,95,0.12)', width: 260, padding: '8px 0', zIndex: 200,
              }}>
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
                      textTransform: 'uppercase', letterSpacing: '0.05em', padding: '10px 14px 4px',
                    }}>{group.label}</div>
                    {group.items.map(item => {
                      const active = exclusions.includes(item.key);
                      return (
                        <button
                          key={item.key}
                          onClick={() => toggleExclusion(item.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px',
                            background: active ? 'var(--red-bg)' : 'transparent', border: 'none', cursor: 'pointer',
                            fontFamily: 'var(--font)', fontSize: 12, color: active ? 'var(--red)' : 'var(--navy)',
                            fontWeight: active ? 600 : 500, textAlign: 'left', transition: 'background 0.1s',
                          }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg)'; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <div style={{
                            width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                            border: `2px solid ${active ? 'var(--red)' : 'var(--border)'}`,
                            background: active ? 'var(--red)' : 'var(--white)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.1s',
                          }}>
                            {active && <span style={{ color: 'white', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{'\u2713'}</span>}
                          </div>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ))}

                <div style={{ padding: '8px 14px 4px', borderTop: '1px solid var(--border)', marginTop: 4 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    Checked items are removed from all NFR calculations across every tab.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active exclusion pills */}
          {exclCount > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 300 }}>
              {exclusions.slice(0, 3).map(key => {
                const def = EXCLUSION_GROUPS.flatMap(g => g.items).find(i => i.key === key);
                return (
                  <span key={key} onClick={() => toggleExclusion(key)} style={{
                    padding: '3px 8px', borderRadius: 5, background: 'var(--red-bg)',
                    color: 'var(--red)', fontSize: 10, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                    {'\u00d7'} {def?.label?.split(' ')[0] || key}
                  </span>
                );
              })}
              {exclCount > 3 && (
                <span style={{ padding: '3px 8px', borderRadius: 5, background: 'var(--red-bg)', color: 'var(--red)', fontSize: 10, fontWeight: 600 }}>+{exclCount - 3}</span>
              )}
            </div>
          )}

          {status && (
            <div style={{
              padding: '5px 14px', background: 'var(--green-bg)',
              border: '1px solid rgba(13,150,104,0.25)', borderRadius: 8,
              fontSize: 11, color: 'var(--green)', fontWeight: 600,
            }}>
              {status.total_contracts?.toLocaleString()} Contracts
            </div>
          )}
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                background: 'var(--navy)', border: 'none', borderRadius: 8,
                color: '#FFFFFF', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Upload size={13} />
              Upload Data
            </button>
          )}

          {/* User info + logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{user.username}</span>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                  background: 'transparent', border: `1px solid var(--border)`, borderRadius: 6,
                  color: 'var(--text-light)', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font)',
                }}
              >
                <LogOut size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onComplete={onUploadComplete} />}
    </>
  );
}
