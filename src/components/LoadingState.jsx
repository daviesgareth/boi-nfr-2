import React from 'react';
import { C } from './shared';

/**
 * Centered loading indicator.
 * Props:
 *  - message: string (default: 'Loading...')
 */
export default function LoadingState({ message = 'Loading...' }) {
  return (
    <p style={{ textAlign: 'center', padding: 40, color: C.textMuted, fontSize: 14 }}>
      {message}
    </p>
  );
}
