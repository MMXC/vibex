/**
 * ShortcutSettingsPanel.tsx — Keyboard Shortcut Settings Modal
 * Sprint52 E5: 键盘快捷键自定义 UI
 */
'use client';

import React, { useCallback } from 'react';
import { useShortcutStore } from '@/stores/shortcutStore';
import { ShortcutKeyInput } from './ShortcutKeyInput';
import styles from './ShortcutSettingsPanel.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: '⌨️ 导航',
  edit: '✏️ 编辑',
  view: '👁️ 视图',
  phase: '🔢 Phase',
};

interface ShortcutSettingsPanelProps {
  /** Controls whether the panel is visible — when false, panel is not rendered */
  isOpen?: boolean;
  onClose: () => void;
}

export function ShortcutSettingsPanel({ isOpen = true, onClose }: ShortcutSettingsPanelProps) {
  // D4.3 (S53-E4): isOpen prop guards rendering — panel unmounts when closed
  if (!isOpen) return null;
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const editingAction = useShortcutStore((s) => s.editingAction);
  const capturedKey = useShortcutStore((s) => s.capturedKey);
  const conflictInfo = useShortcutStore((s) => s.conflictInfo);
  const startEditing = useShortcutStore((s) => s.startEditing);
  const cancelEditing = useShortcutStore((s) => s.cancelEditing);
  const captureKey = useShortcutStore((s) => s.captureKey);
  const saveShortcut = useShortcutStore((s) => s.saveShortcut);
  const resetToDefault = useShortcutStore((s) => s.resetToDefault);
  const resetAll = useShortcutStore((s) => s.resetAll);

  const handleEdit = useCallback(
    (action: string) => {
      startEditing(action);
    },
    [startEditing]
  );

  const handleSave = useCallback(() => {
    saveShortcut();
  }, [saveShortcut]);

  const handleCancel = useCallback(() => {
    cancelEditing();
  }, [cancelEditing]);

  const handleCapture = useCallback(
    (action: string, key: string) => {
      startEditing(action);
      captureKey(key);
    },
    [startEditing, captureKey]
  );

  // Group shortcuts by category
  const groups: Record<string, typeof shortcuts> = {};
  for (const s of shortcuts) {
    if (!groups[s.category]) groups[s.category] = [];
    groups[s.category].push(s);
  }

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleResetAll = useCallback(() => {
    if (confirm('确定重置所有快捷键到默认值?')) {
      resetAll();
    }
  }, [resetAll]);

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="快捷键设置">
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2 className={styles.title}>⌨️ 键盘快捷键设置</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">✕</button>
        </div>

        <div className={styles.body}>
          {Object.entries(groups).map(([category, items]) => (
            <div key={category} className={styles.group}>
              <h3 className={styles.groupTitle}>{CATEGORY_LABELS[category] ?? category}</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>操作</th>
                    <th>快捷键</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const isActive = editingAction === s.action;
                    const conflict =
                      isActive && capturedKey && conflictInfo?.hasConflict
                        ? { hasConflict: true, conflictingDescription: conflictInfo.conflictingDescription }
                        : undefined;
                    return (
                      <tr key={s.action} className={isActive ? styles.rowActive : ''}>
                        <td className={styles.desc}>{s.description}</td>
                        <td>
                          {isActive ? (
                            <ShortcutKeyInput
                              action={s.action}
                              currentKey={s.currentKey}
                              isActive={true}
                              conflictInfo={conflict}
                              onCapture={(key) => handleCapture(s.action, key)}
                              onSave={handleSave}
                              onCancel={handleCancel}
                            />
                          ) : (
                            <span className={styles.keyBadge}>{s.currentKey}</span>
                          )}
                        </td>
                        <td className={styles.rowActions}>
                          {isActive ? null : (
                            <>
                              <button
                                type="button"
                                className={styles.editBtn}
                                onClick={() => handleEdit(s.action)}
                                title="修改"
                              >
                                编辑
                              </button>
                              {s.currentKey !== s.defaultKey && (
                                <button
                                  type="button"
                                  className={styles.resetBtn}
                                  onClick={() => resetToDefault(s.action)}
                                  title="重置到默认"
                                >
                                  重置
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.resetAllBtn} onClick={handleResetAll}>
            重置所有
          </button>
        </div>
      </div>
    </div>
  );
}
