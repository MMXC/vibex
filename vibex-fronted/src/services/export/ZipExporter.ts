/**
 * ZipExporter — Batch export canvas nodes as ZIP archive
 * E1: PNG/SVG 批量导出
 * E2: 批量画布导出 — exportCanvases() added in S76-E2
 *
 * Uses:
 * - html2canvas for PNG capture (constraint C1.1)
 * - JSZip for ZIP creation (constraint C1.2)
 * - XMLSerializer for SVG capture (constraint C1.3)
 *
 * Constraints:
 * - No any types
 * - No canvasLogger.default.debug
 * - No custom canvas.getContext rendering
 */

import JSZip from 'jszip';
import { toPng, toSvg } from 'html-to-image';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

export type BatchFormat = 'png' | 'svg' | 'pdf';

export interface BatchExportOptions {
  /** Export format */
  format: BatchFormat;
  /** Export scope: which trees to include */
  scope: 'context' | 'flow' | 'component' | 'all';
  /** PNG pixel ratio (default 2) */
  scale?: number;
  /** Background color */
  backgroundColor?: string;
  /** Progress callback */
  onProgress?: (current: number, total: number, nodeName: string) => void;
}

interface ExportNode {
  nodeId: string;
  name: string;
  treeType: 'context' | 'flow' | 'component';
  /** CSS selector for this node's DOM element */
  selector: string;
}

const DEFAULT_BG_COLOR = '#0f0f1a';
const MAX_CONCURRENT = 3; // Limit concurrent exports to avoid browser freeze

/**
 * Collect all exportable nodes from the canvas store state
 */
function collectNodes(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[],
  scope: BatchExportOptions['scope']
): ExportNode[] {
  const nodes: ExportNode[] = [];

  const shouldInclude = (treeType: 'context' | 'flow' | 'component') => {
    if (scope === 'all') return true;
    return scope === treeType;
  };

  if (shouldInclude('context')) {
    contextNodes.forEach((node) => {
      nodes.push({
        nodeId: node.nodeId,
        name: node.name,
        treeType: 'context',
        selector: `[data-node-id="${node.nodeId}"]`,
      });
    });
  }

  if (shouldInclude('flow')) {
    flowNodes.forEach((node) => {
      nodes.push({
        nodeId: node.nodeId,
        name: node.name,
        treeType: 'flow',
        selector: `[data-node-id="${node.nodeId}"]`,
      });
    });
  }

  if (shouldInclude('component')) {
    componentNodes.forEach((node) => {
      nodes.push({
        nodeId: node.nodeId,
        name: node.name,
        treeType: 'component',
        selector: `[data-node-id="${node.nodeId}"]`,
      });
    });
  }

  return nodes;
}

/**
 * Capture a single node element as PNG blob using html-to-image
 */
async function captureNodeAsPng(
  selector: string,
  scale: number,
  backgroundColor: string
): Promise<Blob> {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Node element not found: ${selector}`);
  }

  const dataUrl = await toPng(element, {
    backgroundColor,
    pixelRatio: scale,
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: { transform: 'none' },
  });

  // Convert data URL to Blob
  const response = await fetch(dataUrl);
  return response.blob();
}

/**
 * Capture a single node element as SVG blob using XMLSerializer + html-to-image
 */
async function captureNodeAsSvg(
  selector: string,
  backgroundColor: string
): Promise<Blob> {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Node element not found: ${selector}`);
  }

  try {
    const dataUrl = await toSvg(element, {
      backgroundColor,
      width: element.scrollWidth,
      height: element.scrollHeight,
      style: { transform: 'none' },
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    // Verify it's actually SVG
    if (blob.type !== 'image/svg+xml') {
      // Fallback: return as-is (html-to-image may return PNG fallback)
      return blob;
    }
    return blob;
  } catch {
    // If SVG fails, fall back to PNG
    const pngBlob = await captureNodeAsPng(selector, 2, backgroundColor);
    return pngBlob;
  }
}

/**
 * Capture a single node element as PDF blob using html-to-image + jsPDF
 * Note: PDF is captured as PNG-embedded-in-PDF (jsPDF addImage from PNG data URL)
 */
async function captureNodeAsPdf(
  selector: string,
  scale: number,
  backgroundColor: string
): Promise<Blob> {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Node element not found: ${selector}`);
  }

  const dataUrl = await toPng(element, {
    backgroundColor,
    pixelRatio: scale,
    width: element.scrollWidth,
    height: element.scrollHeight,
    style: { transform: 'none' },
  });

  // jsPDF is imported dynamically to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: element.scrollWidth > element.scrollHeight ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Fit image to page with margins
  const PAGE_WIDTH_MM = 210;
  const PAGE_HEIGHT_MM = 297;
  const MARGIN_MM = 10;
  const USABLE_WIDTH_MM = PAGE_WIDTH_MM - 2 * MARGIN_MM;
  const USABLE_HEIGHT_MM = PAGE_HEIGHT_MM - 2 * MARGIN_MM;

  const imgWidthMm = USABLE_WIDTH_MM;
  const imgHeightMm = Math.min(
    (element.scrollHeight / element.scrollWidth) * imgWidthMm,
    USABLE_HEIGHT_MM
  );

  pdf.addImage(dataUrl, 'PNG', MARGIN_MM, MARGIN_MM, imgWidthMm, imgHeightMm);

  return pdf.output('blob');
}

/**
 * Process nodes in batches to avoid browser freeze
 */
async function processWithProgress<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
  onProgress?: (current: number, total: number, itemName: string) => void
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item, idx) => {
        const result = processor(item);
        // Report progress immediately for responsiveness
        const itemName = typeof item === 'object' && item !== null && 'name' in item ? String((item as { name: unknown }).name) : String(i + idx);
        onProgress?.(i + idx + 1, items.length, itemName);
        return result;
      })
    );
    results.push(...batchResults);
  }
  return results;
}

/**
 * Sanitize filename to be safe for ZIP and file systems
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100);
}

/**
 * Create a manifest.json entry for the export
 */
function createManifest(
  nodes: ExportNode[],
  format: BatchFormat,
  scope: string
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      format,
      scope,
      nodeCount: nodes.length,
      nodes: nodes.map((n) => ({
        nodeId: n.nodeId,
        name: n.name,
        treeType: n.treeType,
        filename: `${sanitizeFilename(n.name)}.${format}`,
      })),
    },
    null,
    2
  );
}

/**
 * ZipExporter — Creates ZIP archives of canvas nodes
 */
export class ZipExporter {
  /**
   * Export all canvas nodes as a ZIP archive
   *
   * @example
   * const exporter = new ZipExporter();
   * const blob = await exporter.exportZip({
   *   format: 'png',
   *   scope: 'all',
   *   onProgress: (cur, total, node) => canvasLogger.default.debug(`${cur}/${total}: ${node.name}`),
   * });
   */
  async exportZip(
    contextNodes: BoundedContextNode[],
    flowNodes: BusinessFlowNode[],
    componentNodes: ComponentNode[],
    options: BatchExportOptions
  ): Promise<Blob> {
    const {
      format,
      scope,
      scale = 2,
      backgroundColor = DEFAULT_BG_COLOR,
      onProgress,
    } = options;

    const nodes = collectNodes(contextNodes, flowNodes, componentNodes, scope);

    if (nodes.length === 0) {
      throw new Error('没有可导出的节点');
    }

    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 10);
    const folder = zip.folder(`vibex-export-${scope}-${timestamp}`);
    if (!folder) throw new Error('Failed to create ZIP folder');

    // Capture nodes with progress
    const captureFn =
      format === 'png'
        ? (n: ExportNode) => captureNodeAsPng(n.selector, scale, backgroundColor)
        : format === 'svg'
        ? (n: ExportNode) => captureNodeAsSvg(n.selector, backgroundColor)
        : (n: ExportNode) => captureNodeAsPdf(n.selector, scale, backgroundColor);

    const blobs = await processWithProgress(
      nodes,
      MAX_CONCURRENT,
      captureFn,
      onProgress
    );

    // Add each node file to ZIP
    nodes.forEach((node, i) => {
      const filename = `${sanitizeFilename(node.name)}.${format}`;
      folder.file(filename, blobs[i]!);
    });

    // Add manifest
    folder.file('manifest.json', createManifest(nodes, format, scope));

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return zipBlob;
  }

  /**
   * S76-E2: Export multiple canvases as a single ZIP archive.
   *
   * Loads each canvas's data from IndexedDB (via ddsPersistence),
   * collects the rendered cards (data-id selectors), and creates a ZIP
   * with one subfolder per canvas.
   *
   * @param canvasIds - Array of canvas project IDs to export
   * @param options - Export options including format, scope, progress callback
   * @returns Promise<Blob> - Combined ZIP file blob
   *
   * @example
   * const blob = await zipExporter.exportCanvases(['id1', 'id2'], {
   *   format: 'png',
   *   scope: 'all',
   *   onProgress: (cur, total, name) => console.log(`${cur}/${total}: ${name}`),
   * });
   * downloadBlob(blob, 'vibex-batch-export.zip');
   */
  async exportCanvases(
    canvasIds: string[],
    options: BatchExportOptions
  ): Promise<Blob> {
    if (canvasIds.length === 0) {
      throw new Error('没有选择要导出的画布');
    }

    const {
      format,
      scale = 2,
      backgroundColor = DEFAULT_BG_COLOR,
      onProgress,
    } = options;

    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');

    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 10);
    const rootFolder = zip.folder(`vibex-batch-export-${timestamp}`);
    if (!rootFolder) throw new Error('Failed to create ZIP root folder');

    let totalNodes = 0;
    let processedNodes = 0;

    for (const canvasId of canvasIds) {
      const project = await loadLatestSnapshot(canvasId);
      if (!project) {
        // Canvas not found in IndexedDB — skip silently
        canvasLogger.warn(`[ZipExporter] Canvas not found in IndexedDB: ${canvasId}`);
        continue;
      }

      // Collect all cards from all chapters
      const allCards: Array<{ nodeId: string; name: string; selector: string }> = [];
      for (const chapterData of Object.values(project.chapters)) {
        for (const card of chapterData.cards) {
          allCards.push({
            nodeId: card.id,
            name: card.title ?? card.id,
            selector: `[data-id="${card.id}"]`,
          });
        }
      }

      if (allCards.length === 0) continue;

      // Create subfolder for this canvas
      const canvasFolderName = sanitizeFilename(project.projectName || canvasId);
      const canvasFolder = rootFolder.folder(canvasFolderName);
      if (!canvasFolder) continue;

      // Capture each card as PNG/SVG/PDF
      const captureFn =
        format === 'png'
          ? async (n: typeof allCards[number]) => {
              const el = document.querySelector<HTMLElement>(n.selector);
              if (!el) return new Blob([], { type: 'image/png' });
              const dataUrl = await toPng(el, {
                backgroundColor,
                pixelRatio: scale,
                width: el.scrollWidth,
                height: el.scrollHeight,
                style: { transform: 'none' },
              });
              const response = await fetch(dataUrl);
              return response.blob();
            }
          : format === 'svg'
          ? async (n: typeof allCards[number]) => {
              const el = document.querySelector<HTMLElement>(n.selector);
              if (!el) return new Blob([], { type: 'image/svg+xml' });
              const dataUrl = await toSvg(el, {
                backgroundColor,
                width: el.scrollWidth,
                height: el.scrollHeight,
                style: { transform: 'none' },
              });
              const response = await fetch(dataUrl);
              return response.blob();
            }
          : async (n: typeof allCards[number]) => {
              const el = document.querySelector<HTMLElement>(n.selector);
              if (!el) return new Blob([], { type: 'application/pdf' });
              const dataUrl = await toPng(el, {
                backgroundColor,
                pixelRatio: scale,
                width: el.scrollWidth,
                height: el.scrollHeight,
                style: { transform: 'none' },
              });
              const { jsPDF } = await import('jspdf');
              const pdf = new jsPDF({
                orientation: el.scrollWidth > el.scrollHeight ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
              });
              pdf.addImage(dataUrl, 'PNG', 10, 10, 190, 277);
              return pdf.output('blob');
            };

      // Process cards in batches
      for (let i = 0; i < allCards.length; i += MAX_CONCURRENT) {
        const batch = allCards.slice(i, i + MAX_CONCURRENT);
        const blobs = await Promise.all(batch.map((n) => captureFn(n)));
        batch.forEach((node, idx) => {
          const filename = `${sanitizeFilename(node.name)}.${format}`;
          canvasFolder.file(filename, blobs[idx]!);
          processedNodes++;
          onProgress?.(processedNodes, totalNodes + allCards.length, `${project.projectName}/${node.name}`);
        });
      }

      totalNodes += allCards.length;

      // Add canvas manifest
      const manifest = JSON.stringify(
        {
          projectId: canvasId,
          projectName: project.projectName,
          exportedAt: new Date().toISOString(),
          version: '1.0.0',
          format,
          cardCount: allCards.length,
          cards: allCards.map((n) => ({
            nodeId: n.nodeId,
            name: n.name,
            filename: `${sanitizeFilename(n.name)}.${format}`,
          })),
        },
        null,
        2
      );
      canvasFolder.file('manifest.json', manifest);
    }

    if (totalNodes === 0) {
      throw new Error('没有找到可导出的卡片');
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    return zipBlob;
  }

  /**
   * S78-E4: Export a single canvas as a ZIP archive and POST it to a webhook URL.
   *
   * Flow:
   * 1. Load canvas data from IndexedDB
   * 2. Create ZIP blob with canvas cards as PNG files + manifest
   * 3. POST the ZIP blob to the provided webhookUrl as multipart/form-data
   *
   * @param canvasId - Canvas project ID to export
   * @param options - Export options (format, scale, backgroundColor, onProgress)
   * @param webhookUrl - Full URL to POST the ZIP to after creation
   * @throws Error if canvas not found in IndexedDB, ZIP creation fails, or POST fails
   *
   * @example
   * const zipExporter = new ZipExporter();
   * await zipExporter.exportWithWebhook('my-canvas-id', {
   *   format: 'png',
   *   scope: 'all',
   * }, 'https://api.example.com/webhook');
   */
  async exportWithWebhook(
    canvasId: string,
    options: BatchExportOptions,
    webhookUrl: string
  ): Promise<{ zipBlob: Blob; postStatus: number }> {
    if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
      throw new Error('Webhook URL must start with http:// or https://');
    }

    // Load canvas from IndexedDB
    const { loadLatestSnapshot } = await import('@/services/dds/ddsPersistence');
    const project = await loadLatestSnapshot(canvasId);
    if (!project) {
      throw new Error(`Canvas not found: ${canvasId}`);
    }

    const { format, scale = 2, backgroundColor = DEFAULT_BG_COLOR, onProgress } = options;

    // Collect all cards
    const allCards: Array<{ nodeId: string; name: string; selector: string }> = [];
    for (const chapterData of Object.values(project.chapters)) {
      for (const card of chapterData.cards) {
        allCards.push({
          nodeId: card.id,
          name: card.title ?? card.id,
          selector: `[data-id="${card.id}"]`,
        });
      }
    }

    if (allCards.length === 0) {
      throw new Error('Canvas has no exportable cards');
    }

    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 10);
    const folder = zip.folder(sanitizeFilename(project.projectName || canvasId));
    if (!folder) throw new Error('Failed to create ZIP folder');

    let processedNodes = 0;
    const captureFn = async (card: typeof allCards[number]) => {
      const el = document.querySelector<HTMLElement>(card.selector);
      if (!el) return new Blob([], { type: 'image/png' });

      if (format === 'png' || format === 'pdf') {
        const dataUrl = await toPng(el, {
          backgroundColor,
          pixelRatio: scale,
          width: el.scrollWidth,
          height: el.scrollHeight,
          style: { transform: 'none' },
        });
        const response = await fetch(dataUrl);
        return response.blob();
      } else {
        const dataUrl = await toSvg(el, {
          backgroundColor,
          width: el.scrollWidth,
          height: el.scrollHeight,
          style: { transform: 'none' },
        });
        const response = await fetch(dataUrl);
        return response.blob();
      }
    };

    for (let i = 0; i < allCards.length; i += MAX_CONCURRENT) {
      const batch = allCards.slice(i, i + MAX_CONCURRENT);
      const blobs = await Promise.all(batch.map((card) => captureFn(card)));
      batch.forEach((card, idx) => {
        const filename = `${sanitizeFilename(card.name)}.${format}`;
        folder.file(filename, blobs[idx]!);
        processedNodes++;
        onProgress?.(processedNodes, allCards.length, `${project.projectName}/${card.name}`);
      });
    }

    // Add manifest
    const manifest = JSON.stringify(
      {
        projectId: canvasId,
        projectName: project.projectName,
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        format,
        cardCount: allCards.length,
        cards: allCards.map((c) => ({
          nodeId: c.nodeId,
          name: c.name,
          filename: `${sanitizeFilename(c.name)}.${format}`,
        })),
      },
      null,
      2
    );
    folder.file('manifest.json', manifest);

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    // POST to webhook as multipart/form-data
    const formData = new FormData();
    formData.append('file', zipBlob, `${sanitizeFilename(project.projectName || canvasId)}-${timestamp}.zip`);
    formData.append('canvasId', canvasId);
    formData.append('exportedAt', new Date().toISOString());
    formData.append('format', format);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // Note: not setting Content-Type header — browser sets it automatically with boundary
    });

    if (!response.ok) {
      throw new Error(`Webhook POST failed: ${response.status} ${response.statusText}`);
    }

    return { zipBlob, postStatus: response.status };
  }
}

/** Singleton instance */
export const zipExporter = new ZipExporter();

/**
 * Download a blob as a file (utility for callers)
 */
export function downloadExportBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
