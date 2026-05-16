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
 */
export async function exportAsPNG(canvasEl: HTMLElement): Promise<void> {
  const html2canvas = (await import('html2canvas')).default;

  const canvas = await html2canvas(canvasEl, {
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
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
      link.download = `canvas-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
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
    inlineComputedStyles(sourceChildren[i], cloneChildren[i]);
  }
}
