/**
 * OpenClawBridge.ts — Bridge to OpenClaw sessions_spawn runtime
 *
 * The backend Hono server runs within the OpenClaw runtime context.
 * sessions_spawn is an internal runtime tool — we expose a bridge here
 * that attempts to call the OpenClaw gateway HTTP API, with structured
 * error handling and timeout limits.
 *
 * If the gateway is unavailable (ECONNREFUSED), returns RUNTIME_UNAVAILABLE.
 * If spawn times out (30s hard limit), returns TIMEOUT.
 */

import { devLog } from '@/lib/log-sanitizer';

export interface SpawnOptions {
  task: string;
  context?: Record<string, unknown>;
  sessionId: string;
}

export interface SpawnResult {
  sessionKey: string;
  status: 'running' | 'spawned';
  createdAt: string;
}

/**
 * Check if an error indicates a connection refused / runtime unavailable.
 */
export function isRuntimeUnavailable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('econnrefused') ||
      msg.includes('connection refused') ||
      msg.includes('connect econnrefused') ||
      msg.includes('fetch failed') ||
      msg.includes('service unavailable') ||
      err.name === 'AbortError'
    );
  }
  return false;
}

/**
 * Spawn an OpenClaw subagent session via the gateway HTTP API.
 *
 * Falls back to structured error if gateway unreachable or times out.
 */
export async function spawnAgent(options: SpawnOptions): Promise<SpawnResult> {
  const openclawUrl = process.env.OPENCLAW_GATEWAY_URL || 'http://localhost:18789';
  const timeout = 30_000; // 30s hard limit per P006-C03

  const start = Date.now();
  devLog(`[agent] sessions_spawn called with task="${options.task.substring(0, 60)}..." sessionId=${options.sessionId}`);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(`${openclawUrl}/api/sessions/spawn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-OpenClaw-Session-Id': options.sessionId,
      },
      body: JSON.stringify({
        task: options.task,
        context: options.context,
        runtime: 'subagent',
        timeoutSeconds: 30,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const duration = Date.now() - start;
      const text = await response.text().catch(() => '');
      devLog(`[agent] sessions_spawn failed after ${duration}ms — HTTP ${response.status}: ${text}`);
      throw new Error(`OpenClaw gateway error: HTTP ${response.status}`);
    }

    const data = (await response.json()) as { sessionKey?: string; key?: string };
    const duration = Date.now() - start;

    const sessionKey = data.sessionKey ?? data.key ?? options.sessionId;
    devLog(`[agent] sessions_spawn success after ${duration}ms — sessionKey=${sessionKey}`);

    return {
      sessionKey,
      status: 'spawned',
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    const duration = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === 'AbortError';

    devLog(`[agent] sessions_spawn failed after ${duration}ms — ${isTimeout ? 'TIMEOUT' : 'ERROR'}: ${err instanceof Error ? err.message : String(err)}`);

    if (isTimeout) {
      const timeoutErr = new Error('Agent spawn timeout (30s hard limit)');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }

    throw err;
  }
}