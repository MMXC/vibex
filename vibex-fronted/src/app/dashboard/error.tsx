'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error for telemetry
    console.error('[Dashboard Error]', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '16px',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div style={{ fontSize: '48px' }}>⚠️</div>
      <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Something went wrong</h2>
      <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
        {error.digest && (
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            Error ID: {error.digest}
          </span>
        )}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          background: 'var(--color-primary)',
          color: 'var(--color-text-inverse)',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    </div>
  );
}
