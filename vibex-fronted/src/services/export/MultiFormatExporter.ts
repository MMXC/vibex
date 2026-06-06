/**
 * MultiFormatExporter — Orchestrates PNG + SVG + PDF generation + ZIP bundling
 * S70-E3: 多格式批量画布导出
 *
 * Uses:
 * - html-to-image for PNG/SVG capture
 * - html2canvas + jsPDF for PDF capture
 * - JSZip for ZIP bundling
 *
 * Constraints:
 * - No any types
 * - No canvasLogger.default.debug
 */
import JSZip from 'jszip';
import { toPng, toSvg } from 'html-to-image';
import type { BoundedContextNode, BusinessFlowNode, ComponentNode } from '@/lib/canvas/types';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

export type MultiFormatType = 'png' | 'svg' | 'pdf';

export interface MultiFormatOptions {
  /** Which formats to include in the zip */
  formats: MultiFormatType[];
  /** Canvas ID for export */
  canvasId: string;
  /** Background color for captures */
  backgroundColor?: string;
  /** PNG pixel ratio (default 2) */
  scale?: number;
  /** Progress callback */
  onProgress?: (stage: string, current: number, total: number) => void;
}

interface FormatResult {
  format: MultiFormatType;
  filename: string;
  blob: Blob;
}

function getNodeSelector(
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[]
): Array<{ selector: string; name: string }> {
  const result: Array<{ selector: string; name: string }> = [];
  for (const node of contextNodes) {
    result.push({ selector: `[data-node-id="${node.nodeId}"]`, name: node.name });
  }
  for (const node of flowNodes) {
    result.push({ selector: `[data-node-id="${node.nodeId}"]`, name: node.name });
  }
  for (const node of componentNodes) {
    result.push({ selector: `[data-node-id="${node.nodeId}"]`, name: node.name });
  }
  return result;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_').slice(0, 50);
}

async function captureNodeAsPdf(selector: string, backgroundColor: string, scale: number): Promise<Blob> {
  // Dynamic import to avoid SSR issues
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const element = document.querySelector<HTMLElement>(selector);
  if (!element) {
    throw new Error(`Node element not found: ${selector}`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  return pdf.output('blob');
}

/**
 * Generate all format blobs for a single node
 */
async function generateNodeFormats(
  selector: string,
  nodeName: string,
  formats: MultiFormatType[],
  bgColor: string,
  scale: number,
  onProgress: MultiFormatOptions['onProgress'],
  stage: string,
  total: number,
  nodeIndex: number
): Promise<FormatResult[]> {
  const results: FormatResult[] = [];
  const safeName = sanitizeFilename(nodeName);

  for (const format of formats) {
    try {
      if (format === 'png') {
        onProgress?.(`生成PNG`, nodeIndex, total);
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) continue;
        const dataUrl = await toPng(element, {
          backgroundColor: bgColor,
          pixelRatio: scale,
          width: element.scrollWidth,
          height: element.scrollHeight,
        });
        const blob = await fetch(dataUrl).then(r => r.blob());
        results.push({ format: 'png', filename: `${safeName}.png`, blob });
      } else if (format === 'svg') {
        onProgress?.(`生成SVG`, nodeIndex, total);
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) continue;
        const dataUrl = await toSvg(element, {
          backgroundColor: bgColor,
        });
        const blob = await fetch(dataUrl).then(r => r.blob());
        results.push({ format: 'svg', filename: `${safeName}.svg`, blob });
      } else if (format === 'pdf') {
        onProgress?.(`生成PDF`, nodeIndex, total);
        const blob = await captureNodeAsPdf(selector, bgColor, scale);
        results.push({ format: 'pdf', filename: `${safeName}.pdf`, blob });
      }
    } catch (err) {
      canvasLogger.default.error(`MultiFormatExporter: failed to generate ${format} for ${nodeName}`, err);
    }
  }
  return results;
}

/**
 * Export canvas nodes in multiple formats and bundle into a ZIP file
 */
export async function exportMultiFormatZip(
  options: MultiFormatOptions,
  contextNodes: BoundedContextNode[],
  flowNodes: BusinessFlowNode[],
  componentNodes: ComponentNode[]
): Promise<Blob> {
  const {
    formats,
    backgroundColor = '#0f0f1a',
    scale = 2,
    onProgress,
  } = options;

  const nodes = getNodeSelector(contextNodes, flowNodes, componentNodes);
  const zip = new JSZip();
  const total = nodes.length * formats.length;
  let processed = 0;

  onProgress?.('开始多格式导出', 0, total);

  // Group formats into folders
  const formatFolders: Record<MultiFormatType, JSZip> = {
    png: zip.folder('png')!,
    svg: zip.folder('svg')!,
    pdf: zip.folder('pdf')!,
  };

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const results = await generateNodeFormats(
      node.selector,
      node.name,
      formats,
      backgroundColor,
      scale,
      (stage, current, _total) => {
        processed = current * formats.length;
        onProgress?.(stage, processed, total);
      },
      `导出节点 ${i + 1}/${nodes.length}`,
      nodes.length,
      i
    );

    for (const result of results) {
      formatFolders[result.format].file(result.filename, result.blob);
    }
  }

  onProgress?.('打包ZIP', total, total);

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  canvasLogger.default?.info(
    `MultiFormatExporter: exported ${nodes.length} nodes × ${formats.length} formats → ${(zipBlob.size / 1024).toFixed(1)}KB zip`
  );

  return zipBlob;
}
