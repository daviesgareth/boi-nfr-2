import React from 'react';
import { Outlet } from 'react-router-dom';
import { useFilters } from '../contexts/FilterContext';
import Header from './Header';
import NavTabs from './NavTabs';

export default function DashboardLayout() {
  const { window, excludeParam } = useFilters();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{
        background: 'var(--white)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,53,95,0.08)',
        borderBottom: '1px solid var(--border)',
      }}>
        <Header />
        <NavTabs />
      </div>

      <main style={{ padding: '22px 36px 60px', maxWidth: 1480, margin: '0 auto' }}>
        <Outlet context={{ window, excludeParam }} />
      </main>
    </div>
  );
}
