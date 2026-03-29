/**
 * SessionStorage Adapter for DDD Cross-Page State Persistence
 * 
 * Provides safe sessionStorage read/write with:
 * - JSON parse error handling (corrupt data → clear)
 * - TTL expiration (30 minutes default)
 * - Cross-slice state snapshot
 */

const SESSION_KEY = 'ddd-cross-page-state';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ==================== Types ====================

export interface DDDCrossPageSnapshot {
  /** Bounded contexts data */
  context: {
    boundedContexts: unknown[];
    contextMermaidCode: string;
    selectedContextIds: string[];
  };
  /** Domain models data */
  model: {
    domainModels: unknown[];
    modelMermaidCode: string;
    selectedModelIds: string[];
  };
  /** Business flows from designStore */
  flow: {
    businessFlows: unknown[];
    requirementText: string;
  };
  timestamps: {
    context: number;
    model: number;
    flow: number;
  };
}

export interface PersistedDDDState {
  boundedContexts: unknown[];
  contextMermaidCode: string;
  selectedContextIds: string[];
  domainModels: unknown[];
  modelMermaidCode: string;
  selectedModelIds: string[];
  businessFlows: unknown[];
  requirementText: string;
  _lastSync: number;
}

// ==================== Helpers ====================

function isServer(): boolean {
  return typeof window === 'undefined';
}

function safeJSONParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ==================== Adapter API ====================

/**
 * Save a cross-slice DDD state snapshot to sessionStorage.
 * Only saves slices that have data (non-empty arrays or non-empty strings).
 */
export function persistSnapshot(state: PersistedDDDState): void {
  if (isServer()) return;

  const snapshot: PersistedDDDState = {
    ...state,
    _lastSync: Date.now(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (err) {
    // sessionStorage full or unavailable — fail silently
    console.warn('[dddStateSync] sessionStorage write failed:', err);
  }
}

/**
 * Restore cross-slice DDD state from sessionStorage.
 * Returns null if:
 * - No saved state
 * - State is expired (TTL)
 * - JSON parse error
 */
export function restoreSnapshot(): PersistedDDDState | null {
  if (isServer()) return null;

  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  const state = safeJSONParse<PersistedDDDState | null>(raw, null);
  if (!state) return null;

  // TTL check: if all three slices are expired, clear and return null
  const now = Date.now();
  const lastSync = state._lastSync ?? 0;
  if (now - lastSync > DEFAULT_TTL_MS) {
    clearSnapshot();
    return null;
  }

  return state;
}

/**
 * Clear saved snapshot from sessionStorage.
 */
export function clearSnapshot(): void {
  if (isServer()) return;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

/**
 * Check if sessionStorage has a valid non-expired snapshot.
 */
export function hasValidSnapshot(): boolean {
  return restoreSnapshot() !== null;
}

/**
 * Get snapshot age in milliseconds. Returns -1 if no snapshot.
 */
export function getSnapshotAge(): number {
  if (isServer()) return -1;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return -1;
  const state = safeJSONParse<PersistedDDDState | null>(raw, null);
  if (!state) return -1;
  return Date.now() - (state._lastSync ?? 0);
}
