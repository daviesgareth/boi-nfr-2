import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { C } from '../components/shared';
import { Database, Users, Shield } from 'lucide-react';

const SUB_TABS = [
  { to: '/dashboard/admin/data', label: 'Data Management', icon: Database },
  { to: '/dashboard/admin/users', label: 'Users', icon: Users },
];

const subTabStyle = (isActive) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 16px',
  borderRadius: 8,
  border: `1px solid ${isActive ? C.navy : C.border}`,
  background: isActive ? `${C.navy}0A` : C.white,
  color: isActive ? C.navy : C.textLight,
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'var(--font)',
  textDecoration: 'none',
  transition: 'all 0.12s',
});

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Admin header bar with sub-navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: C.white, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '12px 20px', boxShadow: '0 1px 3px rgba(0,53,95,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Shield size={16} color={C.navy} />
          <span style={{ fontSize: 14, fontWeight: 700, color: C.navy }}>Administration</span>
          <span style={{
            padding: '2px 8px', borderRadius: 4,
            background: `${C.red}12`, color: C.red,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            Admin Only
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {SUB_TABS.map(tab => (
            <NavLink key={tab.to} to={tab.to} style={({ isActive }) => subTabStyle(isActive)}>
              <tab.icon size={13} />
              {tab.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Render the active admin sub-page */}
      <Outlet />
    </div>
  );
}
