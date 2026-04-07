// @ts-nocheck
// Theme Persistence Service
// Epic 2: localStorage persistence for theme preferences
import type { ThemeMode } from '../types/theme';

const STORAGE_KEY = 'vibex-theme';

interface StoredTheme {
  mode: ThemeMode;
  timestamp: number;
}

/**
 * Get theme from localStorage
 * Returns null if no stored preference
 */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredTheme = JSON.parse(raw);
    return parsed.mode ?? null;
  } catch {
    return null;
  }
}

/**
 * Store theme in localStorage
 */
export function setStoredTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    const value: StoredTheme = { mode, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage may be full or disabled
  }
}

/**
 * Clear stored theme
 */
export function clearStoredTheme(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Get system theme preference
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme mode to actual color scheme
 */
export function resolveTheme(mode: ThemeMode, systemTheme: 'light' | 'dark' = 'light'): 'light' | 'dark' {
  if (mode === 'system') return systemTheme;
  return mode;
}
