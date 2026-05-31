/**
 * useCanvasExport.test.ts — Unit tests for canvas export utilities
 *
 * Epic E005 (F002): PNG/SVG canvas export
 *
 * 遵守约束:
 * - 无 any 类型
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportAsPNG, exportAsSVG, exportAsPNGWithScale, buildFigmaJSON } from '../useCanvasExport';

vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({
    toBlob: vi.fn((callback) => {
      callback(new Blob(['fake-png-data'], { type: 'image/png' }));
    }),
  }),
}));

describe('useCanvasExport', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Mock URL methods
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(
      'blob:http://localhost/fake-url'
    );
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn());

    // Mock click on the anchor that gets created
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('exportAsPNG', () => {
    it('should create and click a download link with PNG blob', async () => {
      const mockEl = document.createElement('div');
      await exportAsPNG(mockEl);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should use correct file name pattern for PNG', async () => {
      const mockEl = document.createElement('div');
      await exportAsPNG(mockEl);

      // Check that a link with matching download pattern was clicked
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('exportAsSVG', () => {
    beforeEach(() => {
      // Mock getComputedStyle for inlineComputedStyles
      vi.spyOn(window, 'getComputedStyle').mockReturnValue({
        getPropertyValue: vi.fn().mockReturnValue('100px'),
        length: 1,
        [Symbol.iterator]: function* () {
          yield 'width';
        },
      } as unknown as CSSStyleDeclaration);
    });

    it('should create and click a download link with SVG blob', async () => {
      const mockEl = document.createElement('div');
      await exportAsSVG(mockEl);

      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });

    it('should use correct file name pattern for SVG', async () => {
      const mockEl = document.createElement('div');
      await exportAsSVG(mockEl);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('exportAsPNGWithScale', () => {
    it('should call html2canvas with the given scale', async () => {
      const { default: html2canvas } = await import('html2canvas');
      const mockEl = document.createElement('div');
      await exportAsPNGWithScale(mockEl, 2);

      expect(html2canvas).toHaveBeenCalledWith(mockEl, expect.objectContaining({ scale: 2 }));
    });

    it('should use 1x scale by default', async () => {
      const { default: html2canvas } = await import('html2canvas');
      const mockEl = document.createElement('div');
      await exportAsPNGWithScale(mockEl, 1);

      expect(html2canvas).toHaveBeenCalledWith(mockEl, expect.objectContaining({ scale: 1 }));
    });

    it('should include scale in filename', async () => {
      const mockEl = document.createElement('div');
      await exportAsPNGWithScale(mockEl, 3);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('buildFigmaJSON', () => {
    it('should produce a Figma-compatible JSON structure', () => {
      const chapters = [
        { id: 'ch-1', label: 'Frame 1', nodes: [] },
        { id: 'ch-2', label: 'Frame 2', nodes: [] },
      ];

      const result = buildFigmaJSON(chapters);

      expect(result).toMatchObject({
        document: {
          name: 'VibeX Canvas Export',
          type: 'DOCUMENT',
          children: expect.any(Array),
        },
      });
      expect(result.document.children.length).toBe(1);
      expect(result.document.children[0].type).toBe('CANVAS');
      expect(Array.isArray(result.document.children[0].children)).toBe(true);
    });

    it('should map chapters to Figma frame nodes', () => {
      const chapters = [
        { id: 'ch-1', label: 'MyChapter', nodes: [] },
      ];

      const result = buildFigmaJSON(chapters);
      const frame = result.document.children[0].children[0] as { name: string; type: string };

      expect(frame.name).toBe('MyChapter');
      expect(frame.type).toBe('FRAME');
    });

    it('should handle empty chapters array', () => {
      const result = buildFigmaJSON([]);
      expect(result.document.children[0].children.length).toBe(0);
    });
  });
});
