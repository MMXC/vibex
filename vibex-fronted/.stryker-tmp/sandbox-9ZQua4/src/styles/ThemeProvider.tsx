// @ts-nocheck
'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { generateCSSVariables } from './tokens';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  defaultMode = 'system',
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [isDark, setIsDark] = useState(false);

  // 检测系统主题
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      const dark = mode === 'dark' || (mode === 'system' && mediaQuery.matches);
      setIsDark(dark);

      // 应用 CSS 变量
      const vars = generateCSSVariables(dark);
      const root = document.documentElement;
      Object.entries(vars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });

      // 设置 data-theme 属性
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
    };

    updateTheme();

    // 监听系统主题变化
    const handler = () => updateTheme();
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  const handleSetMode = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const toggleTheme = () => {
    setMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{ mode, isDark, setMode: handleSetMode, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// 主题切换按钮组件
export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? '切换到亮色模式' : '切换到暗色模式'}
      style={{
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        fontSize: '20px',
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
