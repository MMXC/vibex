'use client';

/**
 * Settings Page
 * E012: Settings page with theme selector (light/dark/system)
 * E013: Extended with defaultTemplate selector and shortcut customization display
 * E016: Extended theme selector with 5 options (light, dark, system, enterprise-a, enterprise-b)
 * P003-E3: Extended with AI Scores panel showing score history
 */

import { useState } from 'react';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';
import type { ThemePreference, LocalePreference } from '@/stores/userPreferencesStore';
import { useShortcutStore } from '@/stores/shortcutStore';
import { NotificationPreferencesSection } from './NotificationPreferencesSection';
import { UsageAnalyticsSection } from './analytics/UsageAnalyticsSection';
import styles from './settings.module.css';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
  { value: 'enterprise-a', label: 'Enterprise A' },
  { value: 'enterprise-b', label: 'Enterprise B' },
];

// P001-E2: Language options for locale switcher
const LOCALE_OPTIONS: { value: LocalePreference; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
];

const TEMPLATE_OPTIONS = [
  { value: 'blank', label: 'Blank' },
  { value: 'flow-template', label: 'Flow Template' },
  { value: 'ddd-template', label: 'DDD Template' },
  { value: 'api-template', label: 'API Template' },
];

export default function SettingsPage() {
  const {
    theme,
    locale,
    defaultTemplate,
    setTheme,
    setLocale,
    setDefaultTemplate,
    aiScores,
    removeAIScore,
    clearAIScores,
    gridSpacing,
    gridVisible,
    cursorVisible,
    setGridSpacing,
    setGridVisible,
    setCursorVisible,
  } = useUserPreferencesStore();
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const [scoresExpanded, setScoresExpanded] = useState(false);

  const GRID_SPACING_OPTIONS = [
    { value: 8 as const, label: '8px — Dense' },
    { value: 16 as const, label: '16px — Normal' },
    { value: 32 as const, label: '32px — Spacious' },
  ];

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

          {/* P001-E2: Language switcher dropdown */}
          <div className={styles.field}>
            <label className={styles.label} htmlFor="locale-select">
              Language
            </label>
            <select
              id="locale-select"
              className={styles.select}
              value={locale}
              onChange={(e) => setLocale(e.target.value as LocalePreference)}
            >
              {LOCALE_OPTIONS.map((opt) => (
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
                <div key={shortcut.action} className={styles.shortcutRow}>
                  <span className={styles.shortcutAction}>{shortcut.description}</span>
                  <kbd className={styles.shortcutKeys}>{shortcut.currentKey}</kbd>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>No custom shortcuts configured</p>
            )}
          </div>
        </section>

        {/* S42-P002-E4: Canvas Grid Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Canvas Grid</h2>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="grid-spacing-select">
              Grid Spacing
            </label>
            <select
              id="grid-spacing-select"
              className={styles.select}
              value={gridSpacing}
              onChange={(e) => setGridSpacing(Number(e.target.value) as 8 | 16 | 32)}
            >
              {GRID_SPACING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={gridVisible}
                onChange={(e) => setGridVisible(e.target.checked)}
                data-testid="grid-visible-toggle"
              />
              <span>Show Grid</span>
            </label>
          </div>
        </section>

        {/* S42-P002-E4: Collaboration Settings */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Collaboration</h2>
          <div className={styles.field}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                className={styles.toggleInput}
                checked={cursorVisible}
                onChange={(e) => setCursorVisible(e.target.checked)}
                data-testid="cursor-visible-toggle"
              />
              <span>Show Remote Cursors</span>
            </label>
            <p className={styles.sectionHint}>
              Control whether other users' cursors are displayed on the canvas
            </p>
          </div>
        </section>

        {/* S87-E1: Notification Preferences Section */}

        {/* S89-E1: Usage Analytics Section */}
        <UsageAnalyticsSection />
        <NotificationPreferencesSection />

        {/* P003-E3: AI Scores panel */}
        <section className={styles.section}>
          <button
            type="button"
            className={styles.aiScoresToggle}
            onClick={() => setScoresExpanded((v) => !v)}
            aria-expanded={scoresExpanded}
            data-testid="ai-scores-toggle"
          >
            <h2 className={styles.sectionTitle}>AI Scores</h2>
            <span className={styles.aiScoresCount}>
              {aiScores.length > 0 ? `${aiScores.length} 条记录` : '无记录'}
            </span>
            <span className={styles.chevron}>{scoresExpanded ? '▲' : '▼'}</span>
          </button>

          {scoresExpanded && (
            <div className={styles.aiScoresPanel} data-testid="ai-scores-panel">
              {aiScores.length === 0 ? (
                <p className={styles.emptyState}>暂无 AI 评分记录</p>
              ) : (
                <>
                  <div className={styles.aiScoresList}>
                    {aiScores.slice(0, 20).map((score, idx) => (
                      <div key={score.timestamp} className={styles.aiScoreRow}>
                        <div className={styles.aiScoreMeta}>
                          <span className={styles.aiScoreTime}>
                            {new Date(score.timestamp).toLocaleString()}
                          </span>
                          <span className={styles.aiScoreLines}>
                            +{score.linesAdded} -{score.linesRemoved}
                          </span>
                        </div>
                        <div className={styles.aiScoreStars}>
                          <span title="可读性">📖 {score.readability}</span>
                          <span title="复杂度">🔢 {score.complexity}</span>
                          <span title="覆盖率">📊 {score.coverage}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.aiScoreDelete}
                          onClick={() => removeAIScore(idx)}
                          aria-label="删除评分"
                          data-testid={`remove-score-${idx}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  {aiScores.length > 0 && (
                    <button
                      type="button"
                      className={styles.clearScoresBtn}
                      onClick={clearAIScores}
                      data-testid="clear-scores-btn"
                    >
                      清空全部评分记录
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
