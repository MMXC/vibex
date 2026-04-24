/**
 * ZipArchiveService — Generate ZIP archives for batch component export
 * E5-U1: ZipArchiveService 创建
 *
 * 实现约束：
 * - 返回 Uint8Array（禁止 Buffer，Workers 不支持）
 * - 使用 JSZip generateAsync('blob') + arrayBuffer()
 */

export interface ComponentExport {
  id: string;
  name: string;
  type: string;
  data: string;
  version: number;
  updatedAt: string;
}

export class ZipArchiveService {
  /**
   * Generate ZIP archive from components
   * @returns Promise<Uint8Array> — ZIP file bytes
   */
  async generateZip(components: ComponentExport[]): Promise<Uint8Array> {
    // Lazy load JSZip only when needed (reduce cold start impact)
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Build manifest
    const manifest = {
      exportDate: new Date().toISOString(),
      componentCount: components.length,
      components: components.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        version: c.version,
      })),
    };
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Add each component as JSON file
    for (const component of components) {
      const filename = `${component.id}.json`;
      const content = JSON.stringify({
        id: component.id,
        name: component.name,
        type: component.type,
        version: component.version,
        updatedAt: component.updatedAt,
        data: component.data,
      }, null, 2);
      zip.file(filename, content);
    }

    // Generate blob → ArrayBuffer → Uint8Array
    const blob = await zip.generateAsync({ type: 'blob' });
    const arrayBuffer = await blob.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}

// Singleton export
export const zipArchiveService = new ZipArchiveService();
