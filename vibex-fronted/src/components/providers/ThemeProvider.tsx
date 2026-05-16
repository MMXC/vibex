'use client';

/**
 * ThemeProvider
 * E014: React Context that reads userPreferencesStore theme and applies CSS classes to document root
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import type { ThemePreference } from '@/stores/userPreferencesStore';

interface ThemeContextValue {
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue>({ resolvedTheme: 'dark' });

export function useThemeContext() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUserPreferencesStore((s) => s.theme);

  const getResolvedTheme = (t: ThemePreference): 'light' | 'dark' => {
    if (t === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return t;
  };

  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('theme-light', 'theme-dark', 'theme-enterprise-a', 'theme-enterprise-b');

    // Apply resolved theme class
    root.classList.add(`theme-${resolved}`);
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved;

    // Apply dark theme CSS variables if needed
    if (resolved === 'dark') {
      root.classList.add('theme-dark');
    }
  }, [theme]);

  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      const root = document.documentElement;
      root.classList.remove('theme-light', 'theme-dark', 'theme-enterprise-a', 'theme-enterprise-b');
      root.classList.add(`theme-${resolved}`);
      root.setAttribute('data-theme', resolved);
      root.style.colorScheme = resolved;
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const resolvedTheme = getResolvedTheme(theme);

  return (
    <ThemeContext.Provider value={{ resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
