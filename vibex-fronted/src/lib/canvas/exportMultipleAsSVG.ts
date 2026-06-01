/**
 * exportMultipleAsSVG — Batch SVG export for DDS Canvas
 *
 * Wraps ZipExporter for DDS canvas context/flow/component cards.
 * DDS canvas renders cards as ReactFlow nodes with `data-id` attribute
 * (not `data-node-id` like the prototype canvas), so we use `data-id` selector.
 *
 * E2: SVG 批量导出
 */

import type { DDSCard } from '@/types/dds';

export interface BatchSVGExportOptions {
  /** Export scope */
  scope: 'requirement' | 'context' | 'flow' | 'api' | 'business-rules' | 'all';
  /** Background color (default #0f0f1a) */
  backgroundColor?: string;
  /** Progress callback: (current, total, nodeName) */
  onProgress?: (current: number, total: number, nodeName: string) => void;
  /** Abort signal to cancel the export */
  signal?: AbortSignal;
}

function collectDDSCards(
  cards: DDSCard[],
  _scope: BatchSVGExportOptions['scope']
): Array<{ nodeId: string; name: string; treeType: 'context' | 'flow' | 'component'; selector: string }> {
  return cards.map((card) => ({
    nodeId: card.id,
    name: card.title ?? card.id,
    treeType: 'component' as const,
    // ReactFlow v12 renders nodes with data-id attribute
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
 * Export multiple DDS canvas cards as SVG files in a ZIP archive.
 *
 * @param cards - Array of DDSCard to export
 * @param options - Export options including scope, progress callback, abort signal
 * @returns Promise<Blob> - ZIP file blob
 *
 * @example
 * const blob = await exportMultipleAsSVG(cards, {
 *   scope: 'all',
 *   onProgress: (cur, total, name) => console.log(`${cur}/${total}: ${name}`),
 * });
 */
export async function exportMultipleAsSVG(
  cards: DDSCard[],
  options: BatchSVGExportOptions
): Promise<Blob> {
  const {
    scope,
    backgroundColor = '#0f0f1a',
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

  const { toSvg } = await import('html-to-image');
  const JSZip = (await import('jszip')).default;
  const MAX_CONCURRENT = 3;

  const zip = new JSZip();
  const timestamp = new Date().toISOString().slice(0, 10);
  const folder = zip.folder(`vibex-dds-export-svg-${timestamp}`);
  if (!folder) throw new Error('Failed to create ZIP folder');

  const svgBlobs: Blob[] = [];
  for (let i = 0; i < exportNodes.length; i += MAX_CONCURRENT) {
    if (signal?.aborted) {
      throw new DOMException('Export aborted', 'AbortError');
    }
    const batch = exportNodes.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (node, idx) => {
        wrappedProgress?.(i + idx + 1, exportNodes.length, node.name);
        const el = document.querySelector<HTMLElement>(node.selector);
        if (!el) {
          return new Blob(['<!-- Node not found in DOM -->'], { type: 'image/svg+xml' });
        }
        const svgString = await toSvg(el, {
          backgroundColor,
          width: el.scrollWidth,
          height: el.scrollHeight,
          style: { transform: 'none' },
        });
        return new Blob([svgString], { type: 'image/svg+xml' });
      })
    );
    svgBlobs.push(...batchResults);
  }

  // Add each card SVG to ZIP
  exportNodes.forEach((node, i) => {
    const filename = `${sanitizeFilename(node.name)}.svg`;
    folder.file(filename, svgBlobs[i]!);
  });

  // Add manifest
  const manifest = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      format: 'svg',
      nodeCount: exportNodes.length,
      nodes: exportNodes.map((n, i) => ({
        nodeId: n.nodeId,
        name: n.name,
        filename: `${sanitizeFilename(n.name)}.svg`,
      })),
    },
    null,
    2
  );
  folder.file('manifest.json', manifest);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
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
 * Export multiple cards as SVG and auto-download as ZIP.
 */
export async function exportAndDownloadAsSvgZip(
  cards: DDSCard[],
  options: BatchSVGExportOptions
): Promise<void> {
  const blob = await exportMultipleAsSVG(cards, options);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vibex-export-svg-${timestamp}.zip`);
}
