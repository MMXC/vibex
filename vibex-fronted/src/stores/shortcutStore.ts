/**
 * Shortcut Store
 * 快捷键个性化配置状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ==================== Types ====================

export type ShortcutCategory = 'navigation' | 'edit' | 'view' | 'phase';

export interface ShortcutConfig {
  action: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: ShortcutCategory;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingAction?: string;
  conflictingDescription?: string;
}

export interface ShortcutState {
  // Shortcuts
  shortcuts: ShortcutConfig[];
  
  // Editing state
  editingAction: string | null;
  capturedKey: string | null;
  conflictInfo: ConflictCheckResult | null;
  
  // Actions
  loadDefaults: () => void;
  startEditing: (action: string) => void;
  cancelEditing: () => void;
  captureKey: (key: string) => ConflictCheckResult;
  saveShortcut: () => void;
  resetToDefault: (action: string) => void;
  resetAll: () => void;
  getShortcutKey: (action: string) => string;
}

// ==================== Default Shortcuts ====================

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Navigation
  { action: 'go-to-canvas', description: '切换到画布', defaultKey: 'Cmd+1', currentKey: 'Cmd+1', category: 'navigation' },
  { action: 'go-to-flows', description: '切换到流程', defaultKey: 'Cmd+2', currentKey: 'Cmd+2', category: 'navigation' },
  { action: 'go-to-components', description: '切换到组件', defaultKey: 'Cmd+3', currentKey: 'Cmd+3', category: 'navigation' },
  { action: 'go-to-settings', description: '打开设置', defaultKey: 'Cmd+,', currentKey: 'Cmd+,', category: 'navigation' },
  
  // Edit
  { action: 'undo', description: '撤销', defaultKey: 'Cmd+Z', currentKey: 'Cmd+Z', category: 'edit' },
  { action: 'redo', description: '重做', defaultKey: 'Cmd+Shift+Z', currentKey: 'Cmd+Shift+Z', category: 'edit' },
  { action: 'save', description: '保存', defaultKey: 'Cmd+S', currentKey: 'Cmd+S', category: 'edit' },
  { action: 'delete', description: '删除', defaultKey: 'Delete', currentKey: 'Delete', category: 'edit' },
  { action: 'copy', description: '复制', defaultKey: 'Cmd+C', currentKey: 'Cmd+C', category: 'edit' },
  { action: 'paste', description: '粘贴', defaultKey: 'Cmd+V', currentKey: 'Cmd+V', category: 'edit' },
  
  // View
  { action: 'zoom-in', description: '放大', defaultKey: '+', currentKey: '+', category: 'view' },
  { action: 'zoom-out', description: '缩小', defaultKey: '-', currentKey: '-', category: 'view' },
  { action: 'zoom-reset', description: '重置缩放', defaultKey: '0', currentKey: '0', category: 'view' },
  { action: 'fullscreen', description: '全屏', defaultKey: 'F11', currentKey: 'F11', category: 'view' },
  { action: 'toggle-sidebar', description: '切换侧边栏', defaultKey: 'Cmd+B', currentKey: 'Cmd+B', category: 'view' },
  
  // Phase
  { action: 'prev-phase', description: '上一个 Phase', defaultKey: 'Cmd+[', currentKey: 'Cmd+[', category: 'phase' },
  { action: 'next-phase', description: '下一个 Phase', defaultKey: 'Cmd+]', currentKey: 'Cmd+]', category: 'phase' },
  { action: 'first-phase', description: '第一个 Phase', defaultKey: 'Cmd+Home', currentKey: 'Cmd+Home', category: 'phase' },
  { action: 'last-phase', description: '最后一个 Phase', defaultKey: 'Cmd+End', currentKey: 'Cmd+End', category: 'phase' },
];

// ==================== Store ====================

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,
      editingAction: null,
      capturedKey: null,
      conflictInfo: null,
      
      loadDefaults: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS });
      },
      
      startEditing: (action) => {
        set({
          editingAction: action,
          capturedKey: null,
          conflictInfo: null,
        });
      },
      
      cancelEditing: () => {
        set({
          editingAction: null,
          capturedKey: null,
          conflictInfo: null,
        });
      },
      
      captureKey: (key) => {
        const state = get();
        const editingAction = state.editingAction;
        
        if (!editingAction) {
          return { hasConflict: false };
        }
        
        // Check for conflicts
        const conflict = state.shortcuts.find(
          (s) => s.currentKey === key && s.action !== editingAction
        );
        
        const result: ConflictCheckResult = conflict
          ? {
              hasConflict: true,
              conflictingAction: conflict.action,
              conflictingDescription: conflict.description,
            }
          : { hasConflict: false };
        
        set({
          capturedKey: key,
          conflictInfo: result,
        });
        
        return result;
      },
      
      saveShortcut: () => {
        const state = get();
        const { editingAction, capturedKey, conflictInfo } = state;
        
        if (!editingAction || !capturedKey) return;
        if (conflictInfo?.hasConflict) return;
        
        set({
          shortcuts: state.shortcuts.map((s) =>
            s.action === editingAction
              ? { ...s, currentKey: capturedKey }
              : s
          ),
          editingAction: null,
          capturedKey: null,
          conflictInfo: null,
        });
      },
      
      resetToDefault: (action) => {
        const state = get();
        const defaultShortcut = DEFAULT_SHORTCUTS.find(
          (s) => s.action === action
        );
        
        if (!defaultShortcut) return;
        
        set({
          shortcuts: state.shortcuts.map((s) =>
            s.action === action
              ? { ...s, currentKey: defaultShortcut.defaultKey }
              : s
          ),
        });
      },
      
      resetAll: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS });
      },
      
      getShortcutKey: (action) => {
        const state = get();
        const shortcut = state.shortcuts.find((s) => s.action === action);
        return shortcut?.currentKey || '';
      },
    }),
    {
      name: 'vibex-shortcuts',
    }
  )
);

// ==================== Helper Functions ====================

/**
 * Format key string for display
 */
export function formatKeyDisplay(key: string): string {
  return key
    .replace('Cmd', '⌘')
    .replace('Shift', '⇧')
    .replace('Alt', '⌥')
    .replace('Ctrl', '⌃')
    .replace('Delete', 'Delete')
    .replace('Backspace', '⌫')
    .replace('Escape', 'Esc')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('ArrowLeft', '←')
    .replace('ArrowRight', '→')
    .replace('Home', 'Home')
    .replace('End', 'End')
    .replace('+', '+');
}

/**
 * Parse keyboard event to key string
 */
export function parseKeyEvent(e: KeyboardEvent): string {
  const parts: string[] = [];
  
  if (e.metaKey || e.ctrlKey) parts.push('Cmd');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  
  // Key name
  let keyName = e.key;
  if (keyName.length === 1) {
    keyName = e.shiftKey ? keyName.toUpperCase() : keyName.toLowerCase();
  } else if (keyName === ' ') {
    keyName = 'Space';
  }
  
  parts.push(keyName);
  
  return parts.join('+');
}
