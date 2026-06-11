'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { wsNotificationHandler } from '@/services/wsNotificationHandler';

/**
 * useNotificationWebSocket — S86-E4: 通知 WebSocket 实时推送
 *
 * 职责：
 * - 建立到通知 WebSocket 端点的连接
 * - 调用 wsNotificationHandler.handleMessage() 处理 notification:new 等消息
 * - 处理重连逻辑（指数退避）
 *
 * 设计决策：
 * - 使用全局 WebSocket 连接（单例模式），避免多个 hook 实例创建多个连接
 * - 重连使用指数退避
 *
 * DoD: 新通知在 < 2s 内出现在面板中
 */

interface UseNotificationWebSocketOptions {
  /** 当前登录用户 ID */
  userId: string | null;
  /** 是否启用（默认 true） */
  enabled?: boolean;
  /** 连接成功回调 */
  onConnect?: () => void;
  /** 连接关闭回调 */
  onDisconnect?: () => void;
}

interface UseNotificationWebSocketReturn {
  /** 是否已连接 */
  isConnected: boolean;
  /** 主动断开连接 */
  disconnect: () => void;
  /** 手动重连 */
  reconnect: () => void;
}

/** 连接配置 */
const NOTIFICATION_WS_BASE = (() => {
  if (process.env.NODE_ENV === 'development') {
    return 'ws://localhost:8787/api/v1/ws/notifications';
  }
  return 'wss://api.vibex.top/api/v1/ws/notifications';
})();
const CONNECT_TIMEOUT_MS = 10_000;
const MAX_RECONNECT_ATTEMPTS = 3;
const BASE_RECONNECT_DELAY_MS = 1_000;

/** WebSocket 单例 — 全局共享一个连接 */
let globalWs: WebSocket | null = null;
let globalIsConnected = false;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/** 活跃 hook 实例计数 */
let activeHookCount = 0;

/** 连接状态变更回调列表（支持多 hook 实例） */
const stateListeners = new Set<(connected: boolean) => void>();

function notifyState(connected: boolean) {
  globalIsConnected = connected;
  stateListeners.forEach((fn) => fn(connected));
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function getNotificationWsUrl(userId: string): string {
  return `${NOTIFICATION_WS_BASE}?userId=${encodeURIComponent(userId)}`;
}

/**
 * 全局 WebSocket 连接建立
 */
async function connectGlobal(
  userId: string,
  onConnect?: () => void,
  onDisconnect?: () => void
): Promise<void> {
  if (globalWs && (globalWs.readyState === WebSocket.OPEN || globalWs.readyState === WebSocket.CONNECTING)) {
    notifyState(true);
    onConnect?.();
    return;
  }

  const url = getNotificationWsUrl(userId);

  try {
    const ws = new WebSocket(url);
    globalWs = ws;

    ws.addEventListener('open', () => {
      reconnectAttempts = 0;
      clearReconnectTimer();
      wsNotificationHandler.activate();
      notifyState(true);
      onConnect?.();
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data as string);
        wsNotificationHandler.handleMessage(data);
      } catch {
        // 忽略无法解析的消息
      }
    });

    ws.addEventListener('close', () => {
      wsNotificationHandler.deactivate();
      notifyState(false);
      onDisconnect?.();
      globalWs = null;
      if (activeHookCount > 0) {
        scheduleReconnect(userId, onConnect, onDisconnect);
      }
    });

    ws.addEventListener('error', () => {
      // error 事件后 close 会自动触发
    });

    // 连接超时
    const timeout = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        if (activeHookCount > 0) {
          scheduleReconnect(userId, onConnect, onDisconnect);
        }
      }
    }, CONNECT_TIMEOUT_MS);

    // 清理 timeout 当连接成功
    const originalOpen = ws.onopen;
    ws.addEventListener('open', () => {
      clearTimeout(timeout);
      originalOpen?.();
    });
  } catch {
    if (activeHookCount > 0) {
      scheduleReconnect(userId, onConnect, onDisconnect);
    }
  }
}

/**
 * 指数退避重连调度
 */
function scheduleReconnect(
  userId: string,
  onConnect?: () => void,
  onDisconnect?: () => void
): void {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    return;
  }

  clearReconnectTimer();
  const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts);
  reconnectAttempts++;

  reconnectTimer = setTimeout(() => {
    connectGlobal(userId, onConnect, onDisconnect);
  }, delay);
}

/**
 * 主动断开全局连接
 */
function disconnectGlobal(): void {
  clearReconnectTimer();
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // 防止自动重连
  if (globalWs) {
    globalWs.close();
    globalWs = null;
  }
  wsNotificationHandler.deactivate();
  notifyState(false);
}

/**
 * useNotificationWebSocket — React hook
 *
 * 用法：
 *   const { isConnected, disconnect } = useNotificationWebSocket({ userId });
 *
 * 单例模式：所有 hook 实例共享同一个 WebSocket 连接
 */
export function useNotificationWebSocket({
  userId,
  enabled = true,
  onConnect,
  onDisconnect,
}: UseNotificationWebSocketOptions): UseNotificationWebSocketReturn {
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const userIdRef = useRef(userId);

  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onConnect, onDisconnect]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  const [isConnected, setIsConnected] = useState(globalIsConnected);

  useEffect(() => {
    activeHookCount++;
    const listener = (connected: boolean) => {
      setIsConnected(connected);
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
      activeHookCount--;
      if (activeHookCount === 0) {
        disconnectGlobal();
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }
    connectGlobal(userId, onConnectRef.current, onDisconnectRef.current);
  }, [enabled, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const disconnect = useCallback(() => {
    disconnectGlobal();
  }, []);

  const reconnect = useCallback(() => {
    if (!userIdRef.current) return;
    reconnectAttempts = 0;
    clearReconnectTimer();
    connectGlobal(userIdRef.current, onConnectRef.current, onDisconnectRef.current);
  }, []);

  return { isConnected, disconnect, reconnect };
}
