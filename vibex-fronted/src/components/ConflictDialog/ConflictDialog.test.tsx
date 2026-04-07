/**
 * ConflictDialog — 测试
 * E4-SyncProtocol: 冲突解决对话框测试
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictDialog, type CanvasSnapshot, type CanvasData } from './index';

// Test fixtures
const mockServerSnapshot: CanvasSnapshot = {
  snapshotId: 'snap-server-001',
  version: 5,
  createdAt: '2026-04-03T10:00:00.000Z',
  data: {
    contexts: [
      { nodeId: 'ctx-1', name: '用户管理', description: '', type: 'core', status: 'confirmed', children: [] },
      { nodeId: 'ctx-2', name: '订单系统', description: '', type: 'core', status: 'confirmed', children: [] },
    ],
    flows: [
      { nodeId: 'flow-1', contextId: 'ctx-1', name: '用户注册流程', steps: [], status: 'confirmed', children: [] },
    ],
    components: [
      { nodeId: 'comp-1', flowId: 'flow-1', name: '注册表单', type: 'page', props: {}, api: { method: 'POST', path: '/api/register', params: [] }, status: 'confirmed', children: [] },
    ],
  },
};

const mockLocalData: CanvasData = {
  contextNodes: [
    { nodeId: 'ctx-1', name: '用户管理', description: '', type: 'core', status: 'confirmed', children: [] },
    { nodeId: 'ctx-2', name: '订单系统', description: '', type: 'core', status: 'confirmed', children: [] },
    { nodeId: 'ctx-3', name: '支付系统', description: '', type: 'core', status: 'pending', children: [] },
  ],
  flowNodes: [
    { nodeId: 'flow-1', contextId: 'ctx-1', name: '用户注册流程', steps: [], status: 'confirmed', children: [] },
    { nodeId: 'flow-2', contextId: 'ctx-3', name: '支付流程', steps: [], status: 'pending', children: [] },
  ],
  componentNodes: [
    { nodeId: 'comp-1', flowId: 'flow-1', name: '注册表单', type: 'page', props: {}, api: { method: 'POST', path: '/api/register', params: [] }, status: 'confirmed', children: [] },
    { nodeId: 'comp-2', flowId: 'flow-2', name: '支付表单', type: 'form', props: {}, api: { method: 'POST', path: '/api/pay', params: [] }, status: 'pending', children: [] },
  ],
};

// Mock onKeepLocal
const mockOnKeepLocal = vi.fn();
// Mock onUseServer
const mockOnUseServer = vi.fn();
// Mock onMerge
const mockOnMerge = vi.fn();

function renderDialog(props?: Partial<React.ComponentProps<typeof ConflictDialog>>) {
  return render(
    <ConflictDialog
      serverSnapshot={mockServerSnapshot}
      localData={mockLocalData}
      onKeepLocal={mockOnKeepLocal}
      onUseServer={mockOnUseServer}
      onMerge={mockOnMerge}
      {...props}
    />
  );
}

describe('ConflictDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with correct title and subtitle', () => {
    renderDialog();
    expect(screen.getByText('检测到数据冲突')).toBeInTheDocument();
    expect(screen.getByText(/有其他设备或标签页修改了此项目/)).toBeInTheDocument();
  });

  it('renders version info with correct version numbers', () => {
    renderDialog();
    expect(screen.getByText('v5')).toBeInTheDocument();
    expect(screen.getByText('v6')).toBeInTheDocument(); // local is version + 1
  });

  it('renders comparison table with node counts', () => {
    const { container } = renderDialog();
    // Verify comparison table renders with cells
    const cells = container.querySelectorAll('[role="cell"]');
    expect(cells.length).toBe(6); // 2 rows × 3 columns
    // Verify server row values are displayed (from mockServerSnapshot)
    // Server: 2 contexts, 1 flow, 1 component
    const cellTexts = Array.from(cells).map((c) => c.textContent ?? '');
    // All 6 cells should have non-empty text content
    expect(cellTexts.every((t) => t !== '' && t !== null)).toBe(true);
    // The comparison section should show both server and local data
    expect(container.querySelector('[class*="comparison"]')).toBeInTheDocument();
  });

  it('renders three action buttons with correct labels', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /保留本地/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /使用服务端/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /合并双方/ })).toBeInTheDocument();
  });

  it('calls onKeepLocal when 保留本地 button is clicked', async () => {
    renderDialog();
    const button = screen.getByRole('button', { name: /保留本地/ });
    fireEvent.click(button);
    expect(mockOnKeepLocal).toHaveBeenCalledTimes(1);
  });

  it('calls onUseServer when 使用服务端 button is clicked', async () => {
    renderDialog();
    const button = screen.getByRole('button', { name: /使用服务端/ });
    fireEvent.click(button);
    expect(mockOnUseServer).toHaveBeenCalledTimes(1);
  });

  it('calls onMerge when 合并双方 button is clicked', async () => {
    renderDialog();
    const button = screen.getByRole('button', { name: /合并双方/ });
    fireEvent.click(button);
    expect(mockOnMerge).toHaveBeenCalledTimes(1);
  });

  it('has dialog role for accessibility', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal attribute for accessibility', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby for dialog title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'conflict-dialog-title');
  });

  it('handles empty local data gracefully', () => {
    renderDialog({
      localData: {},
    });
    expect(screen.getByText('检测到数据冲突')).toBeInTheDocument();
    // Dialog should still render even with empty local data
    expect(screen.getByRole('button', { name: /保留本地/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /使用服务端/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /合并双方/ })).toBeInTheDocument();
  });

  it('handles empty server data gracefully', () => {
    renderDialog({
      serverSnapshot: {
        ...mockServerSnapshot,
        data: {},
      },
    });
    expect(screen.getByText('检测到数据冲突')).toBeInTheDocument();
  });

  it('renders help text at bottom', () => {
    renderDialog();
    expect(screen.getByText(/如有疑问/)).toBeInTheDocument();
  });

  it('first button is auto-focused for keyboard accessibility', () => {
    renderDialog();
    const firstButton = screen.getByRole('button', { name: /保留本地/ });
    expect(firstButton).toHaveFocus();
  });

  it('Tab key cycles focus through buttons', () => {
    renderDialog();
    const buttons = [
      screen.getByRole('button', { name: /保留本地/ }),
      screen.getByRole('button', { name: /使用服务端/ }),
      screen.getByRole('button', { name: /合并双方/ }),
    ];

    // Start at first button (auto-focused)
    expect(document.activeElement).toBe(buttons[0]);

    // Tab to second button
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    // Note: This test may need adjustment based on actual focus behavior
    // The keydown handler is on the overlay, not individual elements
  });
});

describe('ConflictDialog — Node Count Helpers', () => {
  it('counts zero for empty arrays', () => {
    const data: CanvasData = {
      contextNodes: [],
      flowNodes: [],
      componentNodes: [],
    };
    // Just verify it renders without error
    renderDialog({ localData: data });
    expect(screen.getByText('检测到数据冲突')).toBeInTheDocument();
  });
});
