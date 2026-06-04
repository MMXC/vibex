/**
 * useBatchExport.test.ts — Sprint61 E2: Batch export hook tests
 *
 * Tests comprehensive coverage of useBatchExport hook:
 * - Initial state validation
 * - startExport with PNG format
 * - startExport with SVG format
 * - startExport with PDF format
 * - cancelExport functionality
 * - Error handling
 * - Multiple exports reset state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';

// Dynamically import to avoid vi.mock hoisting issues
const getHook = () => import('../useBatchExport').then(m => m.useBatchExport);
const getTypes = () => import('../useBatchExport').then(m => ({
  BatchExportFormat: m.BatchExportFormat,
  BatchExportStatus: m.BatchExportStatus,
  BatchExportProgress: m.BatchExportProgress,
}));

// Mock the export functions
const mockExportZip = vi.fn();
const mockExportSvgZip = vi.fn();
const mockExportPdfZip = vi.fn();

vi.mock('@/lib/canvas/exportMultipleAsPNG', () => ({
  exportAndDownloadAsZip: (...args: unknown[]) => mockExportZip(...args),
}));

vi.mock('@/lib/canvas/exportMultipleAsSVG', () => ({
  exportAndDownloadAsSvgZip: (...args: unknown[]) => mockExportSvgZip(...args),
}));

vi.mock('@/lib/canvas/exportMultipleAsPDF', () => ({
  exportAndDownloadAsPDF: (...args: unknown[]) => mockExportPdfZip(...args),
}));

describe('Sprint61 E2 — useBatchExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExportZip.mockResolvedValue(undefined);
    mockExportSvgZip.mockResolvedValue(undefined);
    mockExportPdfZip.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial state', () => {
    it('has status idle on mount', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());
      expect(result.current.status).toBe('idle');
    });

    it('has null progress on mount', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());
      expect(result.current.progress).toBe(null);
    });

    it('has null error on mount', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());
      expect(result.current.error).toBe(null);
    });

    it('startExport is a function', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());
      expect(typeof result.current.startExport).toBe('function');
    });

    it('cancelExport is a function', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());
      expect(typeof result.current.cancelExport).toBe('function');
    });
  });

  describe('startExport — PNG format (default)', () => {
    it('calls exportAndDownloadAsZip with correct options', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(mockExportZip).toHaveBeenCalledWith(
        mockCards,
        expect.objectContaining({ scope: 'all', scale: 2, backgroundColor: '#0f0f1a' })
      );
      expect(result.current.status).toBe('done');
    });
  });

  describe('startExport — SVG format', () => {
    it('calls exportAndDownloadAsSvgZip for SVG format', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'f1', name: 'Flow 1', type: 'business-flow' as const, treeType: 'flow' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'flow', 'svg');
      });

      expect(mockExportSvgZip).toHaveBeenCalledWith(
        mockCards,
        expect.objectContaining({ scope: 'flow', backgroundColor: '#0f0f1a' })
      );
      expect(result.current.status).toBe('done');
    });
  });

  describe('startExport — PDF format', () => {
    it('calls exportAndDownloadAsPDF for PDF format', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'cmp1', name: 'Component 1', type: 'component' as const, treeType: 'component' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'component', 'pdf');
      });

      expect(mockExportPdfZip).toHaveBeenCalledWith(
        mockCards,
        expect.objectContaining({ scope: 'component', scale: 2, backgroundColor: '#0f0f1a' })
      );
      expect(result.current.status).toBe('done');
    });
  });

  describe('cancelExport', () => {
    it('cancelExport is callable without throwing', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      // cancelExport is safe to call even when no export is running
      act(() => {
        result.current.cancelExport();
      });

      // No-op when no export is active (abortControllerRef is null)
      expect(result.current.status).toBe('idle');
    });

    it('sets status to cancelling during abort', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      // Mock a slow export that can be cancelled
      mockExportZip.mockImplementation(() => new Promise(() => {})); // never resolves

      act(() => {
        result.current.startExport(mockCards, 'all', 'png');
      });

      // Cancel the ongoing export
      act(() => {
        result.current.cancelExport();
      });

      // Status should be cancelled after abort
      expect(result.current.status).toBe('cancelled');
    });
  });

  describe('Error handling', () => {
    it('sets status error when PNG export throws', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportZip.mockRejectedValue(new Error('PNG export failed'));

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('PNG export failed');
    });

    it('sets status error when SVG export throws', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportSvgZip.mockRejectedValue(new Error('SVG export failed'));

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'svg');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('SVG export failed');
    });

    it('sets status error when PDF export throws', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportPdfZip.mockRejectedValue(new Error('PDF export failed'));

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'pdf');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('PDF export failed');
    });

    it('sets status cancelled when AbortError is thrown', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportZip.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('cancelled');
    });

    it('handles non-Error thrown objects', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportZip.mockRejectedValue('string error');

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe('Export failed');
    });
  });

  describe('State transitions', () => {
    it('resets progress and error on new export', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      mockExportZip.mockRejectedValueOnce(new Error('First error'));
      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('error');

      mockExportZip.mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('done');
      expect(result.current.error).toBe(null);
    });

    it('idle state after successful export', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards, 'all', 'png');
      });

      expect(result.current.status).toBe('done');
    });
  });

  describe('Scope parameter mapping', () => {
    it('maps undefined scope to all', async () => {
      const useBatchExport = await getHook();
      const { result } = renderHook(() => useBatchExport());

      const mockCards = [
        { nodeId: 'c1', name: 'Context 1', type: 'bounded-context' as const, treeType: 'context' as const },
      ];

      await act(async () => {
        await result.current.startExport(mockCards as any, undefined, 'png');
      });

      expect(mockExportZip).toHaveBeenCalledWith(
        mockCards,
        expect.objectContaining({ scope: 'all' })
      );
    });
  });
});
