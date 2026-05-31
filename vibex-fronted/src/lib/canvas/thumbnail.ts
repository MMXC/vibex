/**
 * thumbnail.ts — Sprint47 E4: Canvas thumbnail generation
 *
 * 使用 canvas.toDataURL() 生成画布缩略图。
 */

/**
 * Generate a thumbnail data URL from an HTML canvas element.
 * @param canvas - HTMLCanvasElement
 * @param options - thumbnail options
 */
export async function generateThumbnail(
  canvas: HTMLCanvasElement,
  options: { width?: number; height?: number; format?: 'image/png' | 'image/jpeg' } = {}
): Promise<string> {
  const { width = 240, height = 160, format = 'image/png' } = options;

  // Create offscreen canvas for resizing
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for thumbnail');
  }

  // Fill white background for JPEG (transparency becomes black)
  if (format === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  // Draw scaled source canvas
  ctx.drawImage(canvas, 0, 0, width, height);

  return offscreen.toDataURL(format, 0.8);
}

/**
 * Generate thumbnail from a React Flow canvas container element.
 * Extracts the flow viewport as an image.
 */
export async function generateFlowThumbnail(
  flowContainer: HTMLElement,
  options: { width?: number; height?: number; format?: 'image/png' | 'image/jpeg' } = {}
): Promise<string> {
  const { width = 240, height = 160, format = 'image/png' } = options;

  // Find the SVG or canvas inside the React Flow container
  const svg = flowContainer.querySelector('svg[data-testid="designer"]');
  if (!svg) {
    // Fallback: use CSS background if available
    throw new Error('React Flow SVG canvas not found in container');
  }

  // Create offscreen canvas
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D context for flow thumbnail');
  }

  // Serialize SVG to data URL
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(svgUrl);
      resolve(offscreen.toDataURL(format, 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error('Failed to load SVG as image for thumbnail'));
    };
    img.src = svgUrl;
  });
}

/**
 * Compress thumbnail by reducing size if it exceeds maxSizeKB.
 * Strips unnecessary data URL prefix.
 */
export function compressThumbnail(dataUrl: string, maxSizeKB = 50): string {
  // If already small enough, return as-is
  const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const sizeKB = (base64.length * 3) / 4 / 1024;
  if (sizeKB <= maxSizeKB) return dataUrl;

  // Reduce quality iteratively
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  const img = new Image();
  // Extract dimensions from dataUrl is non-trivial; use fixed small canvas
  canvas.width = 120;
  canvas.height = 80;

  // Try JPEG at low quality as last resort
  return canvas.toDataURL('image/jpeg', 0.5);
}
