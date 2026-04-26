/**
 * ConflictDialog — 单元测试
 * Epic: E8 — Canvas 协作冲突解决
 *
 * 正确接口 (index.tsx ConflictDialogProps):
 *   serverSnapshot: CanvasSnapshot  — 含 version, createdAt, data
 *   localData:     CanvasData      — 含 contextNodes, flowNodes, componentNodes
 *   onKeepLocal:   () => void
 *   onUseServer:   () => void
 *   onMerge:       () => void
 *
 * 错误接口（已废弃，ConflictBubble.tsx 内部做 toDialogProps 转换）:
 *   conflict, onUseRemote, onDismiss — ConflictBubble 内部接口
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictDialog, type CanvasSnapshot, type CanvasData } from './index';

// ---------------------------------------------------------------------------
// Mock data — 符合 CanvasSnapshot + CanvasData 接口
// ---------------------------------------------------------------------------

const mockServerSnapshot: CanvasSnapshot = {
  snapshotId: 'snap-abc123',
  version: 6,
  createdAt: '2026-04-26T10:00:00.000Z',
  data: {
    contexts: [{ id: 'ctx-1', name: '用户上下文' }],
    flows: [{ id: 'flow-1', name: '用户注册流程' }],
    components: [{ id: 'comp-1', name: 'Button' }],
  },
};

const mockLocalData: CanvasData = {
  contextNodes: [{ id: 'ctx-1', name: '用户上下文' }],
  flowNodes: [{ id: 'flow-1', name: '用户注册流程' }, { id: 'flow-2', name: '登录流程' }],
  componentNodes: [],
};

const mockOnKeepLocal = vi.fn();
const mockOnUseServer = vi.fn();
const mockOnMerge = vi.fn();

// ---------------------------------------------------------------------------
// Render helper
// ---------------------------------------------------------------------------

function renderDialog(
  serverSnapshot: CanvasSnapshot = mockServerSnapshot,
  localData: CanvasData = mockLocalData,
) {
  return render(
    <ConflictDialog
      serverSnapshot={serverSnapshot}
      localData={localData}
      onKeepLocal={mockOnKeepLocal}
      onUseServer={mockOnUseServer}
      onMerge={mockOnMerge}
    />
  );
}

describe('ConflictDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TC-01: 标题和描述正确渲染
  it('renders 冲突检测 title', () => {
    renderDialog();
    expect(screen.getByText('检测到数据冲突')).toBeInTheDocument();
  });

  it('renders subtitle explaining conflict', () => {
    renderDialog();
    expect(screen.getByText(/其他设备|标签页|修改了此项目/)).toBeInTheDocument();
  });

  // TC-02: 版本对比区域
  it('shows 服务端版本 label', () => {
    renderDialog();
    expect(screen.getByText('服务端版本')).toBeInTheDocument();
  });

  it('shows 本地版本 label', () => {
    renderDialog();
    expect(screen.getByText('本地版本')).toBeInTheDocument();
  });

  it('displays server snapshot version number', () => {
    renderDialog();
    // serverSnapshot.version = 6
    expect(screen.getByText('v6')).toBeInTheDocument();
  });

  it('displays local version as server version + 1', () => {
    renderDialog();
    // local version = serverSnapshot.version + 1 = 7
    expect(screen.getByText('v7')).toBeInTheDocument();
  });

  it('shows node counts in comparison table', () => {
    renderDialog();
    // Check comparison table headers
    expect(screen.getByText('上下文')).toBeInTheDocument();
    expect(screen.getByText('流程')).toBeInTheDocument();
    expect(screen.getByText('组件')).toBeInTheDocument();
    // Check row labels
    expect(screen.getAllByText('服务端').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('本地').length).toBeGreaterThanOrEqual(1);
    // Check count values appear in document (server row + local row)
    // For mock data: contexts=1, flows=2, components=0
    expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1); // at least context count
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // at least flow count
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(1); // at least component count
  });

  // TC-03: 三按钮正确渲染
  it('renders 保留本地 button', () => {
    renderDialog();
    const btn = screen.getByRole('button', { name: /保留本地/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-testid', 'conflict-keep-local');
  });

  it('renders 使用服务端 button', () => {
    renderDialog();
    const btn = screen.getByRole('button', { name: /使用服务端/ });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveAttribute('data-testid', 'conflict-use-server');
  });

  it('renders 合并双方 button', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /合并双方/ })).toBeInTheDocument();
  });

  // TC-04: 按钮回调正确绑定
  it('calls onKeepLocal when 保留本地 button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /保留本地/ }));
    expect(mockOnKeepLocal).toHaveBeenCalledTimes(1);
  });

  it('calls onUseServer when 使用服务端 button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /使用服务端/ }));
    expect(mockOnUseServer).toHaveBeenCalledTimes(1);
  });

  it('calls onMerge when 合并双方 button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /合并双方/ }));
    expect(mockOnMerge).toHaveBeenCalledTimes(1);
  });

  // TC-05: 无障碍 (WCAG AA)
  it('has dialog role', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to title', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-labelledby',
      'conflict-dialog-title'
    );
  });

  it('has aria-describedby pointing to description', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-describedby',
      'conflict-dialog-desc'
    );
  });

  it('first button has focus on mount (keyboard a11y)', () => {
    renderDialog();
    // First button is 保留本地 (conflict-keep-local)
    expect(document.activeElement).toHaveAttribute(
      'data-testid',
      'conflict-keep-local'
    );
  });

  // NOTE: Tab keyboard focus cycling is tested via E2E (playwright).
  // jsdom does not simulate real focus movement — skip in unit tests.
  it.skip('Tab key cycles through action buttons (jsdom: skip — see E2E)', () => {
    // This test verifies the Tab key handler exists and fires on Tab press.
    // Actual focus cycling requires a real browser environment.
  });

  // TC-06: data-testid 供 E2E 使用
  it('dialog has data-testid=conflict-bubble', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-bubble')).toBeInTheDocument();
  });

  it('keep-local button has data-testid=conflict-keep-local', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-keep-local')).toBeInTheDocument();
  });

  it('use-server button has data-testid=conflict-use-server', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-use-server')).toBeInTheDocument();
  });

  // TC-07: 辅助说明文本
  it('shows help text about team coordination', () => {
    renderDialog();
    expect(screen.getByText(/团队成员/)).toBeInTheDocument();
  });

  // TC-08: 版本时间戳格式化
  it('formats createdAt date correctly', () => {
    renderDialog();
    // createdAt = '2026-04-26T10:00:00.000Z' → formatted date
    // Should display in zh-CN locale
    expect(screen.getByText(/2026|04|26/)).toBeInTheDocument();
  });
});

describe('ConflictDialog — Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles empty localData with zero counts', () => {
    const emptyData: CanvasData = {};
    renderDialog(mockServerSnapshot, emptyData);
    // 表格仍应渲染，只是 count 为 0
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /保留本地/ })).toBeInTheDocument();
  });

  it('handles empty serverSnapshot data gracefully', () => {
    const emptySnapshot: CanvasSnapshot = {
      ...mockServerSnapshot,
      data: {},
    };
    renderDialog(emptySnapshot, mockLocalData);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /使用服务端/ })).toBeInTheDocument();
  });

  it('handles large node counts', () => {
    const largeSnapshot: CanvasSnapshot = {
      ...mockServerSnapshot,
      data: {
        contexts: Array(100).fill(null).map((_, i) => ({ id: `ctx-${i}` })),
        flows: [],
        components: [],
      },
    };
    const largeLocal: CanvasData = {
      contextNodes: Array(100).fill(null).map((_, i) => ({ id: `ctx-${i}` })),
      flowNodes: Array(50).fill(null).map((_, i) => ({ id: `flow-${i}` })),
      componentNodes: [],
    };
    renderDialog(largeSnapshot, largeLocal);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // contexts
    expect(screen.getByText('50')).toBeInTheDocument();  // flows
  });

  it('version badge updates when serverSnapshot.version changes', () => {
    const v3Snapshot: CanvasSnapshot = { ...mockServerSnapshot, version: 3 };
    renderDialog(v3Snapshot, mockLocalData);
    expect(screen.getByText('v3')).toBeInTheDocument();
    expect(screen.getByText('v4')).toBeInTheDocument(); // local = 3+1
  });

  it('all three callbacks are independent', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /保留本地/ }));
    fireEvent.click(screen.getByRole('button', { name: /合并双方/ }));
    fireEvent.click(screen.getByRole('button', { name: /使用服务端/ }));
    expect(mockOnKeepLocal).toHaveBeenCalledTimes(1);
    expect(mockOnMerge).toHaveBeenCalledTimes(1);
    expect(mockOnUseServer).toHaveBeenCalledTimes(1);
  });
});
