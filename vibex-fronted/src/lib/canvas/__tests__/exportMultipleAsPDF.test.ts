/**
 * exportMultipleAsPDF.test.ts — Sprint52 E2: Batch PDF export tests
 *
 * Tests:
 * - exportMultipleAsPDF: throws on empty cards
 * - exportAndDownloadAsPDF: triggers download
 * - Error handling: aborted export
 * - PDF integration: produces a valid PDF blob
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadBlob } from '../exportMultipleAsPDF';

describe('Sprint52 E2 — exportMultipleAsPDF', () => {
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
    it('creates a download link for PDF blob', () => {
      const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });
      downloadBlob(blob, 'test.pdf');

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test.pdf');
      expect(mockLink.click).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportMultipleAsPDF — module-level tests (no DOM)', () => {
    it('throws on empty cards array', async () => {
      const { exportMultipleAsPDF } = await import('../exportMultipleAsPDF');
      await expect(
        exportMultipleAsPDF([], { scope: 'all' })
      ).rejects.toThrow('没有可导出的卡片');
    });

    it('throws AbortError when signal is already aborted', async () => {
      const { exportMultipleAsPDF } = await import('../exportMultipleAsPDF');
      const controller = new AbortController();
      controller.abort();
      const mockCards = [{ id: 'c1', title: 'Test', type: 'user-story' }] as any;
      try {
        await exportMultipleAsPDF(mockCards, { scope: 'all', signal: controller.signal });
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(DOMException);
        expect((err as DOMException).name).toBe('AbortError');
      }
    });
  });
});

describe('Sprint52 E2 — PDF export blob integration', () => {
  it('pdf export produces a PDF blob', async () => {
    // Inline mock values to avoid hoisting issues with vi.mock
    vi.mock('html-to-image', () => ({
      toPng: vi.fn().mockResolvedValue(
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      ),
    }));

    // Must use class + mockImplementation (not mockReturnValue) for `new jsPDF()` calls
    vi.mock('jspdf', () => ({
      jsPDF: vi.fn().mockImplementation(
        class MockJsPDF {
          addPage = vi.fn();
          addImage = vi.fn();
          setTextColor = vi.fn();
          setFontSize = vi.fn();
          text = vi.fn();
          output = vi.fn().mockReturnValue(
            new Blob(['%PDF-1.4'], { type: 'application/pdf' })
          );
        }
      ),
    }));

    vi.stubGlobal('document', {
      querySelector: vi.fn(() => ({
        scrollWidth: 200,
        scrollHeight: 100,
      })),
      createElement: vi.fn(() => ({})),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    const { exportMultipleAsPDF } = await import('../exportMultipleAsPDF');
    const mockCards = [{ id: 'c1', title: 'Canvas Page', type: 'user-story' }] as any;
    const result = await exportMultipleAsPDF(mockCards, { scope: 'all' });
    expect(result).toBeInstanceOf(Blob);
    expect(result.type).toBe('application/pdf');
  });
});
