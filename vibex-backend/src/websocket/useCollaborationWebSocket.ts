/**
 * WebSocket Client Hook - 前端 WebSocket 连接管理
 * 
 * 提供:
 * - WebSocket 连接建立
 * - 自动重连
 * - 消息发送/接收
 * - 在线状态管理
 * - 协作锁操作
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { devLog, safeError } from '@/lib/log-sanitizer';

export interface UseWebSocketOptions {
  projectId: string;
  userId: string;
  userName: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onPresenceUpdate?: (users: PresenceUser[]) => void;
  onLockResult?: (result: LockResult) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface PresenceUser {
  userId: string;
  userName: string;
  status: 'online' | 'offline' | 'editing';
}

export interface LockResult {
  success: boolean;
  lockedBy?: {
    userId: string;
    userName: string;
  };
  expiresAt?: Date;
}

export interface WSMessage {
  type: string;
  payload: any;
  timestamp: number;
}

/**
 * WebSocket 连接 hook
 */
export function useCollaborationWebSocket(options: UseWebSocketOptions) {
  const {
    projectId,
    userId,
    userName,
    onConnect,
    onDisconnect,
    onMessage,
    onPresenceUpdate,
    onLockResult,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const connectionIdRef = useRef<string | null>(null);

  // 建立 WebSocket 连接
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // 使用当前页面的 host 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      devLog('WebSocket connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      onConnect?.();
      
      // 发送认证信息
      ws.send(JSON.stringify({
        type: 'auth',
        payload: {
          userId,
          userName,
          projectId,
        },
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        
        switch (message.type) {
          case 'connection:established':
            connectionIdRef.current = message.payload.connectionId;
            break;
            
          case 'presence:update':
            if (message.payload.status === 'offline') {
              setOnlineUsers(prev => prev.filter(u => u.userId !== message.payload.userId));
            } else {
              setOnlineUsers(prev => {
                const exists = prev.find(u => u.userId === message.payload.userId);
                if (exists) {
                  return prev.map(u => u.userId === message.payload.userId ? message.payload : u);
                }
                return [...prev, message.payload];
              });
            }
            onPresenceUpdate?.(onlineUsers);
            break;
            
          case 'lock:result':
            onLockResult?.(message.payload);
            break;
            
          default:
            onMessage?.(message);
        }
      } catch (error) {
        safeError('Failed to parse message:', error);
      }
    };
    
    ws.onclose = () => {
      devLog('WebSocket disconnected');
      setIsConnected(false);
      onDisconnect?.();
      
      // 自动重连
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(connect, reconnectInterval);
      }
    };
    
    ws.onerror = (error) => {
      safeError('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, [projectId, userId, userName, onConnect, onDisconnect, onMessage, onPresenceUpdate, onLockResult, reconnectInterval, maxReconnectAttempts, onlineUsers]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // 发送消息
  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type,
        payload,
        timestamp: Date.now(),
      }));
    }
  }, []);

  // 获取锁
  const acquireLock = useCallback((resourceId: string, resourceType: 'project' | 'flow' | 'page') => {
    sendMessage('lock:acquire', { resourceId, resourceType });
  }, [sendMessage]);

  // 释放锁
  const releaseLock = useCallback((resourceId: string) => {
    sendMessage('lock:release', { resourceId });
  }, [sendMessage]);

  // 广播消息
  const broadcast = useCallback((content: string) => {
    sendMessage('broadcast:message', { content });
  }, [sendMessage]);

  // 更新在线状态
  const updatePresence = useCallback((status: 'online' | 'editing') => {
    sendMessage('presence:update', { status });
  }, [sendMessage]);

  // 自动连接
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    onlineUsers,
    connect,
    disconnect,
    sendMessage,
    acquireLock,
    releaseLock,
    broadcast,
    updatePresence,
  };
}

export default useCollaborationWebSocket;
