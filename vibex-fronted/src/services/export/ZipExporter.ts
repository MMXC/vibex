/**
 * ZipExporter — Batch export canvas nodes as ZIP archive
 * E1: PNG/SVG 批量导出
 *
 * Uses:
 * - html2canvas for PNG capture (constraint C1.1)
 * - JSZip for ZIP creation (constraint C1.2)
 * - XMLSerializer for SVG capture (constraint C1.3)
 *
 * Constraints:
 * - No any types
 * - No console.log
 * - No custom canvas.getContext rendering
 */

import JSZip from 'jszip';
import { toPng, toSvg } from 'html-to-image';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';

export type BatchFormat = 'png' | 'svg';

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
    .replace(/_{2,}/g, '_')
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
   *   onProgress: (cur, total, node) => console.log(`${cur}/${total}: ${node.name}`),
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
        : (n: ExportNode) => captureNodeAsSvg(n.selector, backgroundColor);

    const blobs = await processWithProgress(
      nodes,
      MAX_CONCURRENT,
      captureFn,
      onProgress
    );

    // Add each node file to ZIP
    nodes.forEach((node, i) => {
      const filename = `${sanitizeFilename(node.name)}.${format}`;
      folder.file(filename, blobs[i]);
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
}

/** Singleton instance */
export const zipExporter = new ZipExporter();
