/**
 * Shortcut Manager
 * 全局快捷键管理 — 使用 mousetrap 库进行全局键盘事件捕获和冲突检测
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mousetrap = require('mousetrap');
import { useShortcutStore, type ShortcutConfig } from '../../stores/shortcutStore';

// ==================== Types ====================

export interface ShortcutBinding {
  action: string;
  key: string;
  handler: (e: KeyboardEvent) => void;
}

export interface GlobalConflictResult {
  hasConflict: boolean;
  systemAction?: string;
  description?: string;
}

// 系统级快捷键（浏览器保留或常见应用使用）
const SYSTEM_RESERVED: Record<string, string> = {
  'Cmd+w': '关闭当前标签页',
  'Cmd+t': '新建标签页',
  'Cmd+r': '刷新页面',
  'Cmd+Shift+r': '强制刷新',
  'Cmd+f': '页面搜索',
  'Cmd+g': '页面内查找下一个',
  'Cmd+Shift+g': '页面内查找上一个',
  'Cmd+a': '全选',
  'Cmd+v': '粘贴（浏览器）',
  'Cmd+c': '复制（浏览器）',
  'Cmd+x': '剪切',
  'Cmd+z': '撤销（浏览器）',
  'Cmd+Shift+z': '重做（浏览器）',
  'Cmd+,': '浏览器设置',
  'Cmd+b': '切换书签栏（部分浏览器）',
  'Cmd+d': '收藏当前页',
  'Cmd+Shift+d': '收藏所有标签页',
  'Cmd+n': '新建浏览器窗口',
  'Cmd+p': '打印',
  'Cmd+s': '保存页面（浏览器）',
  'F5': '刷新',
  'F11': '全屏（浏览器）',
  'F12': '开发者工具',
  'Escape': '取消/关闭（浏览器）',
};

// ==================== ShortcutManager Class ====================

class ShortcutManager {
  private bindings: Map<string, ShortcutBinding> = new Map();
  private element: HTMLElement | null = null;
  private paused = false;

  /**
   * 初始化 ShortcutManager，绑定到指定容器元素
   * @param element DOM 元素用于事件委托，默认 document.body
   */
  init(element?: HTMLElement): void {
    this.element = element || document.body;
    this.paused = false;
  }

  /**
   * 绑定快捷键到指定处理函数
   */
  bind(key: string, action: string, handler: (e: KeyboardEvent) => void): void {
    if (this.bindings.has(key)) {
      console.warn(`[ShortcutManager] Shortcut ${key} already bound, skipping`);
      return;
    }

    const binding: ShortcutBinding = { action, key, handler };
    this.bindings.set(key, binding);

    Mousetrap.bind(key, (e: MousetrapHandler) => {
      if (this.paused) return;
      handler(e as unknown as KeyboardEvent);
      return false; // 阻止默认行为
    }, 'keydown');
  }

  /**
   * 解绑快捷键
   */
  unbind(key: string): void {
    if (!this.bindings.has(key)) return;
    this.bindings.delete(key);
    Mousetrap.unbind(key);
  }

  /**
   * 解绑所有快捷键
   */
  unbindAll(): void {
    this.bindings.forEach((_, key) => {
      Mousetrap.unbind(key);
    });
    this.bindings.clear();
  }

  /**
   * 暂停所有快捷键处理（用于模态框等场景）
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * 恢复快捷键处理
   */
  resume(): void {
    this.paused = false;
  }

  /**
   * 检查是否暂停
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * 获取所有当前绑定
   */
  getBindings(): ShortcutBinding[] {
    return Array.from(this.bindings.values());
  }

  /**
   * 检查全局快捷键冲突
   * 返回是否有冲突及冲突类型
   */
  checkGlobalConflict(key: string): GlobalConflictResult {
    // 检查系统保留快捷键
    if (key in SYSTEM_RESERVED) {
      return {
        hasConflict: true,
        systemAction: key,
        description: SYSTEM_RESERVED[key],
      };
    }
    return { hasConflict: false };
  }

  /**
   * 用 store 中的快捷键配置批量绑定
   * 通常在 app 初始化时调用一次
   */
  bindFromStore(actionHandlers: Map<string, (e: KeyboardEvent) => void>): void {
    const store = useShortcutStore.getState();
    const shortcuts = store.shortcuts;

    shortcuts.forEach((shortcut: ShortcutConfig) => {
      const handler = actionHandlers.get(shortcut.action);
      if (handler && shortcut.currentKey) {
        this.bind(shortcut.currentKey, shortcut.action, handler);
      }
    });
  }

  /**
   * 重新绑定单个快捷键（配置变更后）
   */
  rebind(key: string, newKey: string, action: string, handler: (e: KeyboardEvent) => void): void {
    this.unbind(key);
    this.bind(newKey, action, handler);
  }
}

// ==================== Extended Mousetrap Types ====================

// Mousetrap handlers receive an event that extends KeyboardEvent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MousetrapHandler = (event: any) => void | boolean;

// ==================== Singleton Export ====================

export const shortcutManager = new ShortcutManager();

// ==================== Helper Functions ====================

/**
 * 将 mousetrap 格式的快捷键字符串转换为可读格式
 */
export function normalizeShortcut(key: string): string {
  return key
    .replace('cmd', 'Cmd')
    .replace('command', 'Cmd')
    .replace('ctrl', 'Ctrl')
    .replace('meta', 'Cmd')
    .replace('alt', 'Alt')
    .replace('shift', 'Shift');
}

/**
 * 将浏览器 KeyboardEvent 的 key 转换为 mousetrap 格式
 */
export function keyboardEventToMousetrap(e: KeyboardEvent): string {
  const parts: string[] = [];

  // 使用修饰键顺序：Cmd, Alt, Shift
  if (e.metaKey || e.ctrlKey) parts.push('Cmd');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  // 获取主键
  let key = e.key;
  if (key === ' ') key = 'Space';
  if (key.length === 1) key = e.shiftKey ? key.toUpperCase() : key.toLowerCase();

  parts.push(key);

  return parts.join('+');
}

/**
 * 检查快捷键是否冲突
 */
export function isReservedShortcut(key: string): boolean {
  return key in SYSTEM_RESERVED;
}

/**
 * 获取保留快捷键描述
 */
export function getReservedDescription(key: string): string | undefined {
  return SYSTEM_RESERVED[key];
}
