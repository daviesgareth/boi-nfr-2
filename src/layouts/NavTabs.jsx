import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield } from 'lucide-react';

const TABS = [
  { to: '/dashboard/overview', label: 'NFR Overview' },
  { to: '/dashboard/regions', label: 'Region & Group' },
  { to: '/dashboard/dealers', label: 'Dealer Retention' },
  { to: '/dashboard/at-risk', label: 'At-Risk Pipeline' },
  { to: '/dashboard/explorer', label: 'Data Explorer' },
  { to: '/dashboard/agreements', label: 'Agreement & Term' },
  { to: '/dashboard/matching', label: 'Customer Matching' },
];

const tabStyle = (isActive) => ({
  padding: '8px 18px',
  borderRadius: '8px 8px 0 0',
  border: 'none',
  borderBottom: isActive ? '3px solid var(--navy)' : '3px solid transparent',
  background: isActive ? 'rgba(0,53,95,0.06)' : 'transparent',
  color: isActive ? 'var(--navy)' : 'var(--text-light)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'var(--font)',
  transition: 'all 0.15s',
  textDecoration: 'none',
});

export default function NavTabs() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/dashboard/admin');

  return (
    <div style={{ padding: '0 36px', display: 'flex', gap: 2 }}>
      {TABS.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          style={({ isActive }) => tabStyle(isActive)}
        >
          {tab.label}
        </NavLink>
      ))}
      {isAdmin && (
        <NavLink
          to="/dashboard/admin"
          style={() => ({
            ...tabStyle(isAdminRoute),
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          })}
        >
          <Shield size={12} />
          Admin
        </NavLink>
      )}
    </div>
  );
}
