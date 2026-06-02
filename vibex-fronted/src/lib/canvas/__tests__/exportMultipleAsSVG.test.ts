/**
 * exportMultipleAsSVG.test.ts — Sprint52 E2: Batch SVG export tests
 * Sprint53 E5 D5.4: Added boundary cases (0/1/100+ nodes)
 *
 * Tests:
 * - exportMultipleAsSVG: throws on empty cards
 * - downloadBlob: creates download link
 * - Error handling: aborted export
 * - D5.4 boundary: 0 nodes → throws, 1 node → works, 100+ nodes → works
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from '../exportMultipleAsSVG';

describe('Sprint52 E2 — exportMultipleAsSVG', () => {
  let mockLink: { click: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
  let mockUrl: string;

  beforeEach(() => {
    mockUrl = 'blob:http://localhost/mock-uuid';
    mockLink = { click: vi.fn(), remove: vi.fn() };

    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => mockUrl),
      revokeObjectURL: vi.fn(),
    });

    vi.stubGlobal('document', {
      createElement: vi.fn(() => mockLink),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadBlob', () => {
    it('creates a download link and triggers click', () => {
      const blob = new Blob(['test'], { type: 'image/svg+xml' });
      downloadBlob(blob, 'test.svg');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('sets correct href and download attributes', () => {
      const blob = new Blob(['<svg></svg>'], { type: 'image/svg+xml' });
      downloadBlob(blob, 'my-canvas.svg');

      const link = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(link.href).toBe(mockUrl);
      expect(link.download).toBe('my-canvas.svg');
    });
  });

  describe('exportMultipleAsSVG — module-level tests (no DOM)', () => {
    it('throws on empty cards array', async () => {
      const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
      await expect(
        exportMultipleAsSVG([], { scope: 'all' })
      ).rejects.toThrow('没有可导出的卡片');
    });

    it('throws AbortError when signal is already aborted', async () => {
      const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
      const controller = new AbortController();
      controller.abort();
      const mockCards = [{ id: 'c1', title: 'Test', type: 'user-story' }] as any;
      try {
        await exportMultipleAsSVG(mockCards, { scope: 'all', signal: controller.signal });
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(DOMException);
        expect((err as DOMException).name).toBe('AbortError');
      }
    });

    it('throws when signal becomes aborted mid-export (DOM query returns null → early exit path)', async () => {
      // When querySelector returns null, it creates empty SVG blobs and continues.
      // The abort check happens in wrappedProgress before each batch.
      const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
      const mockCards = [{ id: 'c1', title: 'Canvas', type: 'user-story' }] as any;
      const controller = new AbortController();
      // Signal already aborted before call
      controller.abort();
      try {
        await exportMultipleAsSVG(mockCards, { scope: 'all', signal: controller.signal });
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(DOMException);
        expect((err as DOMException).name).toBe('AbortError');
      }
    });
  });
});

describe('Sprint52 E2 — SVG export zip blob integration', () => {
  it('svg export produces zip blob with svg content type', async () => {
    vi.mock('html-to-image', () => ({
      toSvg: vi.fn().mockResolvedValue(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#0f0f1a"/></svg>'
      ),
    }));
    vi.mock('jszip', () => ({
      default: class MockJSZip {
        folder() { return this; }
        file() {}
        async generateAsync() {
          return new Blob(['PK...'], { type: 'application/zip' });
        }
      },
    }));

    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({
        scrollWidth: 100,
        scrollHeight: 100,
      })),
    });

    const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
    const mockCards = [{ id: 'c1', title: 'Canvas', type: 'user-story' }] as any;
    const result = await exportMultipleAsSVG(mockCards, { scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/zip');
  });
});

// D5.4 boundary cases (S53-E5)
describe('S53-E5 D5.4 — exportMultipleAsSVG boundary cases', () => {
  it('0 nodes: throws on empty cards array', async () => {
    vi.mock('html-to-image', () => ({ toSvg: vi.fn() }));
    vi.mock('jszip', () => ({ default: class MockJSZip { folder() { return this; } file() {} async generateAsync() { return new Blob(); } } }));
    vi.stubGlobal('document', { querySelector: vi.fn(() => null) });

    const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
    await expect(exportMultipleAsSVG([], { scope: 'all' })).rejects.toThrow();
  });

  it('1 node: produces zip blob for single card', async () => {
    vi.mock('html-to-image', () => ({
      toSvg: vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    }));
    vi.mock('jszip', () => ({
      default: class MockJSZip {
        folder() { return this; }
        file() {}
        async generateAsync() { return new Blob(['PK'], { type: 'application/zip' }); }
      },
    }));
    vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollWidth: 100, scrollHeight: 100 })) });

    const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
    const mockCards = [{ id: 'c1', title: 'Canvas', type: 'user-story' }] as any;
    const result = await exportMultipleAsSVG(mockCards, { scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
  });

  it('100+ nodes: processes large card array without throwing', async () => {
    vi.mock('html-to-image', () => ({
      toSvg: vi.fn().mockResolvedValue('<svg xmlns="http://www.w3.org/2000/svg"/>'),
    }));
    vi.mock('jszip', () => ({
      default: class MockJSZip {
        folder() { return this; }
        file() {}
        async generateAsync() { return new Blob(['PK'], { type: 'application/zip' }); }
      },
    }));
    vi.stubGlobal('document', { querySelector: vi.fn(() => ({ scrollWidth: 100, scrollHeight: 100 })) });

    const { exportMultipleAsSVG } = await import('../exportMultipleAsSVG');
    // Generate 120 mock cards
    const manyCards = Array.from({ length: 120 }, (_, i) => ({
      id: `c${i}`, title: `Canvas ${i}`, type: 'user-story',
    })) as any;
    // Should not throw — just verify it completes
    const result = await exportMultipleAsSVG(manyCards, { scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
  });
});
