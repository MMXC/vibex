// useSystemTheme hook
// Detects OS-level color scheme preference via window.matchMedia
'use client';

import { useState, useEffect } from 'react';
import { getSystemTheme } from '../services/themeStorage';

/**
 * Reactive hook that tracks system theme changes.
 * Returns 'light' | 'dark' based on OS prefers-color-scheme.
 * Works in SSR (returns 'light' on server).
 */
export function useSystemTheme(): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initialize immediately (no flash)
    setSystemTheme(getSystemTheme());

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return systemTheme;
}
