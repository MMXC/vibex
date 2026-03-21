// Theme Types for VibeX
// Epic 1: ThemeContext implementation

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeState {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
}

export interface ThemeContextValue {
  theme: ThemeState;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

export interface ThemeAction {
  type: 'INIT' | 'SET_MODE' | 'TOGGLE' | 'SET_RESOLVED';
  mode?: ThemeMode;
  resolved?: 'light' | 'dark';
}

export interface ThemeMergeStrategy {
  priority: readonly ('localStorage' | 'API' | 'system' | 'default')[];
  default: ThemeMode;
}
