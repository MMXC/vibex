/**
 * @deprecated This router uses the legacy Page Router API.
 * All routes have been migrated to Next.js App Router (app/api/).
 * See: docs/migration/page-router-to-app-router.md
 * This file will be removed after E1 security fixes are complete.
 */
/**
 * WebSocket Collaboration Route
 * E2-S1: 后端 WebSocket 端点 — Cloudflare Durable Object 代理
 *
 * 功能：
 * - 接收前端 WebSocket 升级请求
 * - 从查询参数获取 roomId/userId/userName
 * - 注入 x-user-id / x-user-name / x-project-id headers
 * - 委托给 COLLABORATION_KV Durable Object 处理
 *
 * 路由: GET /api/v1/ws/collaboration?roomId=xxx&userId=xxx&userName=xxx
 *
 * Cloudflare Workers Durable Objects:
 * - 每个 roomId 对应一个独立的 CollaborationRoom DO 实例
 * - DO 在 fetch() 中处理 WebSocket 升级
 */

import { Hono } from 'hono';
import type { CloudflareEnv } from '@/lib/env';
import { apiError, ERROR_CODES } from '@/lib/api-error';

const collaborationWs = new Hono<{ Bindings: CloudflareEnv }>();

/**
 * WebSocket upgrade handler
 * E2-S1: 激活后端 WebSocket 端点
 */
collaborationWs.get('/collaboration', async (c) => {
  const env = c.env as CloudflareEnv;

  // E2-S1: 获取 COLLABORATION_DO binding
  const doNamespace = env.COLLABORATION_DO;
  if (!doNamespace) {
    return c.json(apiError('Collaboration DO not configured', ERROR_CODES.INTERNAL_ERROR), 500);
  }

  // 解析查询参数
  const url = new URL(c.req.url);
  const roomId = url.searchParams.get('roomId');
  const userId = url.searchParams.get('userId') || 'anonymous';
  const userName = url.searchParams.get('userName') || 'Anonymous';

  if (!roomId) {
    return         c.json(apiError('roomId query parameter required', ERROR_CODES.BAD_REQUEST), 400);
  }

  // 获取 DO stub（每个 roomId 对应一个 DO 实例）
  const doId = doNamespace.idFromName(roomId);
  const doStub = doNamespace.get(doId);

  // 构造带有认证 headers 的请求（CollaborationRoom DO 读取这些 headers）
  const headers = new Headers();
  headers.set('x-user-id', userId);
  headers.set('x-user-name', userName);
  headers.set('x-project-id', roomId);

  // 保留原始请求的 Upgrade header（必须是 'websocket'）
  const upgradeHeader = c.req.header('upgrade');
  if (upgradeHeader) {
    headers.set('upgrade', upgradeHeader);
  }

  // 构造转发请求（保留原始 body 和 headers）
  const doRequest = new Request(c.req.url, {
    method: 'GET',
    headers,
    body: undefined,
    // @ts-expect-error - Cloudflare Workers 支持 duplex 请求体用于 WebSocket
    duplex: 'half',
  });

  // 调用 DO fetch（DO 内部执行 WebSocket 升级）
  const doResponse = await doStub.fetch(doRequest);

  // 将 DO 的 101 响应直接返回给客户端
  // 注意：Hono Cloudflare adapter 需要特殊处理 101 响应
  return new Response(doResponse.body, {
    status: doResponse.status,
    statusText: doResponse.statusText,
    headers: doResponse.headers,
    // @ts-expect-error - webSocket 是 Cloudflare Workers Response 扩展属性
    webSocket: doResponse.webSocket as unknown as undefined,
  });
});

export default collaborationWs;
