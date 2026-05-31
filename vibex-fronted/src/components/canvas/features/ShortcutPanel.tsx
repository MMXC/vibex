/**
 * ShortcutPanel — 统一快捷键面板 + 自定义编辑模式 (S48-P001-E3)
 *
 * 合并 ShortcutHintPanel 和 ShortcutHelpPanel，统一管理所有快捷键。
 *
 * S48-P001-E3 新增功能：
 * - 自定义模式（点击 "Customize" 切换）
 * - 编辑模式（点击 kbd → input → keydown capture → 保存）
 * - 冲突检测 + 红色警告 UI
 *
 * 快捷键列表:
 * - HintPanel 快捷键: Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y, Ctrl+K, /, Ctrl+Shift+C, Ctrl+Shift+G, N, +, -, 0, Del, Backspace, Ctrl+A, Esc, F11, ?
 * - HelpPanel 快捷键: Ctrl+G, Alt+1, Alt+2, Alt+3, F11, ?
 * - 补充: Space
 *
 * 遵守约束:
 * - 无 any 类型
 * - 无 canvasLogger.default.debug
 * - 使用 design-tokens.css 变量
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Keyboard, Settings, AlertTriangle } from 'lucide-react';
import { useUserPreferencesStore, type ShortcutCustomization } from '@/stores/userPreferencesStore';
import { parseKeyEvent } from '@/stores/shortcutStore';
import styles from '../canvas.module.css';

// ==================== Types ====================

export interface ShortcutItem {
  /** 唯一标识符 */
  id: string;
  /** 操作名称（与 userPreferencesStore 中的 action 对应） */
  action: string;
  /** 显示的快捷键（如 Ctrl+Z） */
  keys: string[];
  /** 描述（如 "撤销"） */
  description: string;
}

export const SHORTCUTS: ShortcutItem[] = [
  // Undo/Redo
  { id: 'ctrl-z', action: 'undo', keys: ['Ctrl', 'Z'], description: '撤销' },
  { id: 'ctrl-shift-z', action: 'redo', keys: ['Ctrl', 'Shift', 'Z'], description: '重做' },
  { id: 'ctrl-y', action: 'redo', keys: ['Ctrl', 'Y'], description: '重做（Windows）' },
  // Search
  { id: 'ctrl-k', action: 'open-search', keys: ['Ctrl', 'K'], description: '搜索节点' },
  { id: 'slash', action: 'open-search', keys: ['/'], description: '搜索节点（备选）' },
  // Canvas actions
  { id: 'ctrl-shift-c', action: 'confirm-selected', keys: ['Ctrl', 'Shift', 'C'], description: '确认选中节点' },
  { id: 'ctrl-g', action: 'quick-generate', keys: ['Ctrl', 'G'], description: '生成图谱' },
  { id: 'ctrl-shift-g', action: 'generate-context', keys: ['Ctrl', 'Shift', 'G'], description: '生成上下文' },
  // Save & AI
  { id: 'ctrl-s', action: 'save-canvas', keys: ['Ctrl', 'S'], description: '保存画布' },
  { id: 'ctrl-i', action: 'open-ai-panel', keys: ['Ctrl', 'I'], description: '打开 AI 会话' },
  // Node operations
  { id: 'n', action: 'new-node', keys: ['N'], description: '新建节点（当前树）' },
  // Zoom
  { id: 'plus', action: 'zoom-in', keys: ['+'], description: '放大画布' },
  { id: 'minus', action: 'zoom-out', keys: ['-'], description: '缩小画布' },
  { id: 'zero', action: 'zoom-reset', keys: ['0'], description: '重置缩放' },
  // Delete
  { id: 'del', action: 'delete', keys: ['Del'], description: '删除选中节点' },
  { id: 'backspace', action: 'delete', keys: ['Backspace'], description: '删除选中节点' },
  // Selection
  { id: 'ctrl-a', action: 'select-all', keys: ['Ctrl', 'A'], description: '全选节点' },
  // Navigation / Panel
  { id: 'alt-1', action: 'switch-to-context', keys: ['Alt', '1'], description: '切换到上下文树' },
  { id: 'alt-2', action: 'switch-to-flow', keys: ['Alt', '2'], description: '切换到流程树' },
  { id: 'alt-3', action: 'switch-to-component', keys: ['Alt', '3'], description: '切换到组件树' },
  // Utility
  { id: 'esc', action: 'clear-selection', keys: ['Esc'], description: '取消选择/关闭对话框/退出最大化' },
  { id: 'f11', action: 'fullscreen', keys: ['F11'], description: '最大化画布/退出最大化' },
  { id: 'question', action: 'help', keys: ['?'], description: '显示/隐藏本面板' },
  { id: 'space', action: 'space', keys: ['Space'], description: '空格键' },
];

export interface ShortcutPanelProps {
  /** 是否显示面板 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
}

// ==================== Helper ====================

/** 将快捷键数组转换为可显示的字符串（用于显示当前键位） */
function keysToDisplay(keys: string[]): string {
  return keys.join('+');
}

// ==================== ShortcutPanel ====================

export function ShortcutPanel({ open, onClose }: ShortcutPanelProps) {
  const t = useTranslations('shortcuts')();
  const [customizeMode, setCustomizeMode] = useState(false);
  const [editingAction, setEditingAction] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [conflictKey, setConflictKey] = useState<string | null>(null);
  const [conflictAction, setConflictAction] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { shortcutCustomization, setShortcutCustomization } = useUserPreferencesStore();

  // Focus input when entering edit mode
  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  // Get effective key for an action (custom or default)
  function getEffectiveKey(action: string): string {
    const custom = shortcutCustomization.find((c) => c.action === action);
    if (custom) return custom.customKey;
    const item = SHORTCUTS.find((s) => s.action === action);
    return item ? keysToDisplay(item.keys) : '';
  }

  // Check for conflicts when a key is captured
  function checkConflict(key: string, skipAction: string): ShortcutCustomization | undefined {
    const normalizedKey = key.split('+').map((p) => p.toLowerCase()).join('+');
    const result = shortcutCustomization.find(
      (c) => c.action !== skipAction && c.customKey.toLowerCase() === normalizedKey
    );
    return result;
  }

  // Start editing an action's shortcut
  function startEditing(action: string) {
    setEditingAction(action);
    setPendingKey(null);
    setConflictKey(null);
    setConflictAction(null);
  }

  // Cancel editing
  function cancelEditing() {
    setEditingAction(null);
    setPendingKey(null);
    setConflictKey(null);
    setConflictAction(null);
  }

  // Handle key capture in edit mode
  function handleKeyDownCapture(e: React.KeyboardEvent<HTMLInputElement>) {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      cancelEditing();
      return;
    }

    const captured = parseKeyEvent(e.nativeEvent);
    setPendingKey(captured);

    // Check for conflict
    if (editingAction) {
      const conflict = checkConflict(captured, editingAction);
      if (conflict) {
        setConflictKey(captured);
        setConflictAction(conflict.action);
      } else {
        setConflictKey(null);
        setConflictAction(null);
      }
    }
  }

  // Save the shortcut
  function handleSaveShortcut() {
    if (!editingAction || !pendingKey || conflictKey) return;

    // Update customization array
    const updated = shortcutCustomization.filter((c) => c.action !== editingAction);
    updated.push({ action: editingAction, customKey: pendingKey });
    setShortcutCustomization(updated);

    // Exit edit mode
    setEditingAction(null);
    setPendingKey(null);
    setConflictKey(null);
    setConflictAction(null);
  }

  // Reset an action to its default shortcut
  function handleResetToDefault(action: string) {
    const updated = shortcutCustomization.filter((c) => c.action !== action);
    setShortcutCustomization(updated);
  }

  if (!open) return null;

  return (
    <div
      className={styles.shortcutHintOverlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('title')}
      data-testid="shortcut-panel"
      onClick={(e) => {
        if (e.target === e.currentTarget && !editingAction) onClose();
      }}
    >
      <div className={styles.shortcutHintPanel}>
        {/* Header */}
        <div className={styles.shortcutHintHeader}>
          <div className={styles.shortcutHintTitle}>
            <Keyboard size={18} aria-hidden="true" />
            <span>{t('title')}</span>
          </div>
          <div className={styles.shortcutHeaderActions}>
            {/* Customize toggle */}
            <button
              type="button"
              className={styles.shortcutHintClose}
              onClick={() => {
                setCustomizeMode((v) => !v);
                if (!customizeMode) cancelEditing();
              }}
              aria-label={customizeMode ? t('viewMode') : t('customize')}
              title={customizeMode ? t('viewMode') : t('customize')}
            >
              <Settings size={16} aria-hidden="true" />
            </button>
            {/* Close */}
            <button
              type="button"
              className={styles.shortcutHintClose}
              onClick={onClose}
              aria-label={t('closeAria')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Conflict warning banner (S48-P001-E3) */}
        {conflictKey && conflictAction && (
          <div className={styles.shortcutConflictBanner} role="alert">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>
              {t('conflict')}: <strong>{conflictKey}</strong> {t('conflictDesc')}
              {conflictAction}
            </span>
          </div>
        )}

        {/* Shortcut list */}
        <div className={styles.shortcutHintList} role="list">
          {SHORTCUTS.map((shortcut) => {
            const effectiveKey = getEffectiveKey(shortcut.action);
            const isEditing = editingAction === shortcut.action;
            const hasCustomization = shortcutCustomization.some((c) => c.action === shortcut.action);
            const conflictDesc = conflictKey && conflictAction === shortcut.action ? t('conflict') : null;

            return (
              <div
                key={shortcut.id}
                className={styles.shortcutHintItem}
                role="listitem"
                data-action={shortcut.action}
              >
                <div className={styles.shortcutKeys} aria-label={effectiveKey}>
                  {/* Edit mode: show input for capturing */}
                  {isEditing ? (
                    <input
                      ref={inputRef}
                      className={styles.shortcutEditInput}
                      type="text"
                      readOnly
                      placeholder="Press any key..."
                      value={pendingKey || ''}
                      onKeyDown={handleKeyDownCapture}
                      data-testid={`shortcut-edit-input-${shortcut.action}`}
                      aria-label={t('captureKey')}
                    />
                  ) : (
                    <button
                      type="button"
                      className={`${styles.shortcutKbd} ${hasCustomization ? styles.shortcutKbdCustom : ''} ${customizeMode ? styles.shortcutKbdEditable : ''}`}
                      onClick={() => {
                        if (customizeMode) startEditing(shortcut.action);
                      }}
                      disabled={!customizeMode}
                      data-testid={customizeMode ? `shortcut-kbd-edit-${shortcut.action}` : undefined}
                      aria-label={`${shortcut.description}: ${effectiveKey}`}
                    >
                      {effectiveKey.split('+').map((key, i) => (
                        <React.Fragment key={i}>
                          <kbd>{key}</kbd>
                          {i < effectiveKey.split('+').length - 1 && (
                            <span className={styles.shortcutPlus}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </button>
                  )}
                </div>

                {/* Description */}
                <span className={styles.shortcutDesc}>{shortcut.description}</span>

                {/* Edit mode controls */}
                {isEditing && (
                  <div className={styles.shortcutEditControls}>
                    <button
                      type="button"
                      className={styles.shortcutSaveBtn}
                      onClick={handleSaveShortcut}
                      disabled={!pendingKey || !!conflictKey}
                      data-testid={`shortcut-save-${shortcut.action}`}
                    >
                      {t('saveShortcut')}
                    </button>
                    <button
                      type="button"
                      className={styles.shortcutCancelBtn}
                      onClick={cancelEditing}
                      data-testid={`shortcut-cancel-${shortcut.action}`}
                    >
                      {t('cancel')}
                    </button>
                  </div>
                )}

                {/* Conflict indicator */}
                {conflictDesc && !isEditing && (
                  <span className={styles.shortcutConflictTag} role="alert">
                    ⚠️ {conflictDesc}
                  </span>
                )}

                {/* Reset to default (when customized) */}
                {hasCustomization && !isEditing && (
                  <button
                    type="button"
                    className={styles.shortcutResetBtn}
                    onClick={() => handleResetToDefault(shortcut.action)}
                    title={t('reset')}
                    aria-label={t('reset')}
                  >
                    ↩
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.shortcutHintFooter}>
          <span>{customizeMode ? t('customizeModeFooter') : t('footer')}</span>
        </div>
      </div>
    </div>
  );
}
