/**
 * WebSocket Client — VibeX Real-time Collaboration
 * P002-E1: WebSocket 连接层
 *
 * WebSocket protocol:
 * - URL: wss://ws.vibex.top?token=<jwt>
 * - Client → Server: { type: 'auth', token }, { type: 'action', payload }
 * - Server → Client: { type: 'remote_action' }, { type: 'presence' }, { type: 'conflict' }
 */

import type {
  CollabMessage,
  CollabActionPayload,
  RemoteActionMessage,
  PresenceMessage,
  ConflictMessage,
} from './types';

export type CollabWSHandler = (msg: CollabMessage) => void;

export interface CollabWSOptions {
  url: string;
  maxRetries?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  onMessage?: CollabWSHandler;
}

const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

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

  constructor(options: CollabWSOptions) {
    this.url = options.url;
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.onError = options.onError;
    if (options.onMessage) {
      this.handlers.add(options.onMessage);
    }
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('[CollabWS] connected');
      this.retryCount = 0;
      this.onOpen?.();
    };

    this.ws.onclose = () => {
      console.log('[CollabWS] disconnected');
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
        this.handlers.forEach((h) => h(msg));
      } catch (e) {
        console.error('[CollabWS] failed to parse message', e);
      }
    };
  }

  disconnect(): void {
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
    if (this.ws?.readyState === WebSocket.OPEN) {
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
    const delay = BASE_RETRY_DELAY_MS * Math.pow(2, this.retryCount); // exponential backoff
    this.retryCount++;
    console.log(`[CollabWS] reconnecting in ${delay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
    this.retryTimer = setTimeout(() => this.connect(), delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
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
