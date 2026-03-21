'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import type { ThemeState, ThemeAction, ThemeContextValue, ThemeMode } from '../types/theme';
import {
  getStoredTheme,
  setStoredTheme,
  clearStoredTheme,
  getSystemTheme,
  resolveTheme,
} from '../services/themeStorage';
import { generateCSSVariables } from '../styles/tokens';

// ── Reducer ──────────────────────────────────────────────────────────────────

function themeReducer(state: ThemeState, action: ThemeAction): ThemeState {
  switch (action.type) {
    case 'INIT': {
      const system = getSystemTheme();
      const resolved = action.mode ? resolveTheme(action.mode, system) : 'light';
      return { mode: action.mode ?? 'system', resolved };
    }
    case 'SET_MODE': {
      if (!action.mode) return state;
      const system = getSystemTheme();
      return { mode: action.mode, resolved: resolveTheme(action.mode, system) };
    }
    case 'TOGGLE': {
      const next: ThemeMode = state.resolved === 'dark' ? 'light' : 'dark';
      const system = getSystemTheme();
      return { mode: next, resolved: resolveTheme(next, system) };
    }
    case 'SET_RESOLVED':
      return { ...state, resolved: action.resolved ?? state.resolved };
    default:
      return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── CSS Variable Application ─────────────────────────────────────────────────

function applyThemeVars(isDark: boolean): void {
  const vars = generateCSSVariables(isDark);
  const root = document.documentElement;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({ children, defaultMode = 'system' }: ThemeProviderProps) {
  // Initialize from localStorage, fallback to default
  const storedMode = getStoredTheme() ?? defaultMode;
  const initialState: ThemeState = {
    mode: storedMode,
    resolved: resolveTheme(storedMode),
  };

  const [theme, dispatch] = useReducer(themeReducer, initialState);

  // Apply CSS vars whenever resolved theme changes
  useEffect(() => {
    applyThemeVars(theme.resolved === 'dark');
  }, [theme.resolved]);

  // Listen for system theme changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme.mode === 'system') {
        dispatch({ type: 'SET_RESOLVED', resolved: mq.matches ? 'dark' : 'light' });
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme.mode]);

  const toggleTheme = useCallback(() => {
    dispatch({ type: 'TOGGLE' });
  }, []);

  const setTheme = useCallback((mode: ThemeMode) => {
    dispatch({ type: 'SET_MODE', mode });
    setStoredTheme(mode);
  }, []);

  // Persist mode to localStorage on change (but not on TOGGLE, let it derive from resolved)
  useEffect(() => {
    setStoredTheme(theme.mode);
  }, [theme.mode]);

  const value: ThemeContextValue = { theme, toggleTheme, setTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within <ThemeProvider>');
  }
  return ctx;
}

// ── Re-export for convenience ─────────────────────────────────────────────────
export { clearStoredTheme };
