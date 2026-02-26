import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FilterProvider } from './contexts/FilterContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoadingState from './components/LoadingState';
import LoginPage from './pages/LoginPage';

// Lazy-load views for code splitting
const Overview = lazy(() => import('./tabs/Overview'));
const RegionGroup = lazy(() => import('./tabs/RegionGroup'));
const DealerRetention = lazy(() => import('./tabs/DealerRetention'));
const AtRisk = lazy(() => import('./tabs/AtRisk'));
const Explorer = lazy(() => import('./tabs/Explorer'));
const AgreementTerm = lazy(() => import('./tabs/AgreementTerm'));
const CustomerMatching = lazy(() => import('./tabs/CustomerMatching'));
const UserManagement = lazy(() => import('./pages/UserManagement'));

const SuspenseWrap = ({ children }) => (
  <Suspense fallback={<LoadingState />}>{children}</Suspense>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FilterProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/overview" replace />} />
            <Route path="overview" element={<SuspenseWrap><Overview /></SuspenseWrap>} />
            <Route path="regions" element={<SuspenseWrap><RegionGroup /></SuspenseWrap>} />
            <Route path="dealers" element={<SuspenseWrap><DealerRetention /></SuspenseWrap>} />
            <Route path="at-risk" element={<SuspenseWrap><AtRisk /></SuspenseWrap>} />
            <Route path="explorer" element={<SuspenseWrap><Explorer /></SuspenseWrap>} />
            <Route path="agreements" element={<SuspenseWrap><AgreementTerm /></SuspenseWrap>} />
            <Route path="matching" element={<SuspenseWrap><CustomerMatching /></SuspenseWrap>} />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute roles={['admin']}>
                  <SuspenseWrap><UserManagement /></SuspenseWrap>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </FilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
