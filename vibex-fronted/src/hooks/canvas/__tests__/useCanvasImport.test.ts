/**
 * useCanvasImport — Unit tests
 * E2-U2: File Import UI
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCanvasImport } from '../useCanvasImport';
import type { CanvasDocument } from '@/types/canvas-document';

// Mock ImportHistoryService
vi.mock('@/services/canvas/ImportHistoryService', () => ({
  logImport: vi.fn(),
}));

// Mock pako (gzip)
vi.mock('pako', () => ({
  default: {
    deflate: vi.fn((str) => new Uint8Array([...str].map((c) => c.charCodeAt(0)))),
    ungzip: vi.fn((buf: Uint8Array) => String.fromCharCode(...buf)),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', { value: mockConfirm, writable: true });

describe('useCanvasImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('validateFile', () => {
    it('should return valid for file under 10MB', () => {
      const { result } = renderHook(() => useCanvasImport());
      const file = new File(['x'], 'test.json', { type: 'application/json' });
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB
      const res = result.current.validateFile(file);
      expect(res.valid).toBe(true);
    });

    it('should return invalid for file over 10MB', () => {
      const { result } = renderHook(() => useCanvasImport());
      const file = new File(['x'], 'test.json', { type: 'application/json' });
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
      const res = result.current.validateFile(file);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('10MB');
    });

    it('should return invalid for file at exactly 10MB', () => {
      const { result } = renderHook(() => useCanvasImport());
      const file = new File(['x'], 'test.json', { type: 'application/json' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      const res = result.current.validateFile(file);
      expect(res.valid).toBe(true); // boundary is inclusive
    });
  });

  describe('importFile', () => {
    function makeMockJSONFile(chapters: CanvasDocument['chapters']): File {
      const doc: CanvasDocument = {
        schemaVersion: '1.2.0',
        metadata: {
          name: 'Test Canvas',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
        chapters,
        crossChapterEdges: [],
      };
      const blob = new Blob([JSON.stringify(doc)], { type: 'application/json' });
      return new File([blob], 'test.vibex.json', { type: 'application/json' });
    }

    it('should import valid JSON and call onImport', async () => {
      const { result } = renderHook(() => useCanvasImport());
      const chapters = [
        { type: 'requirement' as const, cards: [], edges: [], loading: false, error: null },
      ];
      const file = makeMockJSONFile(chapters);

      const onImport = vi.fn();
      await act(async () => {
        await result.current.importFile(file, onImport);
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(onImport).toHaveBeenCalled();
      const [importedChapters, warnings, rawDoc] = onImport.mock.calls[0];
      expect(importedChapters).toHaveLength(1);
      expect(warnings).toHaveLength(0);
      expect(rawDoc.schemaVersion).toBe('1.2.0');
    });

    it('should throw and not call onImport if user cancels confirm', async () => {
      mockConfirm.mockReturnValue(false);
      const { result } = renderHook(() => useCanvasImport());
      const chapters = [{ type: 'requirement' as const, cards: [], edges: [], loading: false, error: null }];
      const file = makeMockJSONFile(chapters);

      const onImport = vi.fn();
      await expect(
        act(async () => {
          await result.current.importFile(file, onImport);
        })
      ).rejects.toThrow('导入已取消');
      expect(onImport).not.toHaveBeenCalled();
    });

    it('should warn on unknown schema version (forward compat)', async () => {
      const { result } = renderHook(() => useCanvasImport());
      const doc: CanvasDocument = {
        schemaVersion: '99.0.0',
        metadata: { name: 'Test', createdAt: '2026-04-01T00:00:00.000Z', updatedAt: '2026-04-01T00:00:00.000Z' },
        chapters: [{ type: 'requirement', cards: [], edges: [], loading: false, error: null }],
        crossChapterEdges: [],
      };
      const blob = new Blob([JSON.stringify(doc)], { type: 'application/json' });
      const file = new File([blob], 'test.json', { type: 'application/json' });

      const onImport = vi.fn();
      await act(async () => {
        await result.current.importFile(file, onImport);
      });

      const [, warnings] = onImport.mock.calls[0];
      expect(warnings.some((w: string) => w.includes('99.0.0'))).toBe(true);
    });

    it('should throw for invalid JSON', async () => {
      const { result } = renderHook(() => useCanvasImport());
      const blob = new Blob(['not json'], { type: 'application/json' });
      const file = new File([blob], 'bad.json', { type: 'application/json' });

      const onImport = vi.fn();
      await expect(
        act(async () => {
          await result.current.importFile(file, onImport);
        })
      ).rejects.toThrow('无效的 JSON 格式');
      expect(onImport).not.toHaveBeenCalled();
    });

    it('should throw for file missing schemaVersion or chapters', async () => {
      const { result } = renderHook(() => useCanvasImport());
      const doc = { metadata: {} }; // missing schemaVersion and chapters
      const blob = new Blob([JSON.stringify(doc)], { type: 'application/json' });
      const file = new File([blob], 'incomplete.json', { type: 'application/json' });

      const onImport = vi.fn();
      await expect(
        act(async () => {
          await result.current.importFile(file, onImport);
        })
      ).rejects.toThrow('缺少 schemaVersion 或 chapters');
      expect(onImport).not.toHaveBeenCalled();
    });

    it('should throw for oversized file', async () => {
      const { result } = renderHook(() => useCanvasImport());
      const chapters = [{ type: 'requirement', cards: [], edges: [], loading: false, error: null }];
      const file = makeMockJSONFile(chapters);
      Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });

      const onImport = vi.fn();
      await expect(
        act(async () => {
          await result.current.importFile(file, onImport);
        })
      ).rejects.toThrow('10MB');
      expect(onImport).not.toHaveBeenCalled();
    });
  });
});