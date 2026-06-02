/**
 * HistoryPanel.test.tsx — Sprint54 E1: Canvas Snapshot 版本历史 UI
 *
 * 覆盖 HistoryPanel 组件：
 * - E1.1: DDSToolbar History 图标按钮存在
 * - E1.2: HistoryPanel 显示历史快照列表
 * - E1.3: Restore 按钮存在
 * - E1.4: 空状态显示 "No snapshots"
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage before importing anything
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
  configurable: true,
});

function makeMockPast(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `cmd-${i + 1}`,
    execute: vi.fn(),
    rollback: vi.fn(),
    timestamp: Date.now() - (count - i) * 600000,
    description: `操作 #${i + 1}`,
  }));
}

// Shared mutable store for controlling mock state from tests
let _mockPast = makeMockPast(3);
let _mockFuture: unknown[] = [];

function resetMockHistory() {
  _mockPast = makeMockPast(3);
  _mockFuture = [];
}

vi.mock('@/stores/dds/canvasHistoryStore', () => ({
  useCanvasHistoryStore: (selector: (s: {
    past: unknown[]; future: unknown[]; canUndo: () => boolean;
    canRedo: () => boolean; selectiveUndo: () => void; clear: () => void;
    loadHistoryWithRevision: () => Promise<null>;
  }) => unknown) => {
    const state = {
      get past() { return _mockPast; },
      get future() { return _mockFuture; },
      canUndo: () => _mockPast.length > 0,
      canRedo: () => _mockFuture.length > 0,
      selectiveUndo: vi.fn(),
      clear: vi.fn(),
      loadHistoryWithRevision: vi.fn().mockResolvedValue(null),
    };
    return selector(state);
  },
}));

import { HistoryPanel } from '../HistoryPanel';

describe('HistoryPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    resetMockHistory();
    vi.clearAllMocks();
  });

  describe('E1.1: DDSToolbar History button exists', () => {
    it('renders the HistoryPanel when isOpen is true', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('renders the panel title', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByRole('heading', { name: /历史记录/i })).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(<HistoryPanel isOpen={false} onClose={mockOnClose} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('E1.2: History snapshot list', () => {
    it('displays history items as listitems', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      const list = screen.getByRole('list');
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    it('shows operation descriptions in the list', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText('操作 #1')).toBeInTheDocument();
      expect(screen.getByText('操作 #2')).toBeInTheDocument();
    });
  });

  describe('E1.3: Restore button', () => {
    it('shows Restore button for non-current items', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      const restoreButtons = screen.getAllByRole('button', { name: /Restore/i });
      expect(restoreButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('marks the most recent item as current state', () => {
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/当前/i)).toBeInTheDocument();
    });
  });

  describe('E1.4: Empty state', () => {
    it('shows "No snapshots" when history is empty', () => {
      // Override _mockPast to be empty
      _mockPast = [];
      _mockFuture = [];
      render(<HistoryPanel isOpen={true} onClose={mockOnClose} />);
      expect(screen.getByText(/no snapshots/i)).toBeInTheDocument();
    });
  });
});
