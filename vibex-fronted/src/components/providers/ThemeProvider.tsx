'use client';

/**
 * ThemeProvider
 * E014: React Context that reads userPreferencesStore theme and applies CSS classes to document root
 * E015: Extended to support 4 themes (light, dark, enterprise-a, enterprise-b)
 */

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

// Extended theme type supporting enterprise themes
export type ThemeMode = 'light' | 'dark' | 'enterprise-a' | 'enterprise-b' | 'system';

interface ThemeContextValue {
  resolvedTheme: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>({ resolvedTheme: 'dark' });

export function useThemeContext() {
  return useContext(ThemeContext);
}

interface ThemeProviderProps {
  children: ReactNode;
}

// All theme CSS classes that need to be toggled
const THEME_CLASSES = ['theme-light', 'theme-dark', 'theme-enterprise-a', 'theme-enterprise-b'];

export function ThemeProvider({ children }: ThemeProviderProps) {
  const theme = useUserPreferencesStore((s) => s.theme) as ThemeMode;

  const getResolvedTheme = (t: ThemeMode): ThemeMode => {
    if (t === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark';
    }
    return t;
  };

  const applyTheme = (resolved: ThemeMode) => {
    const root = document.documentElement;
    // Remove all theme classes
    THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    // Apply resolved theme class
    root.classList.add(`theme-${resolved}`);
    root.setAttribute('data-theme', resolved);
    root.style.colorScheme = resolved === 'enterprise-a' || resolved === 'enterprise-b' ? 'light' : resolved;
  };

  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    applyTheme(resolved);
  }, [theme]);

  // Listen for system theme changes when using 'system' preference
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const resolved = mediaQuery.matches ? 'dark' : 'light';
      applyTheme(resolved);
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
