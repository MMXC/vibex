/**
 * Firebase Mock — S16-P1-1
 *
 * Simulates Firebase Realtime Database behavior with 4 states:
 * - CONNECTED: normal realtime sync
 * - DEGRADED: high latency (simulated 2s delay)
 * - DISCONNECTED: returns null, local-only mode
 * - RECONNECTING: exponential backoff, auto-recovers
 */

export type FirebaseMockState =
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'RECONNECTING';

export interface FirebaseMockConfig {
  initialState?: FirebaseMockState;
  degradedLatencyMs?: number;
  reconnectBaseDelayMs?: number;
  reconnectMaxDelayMs?: number;
}

export type StateChangeListener = (state: FirebaseMockState) => void;

const DEFAULT_CONFIG: Required<Omit<FirebaseMockConfig, 'initialState'>> = {
  degradedLatencyMs: 2000,
  reconnectBaseDelayMs: 1000,
  reconnectMaxDelayMs: 30000,
};

class FirebaseMock {
  private state: FirebaseMockState;
  private config: Required<Omit<FirebaseMockConfig, 'initialState'>>;
  private listeners: Set<StateChangeListener> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: FirebaseMockConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = config.initialState ?? 'CONNECTED';
  }

  getState(): FirebaseMockState {
    return this.state;
  }

  subscribe(listener: StateChangeListener): () => void {
    // Immediately notify of current state
    listener(this.state);
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(state: FirebaseMockState) {
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  async query<T>(_path: string): Promise<T | null> {
    if (this.state === 'DISCONNECTED') {
      return null;
    }
    if (this.state === 'RECONNECTING') {
      return null;
    }
    if (this.state === 'DEGRADED') {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.degradedLatencyMs)
      );
    }
    return null;
  }

  async set<T>(_path: string, _value: T): Promise<void> {
    if (this.state === 'DISCONNECTED') {
      throw new Error('Firebase is disconnected');
    }
    if (this.state === 'RECONNECTING') {
      throw new Error('Firebase is reconnecting');
    }
    if (this.state === 'DEGRADED') {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.degradedLatencyMs)
      );
    }
  }

  setState(newState: FirebaseMockState) {
    if (this.state === newState) return;
    this.notify(newState);
    if (newState === 'RECONNECTING') {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    const delay = Math.min(
      this.config.reconnectBaseDelayMs *
        Math.pow(2, this.reconnectAttempts),
      this.config.reconnectMaxDelayMs
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      if (this.reconnectAttempts >= 5) {
        this.reconnectAttempts = 0;
        this.notify('CONNECTED');
      } else {
        this.notify('RECONNECTING');
        this.scheduleReconnect();
      }
    }, delay);
  }

  forceReconnect() {
    this.reconnectAttempts = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.notify('CONNECTED');
  }

  measureColdStart(): number {
    const start = Date.now();
    void this.getState();
    return Date.now() - start;
  }
}

let instance: FirebaseMock | null = null;

export function getFirebaseMock(
  config?: FirebaseMockConfig
): FirebaseMock {
  if (!instance) {
    instance = new FirebaseMock(config);
  }
  return instance;
}

export function resetFirebaseMock() {
  if (instance) {
    if (instance['reconnectTimer']) {
      clearTimeout(instance['reconnectTimer']);
    }
  }
  instance = null;
}

export { FirebaseMock };
