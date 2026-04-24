/**
 * Batch Export API — Backend ZIP generation for multiple components
 * EpicE5: Batch Export with Real DB + KV
 *
 * 流程：
 * 1. 校验请求（projectId, componentIds）
 * 2. D1 查询真实组件数据
 * 3. ZipArchiveService 生成 ZIP（Uint8Array）
 * 4. KV 存储 ZIP（5min TTL）
 * 5. 返回一次性下载 URL
 *
 * 约束：
 * - 禁止 Buffer（Workers 不支持），使用 Uint8Array
 * - Max 100 components, Max 5MB ZIP
 * - KV key 一次性下载后删除
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { zipArchiveService, type ComponentExport } from '@/services/ZipArchiveService';
import { getLocalEnv } from '@/lib/env';

export interface BatchExportRequest {
  projectId: string;
  componentIds: string[];
  format?: 'json' | 'yaml';
}

export interface BatchExportResponse {
  success: boolean;
  downloadUrl?: string;
  expiresAt?: string;
  componentCount?: number;
  sizeBytes?: number;
  error?: string;
}

const MAX_COMPONENTS = 100;
const MAX_ZIP_SIZE = 5 * 1024 * 1024; // 5MB
const KV_TTL_SECONDS = 300; // 5 minutes

// POST /api/v1/projects/batch-export
export async function POST(request: NextRequest) {
  const { user, success } = getAuthUserFromRequest(request);
  if (!success || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const userId = user.userId;

  try {
    const body: BatchExportRequest = await request.json();

    // Validate
    if (!body.projectId) {
      return NextResponse.json(
        { success: false, error: 'projectId is required' },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.componentIds) || body.componentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'componentIds must be a non-empty array' },
        { status: 400 }
      );
    }
    if (body.componentIds.length > MAX_COMPONENTS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_COMPONENTS} components per export` },
        { status: 400 }
      );
    }

    // ================================================================
    // E5-U2: 真实 D1 查询
    // ================================================================
    const env = getLocalEnv();
    const db = env.DB;
    const kv = env.EXPORT_KV;

    // D1 不支持 IN () 直接绑定，用 placeholders + bind
    const placeholders = body.componentIds.map((_, i) => `$${i + 1}`).join(', ');
    const query = `SELECT id, name, type, props, version, updatedAt as updatedAt
FROM components
WHERE id IN (${placeholders}) AND project_id = $${body.componentIds.length + 1}
LIMIT ${MAX_COMPONENTS}`;

    const stmt = db.prepare(query);
    const boundStmt = stmt.bind(...body.componentIds, body.projectId);
    const dbResult = await (boundStmt as { all: () => Promise<{ results: Array<{ id: string; name: string; type: string; props: string; version: number; updatedAt: string }> }> }).all();
    const components = dbResult.results;

    if (components.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No components found for the given ids and project' },
        { status: 404 }
      );
    }

    // 转换为 ComponentExport
    const exportComponents: ComponentExport[] = components.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      data: c.props, // store the props as data
      version: c.version,
      updatedAt: c.updatedAt,
    }));

    // ================================================================
    // E5-U1: 生成 ZIP（Uint8Array）
    // ================================================================
    const zipBytes = await zipArchiveService.generateZip(exportComponents);

    // ================================================================
    // E5-U3: KV 暂存 + download URL
    // ================================================================
    if (zipBytes.length > MAX_ZIP_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Export exceeds 5MB size limit' },
        { status: 413 }
      );
    }

    let downloadUrl = '/api/v1/projects/batch-export/download?key=';

    if (kv) {
      const key = `batch-export:${crypto.randomUUID()}`;
      // KV.put accepts string; encode Uint8Array as base64
      const base64 = btoa(String.fromCharCode(...zipBytes));
      await kv.put(key, base64, {
        expirationTtl: KV_TTL_SECONDS,
      });
      downloadUrl = `/api/v1/projects/batch-export/download?key=${key}`;
    } else {
      // KV not configured — embed ZIP as base64 (dev fallback, not for production)
      const base64 = btoa(String.fromCharCode(...zipBytes));
      return NextResponse.json({
        success: true,
        downloadUrl: undefined,
        zipData: base64, // dev fallback only
        componentCount: exportComponents.length,
        sizeBytes: zipBytes.length,
        expiresAt: new Date(Date.now() + KV_TTL_SECONDS * 1000).toISOString(),
      });
    }

    const expiresAt = new Date(Date.now() + KV_TTL_SECONDS * 1000).toISOString();

    return NextResponse.json({
      success: true,
      downloadUrl,
      expiresAt,
      componentCount: exportComponents.length,
      sizeBytes: zipBytes.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Batch export failed' },
      { status: 500 }
    );
  }
}
