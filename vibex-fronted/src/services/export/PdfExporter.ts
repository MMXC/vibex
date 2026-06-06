/**
 * PdfExporter — PDF export service for VibeX DDS Canvas
 *
 * S67-E5: 画布导出增强 PDF/SVG
 *
 * Provides a clean `exportPdf()` API wrapping jsPDF + html-to-image.
 * Supports A4/Letter paper sizes and single/multi-page layouts.
 *
 * Constraints:
 * - No `any` types
 * - No `canvasLogger.default.debug`
 * - Dynamic import for heavy deps (jspdf, html-to-image)
 */

import type { DDSCard } from '@/types/dds';

// ==================== Types ====================

export type PaperSize = 'A4' | 'Letter';
export type PageLayout = 'single' | 'multi';

export interface PdfExportOptions {
  /** Paper size (default: 'A4') */
  paper?: PaperSize;
  /** Page layout: 'single' (all nodes on one page) or 'multi' (one node per page, default) */
  pages?: PageLayout;
  /** PNG pixel ratio for rasterizing nodes (default: 2) */
  scale?: number;
  /** Background color (default: '#0f0f1a') */
  backgroundColor?: string;
  /** Page title shown in PDF metadata */
  title?: string;
  /** Progress callback: (current, total, nodeName) */
  onProgress?: (current: number, total: number, nodeName: string) => void;
  /** AbortSignal to cancel the export */
  signal?: AbortSignal;
}

export interface PdfExportResult {
  blob: Blob;
  pageCount: number;
}

// ==================== Constants ====================

const PAPER_SIZES: Record<PaperSize, { width: number; height: number; unit: 'mm' }> = {
  A4: { width: 210, height: 297, unit: 'mm' },
  Letter: { width: 215.9, height: 279.4, unit: 'mm' },
};

const MARGIN_MM = 10;
const MAX_CONCURRENT = 3;

// ==================== Helpers ====================

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

/**
 * Collect all exportable nodes from DDSCards.
 */
function collectExportNodes(
  cards: DDSCard[]
): Array<{ nodeId: string; name: string; selector: string }> {
  return cards.map((card) => ({
    nodeId: card.id,
    name: card.title ?? card.id,
    selector: `[data-id="${card.id}"]`,
  }));
}

/**
 * Convert px to mm for a given DPI.
 */
function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4;
}

// ==================== Main Export ====================

/**
 * Export DDS canvas nodes as a PDF document.
 *
 * @param cards - Array of DDSCard from the canvas store
 * @param options - Export options (paper size, page layout, progress callback, abort signal)
 * @returns Promise<PdfExportResult> - PDF blob + page count
 *
 * @example
 * const result = await exportPdf(cards, {
 *   paper: 'A4',
 *   pages: 'multi',
 *   scale: 2,
 *   onProgress: (cur, total, name) => console.log(`${cur}/${total}: ${name}`),
 * });
 * // result.blob → download
 */
export async function exportPdf(
  cards: DDSCard[],
  options: PdfExportOptions = {}
): Promise<PdfExportResult> {
  const {
    paper = 'A4',
    pages = 'multi',
    scale = 2,
    backgroundColor = '#0f0f1a',
    title = 'VibeX Canvas',
    onProgress,
    signal,
  } = options;

  if (signal?.aborted) {
    throw new DOMException('Export aborted', 'AbortError');
  }

  if (!cards || cards.length === 0) {
    throw new Error('No cards to export');
  }

  const nodes = collectExportNodes(cards);
  const paperSpec = PAPER_SIZES[paper];

  // Dynamically import heavy deps
  const [{ jsPDF }, { toPng }] = await Promise.all([
    import('jspdf'),
    import('html-to-image'),
  ]);

  const pdf = new jsPDF({
    orientation: paperSpec.width > paperSpec.height ? 'landscape' : 'portrait',
    unit: paperSpec.unit,
    format: paper === 'A4' ? 'a4' : 'letter',
  });

  // Set PDF metadata
  pdf.setProperties({ title, creator: 'VibeX' });

  const pageW = paperSpec.width - MARGIN_MM * 2;
  const pageH = paperSpec.height - MARGIN_MM * 2;
  const DPI = 96 * scale;

  onProgress?.(0, nodes.length, 'preparing');

  if (pages === 'single') {
    // Single-page: capture entire canvas as one image
    const canvasEl = document.querySelector('[data-canvas-root]') as HTMLElement;
    if (!canvasEl) {
      throw new Error('Canvas element not found');
    }

    const dataUrl: string = await toPng(canvasEl, {
      backgroundColor,
      pixelRatio: scale,
      filter: (node) => {
        // Exclude UI overlays, toolbars
        const el = node as HTMLElement;
        if (el.dataset?.canvasRoot !== undefined) return true;
        if (el.className?.toString?.().includes?.('toolbar')) return false;
        return true;
      },
    });

    const imgWmm = pageW;
    const imgHmm = pxToMm((canvasEl.clientHeight || 800) * scale, DPI) * (pageW / (canvasEl.clientWidth || 1200));

    pdf.addImage(dataUrl, 'PNG', MARGIN_MM, MARGIN_MM, imgWmm, Math.min(imgHmm, pageH));
    onProgress?.(1, 1, 'complete');

    return { blob: pdf.output('blob'), pageCount: 1 };
  }

  // Multi-page: one node per page
  const nodesWithProgress = nodes.map((node, idx) => ({
    node,
    idx,
    total: nodes.length,
  }));

  for (let i = 0; i < nodesWithProgress.length; i += MAX_CONCURRENT) {
    if (signal?.aborted) {
      throw new DOMException('Export aborted', 'AbortError');
    }

    const batch = nodesWithProgress.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async ({ node }) => {
        const domEl = document.querySelector(node.selector) as HTMLElement;
        if (!domEl) return null;

        const dataUrl: string = await toPng(domEl, {
          backgroundColor,
          pixelRatio: scale,
        });

        const imgWpx = domEl.clientWidth || 400;
        const imgHpx = domEl.clientHeight || 300;
        const imgWmm = pageW;
        const imgHmm = pxToMm(imgHpx, DPI) * (pageW / imgWpx);

        return { node, dataUrl, imgWmm, imgHmm };
      })
    );

    for (const result of batchResults) {
      if (!result) continue;
      const { node, dataUrl, imgWmm, imgHmm } = result;

      // Add new page if not the first node
      if (pdf.getNumberOfPages() > 1 || i > 0) {
        pdf.addPage();
      }

      // Center the image on the page
      const offsetX = MARGIN_MM;
      const offsetY = Math.max(MARGIN_MM, (pageH - imgHmm) / 2);

      pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, imgWmm, Math.min(imgHmm, pageH - MARGIN_MM));

      // Node name as footer
      const pageNum = pdf.getNumberOfPages();
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `${sanitizeFilename(node.name)} — ${pageNum}`,
        MARGIN_MM,
        paperSpec.height - 4
      );

      onProgress?.(pdf.getNumberOfPages(), nodes.length, node.name);
    }
  }

  return {
    blob: pdf.output('blob'),
    pageCount: pdf.getNumberOfPages(),
  };
}
