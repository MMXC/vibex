/**
 * ConflictDialog — 测试
 * E8-S2: 冲突仲裁弹窗单元测试
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictDialog, type ConflictData } from './index';

const mockConflict: ConflictData = {
  nodeId: 'flow-1',
  nodeName: '用户注册流程',
  localData: {
    id: 'flow-1',
    name: '用户注册流程',
    version: 5,
    status: 'draft',
    description: '本地编辑',
  },
  remoteData: {
    id: 'flow-1',
    name: '用户注册流程',
    version: 6,
    status: 'confirmed',
    description: '服务端更新',
  },
  localVersion: 5,
  remoteVersion: 6,
};

const mockOnKeepLocal = vi.fn();
const mockOnUseRemote = vi.fn();
const mockOnDismiss = vi.fn();

function renderDialog(overrides: Partial<ConflictData> = {}) {
  return render(
    <ConflictDialog
      conflict={{ ...mockConflict, ...overrides }}
      onKeepLocal={mockOnKeepLocal}
      onUseRemote={mockOnUseRemote}
      onDismiss={mockOnDismiss}
    />
  );
}

describe('ConflictDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dialog with 冲突检测 title', () => {
    renderDialog();
    expect(screen.getByText('冲突检测')).toBeInTheDocument();
  });

  it('renders both buttons with correct labels', () => {
    renderDialog();
    expect(screen.getByRole('button', { name: /保留我的版本/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /采用最新版本/ })).toBeInTheDocument();
  });

  it('calls onKeepLocal when 保留我的版本 button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /保留我的版本/ }));
    expect(mockOnKeepLocal).toHaveBeenCalledTimes(1);
    expect(mockOnKeepLocal).toHaveBeenCalledWith('flow-1');
  });

  it('calls onUseRemote when 采用最新版本 button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: /采用最新版本/ }));
    expect(mockOnUseRemote).toHaveBeenCalledTimes(1);
    expect(mockOnUseRemote).toHaveBeenCalledWith('flow-1');
  });

  it('calls onDismiss when close button is clicked', () => {
    renderDialog();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('has dialog role and aria-modal for accessibility', () => {
    renderDialog();
    expect(screen.getByRole('dialog')).toBeAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to title', () => {
    renderDialog();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'conflict-dialog-title');
  });

  it('displays node name in description', () => {
    renderDialog();
    expect(screen.getByText(/用户注册流程/)).toBeInTheDocument();
  });

  it('falls back to nodeId when nodeName is missing', () => {
    renderDialog({ nodeName: undefined });
    expect(screen.getByText(/flow-1/)).toBeInTheDocument();
  });

  it('shows hint text about ESC key', () => {
    renderDialog();
    expect(screen.getByText(/按 ESC 键采用最新版本/)).toBeInTheDocument();
  });

  it('ESC key triggers onUseRemote', () => {
    renderDialog();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnUseRemote).toHaveBeenCalledTimes(1);
    expect(mockOnUseRemote).toHaveBeenCalledWith('flow-1');
  });

  it('renders diff table with version labels', () => {
    renderDialog();
    // Should show version numbers
    expect(screen.getByText(/v5/)).toBeInTheDocument();
    expect(screen.getByText(/v6/)).toBeInTheDocument();
  });

  it('renders diff with differing fields highlighted', () => {
    renderDialog();
    // status field differs: local=draft, remote=confirmed
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
    // description field differs
    expect(screen.getByText('本地编辑')).toBeInTheDocument();
    expect(screen.getByText('服务端更新')).toBeInTheDocument();
  });

  it('has data-testid on dialog for E2E tests', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-bubble')).toBeInTheDocument();
  });

  it('has data-testid on keep-local button for E2E tests', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-keep-local')).toBeInTheDocument();
  });

  it('has data-testid on use-remote button for E2E tests', () => {
    renderDialog();
    expect(screen.getByTestId('conflict-use-server')).toBeInTheDocument();
  });
});

describe('ConflictDialog — Edge Cases', () => {
  it('handles empty localData gracefully', () => {
    renderDialog({ localData: {} });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/保留我的版本/)).toBeInTheDocument();
  });

  it('handles empty remoteData gracefully', () => {
    renderDialog({ remoteData: {} });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/采用最新版本/)).toBeInTheDocument();
  });

  it('shows identical values as unchanged', () => {
    const conflict = {
      ...mockConflict,
      localData: { id: 'x', name: 'Same', version: 1 },
      remoteData: { id: 'x', name: 'Same', version: 2 },
    };
    renderDialog(conflict);
    // Both versions should be displayed
    expect(screen.getByText('Same')).toBeInTheDocument();
  });
});
