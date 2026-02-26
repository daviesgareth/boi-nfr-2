import React, { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAPI, putAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';
import { PasswordChecklist } from '../components/shared';
import { Filter, ChevronDown, LogOut, User, Key, Check, AlertTriangle } from 'lucide-react';

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

const inputStyle = {
  width: '100%', padding: '7px 10px', borderRadius: 6,
  border: '1px solid var(--border)', fontSize: 12,
  fontFamily: 'var(--font)', color: 'var(--navy)', outline: 'none',
  boxSizing: 'border-box',
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
  const { user, logout } = useAuth();
  const { window, setWindow, timeframe, setTimeframe, exclusions, toggleExclusion, clearExclusions } = useFilters();
  const [status, setStatus] = useState(null);
  const [showExclDropdown, setShowExclDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const dropRef = useRef(null);
  const userMenuRef = useRef(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
        setShowPasswordForm(false);
        setPwError('');
        setPwSuccess(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (!pwForm.current || !pwForm.new) {
      setPwError('All fields are required');
      return;
    }
    if (pwForm.new.length < 8) {
      setPwError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(pwForm.new) || !/[a-z]/.test(pwForm.new) || !/[0-9]/.test(pwForm.new)) {
      setPwError('Password needs uppercase, lowercase, and a number');
      return;
    }
    if (pwForm.new !== pwForm.confirm) {
      setPwError('New passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await putAPI('/api/auth/password', {
        currentPassword: pwForm.current,
        newPassword: pwForm.new,
      });
      setPwSuccess(true);
      setPwForm({ current: '', new: '', confirm: '' });
      setTimeout(() => {
        setShowPasswordForm(false);
        setShowUserMenu(false);
        setPwSuccess(false);
      }, 1500);
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const exclCount = exclusions.length;

  const roleBadge = (role) => {
    const colors = {
      admin: { bg: '#FEF2F2', color: '#DC2626' },
      analyst: { bg: '#DBEAFE', color: '#1E40AF' },
      viewer: { bg: '#F4F6F9', color: '#3D5A7C' },
    };
    const c = colors[role] || colors.viewer;
    return (
      <span style={{
        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700,
        background: c.bg, color: c.color, textTransform: 'uppercase',
      }}>{role}</span>
    );
  };

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
          {/* Timeframe selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Period</span>
            <select value={timeframe} onChange={e => setTimeframe(e.target.value)} style={selStyle}>
              <option value="rolling13">Rolling 13 months</option>
              <option value="thisYear">{new Date().getFullYear()}</option>
              <option value="lastYear">{new Date().getFullYear() - 1}</option>
              <option value="all">All time</option>
            </select>
          </div>

          {/* Window selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Window</span>
            <select value={window} onChange={e => setWindow(e.target.value)} style={selStyle}>
              <option value="core">{'\u2212'}3/+1 months</option>
              <option value="6_1">{'\u2212'}6/+1 months</option>
              <option value="3_6">{'\u2212'}3/+6 months</option>
              <option value="3_9">{'\u2212'}3/+9 months</option>
              <option value="3_12">{'\u2212'}3/+12 months</option>
              <option value="3_18">{'\u2212'}3/+18 months</option>
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

          {/* User menu dropdown */}
          {user && (
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setShowUserMenu(v => !v); setShowPasswordForm(false); setPwError(''); setPwSuccess(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                  background: showUserMenu ? 'rgba(0,53,95,0.06)' : 'transparent',
                  border: '1px solid var(--border)', borderRadius: 6,
                  color: 'var(--navy)', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font)',
                }}
              >
                <User size={13} />
                {user.username}
                <ChevronDown size={11} style={{ color: 'var(--text-muted)', transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {showUserMenu && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 6,
                  background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(0,53,95,0.12)', width: 260, zIndex: 200,
                  overflow: 'hidden',
                }}>
                  {/* User info header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{user.username}</span>
                      {roleBadge(user.role)}
                    </div>
                    {user.email && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
                    )}
                  </div>

                  {/* Password change section */}
                  {!showPasswordForm ? (
                    <button
                      onClick={() => { setShowPasswordForm(true); setPwError(''); setPwSuccess(false); setPwForm({ current: '', new: '', confirm: '' }); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font)', fontSize: 12, color: 'var(--navy)', fontWeight: 500, textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Key size={13} color="var(--text-light)" />
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handlePasswordChange} style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy)', marginBottom: 10 }}>Change Password</div>

                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Current Password</label>
                        <input
                          type="password"
                          value={pwForm.current}
                          onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                          style={{ ...inputStyle, marginTop: 3 }}
                          autoFocus
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>New Password</label>
                        <input
                          type="password"
                          value={pwForm.new}
                          onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))}
                          style={{ ...inputStyle, marginTop: 3 }}
                        />
                        <PasswordChecklist value={pwForm.new} compact />
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confirm New Password</label>
                        <input
                          type="password"
                          value={pwForm.confirm}
                          onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                          style={{ ...inputStyle, marginTop: 3 }}
                        />
                      </div>

                      {pwError && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--red)', marginBottom: 8 }}>
                          <AlertTriangle size={12} /> {pwError}
                        </div>
                      )}
                      {pwSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--green)', marginBottom: 8 }}>
                          <Check size={12} /> Password changed successfully
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="submit"
                          disabled={pwLoading}
                          style={{
                            flex: 1, padding: '7px 0', borderRadius: 6, border: 'none',
                            background: 'var(--navy)', color: 'var(--white)',
                            fontSize: 12, fontWeight: 600, cursor: pwLoading ? 'wait' : 'pointer',
                            fontFamily: 'var(--font)', opacity: pwLoading ? 0.6 : 1,
                          }}
                        >
                          {pwLoading ? 'Saving...' : 'Update'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPasswordForm(false)}
                          style={{
                            padding: '7px 12px', borderRadius: 6,
                            border: '1px solid var(--border)', background: 'var(--white)',
                            color: 'var(--text-light)', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'var(--font)',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Logout */}
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={logout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 16px',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font)', fontSize: 12, color: 'var(--red)', fontWeight: 500, textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--red-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <LogOut size={13} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

    </>
  );
}
