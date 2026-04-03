// @ts-nocheck
'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme.resolved === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        padding: 0,
        border: 'none',
        borderRadius: '8px',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'background-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-bg-secondary, rgba(255,255,255,0.08))';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
