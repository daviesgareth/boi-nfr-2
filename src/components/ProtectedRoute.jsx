import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingState from './LoadingState';

/**
 * Route guard — redirects to /login if unauthenticated.
 * Optional `roles` prop restricts to specific roles.
 *
 * Props:
 *  - children: ReactNode
 *  - roles: string[] — optional allowed roles (e.g. ['admin'])
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingState message="Checking authentication..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
