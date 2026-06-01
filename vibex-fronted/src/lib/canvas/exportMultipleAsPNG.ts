/**
 * exportMultipleAsPNG — Batch PNG export for DDS Canvas
 *
 * Wraps ZipExporter for DDS canvas context/flow/component cards.
 * DDS canvas renders cards as ReactFlow nodes with `data-id` attribute
 * (not `data-node-id` like the prototype canvas), so we use `data-id` selector.
 *
 * E2: PNG 批量导出
 */

import { zipExporter } from '@/services/export/ZipExporter';
import type { DDSCard } from '@/types/dds';

export interface BatchExportOptions {
  /** Export scope */
  scope: 'requirement' | 'context' | 'flow' | 'api' | 'business-rules' | 'all';
  /** PNG pixel ratio (default 2) */
  scale?: number;
  /** Background color (default #0f0f1a) */
  backgroundColor?: string;
  /** Progress callback: (current, total, nodeName) */
  onProgress?: (current: number, total: number, nodeName: string) => void;
  /** Abort signal to cancel the export */
  signal?: AbortSignal;
}

function collectDDSCards(
  cards: DDSCard[],
  _scope: BatchExportOptions['scope']
): Array<{ nodeId: string; name: string; treeType: 'context' | 'flow' | 'component'; selector: string }> {
  return cards.map((card) => ({
    nodeId: card.id,
    name: card.title ?? card.id,
    treeType: 'component' as const,
    // ReactFlow v12 renders nodes with data-id attribute, not data-node-id
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
 * Export multiple DDS canvas cards as a single ZIP archive.
 *
 * @param cards - Array of DDSCard to export
 * @param options - Export options including scope, progress callback, abort signal
 * @returns Promise<Blob> - ZIP file blob
 *
 * @example
 * const blob = await exportMultipleAsPNG(cards, {
 *   scope: 'all',
 *   scale: 2,
 *   onProgress: (cur, total, name) => console.log(`${cur}/${total}: ${name}`),
 * });
 * // Auto-downloads
 * downloadBlob(blob, 'vibex-export.zip');
 */
export async function exportMultipleAsPNG(
  cards: DDSCard[],
  options: BatchExportOptions
): Promise<Blob> {
  const {
    scope,
    scale = 2,
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

  // Build export nodes using ReactFlow data-id selector
  const exportNodes = collectDDSCards(cards, scope);

  // Intercept progress to support abort
  const wrappedProgress = onProgress
    ? (current: number, total: number, nodeName: string) => {
        if (signal?.aborted) {
          throw new DOMException('Export aborted', 'AbortError');
        }
        onProgress(current, total, nodeName);
      }
    : undefined;

  // Use ZipExporter's batch processing (concurrency=3, progress, abort support)
  const nodesForZipExporter = exportNodes.map((n) => ({
    nodeId: n.nodeId,
    name: n.name,
    // ZipExporter expects BoundedContextNode interface but we pass our own
    // since the selector is compatible with data-id
    type: 'component' as const,
    selector: n.selector,
    treeType: n.treeType,
  }));

  // We can't directly use zipExporter.exportZip since it expects
  // BoundedContextNode[] but we have DDSCard[]. Instead, do inline export:
  const { toPng } = await import('html-to-image');
  const JSZip = (await import('jszip')).default;
  const MAX_CONCURRENT = 3;

  const zip = new JSZip();
  const timestamp = new Date().toISOString().slice(0, 10);
  const folder = zip.folder(`vibex-dds-export-${timestamp}`);
  if (!folder) throw new Error('Failed to create ZIP folder');

  // Process in batches of MAX_CONCURRENT
  const blobs: Blob[] = [];
  for (let i = 0; i < nodesForZipExporter.length; i += MAX_CONCURRENT) {
    if (signal?.aborted) {
      throw new DOMException('Export aborted', 'AbortError');
    }
    const batch = nodesForZipExporter.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map(async (node, idx) => {
        wrappedProgress?.(i + idx + 1, nodesForZipExporter.length, node.name);
        const el = document.querySelector<HTMLElement>(node.selector);
        if (!el) {
          // Node not found in DOM — skip silently
          return new Blob([], { type: 'image/png' });
        }
        const dataUrl = await toPng(el, {
          backgroundColor,
          pixelRatio: scale,
          width: el.scrollWidth,
          height: el.scrollHeight,
          style: { transform: 'none' },
        });
        const response = await fetch(dataUrl);
        return response.blob();
      })
    );
    blobs.push(...batchResults);
  }

  // Add each card PNG to ZIP
  nodesForZipExporter.forEach((node, i) => {
    const filename = `${sanitizeFilename(node.name)}.png`;
    folder.file(filename, blobs[i]!);
  });

  // Add manifest
  const manifest = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      format: 'png',
      scale,
      nodeCount: nodesForZipExporter.length,
      nodes: nodesForZipExporter.map((n, i) => ({
        nodeId: n.nodeId,
        name: n.name,
        filename: `${sanitizeFilename(n.name)}.png`,
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
 * Export multiple cards as PNG and auto-download as ZIP.
 * Convenience wrapper combining exportMultipleAsPNG + downloadBlob.
 */
export async function exportAndDownloadAsZip(
  cards: DDSCard[],
  options: BatchExportOptions
): Promise<void> {
  const blob = await exportMultipleAsPNG(cards, options);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `vibex-export-${timestamp}.zip`);
}
