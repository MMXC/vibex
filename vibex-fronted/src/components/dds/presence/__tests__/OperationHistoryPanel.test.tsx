/**
 * OperationHistoryPanel — S91-E3-F3: 操作历史实时同步
 *
 * 覆盖场景:
 * - Renders nothing when operationHistory is empty
 * - Shows collapsible panel with operations when history exists
 * - Shows correct icons per operation type
 * - Shows correct user name and description
 * - Collapse/expand toggle works
 * - Relative time formatting
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OperationHistoryPanel } from '../OperationHistoryPanel';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function renderPanel() {
  return render(<OperationHistoryPanel />);
}

function populateHistory(operations: Array<{
  userId: string;
  userName: string;
  operationType: 'add' | 'delete' | 'edit-property' | 'move';
  description: string;
  targetId: string;
}>) {
  const store = usePresenceStore.getState();
  store.clearOperationHistory();
  for (const op of operations) {
    usePresenceStore.getState().addOperation(op);
  }
}

describe('OperationHistoryPanel', () => {
  beforeEach(() => {
    usePresenceStore.getState().clearOperationHistory();
  });

  it('should render nothing when operationHistory is empty', () => {
    const { container } = renderPanel();
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId('op-history-panel')).toBeNull();
  });

  it('should render panel when operations exist', () => {
    populateHistory([
      { userId: 'u1', userName: 'Alice', operationType: 'add', description: '添加了节点', targetId: 'n1' },
    ]);

    renderPanel();
    expect(screen.getByTestId('op-history-panel')).toBeInTheDocument();
    expect(screen.getByTestId('op-history-list')).toBeInTheDocument();
  });

  it('should show correct user name and description', () => {
    populateHistory([
      { userId: 'u1', userName: 'Bob', operationType: 'delete', description: '删除了节点', targetId: 'n2' },
    ]);

    renderPanel();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('删除了节点')).toBeInTheDocument();
  });

  it('should render all 4 operation types', () => {
    populateHistory([
      { userId: 'u1', userName: 'A', operationType: 'add', description: '添加', targetId: 'n1' },
      { userId: 'u2', userName: 'B', operationType: 'delete', description: '删除', targetId: 'n2' },
      { userId: 'u3', userName: 'C', operationType: 'edit-property', description: '编辑属性', targetId: 'n3' },
      { userId: 'u4', userName: 'D', operationType: 'move', description: '移动', targetId: 'n4' },
    ]);

    renderPanel();

    expect(screen.getByTestId('op-history-row-add')).toBeInTheDocument();
    expect(screen.getByTestId('op-history-row-delete')).toBeInTheDocument();
    expect(screen.getByTestId('op-history-row-edit-property')).toBeInTheDocument();
    expect(screen.getByTestId('op-history-row-move')).toBeInTheDocument();
  });

  it('should show multiple operations', () => {
    populateHistory([
      { userId: 'u1', userName: 'Alice', operationType: 'add', description: '操作1', targetId: 'n1' },
      { userId: 'u2', userName: 'Bob', operationType: 'move', description: '操作2', targetId: 'n2' },
    ]);

    renderPanel();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should show count badge in header', () => {
    populateHistory([
      { userId: 'u1', userName: 'A', operationType: 'add', description: 'op1', targetId: 'n1' },
      { userId: 'u2', userName: 'B', operationType: 'add', description: 'op2', targetId: 'n2' },
    ]);

    renderPanel();
    const panel = screen.getByTestId('op-history-panel');
    expect(panel).toHaveAttribute('data-count', '2');
  });

  it('should collapse when toggle is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    populateHistory([
      { userId: 'u1', userName: 'Alice', operationType: 'add', description: '添加', targetId: 'n1' },
    ]);

    renderPanel();
    expect(screen.getByTestId('op-history-list')).toBeVisible();

    // Click toggle using userEvent for better simulation
    await user.click(screen.getByTestId('op-history-toggle'));

    // List should be removed from DOM (not rendered when collapsed)
    expect(screen.queryByTestId('op-history-list')).not.toBeInTheDocument();

    // Click again to expand
    await user.click(screen.getByTestId('op-history-toggle'));
    expect(screen.getByTestId('op-history-list')).toBeVisible();
  });

  it('should show relative time (刚刚) for recent operations', () => {
    populateHistory([
      { userId: 'u1', userName: 'Alice', operationType: 'add', description: '添加', targetId: 'n1' },
    ]);

    renderPanel();
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });
});
