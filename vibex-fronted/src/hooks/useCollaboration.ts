/**
 * Collaboration Socket Hook
 * 前端 WebSocket 连接管理
 *
 * E1-S4: 指数退避重连 + 单用户降级模式
 * E1-S2: 节点消息处理
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageRouter, type WebSocketMessage, type NodeSyncPayload } from '@/lib/websocket/MessageRouter';
import { useRoomManager } from '@/lib/websocket/RoomManager';
import { canvasLogger } from '@/lib/canvas/canvasLogger';
import { initCollaborationSync, handleRemoteNodeSync } from '@/lib/canvas/collaborationSync';

interface UseCollaborationOptions {
  url?: string;
  autoConnect?: boolean;
  /** 重连指数退避基础延迟（ms） */
  baseReconnectDelay?: number;
  /** 最大重连次数 */
  maxReconnectAttempts?: number;
  /** Firebase 超时（ms） */
  firebaseTimeout?: number;
  /** 单用户模式重试间隔（ms） */
  singleUserRetryInterval?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  /** 进入单用户降级模式回调 */
  onSingleUserMode?: () => void;
  /** Firebase 不可用回调 */
  onFirebaseUnavailable?: () => void;
}

interface UseCollaborationReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isSingleUserMode: boolean;
  isFirebaseAvailable: boolean;
  error: Error | null;
  sendMessage: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
  retryFirebase: () => void;
}

// E1-S4: 指数退避延迟表：1s → 2s → 4s → 8s → 16s
const EXPONENTIAL_BACKOFF = [1000, 2000, 4000, 8000, 16000];

/**
 * Collaboration Socket Hook
 *
 * 特性：
 * - 指数退避重连（1s→2s→4s→8s→16s）
 * - 保留本地状态不清空
 * - Firebase 不可达时降级为"单用户模式"
 * - 节点消息（node:create/update/delete）处理
 */
export function useCollaboration(
  options: UseCollaborationOptions = {}
): UseCollaborationReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    baseReconnectDelay = 1000,
    maxReconnectAttempts = 5,
    firebaseTimeout = 5000,
    singleUserRetryInterval = 30_000,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    onSingleUserMode,
    onFirebaseUnavailable,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSingleUserMode, setIsSingleUserMode] = useState(false);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  // E1-S4: 重连尝试次数（用于指数退避）
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Omit<WebSocketMessage, 'id' | 'timestamp'>[]>([]);
  const firebaseRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const unmountedRef = useRef(false);

  const { currentRoom, currentRoom: room } = useRoomManager();
  const routerRef = useRef<MessageRouter | null>(null);

  // ============================================================================
  // E1-S2: 初始化 MessageRouter 并注册 node 消息处理
  // ============================================================================
  useEffect(() => {
    if (!room || !currentRoom) return;

    routerRef.current = new MessageRouter();

    // 注册现有消息类型
    routerRef.current.subscribe('cursor', (msg) => onMessage?.(msg));
    routerRef.current.subscribe('chat', (msg) => onMessage?.(msg));
    routerRef.current.subscribe('notification', (msg) => onMessage?.(msg));

    // E1-S2: 注册 node 消息处理
    routerRef.current.subscribe('node', (msg) => {
      const payload = (msg as { payload?: NodeSyncPayload }).payload;
      if (payload) {
        handleRemoteNodeSync(payload);
      }
      onMessage?.(msg);
    });

    // E1-S2: 初始化协作同步（绑定 userId/roomId）
    initCollaborationSync(
      routerRef.current,
      room.ownerId, // 使用当前房间 owner 作为 userId（后续从 auth 获取）
      room.id
    );

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      routerRef.current = null;
    };
  }, [room?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ============================================================================
  // E1-S4: 计算指数退避延迟
  // ============================================================================
  const getBackoffDelay = useCallback(
    (attempt: number): number => {
      const index = Math.min(attempt, EXPONENTIAL_BACKOFF.length - 1);
      return EXPONENTIAL_BACKOFF[index]!;
    },
    []
  );

  // ============================================================================
  // E1-S4: 进入单用户降级模式
  // ============================================================================
  const enterSingleUserMode = useCallback(() => {
    if (isSingleUserMode) return;
    setIsSingleUserMode(true);
    setIsConnected(false);
    setIsConnecting(false);
    onSingleUserMode?.();
    canvasLogger.default.warn('[useCollaboration] Entered single-user degradation mode');

    // 30 秒后重试 Firebase
    if (firebaseRetryTimeoutRef.current) {
      clearTimeout(firebaseRetryTimeoutRef.current);
    }
    firebaseRetryTimeoutRef.current = setTimeout(() => {
      if (!unmountedRef.current) {
        setIsSingleUserMode(false);
        setIsFirebaseAvailable(true);
        // 重试连接
        connectRef.current?.();
      }
    }, singleUserRetryInterval);
  }, [isSingleUserMode, onSingleUserMode, singleUserRetryInterval]);

  // ============================================================================
  // E1-S4: 重试 Firebase
  // ============================================================================
  const retryFirebase = useCallback(() => {
    if (firebaseRetryTimeoutRef.current) {
      clearTimeout(firebaseRetryTimeoutRef.current);
    }
    setIsSingleUserMode(false);
    setIsFirebaseAvailable(true);
    connectRef.current?.();
  }, []);

  // ============================================================================
  // 连接（使用 ref 避免 useCallback 循环依赖）
  // ============================================================================
  const connectRef = useRef<() => void>(() => {});
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) { ws.close(); return; }
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0; // E1-S4: 成功后重置重试计数
        onConnect?.();

        // 发送队列中的消息
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) ws.send(JSON.stringify(msg));
        }

        // 加入房间
        if (currentRoom) {
          ws.send(JSON.stringify({
            type: 'room',
            action: 'join',
            roomId: currentRoom.id,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          // 消息已由 router 的 node 订阅处理器处理
          routerRef.current?.subscribe(message.type, () => {});
        } catch (e) {
          canvasLogger.default.error('[useCollaboration] Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // E1-S4: 指数退避重连
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = getBackoffDelay(reconnectAttemptsRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!unmountedRef.current) {
              reconnectAttemptsRef.current++;
              connect();
            }
          }, delay);
          canvasLogger.default.debug(
            `[useCollaboration] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`
          );
        } else {
          // E1-S4: 超过最大重试次数，降级为单用户模式
          canvasLogger.default.warn('[useCollaboration] Max reconnect attempts reached, entering single-user mode');
          enterSingleUserMode();
        }
      };

      ws.onerror = (e) => {
        if (unmountedRef.current) return;
        setError(new Error('WebSocket error'));
        onError?.(e);
      };
    } catch (e) {
      if (unmountedRef.current) return;
      setError(e instanceof Error ? e : new Error('Connection failed'));
      setIsConnecting(false);
    }
  }, [ // eslint-disable-line react-hooks/exhaustive-deps
    url,
    maxReconnectAttempts,
    currentRoom,
    onConnect,
    onDisconnect,
    onError,
    getBackoffDelay,
    enterSingleUserMode,
  ]);

  // 同步 connectRef
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // ============================================================================
  // 断开连接
  // ============================================================================
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (firebaseRetryTimeoutRef.current) {
      clearTimeout(firebaseRetryTimeoutRef.current);
    }
    reconnectAttemptsRef.current = 0;

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsSingleUserMode(false);
  }, []);

  // ============================================================================
  // 发送消息
  // ============================================================================
  const sendMessage = useCallback(
    (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
      if (isSingleUserMode) {
        // 单用户模式：静默丢弃（本地操作已通过 store 保存）
        return;
      }
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        // E1-S4: 保留本地状态，加入队列等待重连
        messageQueueRef.current.push(message);
      }
    },
    [isSingleUserMode]
  );

  // ============================================================================
  // E1-S4: Firebase 可用性检查（timeout 5s）
  // ============================================================================
  useEffect(() => {
    if (isSingleUserMode) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const checkFirebase = async () => {
      const configured =
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
        process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL &&
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'your-api-key';

      if (!configured) {
        // Firebase 未配置，降级为单用户模式
        if (!cancelled) {
          setIsFirebaseAvailable(false);
          onFirebaseUnavailable?.();
          enterSingleUserMode();
        }
        return;
      }

      // 5s timeout 检查 Firebase 连接
      await new Promise<void>((resolve) => {
        timeoutId = setTimeout(() => {
          if (!cancelled) {
            canvasLogger.default.warn('[useCollaboration] Firebase availability check timeout');
            setIsFirebaseAvailable(false);
            onFirebaseUnavailable?.();
            enterSingleUserMode();
            resolve();
          }
        }, firebaseTimeout);
      });
    };

    checkFirebase();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isSingleUserMode, firebaseTimeout, enterSingleUserMode, onFirebaseUnavailable]);

  // ============================================================================
  // 自动连接
  // ============================================================================
  useEffect(() => {
    if (autoConnect && currentRoom && !isSingleUserMode) {
      connect();
    }

    return () => {
      unmountedRef.current = true;
      disconnect();
    };
  }, [autoConnect, currentRoom, isSingleUserMode, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    isSingleUserMode,
    isFirebaseAvailable,
    error,
    sendMessage,
    connect,
    disconnect,
    retryFirebase,
  };
}

export default useCollaboration;
