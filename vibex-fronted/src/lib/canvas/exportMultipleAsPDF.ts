/**
 * exportMultipleAsPDF — Batch PDF export for DDS Canvas
 *
 * Each card becomes one page in a multi-page PDF using jsPDF.
 * DDS canvas renders cards as ReactFlow nodes with `data-id` attribute.
 *
 * E2: PDF 批量导出
 */

import type { DDSCard } from '@/types/dds';

export interface BatchPDFExportOptions {
  /** Export scope */
  scope: 'requirement' | 'context' | 'flow' | 'api' | 'business-rules' | 'all';
  /** PNG pixel ratio for rasterizing nodes (default 2) */
  scale?: number;
  /** Background color (default #0f0f1a) */
  backgroundColor?: string;
  /** Page title */
  pageTitle?: string;
  /** Progress callback: (current, total, nodeName) */
  onProgress?: (current: number, total: number, nodeName: string) => void;
  /** Abort signal to cancel the export */
  signal?: AbortSignal;
}

function collectDDSCards(
  cards: DDSCard[],
  _scope: BatchPDFExportOptions['scope']
): Array<{ nodeId: string; name: string; selector: string }> {
  return cards.map((card) => ({
    nodeId: card.id,
    name: card.title ?? card.id,
    selector: `[data-id="${card.id}"]`,
  }));
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

/**
 * Export multiple DDS canvas cards as a multi-page PDF.
 *
 * @param cards - Array of DDSCard to export
 * @param options - Export options including scope, progress callback, abort signal
 * @returns Promise<Blob> - PDF file blob
 *
 * @example
 * const blob = await exportMultipleAsPDF(cards, {
 *   scope: 'all',
 *   scale: 2,
 *   onProgress: (cur, total, name) => console.log(`${cur}/${total}: ${name}`),
 * });
 */
export async function exportMultipleAsPDF(
  cards: DDSCard[],
  options: BatchPDFExportOptions
): Promise<Blob> {
  const {
    scope,
    scale = 2,
    backgroundColor = '#0f0f1a',
    pageTitle,
    onProgress,
    signal,
  } = options;

  if (signal?.aborted) {
    throw new DOMException('Export aborted', 'AbortError');
  }

  if (cards.length === 0) {
    throw new Error('没有可导出的卡片');
  }

  const exportNodes = collectDDSCards(cards, scope);

  const wrappedProgress = onProgress
    ? (current: number, total: number, nodeName: string) => {
        if (signal?.aborted) {
          throw new DOMException('Export aborted', 'AbortError');
        }
        onProgress(current, total, nodeName);
      }
    : undefined;

  const { toPng } = await import('html-to-image');
  const { jsPDF } = await import('jspdf');
  const MAX_CONCURRENT = 3;

  // Capture all nodes as PNG data URLs first
  const pngDataUrls: Array<{ node: typeof exportNodes[0]; dataUrl: string; width: number; height: number }> = [];

  for (let i = 0; i < exportNodes.length; i += MAX_CONCURRENT) {
    if (signal?.aborted) {
      throw new DOMException('Export aborted', 'AbortError');
    }
    const batch = exportNodes.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (node, idx) => {
        wrappedProgress?.(i + idx + 1, exportNodes.length * 2, node.name);
        const el = document.querySelector<HTMLElement>(node.selector);
        if (!el) {
          return { node, dataUrl: '', width: 0, height: 0 };
        }
        const dataUrl = await toPng(el, {
          backgroundColor,
          pixelRatio: scale,
          width: el.scrollWidth,
          height: el.scrollHeight,
          style: { transform: 'none' },
        });
        // Parse dimensions from data URL
        const base64 = dataUrl.split(',')[1] ?? '';
        const binary = atob(base64);
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let j = 0; j < len; j++) buffer[j] = binary.charCodeAt(j);
        const blob = new Blob([buffer], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        // Synchronous dimension reading isn't possible without onload,
        // but we use the known scrollWidth/scrollHeight as fallback
        const width = el.scrollWidth * scale;
        const height = el.scrollHeight * scale;
        URL.revokeObjectURL(url);
        return { node, dataUrl, width, height };
      })
    );
    pngDataUrls.push(...batchResults);
  }

  // A4 dimensions in mm
  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;
  const MARGIN_MM = 10;
  const USABLE_WIDTH_MM = PAGE_WIDTH_MM - 2 * MARGIN_MM;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const hasTitle = !!pageTitle;

  for (let i = 0; i < pngDataUrls.length; i++) {
    if (signal?.aborted) {
      throw new DOMException('Export aborted', 'AbortError');
    }

    if (i > 0 || hasTitle) {
      pdf.addPage();
    }

    wrappedProgress?.(exportNodes.length + i + 1, exportNodes.length * 2, pngDataUrls[i].node.name);

    const { dataUrl, width, height, node } = pngDataUrls[i];

    // Add title above image
    pdf.setFontSize(10);
    pdf.setTextColor(180);
    pdf.text(sanitizeFilename(node.name), MARGIN_MM, MARGIN_MM);

    // Calculate image dimensions to fit in usable area while maintaining aspect ratio
    const imgWidthMm = USABLE_WIDTH_MM;
    const imgHeightMm = Math.min(
      (height / width) * imgWidthMm,
      PAGE_HEIGHT_MM - 2 * MARGIN_MM - (hasTitle ? 6 : 0)
    );

    const xMm = MARGIN_MM;
    const yMm = MARGIN_MM + (hasTitle ? 5 : 0);

    try {
      pdf.addImage(dataUrl, 'PNG', xMm, yMm, imgWidthMm, imgHeightMm);
    } catch (err) {
      // If image fails (e.g., too large), add page with error text
      pdf.setFontSize(9);
      pdf.setTextColor(200, 100, 100);
      pdf.text(`[导出失败: ${node.name}]`, xMm, yMm + 10);
    }
  }

  return pdf.output('blob');
}

/**
 * Download a blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple cards as PDF and auto-download.
 */
export async function exportAndDownloadAsPDF(
  cards: DDSCard[],
  options: BatchPDFExportOptions
): Promise<void> {
  const blob = await exportMultipleAsPDF(cards, options);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vibex-export-${timestamp}.pdf`);
}
