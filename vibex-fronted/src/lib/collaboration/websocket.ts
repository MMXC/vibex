/**
 * WebSocket Client — VibeX Real-time Collaboration
 * P002-E1: WebSocket 连接层
 * S77-E2: WebSocket 连接稳定性增强 — 心跳 ping/pong + 断线重连 + connectionStatus
 *
 * WebSocket protocol:
 * - URL: wss://ws.vibex.top?token=***
 * - Client → Server: { type: 'auth', token }, { type: 'action', payload }
 * - Server → Client: { type: 'remote_action' }, { type: 'presence' }, { type: 'conflict' }
 * - S77-E2: Client → Server: { type: 'ping', timestamp }, Server responds: { type: 'pong', timestamp }
 */

import type {
  CollabMessage,
  RemoteActionMessage,
  PresenceMessage,
  ConflictMessage,
} from './types';

export type CollabWSHandler = (msg: CollabMessage) => void;

export interface CollabWSOptions {
  url: string;
  maxRetries?: number;
  /** Heartbeat interval in ms (default: 30000 = 30s, S77-E2) */
  heartbeatIntervalMs?: number;
  /** Missed pong count before reconnect (default: 3, S77-E2) */
  maxMissedPongs?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  /** Called when entering reconnecting state (S77-E2) */
  onReconnecting?: (attempt: number) => void;
  /** Called after successful reconnect (S77-E2) */
  onReconnected?: () => void;
  onMessage?: CollabWSHandler;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RETRY_DELAY_MS = 30000;
const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000;
const DEFAULT_MAX_MISSED_PONGS = 3;

export class CollabWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private maxRetries: number;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers: Set<CollabWSHandler> = new Set();
  private onOpen?: () => void;
  private onClose?: () => void;
  private onError?: (err: Event) => void;
  private onReconnecting?: (attempt: number) => void;
  private onReconnected?: () => void;

  // S77-E2: Heartbeat state
  private heartbeatIntervalMs: number;
  private maxMissedPongs: number;
  private pingTimer: ReturnType<typeof setTimeout> | null = null;
  private lastPongReceived: number = Date.now();
  private missedPongCount: number = 0;
  private pendingPingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: CollabWSOptions) {
    this.url = options.url;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_INTERVAL_MS;
    this.maxMissedPongs = options.maxMissedPongs ?? DEFAULT_MAX_MISSED_PONGS;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
    this.onReconnecting = options.onReconnecting;
    this.onReconnected = options.onReconnected;
    if (options.onMessage) {
      this.handlers.add(options.onMessage);
    }
  }

  private scheduleNextPing(): void {
    // Cancel any pending timers
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pendingPingTimer) {
      clearTimeout(this.pendingPingTimer);
      this.pendingPingTimer = null;
    }

    // Schedule the next ping
    this.pingTimer = setTimeout(() => {
      console.log('[DEBUG] ping timer cb fired: ws=', !!this.ws, 'readyState=', this.ws?.readyState, 'OPEN=', WebSocket.OPEN);
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

      // Send ping
      const timestamp = Date.now();
      console.log('[DEBUG] calling this.send ping');
      this.send({ type: 'ping', timestamp });

      // Wait for pong with 1 heartbeat interval as timeout
      this.pendingPingTimer = setTimeout(() => {
        this.missedPongCount++;
        console.warn(
          `[CollabWS] missed pong #${this.missedPongCount}/${this.maxMissedPongs} (${Date.now() - this.lastPongReceived}ms since last pong)`
        );

        if (this.missedPongCount >= this.maxMissedPongs) {
          console.warn('[CollabWS] max missed pongs reached, forcing reconnect');
          this.stopHeartbeat();
          this.ws?.close();
        } else {
          // Schedule the next ping cycle
          this.scheduleNextPing();
        }
      }, this.heartbeatIntervalMs);
    }, this.heartbeatIntervalMs);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.lastPongReceived = Date.now();
    this.missedPongCount = 0;
    this.scheduleNextPing();
  }

  private stopHeartbeat(): void {
    if (this.pingTimer) {
      clearTimeout(this.pingTimer);
      this.pingTimer = null;
    }
    if (this.pendingPingTimer) {
      clearTimeout(this.pendingPingTimer);
      this.pendingPingTimer = null;
    }
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[CollabWS] connected');
      // Only reset retryCount on the very first connection ever (not on reconnects)
      // This preserves the exponential backoff: retryCount increments for each
      // reconnection attempt and is NOT reset between successful reconnects.
      if (!(this as unknown as Record<string, boolean>)._everConnected) {
        this.retryCount = 0;
        (this as unknown as Record<string, boolean>)._everConnected = true;
      }
      this.lastPongReceived = Date.now();
      this.missedPongCount = 0;
      this.startHeartbeat();
      this.onOpen?.();
      this.onReconnected?.();
    };

    this.ws.onclose = () => {
      console.log('[CollabWS] disconnected');
      this.stopHeartbeat();
      this.onClose?.();
      this.scheduleReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[CollabWS] error', err);
      this.onError?.(err);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg: CollabMessage = JSON.parse(event.data as string);

        // S77-E2: Handle pong response
        if (msg.type === 'pong') {
          this.lastPongReceived = Date.now();
          this.missedPongCount = 0;
          if (this.pendingPingTimer) {
            clearTimeout(this.pendingPingTimer);
            this.pendingPingTimer = null;
          }
          // Restart the ping cycle
          this.scheduleNextPing();
          return;
        }

        this.handlers.forEach((h) => h(msg));
      } catch (e) {
        console.error('[CollabWS] failed to parse message', e);
      }
    };
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryCount = this.maxRetries; // prevent reconnect
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(msg: object): void {
    console.log('[DEBUG] send called: ws=', !!this.ws, 'readyState=', this.ws?.readyState, 'OPEN=', WebSocket.OPEN, 'typeof send=', typeof this.ws?.send);
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[DEBUG] calling this.ws.send');
      console.log('[DEBUG] this.ws.send is:', typeof this.ws.send, 'calls:', (this.ws.send as any).mock?.calls?.length);
      console.log('[DEBUG] this.ws.send is:', typeof this.ws.send, 'mock?:', !!(this.ws.send as any).mock, 'calls:', (this.ws.send as any).mock?.calls?.length);
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[CollabWS] send skipped — not connected');
    }
  }

  subscribe(handler: CollabWSHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      console.warn('[CollabWS] max retries reached, giving up');
      return;
    }
    // S77-E2: exponential backoff with max cap
    const delay = Math.min(
      DEFAULT_BASE_RETRY_DELAY_MS * Math.pow(2, this.retryCount),
      DEFAULT_MAX_RETRY_DELAY_MS
    );
    this.retryCount++;
    console.log(`[CollabWS] reconnecting in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
    // S77-E2: notify about reconnecting state
    this.onReconnecting?.(this.retryCount);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** S77-E2: Simulate disconnect for testing */
  simulateDisconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** S77-E2: Simulate reconnect for testing */
  simulateReconnect(): void {
    this.retryCount = 0;
    this.connect();
  }
}

// Convenience helpers
export function parseRemoteAction(msg: CollabMessage): RemoteActionMessage | null {
  if (msg.type === 'remote_action') return msg as RemoteActionMessage;
  return null;
}

export function parsePresence(msg: CollabMessage): PresenceMessage | null {
  if (msg.type === 'presence') return msg as PresenceMessage;
  return null;
}

export function parseConflict(msg: CollabMessage): ConflictMessage | null {
  if (msg.type === 'conflict') return msg as ConflictMessage;
  return null;
}
