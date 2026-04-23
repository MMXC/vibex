/**
 * Batch Export API — Backend ZIP generation for multiple components
 * E5: 多文件组件导出
 *
 * Generates ZIP files containing multiple components as JSON files
 * with a manifest.json index.
 *
 * Constraints:
 * - Max 100 components per export
 * - Total ZIP size < 5MB
 * - Signed URL valid for 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';

export interface BatchExportComponent {
  id: string;
  name: string;
  type: string;
  content: string;
  version: number;
  updatedAt: string;
}

export interface BatchExportRequest {
  projectId: string;
  componentIds: string[];
  format: 'json' | 'yaml';
}

export interface BatchExportResult {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: string;
  error?: string;
}

const MAX_COMPONENTS = 100;
const MAX_ZIP_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Generate ZIP content from components
 * Each component is a JSON file named {id}.json
 * Plus a manifest.json with metadata
 */
async function generateZip(components: BatchExportComponent[]): Promise<Buffer> {
  // Lazy load JSZip only when needed
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // Add manifest
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
    zip.file(filename, JSON.stringify(component, null, 2));
  }

  const zipBuffer = await zip.generateAsync({ type: 'base64' });
  return Buffer.from(zipBuffer, 'base64');
}

/**
 * Validate batch export request
 */
function validateRequest(data: BatchExportRequest): string[] {
  const errors: string[] = [];

  if (!data.projectId) {
    errors.push('projectId is required');
  }

  if (!Array.isArray(data.componentIds) || data.componentIds.length === 0) {
    errors.push('componentIds must be a non-empty array');
  }

  if (data.componentIds.length > MAX_COMPONENTS) {
    errors.push(`Maximum ${MAX_COMPONENTS} components per export`);
  }

  if (!['json', 'yaml'].includes(data.format)) {
    errors.push('format must be json or yaml');
  }

  return errors;
}

// POST /api/v1/projects/batch-export
export async function POST(request: NextRequest) {
  // Auth check
  const { success } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: BatchExportRequest = await request.json();

    // Validate
    const errors = validateRequest(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: errors.join(', ') },
        { status: 400 }
      );
    }

    // In MVP, we return mock data (no actual DB query)
    // Full implementation would:
    // 1. Query DB for components
    // 2. Validate each component belongs to projectId
    // 3. Generate ZIP
    // 4. Upload to storage (Cloudflare R2 or similar)
    // 5. Return signed URL with 5min expiry

    const mockComponents: BatchExportComponent[] = body.componentIds.slice(0, 5).map((id, i) => ({
      id,
      name: `Component ${i + 1}`,
      type: 'canvas-component',
      content: JSON.stringify({ id, nodes: [] }),
      version: 1,
      updatedAt: new Date().toISOString(),
    }));

    // Generate ZIP
    const zipBuffer = await generateZip(mockComponents);

    // Check size
    if (zipBuffer.length > MAX_ZIP_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Export exceeds 5MB size limit' },
        { status: 413 }
      );
    }

    // In MVP, we return the ZIP as base64 (production would use signed URL)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    return NextResponse.json({
      success: true,
      // MVP: base64 ZIP (production: signed URL)
      zipData: zipBuffer.toString('base64'),
      componentCount: mockComponents.length,
      sizeBytes: zipBuffer.length,
      expiresAt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Batch export failed' },
      { status: 500 }
    );
  }
}