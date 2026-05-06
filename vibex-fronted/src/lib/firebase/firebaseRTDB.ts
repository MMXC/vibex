/**
 * Firebase RTDB helpers for node synchronization
 * E01 S01.2: Real-time node sync
 */

import { canvasLogger } from '@/lib/canvas/canvasLogger';

const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? '',
};

function isFirebaseConfigured(): boolean {
  return !!(
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.databaseURL &&
    FIREBASE_CONFIG.apiKey !== 'your-api-key'
  );
}

function getDatabaseUrl(path: string): string {
  const base = FIREBASE_CONFIG.databaseURL!.replace(/\/$/, '');
  const encodedPath = path
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/');
  return `${base}/${encodedPath}.json`;
}

function getAuthParam(): string {
  return `?auth=${FIREBASE_CONFIG.apiKey}`;
}

export interface CanvasNodesSnapshot {
  context?: Array<Record<string, unknown>>;
  flow?: Array<Record<string, unknown>>;
  component?: Array<Record<string, unknown>>;
  updatedAt: number;
  updatedBy: string;
}

/**
 * Subscribe to project nodes via Firebase RTDB SSE streaming
 * @returns unsubscribe function
 */
export function subscribeToNodes(
  projectId: string,
  onUpdate: (snapshot: CanvasNodesSnapshot | null) => void
): () => void {
  if (!isFirebaseConfigured()) {
    canvasLogger.default.warn('[RTDB] Firebase not configured — sync disabled');
    return () => {};
  }

  try {
    const path = `projects/${encodeURIComponent(projectId)}/nodes`;
    const url = `${FIREBASE_CONFIG.databaseURL!.replace(/\/$/, '')}/${path}.json${getAuthParam()}&sse=true&streamType=value`;

    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        if (event.data) {
          const data = JSON.parse(event.data);
          onUpdate(data as CanvasNodesSnapshot);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      canvasLogger.default.error('[RTDB] SSE error for nodes subscription');
    };

    return () => {
      es.close();
    };
  } catch (err) {
    canvasLogger.default.error('[RTDB] Failed to subscribe to nodes:', err);
    return () => {};
  }
}

/**
 * Write local nodes to Firebase RTDB
 * Uses PUT to overwrite the entire nodes snapshot
 */
export async function writeNodes(
  projectId: string,
  nodes: CanvasNodesSnapshot,
  userId: string
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    const path = `projects/${encodeURIComponent(projectId)}/nodes`;
    const url = getDatabaseUrl(path) + getAuthParam();
    const payload = {
      ...nodes,
      updatedAt: Date.now(),
      updatedBy: userId,
    };

    await fetch(url, {
      method: 'PUT',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    canvasLogger.default.debug('[RTDB] writeNodes:', path);
  } catch (err) {
    canvasLogger.default.error('[RTDB] writeNodes failed:', err);
  }
}

export { isFirebaseConfigured };
