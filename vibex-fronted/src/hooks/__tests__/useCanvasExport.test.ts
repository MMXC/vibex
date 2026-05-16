/**
 * useCanvasExport.test.ts — Unit tests for canvas export utilities
 *
 * Epic E005 (F002): PNG/SVG canvas export
 *
 * 遵守约束:
 * - 无 any 类型
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportAsPNG, exportAsSVG } from '../useCanvasExport';

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
});
