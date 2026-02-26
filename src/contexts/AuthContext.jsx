import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { postAPI, fetchAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('nfr_token'));
  const [loading, setLoading] = useState(true);

  // On mount, if we have a token, validate it
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetchAPI('/api/auth/me')
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        // Token invalid/expired
        localStorage.removeItem('nfr_token');
        setToken(null);
        setUser(null);
        setLoading(false);
      });
  }, [token]);

  // Listen for auth:expired events from api.js
  useEffect(() => {
    const handler = () => {
      localStorage.removeItem('nfr_token');
      setToken(null);
      setUser(null);
    };
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await postAPI('/api/auth/login', { username, password });
    localStorage.setItem('nfr_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nfr_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isAnalyst: user?.role === 'analyst',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
