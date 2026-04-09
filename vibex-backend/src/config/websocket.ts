/**
 * WebSocket Configuration — Single Source of Truth
 *
 * E3: CI/CD 守卫增强 — WEBSOCKET_CONFIG 单一配置源
 *
 * Usage:
 *   import { WEBSOCKET_CONFIG } from '@/config/websocket';
 *   const url = WEBSOCKET_CONFIG.collabUrl;
 */

export interface WebSocketConfig {
  /** Collaboration WebSocket URL */
  collabUrl: string;
  /** Connection timeout (ms) */
  connectTimeout: number;
  /** Max reconnect attempts */
  maxReconnectAttempts: number;
  /** Base reconnect delay (ms) — exponential backoff applied */
  baseReconnectDelay: number;
}

function resolveCollabUrl(): string {
  // Environment variable takes precedence (for Cloudflare Workers deployment)
  if (process.env.WEBSOCKET_COLLAB_URL) {
    return process.env.WEBSOCKET_COLLAB_URL;
  }
  // Local development fallback
  if (process.env.NODE_ENV === 'development') {
    return process.env.WS_URL || 'ws://localhost:8787/api/v1/ws/collaboration';
  }
  // Production: must be set via environment
  return process.env.WS_URL || 'wss://api.vibex.dev/api/v1/ws/collaboration';
}

export const WEBSOCKET_CONFIG: WebSocketConfig = {
  collabUrl: resolveCollabUrl(),
  connectTimeout: 10_000,        // 10s
  maxReconnectAttempts: 5,
  baseReconnectDelay: 1_000,     // 1s → exponential: 1s, 2s, 4s, 8s, 16s
};
