import React from 'react';
import { C } from './shared';

/**
 * Error boundary — catches render errors and shows a fallback UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px 24px',
          background: '#FEF2F2',
          borderRadius: 12,
          border: '1px solid #FECACA',
          margin: 20,
        }}>
          <h3 style={{ color: C.red, marginBottom: 8, fontSize: 16 }}>Something went wrong</h3>
          <p style={{ color: C.textMuted, fontSize: 13, marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 20px',
              background: C.navy,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontFamily: 'var(--font)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
