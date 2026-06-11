/**
 * BatchCanvasToolbar.test.tsx — Sprint87 E3: BatchCanvasToolbar component tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// ============================================
// Mock @xyflow/react
// ============================================

const mockSetNodes = vi.fn();
const mockAddNodes = vi.fn();
const mockGetNodes = vi.fn(() => []);

vi.mock('@xyflow/react', () => ({
  useReactFlow: vi.fn(() => ({
    setNodes: mockSetNodes,
    addNodes: mockAddNodes,
    getNodes: mockGetNodes,
  })),
}));

// ============================================
// Import after mock
// ============================================
import { useBatchCanvasStore } from '@/stores/dds/batchCanvasStore';
import { BatchCanvasToolbar } from '../BatchCanvasToolbar';

// ============================================
// Helper: pre-populate store with N selected nodes
// ============================================
function selectNodes(count: number) {
  const ids = Array.from({ length: count }, (_, i) => `node-${i + 1}`);
  useBatchCanvasStore.getState().setSelection(ids);
}

function clearAll() {
  useBatchCanvasStore.getState().clearSelection();
}

describe('BatchCanvasToolbar', () => {
  beforeEach(() => {
    clearAll();
    vi.clearAllMocks();
    mockGetNodes.mockReturnValue([]);
  });

  // ---- Rendering ----

  describe('rendering', () => {
    it('renders nothing when < 2 nodes selected', () => {
      selectNodes(1);
      const { container } = render(<BatchCanvasToolbar />);
      expect(container.firstChild).toBeNull();
    });

    it('renders toolbar when exactly 2 nodes selected', () => {
      selectNodes(2);
      render(<BatchCanvasToolbar />);
      expect(screen.getByText('2 个节点已选中')).toBeTruthy();
    });

    it('renders toolbar when 3+ nodes selected', () => {
      selectNodes(5);
      render(<BatchCanvasToolbar />);
      expect(screen.getByText('5 个节点已选中')).toBeTruthy();
    });

    it('shows Delete, 复制, and 取消选中 buttons', () => {
      selectNodes(2);
      render(<BatchCanvasToolbar />);
      expect(screen.getByRole('button', { name: '批量删除' })).toBeTruthy();
      expect(screen.getByRole('button', { name: '批量复制' })).toBeTruthy();
      expect(screen.getByRole('button', { name: '取消选中' })).toBeTruthy();
    });
  });

  // ---- Batch Delete ----

  describe('batch delete', () => {
    it('calls clearSelection after delete', () => {
      selectNodes(2);
      render(<BatchCanvasToolbar />);
      fireEvent.click(screen.getByRole('button', { name: '批量删除' }));
      expect(useBatchCanvasStore.getState().selectedNodeIds.size).toBe(0);
    });

    it('filters out selected nodes from reactFlow.setNodes', () => {
      selectNodes(2);
      mockGetNodes.mockReturnValue([
        { id: 'node-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', position: { x: 100, y: 0 }, data: {} },
        { id: 'node-3', position: { x: 200, y: 0 }, data: {} },
      ]);
      render(<BatchCanvasToolbar />);
      fireEvent.click(screen.getByRole('button', { name: '批量删除' }));
      expect(mockSetNodes).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'node-3' }),
        ])
      );
      // node-1 and node-2 should be filtered out
      const callArg = mockSetNodes.mock.calls[0][0];
      const ids = callArg.map((n: any) => n.id);
      expect(ids).not.toContain('node-1');
      expect(ids).not.toContain('node-2');
    });
  });

  // ---- Batch Duplicate ----

  describe('batch duplicate', () => {
    it('calls addNodes with offset copies', () => {
      selectNodes(2);
      mockGetNodes.mockReturnValue([
        { id: 'node-1', position: { x: 0, y: 0 }, data: {} },
        { id: 'node-2', position: { x: 100, y: 0 }, data: {} },
      ]);
      render(<BatchCanvasToolbar />);
      fireEvent.click(screen.getByRole('button', { name: '批量复制' }));
      expect(mockAddNodes).toHaveBeenCalled();
      const addedNodes = mockAddNodes.mock.calls[0][0] as any[];
      expect(addedNodes.length).toBe(2);
      // Should have offset positions
      expect(addedNodes[0].position.x).toBe(50);
      expect(addedNodes[0].position.y).toBe(50);
      expect(addedNodes[1].position.x).toBe(150);
      expect(addedNodes[1].position.y).toBe(50);
    });

    it('clears selection after duplicate', () => {
      selectNodes(2);
      render(<BatchCanvasToolbar />);
      fireEvent.click(screen.getByRole('button', { name: '批量复制' }));
      expect(useBatchCanvasStore.getState().selectedNodeIds.size).toBe(0);
    });
  });

  // ---- Cancel ----

  describe('cancel / clear', () => {
    it('clears selection on cancel click', () => {
      selectNodes(3);
      render(<BatchCanvasToolbar />);
      fireEvent.click(screen.getByRole('button', { name: '取消选中' }));
      expect(useBatchCanvasStore.getState().selectedNodeIds.size).toBe(0);
    });

    it('calls onClearSelection callback if provided', () => {
      const onClear = vi.fn();
      selectNodes(2);
      render(<BatchCanvasToolbar onClearSelection={onClear} />);
      fireEvent.click(screen.getByRole('button', { name: '取消选中' }));
      expect(onClear).toHaveBeenCalled();
    });
  });
});
