/**
 * ShortcutPanel — 测试用例
 *
 * 覆盖范围:
 * 1. open=false 时不渲染
 * 2. open=true 时渲染快捷键列表
 * 3. 点击关闭按钮触发 onClose
 * 4. 点击遮罩触发 onClose
 * 5. 所有快捷键正确显示
 * 6. 底部提示文本显示正确
 * 7. data-testid 属性正确
 * S48-P001-E3: 自定义编辑模式测试
 * S48-P001-E3: 冲突检测红色警告 UI 测试
 */

const tMock = (key: string): string => {
  const dict: Record<string, string> = {
    title: '快捷键',
    closeAria: '关闭快捷键提示',
    footer: '在文本输入框中，快捷键不会触发',
    customize: '自定义快捷键',
    viewMode: '查看模式',
    conflict: '冲突',
    conflictDesc: '已分配给其他操作：',
    captureKey: '按下任意组合键进行分配',
    reset: '恢复默认',
    saveShortcut: '保存',
    cancel: '取消',
    customizeModeFooter: '点击快捷键进行自定义，按 Escape 取消。',
  };
  return dict[key] ?? key;
};

vi.mock('@/hooks/useTranslations', () => ({
  useTranslations: () => () => tMock,
}));

// Real Zustand store for reactive testing
interface ShortcutCustomization { action: string; customKey: string }
interface UserPreferencesState {
  shortcutCustomization: ShortcutCustomization[];
  setShortcutCustomization: (customizations: ShortcutCustomization[]) => void;
}

// Module-level store instance — shared across all mock invocations
let storeState: UserPreferencesState = {
  shortcutCustomization: [],
  setShortcutCustomization: (customizations) => {
    storeState.shortcutCustomization = customizations;
    listeners.forEach((l) => l(storeState));
  },
};
let listeners: Array<(s: UserPreferencesState) => void> = [];

vi.mock('@/stores/userPreferencesStore', () => {
  function useStore(selector?: (s: UserPreferencesState) => unknown) {
    const state = storeState;
    if (!selector) return state;
    return selector(state);
  }
  (useStore as any).getState = () => storeState;
  (useStore as any).setState = (partial: Partial<UserPreferencesState>) => {
    storeState = { ...storeState, ...partial };
    listeners.forEach((l) => l(storeState));
  };
  (useStore as any).subscribe = (listener: (s: UserPreferencesState) => void) => {
    listeners.push(listener);
    return () => { listeners = listeners.filter((l) => l !== listener); };
  };
  return { useUserPreferencesStore: useStore };
});

// Mock parseKeyEvent
vi.mock('@/stores/shortcutStore', () => ({
  parseKeyEvent: (e: KeyboardEvent) => {
    const parts: string[] = [];
    if (e.metaKey || e.ctrlKey) parts.push('Cmd');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');
    let keyName = e.key;
    if (keyName.length === 1) {
      keyName = e.shiftKey ? keyName.toUpperCase() : keyName.toLowerCase();
    } else if (keyName === ' ') {
      keyName = 'Space';
    }
    parts.push(keyName);
    return parts.join('+');
  },
}));

import React from 'react';
import { act } from 'react-dom/test-utils';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShortcutPanel, SHORTCUTS } from '../ShortcutPanel';

// Helper: reset store to empty
function resetStore() {
  storeState = {
    shortcutCustomization: [],
    setShortcutCustomization: (customizations) => {
      storeState.shortcutCustomization = customizations;
      listeners.forEach((l) => l(storeState));
    },
  };
  listeners = [];
}

describe('ShortcutPanel', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('open=false 时不渲染面板', () => {
    render(<ShortcutPanel open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('open=true 时渲染对话框', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('shortcut-panel')).toBeInTheDocument();
  });

  it('显示所有合并后的快捷键和描述', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByText('撤销')).toBeInTheDocument();
    expect(screen.getByText('重做')).toBeInTheDocument();
    expect(screen.getByText('搜索节点')).toBeInTheDocument();
    expect(screen.getByText('确认选中节点')).toBeInTheDocument();
    expect(screen.getByText('生成上下文')).toBeInTheDocument();
    expect(screen.getByText('新建节点（当前树）')).toBeInTheDocument();
    expect(screen.getByText('放大画布')).toBeInTheDocument();
    expect(screen.getByText('缩小画布')).toBeInTheDocument();
    expect(screen.getByText('重置缩放')).toBeInTheDocument();
    expect(screen.getAllByText('删除选中节点')).toHaveLength(2);
    expect(screen.getByText('全选节点')).toBeInTheDocument();
    expect(screen.getByText('取消选择/关闭对话框/退出最大化')).toBeInTheDocument();
    expect(screen.getByText('生成图谱')).toBeInTheDocument();
    expect(screen.getByText('切换到上下文树')).toBeInTheDocument();
    expect(screen.getByText('切换到流程树')).toBeInTheDocument();
    expect(screen.getByText('切换到组件树')).toBeInTheDocument();
    expect(screen.getByText('空格键')).toBeInTheDocument();
    expect(screen.getByText('最大化画布/退出最大化')).toBeInTheDocument();
    expect(screen.getByText('显示/隐藏本面板')).toBeInTheDocument();
  });

  it('所有 SHORTCUTS 数组中的项都正确渲染', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const unique = [...new Set(SHORTCUTS.map((s) => s.description))];
    unique.forEach((desc) => {
      const count = SHORTCUTS.filter((s) => s.description === desc).length;
      expect(screen.getAllByText(desc, { exact: true })).toHaveLength(count);
    });
  });

  it('点击关闭按钮触发 onClose', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const closeBtn = screen.getByRole('button', { name: '关闭快捷键提示' });
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('点击遮罩层触发 onClose', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('标题显示正确', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByText('快捷键')).toBeInTheDocument();
  });

  it('底部提示文本显示正确', () => {
    render(<ShortcutPanel {...defaultProps} />);
    expect(screen.getByText('在文本输入框中，快捷键不会触发')).toBeInTheDocument();
  });

  it('kbd 按钮有 aria-label', () => {
    render(<ShortcutPanel {...defaultProps} />);
    const undoBtn = screen.getByRole('button', { name: /撤销/ });
    expect(undoBtn).toBeInTheDocument();
  });

  // ============================================================
  // S48-P001-E3: Customization edit mode tests
  // ============================================================

  it('S48-P001-E3: edit mode — clicking customize button toggles edit mode', async () => {
    let root!: HTMLElement;
    await act(async () => {
      const { container } = render(<ShortcutPanel {...defaultProps} />);
      root = container;
    });

    // Initially no edit input
    expect(screen.queryByPlaceholderText('Press any key...')).not.toBeInTheDocument();

    // Toggle customize mode
    const customizeBtn = screen.getByTitle('自定义快捷键');
    await act(async () => {
      fireEvent.click(customizeBtn);
    });

    // Kbd button should now have a testid
    const undoRow = root.querySelector('[data-action="undo"]') as HTMLElement;
    expect(undoRow).not.toBeNull();
    const undoKbdBtn = undoRow.querySelector('[data-testid^="shortcut-kbd-"]') as HTMLElement;
    expect(undoKbdBtn).toBeInTheDocument();

    // Click kbd to enter edit mode
    await act(async () => {
      fireEvent.click(undoKbdBtn);
    });

    // Edit input should appear
    expect(screen.getByTestId('shortcut-edit-input-undo')).toBeInTheDocument();
  });

  it('S48-P001-E3: conflict — duplicate key shows red warning UI', async () => {
    // Pre-populate store with custom shortcuts BEFORE render
    // This ensures the component has the conflict data when it mounts
    const { useUserPreferencesStore } = await import('../../../../stores/userPreferencesStore');
    useUserPreferencesStore.setState({
      shortcutCustomization: [
        { action: 'undo', customKey: 'Cmd+Alt+Z' },
        { action: 'redo', customKey: 'Cmd+A' },
      ],
    });

    // Spy on setConflictKey to see if it's called
    const origSetState = useUserPreferencesStore.setState;
    const setConflictKeySpy = vi.fn();
    // Intercept calls to setState that look like setting conflictKey (null)
    useUserPreferencesStore.setState = (partial: any) => {
      // Check if this is a conflictKey update by looking at the full store
      const state = useUserPreferencesStore.getState();
      origSetState(partial);
      const newState = useUserPreferencesStore.getState();
      console.log('[DEBUG] setState called, new shortcutCustomization:', JSON.stringify(newState.shortcutCustomization));
      setConflictKeySpy();
    };

    let root!: HTMLElement;
    await act(async () => {
      const { container } = render(<ShortcutPanel {...defaultProps} />);
      root = container;
    });

    // Enter customize mode
    const customizeBtn = screen.getByTitle('自定义快捷键');
    await act(async () => {
      fireEvent.click(customizeBtn);
    });

    // Enter edit mode for zoom-in
    const zoomInRow = root.querySelector('[data-action="zoom-in"]') as HTMLElement;
    const zoomInKbdBtn = zoomInRow!.querySelector('[data-testid^="shortcut-kbd-"]') as HTMLElement;
    await act(async () => {
      fireEvent.click(zoomInKbdBtn);
    });

    // Capture key Cmd+A — conflicts with custom 'redo' shortcut (also Cmd+A)
    const zoomInEditInput = screen.getByTestId('shortcut-edit-input-zoom-in');

    // Spy on parseKeyEvent to verify it's called
    const { parseKeyEvent } = await import('@/stores/shortcutStore');
    const parseSpy = vi.spyOn(parseKeyEvent as any, 'default' as any);
    console.log('[DEBUG] parseKeyEvent type:', typeof parseKeyEvent);
    console.log('[DEBUG] parseKeyEvent:', parseKeyEvent);

    await act(async () => {
      fireEvent.keyDown(zoomInEditInput, { key: 'a', ctrlKey: false, metaKey: true, altKey: false });
    });
    console.log('[DEBUG] parseKeyEvent called:', parseSpy.mock.calls.length, 'times');
    console.log('[DEBUG] spy calls:', parseSpy.mock.calls);

    // Restore setState
    useUserPreferencesStore.setState = origSetState;

    // Conflict banner should appear — use waitFor to let state updates flush
    await waitFor(() => {
      expect(screen.queryByRole('alert')).toBeInTheDocument();
    });
  });
});
