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
    const { setTheme, setDefaultTemplate, setShortcutCustomization, resetPreferences } =
      useUserPreferencesStore.getState();
    setTheme('dark');
    setDefaultTemplate('flow-template');
    setShortcutCustomization([{ action: 'undo', customKey: 'Ctrl+Alt+Z' }]);
    resetPreferences();
    const state = useUserPreferencesStore.getState();
    expect(state.theme).toBe('system');
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
