/**
 * GET /api/templates/ai-generate/[jobId] — Get job status/result
 *
 * S91 E1: AI Template Generation
 *
 * Response:
 *   { ok: true, job: { id, prompt, status, result?, error?, created_at, updated_at } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface JobRow {
  id: string;
  user_id: string;
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_json: string | null;
  error_message: string | null;
  created_at: number;
  updated_at: number;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ jobId: string }>; env: Env }
) {
  try {
    const { env } = context;
    const { jobId } = await context.params;
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const job = await env.DB
      .prepare('SELECT * FROM ai_generation_jobs WHERE id = ? AND user_id = ?')
      .bind(jobId, user.userId)
      .first<JobRow>();

    if (!job) {
      return NextResponse.json({ ok: false, error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      job: {
        id: job.id,
        prompt: job.prompt,
        status: job.status,
        result: job.result_json ? JSON.parse(job.result_json) : null,
        error: job.error_message,
        created_at: job.created_at,
        updated_at: job.updated_at,
      },
    });
  } catch (err) {
    safeError('[ai-generate/[jobId] GET]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
