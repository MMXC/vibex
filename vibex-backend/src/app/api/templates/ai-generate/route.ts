/**
 * POST /api/templates/ai-generate — Create AI generation job
 * GET  /api/templates/ai-generate — List user's generation jobs
 *
 * S91 E1: AI Template Generation
 *
 * POST Body:
 *   { prompt: string }
 * Response:
 *   { ok: true, jobId: string, status: 'pending' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/authFromGateway';
import { generateId, safeError, Env } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20'), 100);

    const jobs = await env.DB
      .prepare(
        `SELECT id, prompt, status, created_at, updated_at
         FROM ai_generation_jobs
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?`
      )
      .bind(user.userId, limit)
      .all<{ id: string; prompt: string; status: string; created_at: number; updated_at: number }>();

    return NextResponse.json({ ok: true, jobs: jobs.results });
  } catch (err) {
    safeError('[ai-generate GET]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { env: Env }
) {
  try {
    const { env } = context;
    const { success, user } = getAuthUserFromRequest(request);
    if (!success || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as { prompt?: string };
    const prompt = body.prompt?.trim();
    if (!prompt || prompt.length < 5) {
      return NextResponse.json({ ok: false, error: 'Prompt too short (min 5 chars)' }, { status: 400 });
    }
    if (prompt.length > 2000) {
      return NextResponse.json({ ok: false, error: 'Prompt too long (max 2000 chars)' }, { status: 400 });
    }

    const jobId = generateId();
    const now = Date.now();

    await env.DB
      .prepare(
        `INSERT INTO ai_generation_jobs (id, user_id, prompt, status, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, ?)`
      )
      .bind(jobId, user.userId, prompt, now, now)
      .run();

    // Kick off async processing via background wait (Workers don't have bg tasks natively)
    // For now, process inline but allow timeout — caller should poll
    processJob(env, jobId, prompt).catch(err => safeError('[processJob]', err));

    return NextResponse.json({ ok: true, jobId, status: 'pending' }, { status: 202 });
  } catch (err) {
    safeError('[ai-generate POST]', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

/**
 * Async job processor — generates template and stores result.
 * Called immediately after job creation; caller polls for completion.
 */
async function processJob(env: Env, jobId: string, prompt: string): Promise<void> {
  const now = Date.now();
  try {
    await env.DB
      .prepare(`UPDATE ai_generation_jobs SET status = 'processing', updated_at = ? WHERE id = ?`)
      .bind(now, jobId)
      .run();

    const apiKey = process.env.MINIMAX_API_KEY ?? '';
    if (!apiKey) {
      await env.DB
        .prepare(`UPDATE ai_generation_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`)
        .bind('MINIMAX_API_KEY not configured', Date.now(), jobId)
        .run();
      return;
    }

    const { generateTemplateFromPrompt } = await import('@/lib/llm/templateGenerator');
    const result = await generateTemplateFromPrompt(prompt, apiKey);

    await env.DB
      .prepare(
        `UPDATE ai_generation_jobs
         SET status = 'completed', result_json = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(JSON.stringify(result), Date.now(), jobId)
      .run();
  } catch (err) {
    safeError('[processJob error]', err);
    const errorMsg = err instanceof Error ? err.message : 'Generation failed';
    await env.DB
      .prepare(`UPDATE ai_generation_jobs SET status = 'failed', error_message = ?, updated_at = ? WHERE id = ?`)
      .bind(errorMsg, Date.now(), jobId)
      .run();
  }
}
