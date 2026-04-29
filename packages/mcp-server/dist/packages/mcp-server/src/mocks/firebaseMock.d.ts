/**
 * Firebase Mock — S16-P1-1
 *
 * Simulates Firebase Realtime Database behavior with 4 states:
 * - CONNECTED: normal realtime sync
 * - DEGRADED: high latency (simulated 2s delay)
 * - DISCONNECTED: returns null, local-only mode
 * - RECONNECTING: exponential backoff, auto-recovers
 */
export type FirebaseMockState = 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'RECONNECTING';
export interface FirebaseMockConfig {
    initialState?: FirebaseMockState;
    degradedLatencyMs?: number;
    reconnectBaseDelayMs?: number;
    reconnectMaxDelayMs?: number;
}
export type StateChangeListener = (state: FirebaseMockState) => void;
declare class FirebaseMock {
    private state;
    private config;
    private listeners;
    private reconnectAttempts;
    private reconnectTimer;
    constructor(config?: FirebaseMockConfig);
    getState(): FirebaseMockState;
    subscribe(listener: StateChangeListener): () => void;
    private notify;
    query<T>(_path: string): Promise<T | null>;
    set<T>(_path: string, _value: T): Promise<void>;
    setState(newState: FirebaseMockState): void;
    private scheduleReconnect;
    forceReconnect(): void;
    measureColdStart(): number;
}
export declare function getFirebaseMock(config?: FirebaseMockConfig): FirebaseMock;
export declare function resetFirebaseMock(): void;
export { FirebaseMock };
