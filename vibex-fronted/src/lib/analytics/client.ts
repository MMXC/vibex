/**
 * analytics/client.ts — VibeX Analytics 前端 SDK
 *
 * E3-S3: 自建轻量 analytics
 *
 * 使用示例:
 *   import { track } from '@/lib/analytics/client';
 *   track('project_create', { projectId: 'xxx' });
 *
 * 特性:
 * - 静默失败（端点异常不阻断用户操作）
 * - 无 PII 采集
 * - 批量上报优化
 */

// 允许的事件名（AGENTS.md 约束）
const ALLOWED_EVENTS = [
  'project_create',
  'treemap_complete',
  'ai_generate',
  'export',
  'collab_enabled',
  'node_sync',
  'health_warning',
] as const;

type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

interface TrackOptions {
  sessionId: string;
  userId?: string; // 可选，必须是匿名 UUID（AGENTS.md: 禁止 PII）
  properties?: Record<string, unknown>; // 可选，禁止包含 PII
}

const SESSION_ID_KEY = 'vibex_analytics_session';

/**
 * 获取或创建当前 session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

/**
 * 静默上报单个事件
 *
 * AGENTS.md 约束:
 * - analytics 端点必须静默失败（不阻断用户操作）
 * - 禁止采集 PII
 * - userId 必须是匿名 UUID
 */
export async function track(
  event: AllowedEvent,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!ALLOWED_EVENTS.includes(event)) {
    console.warn(`[analytics] Unknown event: ${event}`);
    return;
  }

  const payload = {
    event,
    sessionId: getSessionId(),
    timestamp: Date.now(),
    properties: properties ?? {},
  };

  try {
    await fetch('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // 不设置 cache: no-store，允许批量优化
    });
  } catch {
    // 静默失败，不影响用户操作
  }
}

/**
 * 批量上报事件（内部使用，批量时调用）
 */
export async function trackBatch(
  events: Array<{ event: AllowedEvent; properties?: Record<string, unknown> }>
): Promise<void> {
  const sessionId = getSessionId();
  const payloads = events
    .filter(e => ALLOWED_EVENTS.includes(e.event))
    .map(e => ({
      event: e.event,
      sessionId,
      timestamp: Date.now(),
      properties: e.properties ?? {},
    }));

  if (payloads.length === 0) return;

  try {
    await fetch('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloads),
    });
  } catch {
    // 静默失败
  }
}
