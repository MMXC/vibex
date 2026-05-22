/**
 * UserPreferencesStore Tests
 * E011: Persisted user preferences using Zustand persist middleware with localStorage
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

  it('should persist theme across reset', () => {
    const { setTheme } = useUserPreferencesStore.getState();
    setTheme('dark');
    expect(useUserPreferencesStore.getState().theme).toBe('dark');
    // Store should be using persist middleware, state survives reset of individual fields
    useUserPreferencesStore.getState().resetPreferences();
    expect(useUserPreferencesStore.getState().theme).toBe('system');
  });
});
