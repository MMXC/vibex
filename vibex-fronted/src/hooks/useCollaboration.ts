/**
 * Collaboration Socket Hook
 * 前端 WebSocket 连接管理
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageRouter, type WebSocketMessage } from '@/lib/websocket/MessageRouter';
import { useRoomManager } from '@/lib/websocket/RoomManager';

import { canvasLogger } from '@/lib/canvas/canvasLogger';

interface UseCollaborationOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseCollaborationReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: Error | null;
  sendMessage: (message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Collaboration Socket Hook
 */
export function useCollaboration(options: UseCollaborationOptions = {}): UseCollaborationReturn {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<Omit<WebSocketMessage, 'id' | 'timestamp'>[]>([]);

  const { currentRoom } = useRoomManager();
  const routerRef = useRef<MessageRouter | null>(null);

  // 初始化 MessageRouter
  useEffect(() => {
    routerRef.current = new MessageRouter();

    // 订阅消息
    routerRef.current.subscribe('cursor', (msg) => onMessage?.(msg));
    routerRef.current.subscribe('chat', (msg) => onMessage?.(msg));
    routerRef.current.subscribe('notification', (msg) => onMessage?.(msg));

    return () => {
      // 清理
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // 连接管理
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setIsConnecting(true);
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttemptsRef.current = 0;
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
          routerRef.current?.subscribe(message.type, () => {});
        } catch (e) {
          canvasLogger.default.error('Failed to parse message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // 自动重连
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (e) => {
        setError(new Error('WebSocket error'));
        onError?.(e);
      };
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Connection failed'));
      setIsConnecting(false);
    }
  }, [url, reconnectInterval, maxReconnectAttempts, currentRoom, onConnect, onDisconnect, onError]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  }, []);

  // 发送消息
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'id' | 'timestamp'>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      // 加入队列等待重连
      messageQueueRef.current.push(message);
    }
  }, []);

  // 自动连接
  useEffect(() => {
    if (autoConnect && currentRoom) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, currentRoom, connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    sendMessage,
    connect,
    disconnect,
  };
}

export default useCollaboration;
