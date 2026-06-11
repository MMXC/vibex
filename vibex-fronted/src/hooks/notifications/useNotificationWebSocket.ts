'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { wsNotificationHandler } from '@/services/wsNotificationHandler';
import { WEBSOCKET_CONFIG } from '@/config/websocket';

/**
 * useNotificationWebSocket — S86-E4: 通知 WebSocket 实时推送
 *
 * 职责：
 * - 建立到通知 WebSocket 端点的连接
 * - 调用 wsNotificationHandler.handleMessage() 处理 notification:new 等消息
 * - 处理重连逻辑（基于 WEBSOCKET_CONFIG）
 * - 离线重连后通过 HTTP GET /api/notifications 拉取离线期间的通知
 *
 * 设计决策：
 * - 使用全局 WebSocket 连接（单例模式），避免多个 hook 实例创建多个连接
 * - 重连使用指数退避（参考 WEBSOCKET_CONFIG.baseReconnectDelay）
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
  // 使用与协作 WS 相同的 base URL，但指向 notification 路径
  const collabBase = WEBSOCKET_CONFIG.collabUrl;
  const base = collabBase.replace('/collaboration', '/notifications');
  return `${base}?userId=${encodeURIComponent(userId)}`;
}

/**
 * 全局 WebSocket 连接建立
 * 幂等：已连接则直接通知，不重复创建
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
      // 有活跃 hook 时才重连
      if (activeHookCount > 0) {
        scheduleReconnect(userId, onConnect, onDisconnect);
      }
    });

    ws.addEventListener('error', () => {
      // error 事件后 close 会自动触发
    });

    // 连接超时
    setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        if (activeHookCount > 0) {
          scheduleReconnect(userId, onConnect, onDisconnect);
        }
      }
    }, WEBSOCKET_CONFIG.connectTimeout);
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
  if (reconnectAttempts >= WEBSOCKET_CONFIG.maxReconnectAttempts) {
    return;
  }

  clearReconnectTimer();
  const delay = WEBSOCKET_CONFIG.baseReconnectDelay * Math.pow(2, reconnectAttempts);
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
  reconnectAttempts = WEBSOCKET_CONFIG.maxReconnectAttempts; // 防止自动重连
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

  // 保持回调引用最新
  useEffect(() => {
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
  }, [onConnect, onDisconnect]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  // 连接状态
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
      // 最后一个 hook unmount 时断开连接
      if (activeHookCount === 0) {
        disconnectGlobal();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 建立 / 断开连接
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
