'use client';

/**
 * Settings Page
 * E012: Settings page with theme selector (light/dark/system)
 */

import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import type { ThemePreference } from '@/stores/userPreferencesStore';
import styles from './settings.module.css';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUserPreferencesStore();

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
      </div>
    </div>
  );
}
