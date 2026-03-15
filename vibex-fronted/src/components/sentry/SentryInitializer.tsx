/**
 * Sentry Initialization for Client Components
 * 
 * This file initializes Sentry for client-side error tracking
 */

'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Initialize Sentry on client side
 */
export function SentryInitializer() {
  useEffect(() => {
    // Check if Sentry is enabled
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      console.log('[Sentry] Client initialized');
    }
  }, []);

  return null;
}

/**
 * Wrap component with Sentry error boundary
 */
export function withSentry<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function SentryWrappedComponent(props: P) {
    return (
      <Sentry.ErrorBoundary
        fallback={<ErrorFallback />}
      >
        <Component {...props} />
      </Sentry.ErrorBoundary>
    );
  };
}

/**
 * Error fallback UI
 */
function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div style={{
      padding: '20px',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '8px',
      margin: '20px',
    }}>
      <h2 style={{ color: '#c00', marginTop: 0 }}>
        ⚠️ 出现了一些问题
      </h2>
      <p style={{ color: '#666' }}>
        发生了意外错误，请刷新页面重试。
      </p>
      {process.env.NODE_ENV === 'development' && (
        <pre style={{
          background: '#f5f5f5',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '12px',
        }}>
          {error.message}
        </pre>
      )}
    </div>
  );
}

export default SentryInitializer;
