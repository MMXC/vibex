/**
 * UserPreferencesStore Tests
 * E011: Persisted user preferences using Zustand persist middleware with localStorage
 * S42-P002-E4: Extended with gridSpacing, gridVisible, cursorVisible tests
 */

import { useUserPreferencesStore } from '../userPreferencesStore';

describe('UserPreferencesStore', () => {
  beforeEach(() => {
    useUserPreferencesStore.getState().resetPreferences();
  });

  it('should have initial state', () => {
    const state = useUserPreferencesStore.getState();
    expect(state.theme).toBe('system');
    expect(state.locale).toBe('zh'); // P001-E2: default locale is zh
    expect(state.defaultTemplate).toBe('blank');
    expect(state.shortcutCustomization).toEqual([]);
    // S42-P002-E4: Canvas grid defaults
    expect(state.gridSpacing).toBe(16);
    expect(state.gridVisible).toBe(true);
    expect(state.cursorVisible).toBe(true);
  });

  it('should set theme', () => {
    const { setTheme } = useUserPreferencesStore.getState();
    setTheme('dark');
    expect(useUserPreferencesStore.getState().theme).toBe('dark');
    setTheme('light');
    expect(useUserPreferencesStore.getState().theme).toBe('light');
  });

  // P001-E2: locale persistence tests
  it('should set locale', () => {
    const { setLocale } = useUserPreferencesStore.getState();
    setLocale('en');
    expect(useUserPreferencesStore.getState().locale).toBe('en');
    setLocale('zh');
    expect(useUserPreferencesStore.getState().locale).toBe('zh');
  });

  it('should reset locale to default', () => {
    const { setLocale, resetPreferences } = useUserPreferencesStore.getState();
    setLocale('en');
    expect(useUserPreferencesStore.getState().locale).toBe('en');
    resetPreferences();
    expect(useUserPreferencesStore.getState().locale).toBe('zh');
  });

  it('should set defaultTemplate', () => {
    const { setDefaultTemplate } = useUserPreferencesStore.getState();
    setDefaultTemplate('flow-template');
    expect(useUserPreferencesStore.getState().defaultTemplate).toBe('flow-template');
  });

  it('should set shortcutCustomization', () => {
    const { setShortcutCustomization } = useUserPreferencesStore.getState();
    const shortcuts = [
      { action: 'undo', customKey: 'Ctrl+Alt+Z' },
      { action: 'newNode', customKey: 'Ctrl+Shift+N' },
    ];
    setShortcutCustomization(shortcuts);
    expect(useUserPreferencesStore.getState().shortcutCustomization).toEqual(shortcuts);
  });

  it('should reset preferences to defaults', () => {
    const { setTheme, setLocale, setDefaultTemplate, setShortcutCustomization, resetPreferences } =
      useUserPreferencesStore.getState();
    setTheme('dark');
    setLocale('en');
    setDefaultTemplate('flow-template');
    setShortcutCustomization([{ action: 'undo', customKey: 'Ctrl+Alt+Z' }]);
    resetPreferences();
    const state = useUserPreferencesStore.getState();
    expect(state.theme).toBe('system');
    expect(state.locale).toBe('zh');
    expect(state.defaultTemplate).toBe('blank');
    expect(state.shortcutCustomization).toEqual([]);
  });

  it('should reset aiScores on resetPreferences', () => {
    const { addAIScore, resetPreferences } = useUserPreferencesStore.getState();
    addAIScore({ readability: 4, complexity: 3, coverage: 5, linesAdded: 10, linesRemoved: 2 });
    expect(useUserPreferencesStore.getState().aiScores.length).toBeGreaterThan(0);
    resetPreferences();
    expect(useUserPreferencesStore.getState().aiScores).toEqual([]);
  });

  // S42-P002-E4: Canvas grid settings tests
  it('should set gridSpacing', () => {
    const { setGridSpacing } = useUserPreferencesStore.getState();
    setGridSpacing(8);
    expect(useUserPreferencesStore.getState().gridSpacing).toBe(8);
    setGridSpacing(32);
    expect(useUserPreferencesStore.getState().gridSpacing).toBe(32);
    setGridSpacing(16);
    expect(useUserPreferencesStore.getState().gridSpacing).toBe(16);
  });

  it('should set gridVisible', () => {
    const { setGridVisible } = useUserPreferencesStore.getState();
    setGridVisible(false);
    expect(useUserPreferencesStore.getState().gridVisible).toBe(false);
    setGridVisible(true);
    expect(useUserPreferencesStore.getState().gridVisible).toBe(true);
  });

  it('should set cursorVisible', () => {
    const { setCursorVisible } = useUserPreferencesStore.getState();
    setCursorVisible(false);
    expect(useUserPreferencesStore.getState().cursorVisible).toBe(false);
    setCursorVisible(true);
    expect(useUserPreferencesStore.getState().cursorVisible).toBe(true);
  });

  it('should reset E4 canvas settings on resetPreferences', () => {
    const { setGridSpacing, setGridVisible, setCursorVisible, resetPreferences } =
      useUserPreferencesStore.getState();
    setGridSpacing(8);
    setGridVisible(false);
    setCursorVisible(false);
    resetPreferences();
    const state = useUserPreferencesStore.getState();
    expect(state.gridSpacing).toBe(16);
    expect(state.gridVisible).toBe(true);
    expect(state.cursorVisible).toBe(true);
  });
});
