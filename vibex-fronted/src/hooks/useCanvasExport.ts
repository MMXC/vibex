/**
 * useCanvasExport — PNG and SVG export utilities for canvas elements
 *
 * Provides:
 * - exportAsPNG: Captures an HTMLElement as PNG using html2canvas (dynamic import)
 * - exportAsSVG: Serializes an HTMLElement as SVG (DOM → SVG serialization)
 *
 * Epic E005 (F002): PNG/SVG canvas export
 *
 * 遵守约束:
 * - html2canvas 使用动态 import 避免 SSR 问题
 * - 文件名: canvas-{timestamp}.png / canvas-{timestamp}.svg
 * - 使用 URL.createObjectURL + <a download> 下载模式
 */
'use client';

/**
 * Export an HTMLElement as a PNG image file.
 * Uses html2canvas (dynamically imported to avoid SSR issues).
 * Default scale = 1 (1x). Use exportAsPNGWithScale for resolution options.
 */
export async function exportAsPNG(canvasEl: HTMLElement): Promise<void> {
  return exportAsPNGWithScale(canvasEl, 1);
}

/**
 * Export an HTMLElement as a PNG at the specified resolution scale.
 * scale: 1 = 1x, 2 = 2x (retina), 3 = 3x (high-res).
 */
export async function exportAsPNGWithScale(
  canvasEl: HTMLElement,
  scale: 1 | 2 | 3 = 1
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(canvasEl, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    scale, // html2canvas supports scale for resolution control
  });

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `canvas-${Date.now()}-${scale}x.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}

/**
 * Export canvas data as Figma-compatible JSON.
 * Generates a Figma file JSON structure with:
 * - document.children[0]: main canvas page
 * - Each chapter's cards rendered as Figma frame nodes
 */
export interface FigmaExportChapter {
  id: string;
  label: string;
  nodes: FigmaExportNode[];
}

export interface FigmaExportNode {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: string[];
  strokes?: string[];
}

export interface FigmaExportData {
  document: {
    id: string;
    name: string;
    type: 'DOCUMENT';
    children: FigmaPageNode[];
  };
  schemaVersion: number;
  exportedAt: string;
}

export interface FigmaPageNode {
  id: string;
  name: string;
  type: 'CANVAS';
  children: FigmaFrameNode[];
}

export interface FigmaFrameNode {
  id: string;
  name: string;
  type: 'FRAME';
  absoluteBoundingBox: { x: number; y: number; width: number; height: number };
  fills: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
  strokes: Array<{ type: string; color?: { r: number; g: number; b: number; a: number } }>;
}

/**
 * Build Figma-compatible JSON from chapter data.
 * Returns the JSON without triggering a download.
 */
export function buildFigmaJSON(chapters: FigmaExportChapter[]): FigmaExportData {
  return {
    document: {
      id: '0:0',
      name: 'VibeX Canvas Export',
      type: 'DOCUMENT',
      children: [
        {
          id: '0:1',
          name: 'Canvas',
          type: 'CANVAS',
          children: chapters.map((chapter) => ({
            id: chapter.id,
            name: chapter.label,
            type: 'FRAME' as const,
            absoluteBoundingBox: {
              x: 0,
              y: 0,
              width: 800,
              height: 600,
            },
            fills: [{ type: 'SOLID' as const, color: { r: 1, g: 1, b: 1, a: 1 } }],
            strokes: [],
          })),
        },
      ],
    },
    schemaVersion: 0,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Export canvas data as a downloadable Figma-compatible .fig file.
 * Figma's .fig format is a proprietary JSON variant; we export a compatible
 * structure as .json that can be imported into design tools.
 */
export function downloadFigmaJSON(chapters: FigmaExportChapter[]): void {
  const data = buildFigmaJSON(chapters);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.fig.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export an HTMLElement as an SVG file by serializing the DOM.
 * Inlines computed styles so the SVG is self-contained.
 */
export async function exportAsSVG(element: HTMLElement): Promise<void> {
  const clone = element.cloneNode(true) as HTMLElement;

  // Inline computed styles so SVG is self-contained
  inlineComputedStyles(element, clone);

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);

  // Add SVG namespace if missing
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(/^<([^>]+)>/, (match, tag) => {
      return `<${tag} xmlns="http://www.w3.org/2000/svg">`;
    });
  }

  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `canvas-${Date.now()}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Recursively copy computed styles from source to clone.
 */
function inlineComputedStyles(source: Element, clone: Element): void {
  const sourceEl = source as HTMLElement;
  const cloneEl = clone as HTMLElement;

  const computed = window.getComputedStyle(sourceEl);
  cloneEl.style.cssText = Array.from(computed)
    .filter((prop) => computed.getPropertyValue(prop))
    .map((prop) => `${prop}:${computed.getPropertyValue(prop)}`)
    .join(';');

  const sourceChildren = sourceEl.children;
  const cloneChildren = cloneEl.children;

  for (let i = 0; i < sourceChildren.length && i < cloneChildren.length; i++) {
    const src = sourceChildren[i];
    const dst = cloneChildren[i];
    if (src && dst) inlineComputedStyles(src, dst);
  }
}
