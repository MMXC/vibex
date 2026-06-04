/**
 * useCollaboration — Zustand-friendly WebSocket collaboration hook
 * P002-E1: WebSocket 连接层 + useCollaboration Hook
 *
 * Usage:
 *   const { connect, disconnect, broadcast, subscribe, isConnected, onlineUsers } =
 *     useCollaboration();
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { CollabWebSocket } from './websocket';
import type {
  CollabMessage,
  CollabActionPayload,
  CollabUser,
  RemoteActionMessage,
  PresenceMessage,
  ConflictMessage,
  AuthMessage,
  ActionMessage,
} from './types';

export interface UseCollaborationOptions {
  /** WebSocket URL (default: wss://ws.vibex.top) */
  wsUrl?: string;
  /** JWT token from localStorage key (default: 'vibex-token') */
  tokenKey?: string;
  /** Max reconnection retries (default: 3) */
  maxRetries?: number;
  /** Called when remote action received */
  onRemoteAction?: (msg: RemoteActionMessage) => void;
  /** Called when presence update received */
  onPresence?: (users: CollabUser[]) => void;
  /** Called when conflict detected */
  onConflict?: (msg: ConflictMessage) => void;
}

const DEFAULT_WS_URL = 'wss://ws.vibex.top';
const DEFAULT_TOKEN_KEY = 'vibex-token';

export function useCollaboration(options: UseCollaborationOptions = {}) {
  const {
    wsUrl = DEFAULT_WS_URL,
    tokenKey = DEFAULT_TOKEN_KEY,
    maxRetries = 3,
    onRemoteAction,
    onPresence,
    onConflict,
  } = options;

  const wsRef = useRef<CollabWebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<CollabUser[]>([]);

  // Build message handler
  const handleMessage = useCallback(
    (msg: CollabMessage) => {
      switch (msg.type) {
        case 'remote_action':
          onRemoteAction?.(msg);
          break;
        case 'presence':
          setOnlineUsers(msg.users);
          onPresence?.(msg.users);
          break;
        case 'conflict':
          onConflict?.(msg);
          break;
      }
    },
    [onRemoteAction, onPresence, onConflict]
  );

  // Initialize WebSocket
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    const url = token ? `${wsUrl}?token=${encodeURIComponent(token)}` : wsUrl;

    wsRef.current = new CollabWebSocket({
      url,
      maxRetries,
      onOpen: () => setIsConnected(true),
      onClose: () => {
        setIsConnected(false);
        setOnlineUsers([]);
      },
      onMessage: handleMessage,
    });

    return () => {
      wsRef.current?.disconnect();
      wsRef.current = null;
    };
  }, [wsUrl, tokenKey, maxRetries, handleMessage]);

  const connect = useCallback(() => {
    wsRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
  }, []);

  /**
   * Broadcast a canvas action to other users
   */
  const broadcast = useCallback(
    (type: CollabActionPayload['action'], payload: Omit<CollabActionPayload, 'action' | 'timestamp'>) => {
      const msg: ActionMessage = {
        type: 'action',
        payload: {
          ...payload,
          action: type,
          timestamp: Date.now(),
        },
      };
      wsRef.current?.send(msg);
    },
    []
  );

  /**
   * Subscribe to all incoming messages (returns unsubscribe fn)
   */
  const subscribe = useCallback(
    (handler: (msg: CollabMessage) => void) => {
      return wsRef.current?.subscribe(handler) ?? (() => {});
    },
    []
  );

  /**
   * S62-E1: Send arbitrary message types (e.g. collab:editing:start/end).
   * Use this for message types not covered by the standard broadcast() method.
   */
  const sendRaw = useCallback((msg: object) => {
    wsRef.current?.send(msg);
  }, []);

  return {
    connect,
    disconnect,
    broadcast,
    sendRaw,
    subscribe,
    isConnected,
    onlineUsers,
  };
}
