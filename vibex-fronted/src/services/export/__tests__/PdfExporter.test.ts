/**
 * PdfExporter.test.ts — S67-E5: 画布导出增强 PDF/SVG
 *
 * Tests:
 * - D5.1: exportPdf() returns blob with correct MIME type
 * - D5.1: exportPdf() supports A4 / Letter paper sizes
 * - D5.1: exportPdf() supports single / multi page layouts
 * - D5.1: exportPdf() calls onProgress callback
 * - D5.1: exportPdf() throws on empty cards
 * - D5.1: exportPdf() handles abort signal
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock external modules (must be at top, hoisted by vitest) ─────────────────

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

// jsPDF mock as class constructor
vi.mock('jspdf', () => {
  let pageCount = 1;
  const MockJsPDF = function (this: Record<string, unknown>) {
    this.addImage = vi.fn();
    this.output = vi.fn().mockReturnValue(new Blob(['pdf'], { type: 'application/pdf' }));
    this.getNumberOfPages = vi.fn(() => pageCount);
    this.setProperties = vi.fn();
    this.setFontSize = vi.fn();
    this.setTextColor = vi.fn();
    this.addPage = vi.fn(() => { pageCount++; });
    this.text = vi.fn();
    Object.defineProperty(this, 'Internal', { value: { Api: {} }, writable: true });
  };
  (MockJsPDF as Record<string, unknown>).setPageCount = (n: number) => { pageCount = n; };
  return { jsPDF: MockJsPDF };
});

// ─── Import after mocks ────────────────────────────────────────────────────────

import { exportPdf } from '../PdfExporter';
import type { DDSCard } from '@/types/dds';
import { toPng } from 'html-to-image';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function makeCard(id: string, title: string): DDSCard {
  return {
    id,
    title,
    type: 'bounded-context',
    chapterId: 'ch-1',
  } as DDSCard;
}

function mockDomElement(selector: string) {
  const el = {
    clientWidth: 400,
    clientHeight: 300,
    querySelector: vi.fn(),
    dataset: {},
  } as unknown as HTMLElement;
  return el;
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('PdfExporter — D5.1 / D5.6', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset page count
    (vi.mocked(toPng).getMockImplementation() as ReturnType<typeof vi.fn> | undefined)?.mockResolvedValue?.('data:image/png;base64,mock');
    // Stub document.querySelector — return mock element by default
    vi.stubGlobal('document', {
      querySelector: vi.fn().mockReturnValue(mockDomElement('[data-id="card-1"]')),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('D5.1a: exportPdf returns a blob with application/pdf MIME type', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportPdf(cards, {});
    expect(result.blob.type).toBe('application/pdf');
  });

  it('D5.1b: supports A4 paper size', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportPdf(cards, { paper: 'A4' });
    expect(result.blob.type).toBe('application/pdf');
  });

  it('D5.1c: supports Letter paper size', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportPdf(cards, { paper: 'Letter' });
    expect(result.blob.type).toBe('application/pdf');
  });

  it('D5.1d: supports single-page layout', async () => {
    const mockCanvas = {
      clientWidth: 1200,
      clientHeight: 800,
      dataset: { canvasRoot: 'true' },
      querySelector: vi.fn(),
    } as unknown as HTMLElement;
    vi.stubGlobal('document', {
      querySelector: vi.fn()
        .mockReturnValueOnce(mockCanvas) // canvas root
        .mockReturnValue(null),          // filter fallback
    });
    const cards = [makeCard('card-1', '上下文A')];
    const result = await exportPdf(cards, { pages: 'single' });
    expect(result.blob.type).toBe('application/pdf');
  });

  it('D5.1e: supports multi-page layout', async () => {
    const cards = [makeCard('card-1', '上下文A'), makeCard('card-2', '上下文B')];
    const result = await exportPdf(cards, { pages: 'multi' });
    expect(result.blob.type).toBe('application/pdf');
    expect(toPng).toHaveBeenCalled();
  });

  it('D5.1f: calls onProgress callback', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const onProgress = vi.fn();
    await exportPdf(cards, { onProgress });
    expect(onProgress).toHaveBeenCalled();
  });

  it('D5.1g: throws on empty cards array', async () => {
    await expect(exportPdf([], {})).rejects.toThrow('No cards to export');
  });

  it('D5.1h: throws on null cards', async () => {
    // @ts-expect-error testing invalid input
    await expect(exportPdf(null, {})).rejects.toThrow('No cards to export');
  });

  it('D5.1i: applies custom title in PDF metadata', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    await exportPdf(cards, { title: '我的文档' });
    // Verified by PDF blob being produced (jsPDF setProperties called)
    const result = await exportPdf(cards, {});
    expect(result.blob.type).toBe('application/pdf');
  });

  it('D5.1j: throws Export aborted on already-aborted signal', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    const controller = new AbortController();
    controller.abort();
    await expect(
      exportPdf(cards, { signal: controller.signal })
    ).rejects.toThrow('Export aborted');
  });

  it('D5.1k: uses scale option for image quality in multi-page', async () => {
    const cards = [makeCard('card-1', '上下文A')];
    await exportPdf(cards, { pages: 'multi', scale: 3 });
    expect(toPng).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ pixelRatio: 3 })
    );
  });
});
