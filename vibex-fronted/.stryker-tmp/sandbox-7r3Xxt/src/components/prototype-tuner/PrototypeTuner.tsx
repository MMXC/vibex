/**
 * Prototype Tuner Component
 * 调整细节、实时更新
 */
// @ts-nocheck


'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import styles from './PrototypeTuner.module.css';

export interface TunerConfig {
  id: string;
  label: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'color' | 'select' | 'boolean';
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface PrototypeTunerProps {
  configs: TunerConfig[];
  onChange?: (configId: string, value: unknown) => void;
  onApply?: (allValues: Record<string, unknown>) => void;
  liveUpdate?: boolean;
}

export function PrototypeTuner({
  configs,
  onChange,
  onApply,
  liveUpdate = false,
}: PrototypeTunerProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize values
  useEffect(() => {
    const initial: Record<string, unknown> = {};
    configs.forEach(c => { initial[c.id] = c.value; });
    setValues(initial);
  }, [configs]);

  // Handle change
  const handleChange = useCallback((configId: string, newValue: unknown) => {
    setValues(prev => ({ ...prev, [configId]: newValue }));
    onChange?.(configId, newValue);

    // Live update with debounce
    if (liveUpdate) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onApply?.(values);
      }, 300);
    }
  }, [onChange, liveUpdate, onApply, values]);

  // Apply all changes
  const handleApply = useCallback(() => {
    onApply?.(values);
  }, [onApply, values]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    const defaults: Record<string, unknown> = {};
    configs.forEach(c => { defaults[c.id] = c.value; });
    setValues(defaults);
    onApply?.(defaults);
  }, [configs, onApply]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>原型微调</h3>
        <div className={styles.actions}>
          <button type="button" className={styles.resetButton} onClick={handleReset}>重置</button>
          <button type="button" className={styles.applyButton} onClick={handleApply}>应用</button>
        </div>
      </div>

      <div className={styles.configList}>
        {configs.map(config => (
          <div key={config.id} className={styles.configItem}>
            <label className={styles.configLabel}>{config.label}</label>
            {config.type === 'text' && (
              <input
                type="text"
                className={styles.input}
                value={String(values[config.id] || '')}
                onChange={e => handleChange(config.id, e.target.value)}
              />
            )}
            {config.type === 'number' && (
              <input
                type="number"
                className={styles.input}
                value={Number(values[config.id] || 0)}
                min={config.min}
                max={config.max}
                step={config.step || 1}
                onChange={e => handleChange(config.id, Number(e.target.value))}
              />
            )}
            {config.type === 'color' && (
              <input
                type="color"
                className={styles.colorInput}
                value={String(values[config.id] || '#000000')}
                onChange={e => handleChange(config.id, e.target.value)}
              />
            )}
            {config.type === 'select' && (
              <select
                className={styles.select}
                value={String(values[config.id] || '')}
                onChange={e => handleChange(config.id, e.target.value)}
              >
                {config.options?.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            {config.type === 'boolean' && (
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={Boolean(values[config.id])}
                  onChange={e => handleChange(config.id, e.target.checked)}
                />
                <span className={styles.toggleSlider} />
              </label>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrototypeTuner;
