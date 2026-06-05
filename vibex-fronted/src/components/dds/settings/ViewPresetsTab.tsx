/**
 * ViewPresetsTab.tsx — Canvas View Presets Tab
 * S66-E3: Canvas View Presets Save & Switch
 */
'use client';

import React, { useState, useCallback } from 'react';
import { useViewPresetsStore, type ViewPresetSettings } from '@/stores/viewPresetsStore';
import { useSettingsStore } from '@/stores/dds/settingsStore';
import styles from './ViewPresetsTab.module.css';

export function ViewPresetsTab() {
  const [presetName, setPresetName] = useState('');
  const [fitViewOnLoad, setFitViewOnLoad] = useState(true);

  const presets = useViewPresetsStore((s) => s.presets);
  const currentPresetId = useViewPresetsStore((s) => s.currentPresetId);
  const savePreset = useViewPresetsStore((s) => s.savePreset);
  const deletePreset = useViewPresetsStore((s) => s.deletePreset);
  const loadPreset = useViewPresetsStore((s) => s.loadPreset);
  const getPreset = useViewPresetsStore((s) => s.getPreset);

  const settingsStore = useSettingsStore();

  const getCurrentSettings = useCallback((): ViewPresetSettings => {
    return {
      backgroundColor: settingsStore.backgroundColor,
      gridSize: settingsStore.gridSize,
      gridVariant: settingsStore.gridVariant,
      defaultZoom: settingsStore.defaultZoom,
      snapToGrid: settingsStore.snapToGrid,
    };
  }, [settingsStore]);

  const handleSave = useCallback(() => {
    if (!presetName.trim()) return;
    const settings = getCurrentSettings();
    savePreset(presetName.trim(), settings);
    setPresetName('');
  }, [presetName, getCurrentSettings, savePreset]);

  const handleLoad = useCallback(
    (id: string) => {
      const preset = loadPreset(id);
      if (!preset) return;

      const { settings } = preset;
      settingsStore.setBackgroundColor(settings.backgroundColor);
      settingsStore.setGridSize(settings.gridSize);
      settingsStore.setGridVariant(settings.gridVariant);
      settingsStore.setDefaultZoom(settings.defaultZoom);
      settingsStore.setSnapToGrid(settings.snapToGrid);
    },
    [loadPreset, settingsStore]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('确定删除此预设?')) {
        deletePreset(id);
      }
    },
    [deletePreset]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className={styles.container} role="tabpanel" aria-label="画布视图预设">
      <div className={styles.header}>
        <span className={styles.title}>视图预设</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #6b7280)' }}>
          {presets.length} 个预设
        </span>
      </div>

      {presets.length === 0 ? (
        <div className={styles.emptyState}>暂无预设，保存当前视图设置</div>
      ) : (
        <div className={styles.presetList} role="listbox" aria-label="预设列表">
          {presets.map((preset) => {
            const isActive = preset.id === currentPresetId;
            const previewBg = preset.settings.backgroundColor;
            const previewGrid =
              preset.settings.gridVariant === 'dots'
                ? 'radial-gradient(#d1d5db 1px, transparent 1px)'
                : preset.settings.gridVariant === 'lines'
                  ? 'linear-gradient(#d1d5db 1px, transparent 1px)'
                  : 'none';

            return (
              <div
                key={preset.id}
                className={`${styles.presetCard} ${isActive ? styles.presetCardActive : ''}`}
                onClick={() => handleLoad(preset.id)}
                role="option"
                aria-selected={isActive}
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleLoad(preset.id)}
              >
                <div
                  className={styles.previewSwatch}
                  style={{
                    background: previewBg,
                    backgroundImage: previewGrid,
                    backgroundSize: preset.settings.gridVariant === 'dots' ? `${preset.settings.gridSize}px ${preset.settings.gridSize}px` : '100% 100%',
                    backgroundPosition: 'center',
                  }}
                  aria-hidden="true"
                />
                <div className={styles.presetInfo}>
                  <div className={styles.presetName}>{preset.name}</div>
                  <div className={styles.presetMeta}>
                    {preset.settings.gridSize}px · {preset.settings.gridVariant} · {preset.settings.defaultZoom}×
                    {preset.fitViewOnLoad ? ' · 自适应' : ''}
                  </div>
                </div>
                <div className={styles.presetActions}>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={(e) => handleDelete(e, preset.id)}
                    aria-label={`删除预设 ${preset.name}`}
                    title="删除"
                  >
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className={styles.saveSection}>
        <div className={styles.inputRow}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="预设名称..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={50}
            aria-label="预设名称"
          />
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!presetName.trim()}
            aria-label="保存当前视图为预设"
          >
            保存
          </button>
        </div>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={fitViewOnLoad}
            onChange={(e) => setFitViewOnLoad(e.target.checked)}
          />
          加载时自动适应视图
        </label>
      </div>
    </div>
  );
}
