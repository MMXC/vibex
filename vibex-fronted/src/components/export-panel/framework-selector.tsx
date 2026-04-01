/**
 * FrameworkSelector — Framework switcher for multi-framework export
 * E4-T2: Export Panel Framework Switch
 */

import React from 'react';
import styles from './framework-selector.module.css';

export type Framework = 'react' | 'vue' | 'svelte';

interface FrameworkSelectorProps {
  /** Currently selected framework */
  value: Framework;
  /** Callback when framework changes */
  onChange: (framework: Framework) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

const FRAMEWORKS: { id: Framework; label: string; icon: string; description: string }[] = [
  { id: 'react', label: 'React', icon: '⚛️', description: 'Modern React framework' },
  { id: 'vue', label: 'Vue 3', icon: '💚', description: 'Progressive JS framework' },
  { id: 'svelte', label: 'Svelte', icon: '🔥', description: 'Compiled reactive UI framework' },
];

export function FrameworkSelector({
  value,
  onChange,
  disabled = false,
}: FrameworkSelectorProps) {
  return (
    <div className={styles.selector} role="group" aria-label="Framework selector">
      {FRAMEWORKS.map((fw) => (
        <button
          key={fw.id}
          type="button"
          className={`${styles.option} ${value === fw.id ? styles.active : ''}`}
          onClick={() => onChange(fw.id)}
          disabled={disabled}
          aria-pressed={value === fw.id}
          title={fw.description}
        >
          <span className={styles.icon} aria-hidden="true">
            {fw.icon}
          </span>
          <span className={styles.label}>{fw.label}</span>
          {value === fw.id && (
            <span className={styles.checkmark} aria-hidden="true">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
