/**
 * Batch Export Download — One-time download endpoint
 * EpicE5-U4: KV.get → delete → return application/zip
 *
 * 约束：
 * - 下载后立即删除 KV key（一次性）
 * - key 不存在/已过期 → 404
 * - 禁止 Buffer，使用 Uint8Array
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { getLocalEnv } from '@/lib/env';

// GET /api/v1/projects/batch-export/download?key=<uuid>
export async function GET(request: NextRequest) {
  const { success } = getAuthUserFromRequest(request);
  if (!success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key || !key.startsWith('batch-export:')) {
    return NextResponse.json({ error: 'Invalid or missing key' }, { status: 400 });
  }

  const env = getLocalEnv();
  const kv = env.EXPORT_KV;

  if (!kv) {
    return NextResponse.json({ error: 'Download service not configured' }, { status: 503 });
  }

  try {
    // Read from KV — stored as Uint8Array, retrieved as unknown then cast
    const raw = await kv.get(key);
    if (!raw) {
      return NextResponse.json(
        { error: 'Download link expired or has already been used' },
        { status: 404 }
      );
    }

    // One-time: delete immediately after read
    await kv.delete(key);

    // Decode base64 stored in KV
    const decoded = atob(raw as string);
    const uint8Array = new Uint8Array(decoded.split('').map((c) => c.charCodeAt(0)));

    return new Response(uint8Array, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="vibex-components.zip"',
        'Content-Length': String(uint8Array.length),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve download' },
      { status: 500 }
    );
  }
}
