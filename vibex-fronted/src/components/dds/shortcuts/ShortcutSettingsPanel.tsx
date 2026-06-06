/**
 * ShortcutSettingsPanel.tsx — Keyboard Shortcut Settings Modal
 * Sprint52 E5: 键盘快捷键自定义 UI
 * S67-E4: Added import/export buttons
 */
'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useShortcutStore } from '@/stores/shortcutStore';
import { ShortcutKeyInput } from './ShortcutKeyInput';
import { ShortcutEditor } from './ShortcutEditor';
import styles from './ShortcutSettingsPanel.module.css';

const CATEGORY_LABELS: Record<string, string> = {
  navigation: '⌨️ 导航',
  edit: '✏️ 编辑',
  view: '👁️ 视图',
  phase: '🔢 Phase',
};

interface ShortcutSettingsPanelProps {
  onClose: () => void;
}

export function ShortcutSettingsPanel({ onClose }: ShortcutSettingsPanelProps) {
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
  const exportBindings = useShortcutStore((s) => s.exportBindings);
  const importBindings = useShortcutStore((s) => s.importBindings);

  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExport = useCallback(() => {
    const json = exportBindings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibex-shortcuts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportBindings]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const result = importBindings(text);
        if (result.success) {
          alert(`导入成功: ${result.imported} 个快捷键`);
        } else {
          alert(`导入完成 (${result.imported} 个):\\n${result.errors.join('\\n')}`);
        }
      };
      reader.onerror = () => alert('文件读取失败');
      reader.readAsText(file);
      // Reset input so same file can be re-imported
      e.target.value = '';
    },
    [importBindings]
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

  const activeShortcut = activeEditor
    ? shortcuts.find(s => s.action === activeEditor)
    : null;

  return (
    <>
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
            <div className={styles.ioButtons}>
              <button type="button" className={styles.importBtn} onClick={handleImportClick}>
                📥 导入
              </button>
              <button type="button" className={styles.exportBtn} onClick={handleExport}>
                📤 导出
              </button>
            </div>
            <button type="button" className={styles.resetAllBtn} onClick={handleResetAll}>
              重置所有
            </button>
          </div>
        </div>
      </div>

      {/* E4: Dedicated ShortcutEditor modal */}
      {activeEditor && activeShortcut && (
        <ShortcutEditor
          action={activeShortcut.action}
          description={activeShortcut.description}
          currentKey={activeShortcut.currentKey}
          defaultKey={activeShortcut.defaultKey}
          onClose={() => setActiveEditor(null)}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={handleImportFile}
        aria-label="导入快捷键配置"
      />
    </>
  );
}
