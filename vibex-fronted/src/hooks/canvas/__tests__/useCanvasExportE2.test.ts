/**
 * useCanvasExport — E2 Export tests
 * US-E2.1: Canvas JSON/Vibex export
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCanvasExport } from '../useCanvasExport';

// Mock html-to-image
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
  toSvg: vi.fn().mockResolvedValue('<svg></svg>'),
}));

describe('useCanvasExport — E2 Export Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportAsJSON', () => {
    it('returns a Blob with application/json type', () => {
      const { result } = renderHook(() => useCanvasExport());
      const chapters = [{ cards: [], edges: [], loading: false, error: null, type: 'requirement' as const }];
      const blob = result.current.exportAsJSON(chapters, []);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
    });

    it('output JSON is parseable and contains required fields', async () => {
      const { result } = renderHook(() => useCanvasExport());
      const chapters = [{ cards: [], edges: [], loading: false, error: null, type: 'requirement' as const }];
      const blob = result.current.exportAsJSON(chapters, []);
      const text = await blob.text();
      const doc = JSON.parse(text);
      expect(doc).toHaveProperty('schemaVersion');
      expect(doc).toHaveProperty('metadata');
      expect(doc).toHaveProperty('chapters');
      expect(doc).toHaveProperty('crossChapterEdges');
      expect(typeof doc.schemaVersion).toBe('string');
      expect(doc.schemaVersion.length).toBeGreaterThan(0);
    });

    it('JSON does not throw on parse', async () => {
      const { result } = renderHook(() => useCanvasExport());
      const chapters = [{ cards: [], edges: [], loading: false, error: null, type: 'requirement' as const }];
      const blob = result.current.exportAsJSON(chapters, []);
      const text = await blob.text();
      expect(() => JSON.parse(text)).not.toThrow();
    });
  });

  describe('exportAsVibex', () => {
    it('returns a Blob', async () => {
      const { result } = renderHook(() => useCanvasExport());
      const chapters = [{ cards: [], edges: [], loading: false, error: null, type: 'requirement' as const }];
      const blob = await result.current.exportAsVibex(chapters, []);
      expect(blob).toBeInstanceOf(Blob);
    });
  });
});
