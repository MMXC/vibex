// Cloudflare Workers runtime type declarations
// Augments global scope with Cloudflare Workers built-in types

// Global Cloudflare Workers types
interface DurableObjectState {
  id: DurableObjectId;
  storage: DurableObjectStorage;
  blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list<T>(opts?: { start?: string; end?: string; limit?: number }): Promise<Map<string, T>>;
}

// WebSocketPair is a Cloudflare Workers built-in constructor
declare const WebSocketPair: {
  new (): {
    0: WebSocket;
    1: WebSocket;
  };
};

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  get(id: DurableObjectId): DurableObject;
}

// Cloudflare Environment type - used in Durable Objects
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Env extends Record<string, unknown> {}
declare const Env: {
  new (): Record<string, unknown>;
  prototype: Record<string, unknown>;
};;

// Extend WebSocket with Cloudflare's accept method
interface WebSocket {
  accept(): void;
}

// Extend ResponseInit to support webSocket
interface ResponseInit {
  webSocket?: WebSocket;
}

// Cloudflare Workers module
declare module 'cloudflare:workers' {
  export class DurableObject<S = unknown, Env = unknown> {
    constructor(state: DurableObjectState, env: Env);
    fetch(request: Request): Response | Promise<Response>;
  }
}
