/**
 * ViewPresetsPanel.tsx — Toolbar View Presets Dropdown
 * S69-E5: Canvas View Presets — toolbar dropdown for applying/saving presets
 *
 * Dropdown panel rendered in DDSToolbar for quick preset application
 * and one-click save of the current view settings.
 */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSettingsStore, type CanvasSettings } from '@/stores/dds/settingsStore';
import styles from './ViewPresetsPanel.module.css';

interface ViewPresetsPanelProps {
  /** Whether the panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Anchor button ref for positioning */
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  /** Open settings panel (e.g. open CanvasSettingsPanel at presets tab) */
  onOpenSettings?: () => void;
}

function PresetIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function ViewPresetsPanel({ open, onClose, onOpenSettings }: ViewPresetsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const presets = useSettingsStore((s) => s.canvasPresets);
  const activePresetId = useSettingsStore((s) => s.activePresetId);
  const saveAsPreset = useSettingsStore((s) => s.saveAsPreset);
  const applyPreset = useSettingsStore((s) => s.applyPreset);
  const deletePreset = useSettingsStore((s) => s.deletePreset);
  const getCurrentSettings = useSettingsStore(
    (s) =>
      () =>
        ({
          backgroundColor: s.backgroundColor,
          gridSize: s.gridSize,
          gridVariant: s.gridVariant,
          defaultZoom: s.defaultZoom,
          snapToGrid: s.snapToGrid,
        } satisfies CanvasSettings)
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSave = useCallback(() => {
    if (!presetName.trim()) return;
    const settings = getCurrentSettings();
    saveAsPreset(presetName.trim(), settings);
    setPresetName('');
    setSaving(false);
  }, [presetName, getCurrentSettings, saveAsPreset]);

  const handleApply = useCallback(
    (presetId: string) => {
      applyPreset(presetId);
      onClose();
    },
    [applyPreset, onClose]
  );

  const handleDelete = useCallback(
    (presetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      deletePreset(presetId);
    },
    [deletePreset]
  );

  const handleSaveKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setSaving(false);
      setPresetName('');
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className={styles.panel}
      role="menu"
      aria-label="画布视图预设"
    >
      {/* Preset list */}
      <div className={styles.presetList}>
        {presets.length === 0 && !saving && (
          <div className={styles.empty}>暂无预设，保存当前视图</div>
        )}

        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          const bg = preset.settings.backgroundColor;
          const gridStyle =
            preset.settings.gridVariant === 'dots'
              ? `radial-gradient(circle, ${bg === '#ffffff' || bg === '#fff' ? '#9ca3af' : 'rgba(128,128,128,0.3)'} 1px, transparent 1px)`
              : preset.settings.gridVariant === 'lines'
              ? `linear-gradient(${bg === '#ffffff' || bg === '#fff' ? '#d1d5db' : 'rgba(128,128,128,0.3)'} 1px, transparent 1px)`
              : 'none';
          const bgColor = preset.settings.backgroundColor;

          return (
            <div
              key={preset.id}
              className={`${styles.presetItem} ${isActive ? styles.presetItemActive : ''}`}
              role="menuitem"
              onClick={() => handleApply(preset.id)}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleApply(preset.id)}
              aria-label={`应用预设 ${preset.name}`}
              aria-selected={isActive}
            >
              {/* Preview swatch */}
              <div
                className={styles.preview}
                style={{
                  background: bgColor,
                  backgroundImage: gridStyle,
                  backgroundSize:
                    preset.settings.gridVariant === 'dots'
                      ? `${preset.settings.gridSize}px ${preset.settings.gridSize}px`
                      : '100% 100%',
                }}
                aria-hidden="true"
              />

              {/* Info */}
              <div className={styles.presetInfo}>
                <span className={styles.presetName}>{preset.name}</span>
                <span className={styles.presetMeta}>
                  {preset.settings.gridSize}px · {preset.settings.gridVariant} ·{' '}
                  {preset.settings.defaultZoom}×
                </span>
              </div>

              {/* Active badge */}
              {isActive && (
                <span className={styles.activeBadge} aria-label="当前活动">✓</span>
              )}

              {/* Delete */}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(preset.id, e)}
                aria-label={`删除预设 ${preset.name}`}
                title="删除预设"
              >
                <DeleteIcon />
              </button>
            </div>
          );
        })}
      </div>

      {/* Save section */}
      {saving ? (
        <div className={styles.saveSection}>
          <input
            ref={inputRef}
            type="text"
            className={styles.nameInput}
            placeholder="预设名称..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={handleSaveKeyDown}
            maxLength={50}
            autoFocus
            aria-label="预设名称"
          />
          <div className={styles.saveActions}>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!presetName.trim()}
            >
              保存
            </button>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setSaving(false);
                setPresetName('');
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.panelActions}>
          <button
            type="button"
            className={styles.saveCurrentBtn}
            onClick={() => {
              setSaving(true);
              setPresetName('');
            }}
            aria-label="保存当前视图为预设"
          >
            <PresetIcon />
            保存当前视图
          </button>
          <button
            type="button"
            className={styles.manageBtn}
            onClick={() => {
              onClose();
              onOpenSettings?.();
            }}
            aria-label="管理所有预设"
            title="在设置面板中管理预设"
          >
            <SettingsIcon />
            管理
          </button>
        </div>
      )}
    </div>
  );
}
