'use client';

/**
 * Settings Page
 * E012: Settings page with theme selector (light/dark/system)
 * E013: Extended with defaultTemplate selector and shortcut customization display
 */

import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import type { ThemePreference } from '@/stores/userPreferencesStore';
import { useShortcutStore } from '@/stores/shortcutStore';
import styles from './settings.module.css';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const TEMPLATE_OPTIONS = [
  { value: 'blank', label: 'Blank' },
  { value: 'flow-template', label: 'Flow Template' },
  { value: 'ddd-template', label: 'DDD Template' },
  { value: 'api-template', label: 'API Template' },
];

export default function SettingsPage() {
  const { theme, defaultTemplate, setTheme, setDefaultTemplate } = useUserPreferencesStore();
  const shortcuts = useShortcutStore((s) => s.shortcuts);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Appearance</h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="theme-select">
              Theme
            </label>
            <select
              id="theme-select"
              className={styles.select}
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemePreference)}
            >
              {THEME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Defaults</h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="template-select">
              Default Template
            </label>
            <select
              id="template-select"
              className={styles.select}
              value={defaultTemplate}
              onChange={(e) => setDefaultTemplate(e.target.value)}
            >
              {TEMPLATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Keyboard Shortcuts</h2>
          <p className={styles.sectionHint}>
            Current shortcut customization overrides (read-only)
          </p>
          <div className={styles.shortcutsList}>
            {shortcuts.length > 0 ? (
              shortcuts.slice(0, 15).map((shortcut) => (
                <div key={shortcut.id} className={styles.shortcutRow}>
                  <span className={styles.shortcutAction}>{shortcut.description}</span>
                  <kbd className={styles.shortcutKeys}>{shortcut.keyboardShortcut}</kbd>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>No custom shortcuts configured</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
