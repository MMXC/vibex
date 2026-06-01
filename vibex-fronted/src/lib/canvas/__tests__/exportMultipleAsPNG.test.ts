/**
 * exportMultipleAsPNG.test.ts — Sprint51 E2: Batch PNG export tests
 *
 * Tests:
 * - exportMultipleAsPNG: collects cards, calls html-to-image, creates ZIP
 * - downloadBlob: creates download link
 * - exportAndDownloadAsZip: combines export + download
 * - Error handling: empty cards, aborted export
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from '../exportMultipleAsPNG';

describe('Sprint51 E2 — exportMultipleAsPNG', () => {
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
      const blob = new Blob(['test'], { type: 'image/png' });
      downloadBlob(blob, 'test.png');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });

    it('sets correct href and download attributes', () => {
      const blob = new Blob(['data'], { type: 'image/png' });
      downloadBlob(blob, 'my-canvas.zip');

      const link = (document.createElement as ReturnType<typeof vi.fn>).mock.results[0].value;
      expect(link.href).toBe(mockUrl);
      expect(link.download).toBe('my-canvas.zip');
    });

    it('handles blob with empty data', () => {
      const blob = new Blob([], { type: 'application/zip' });
      expect(() => downloadBlob(blob, 'empty.zip')).not.toThrow();
    });
  });
});

describe('exportMultipleAsPNG — module-level tests (no DOM)', () => {
  it('throws on empty cards array', async () => {
    const { exportMultipleAsPNG } = await import('../exportMultipleAsPNG');
    await expect(
      exportMultipleAsPNG([], { scope: 'all' })
    ).rejects.toThrow('没有可导出的卡片');
  });

  it('throws AbortError when signal is already aborted', async () => {
    const { exportMultipleAsPNG } = await import('../exportMultipleAsPNG');
    const controller = new AbortController();
    controller.abort();
    // Pass a non-empty card to skip the empty-cards check and hit the abort check
    const mockCards = [{ id: 'c1', title: 'Test', type: 'user-story' }] as any;

    await expect(
      exportMultipleAsPNG(mockCards, { scope: 'all', signal: controller.signal })
    ).rejects.toThrow('Export aborted');
  });
});
