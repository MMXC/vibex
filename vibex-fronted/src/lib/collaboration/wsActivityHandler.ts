/**
 * wsActivityHandler — WebSocket handler for user activity broadcast + receive.
 * S67-E2: 实时协作活动流面板
 *
 * Registers with CollabWebSocket to handle:
 * - user:activity (incoming from server — another user's local activity)
 * - broadcastActivity (outgoing — local user activity, throttled to 1 msg/sec/user)
 *
 * Server broadcasts 'user:activity' messages to all clients when a user performs
 * a canvas operation. This handler updates the local activityStore with those entries.
 *
 * Usage:
 *   import { registerActivityWSHandler } from './wsActivityHandler';
 *   registerActivityWSHandler(subscribe, sendRaw);
 */
import type { CollabWSHandler } from './websocket';
import type { ActivityEntry, ActivityMessage } from './types';
import { useActivityStore } from './activityStore';

/** E2: Throttle to 1 message per second per user */
const THROTTLE_MS = 1000;

interface ThrottleEntry {
  lastSent: number;
}

const throttleMap = new Map<string, ThrottleEntry>();

/** E2: user:activity incoming message */
interface UserActivityMessage {
  type: 'user:activity';
  entries: ActivityEntry[];
  userId: string;
}

/**
 * Register this handler with the WebSocket.
 * @param subscribe - useCollaboration's subscribe() function
 * @param sendRaw - useCollaboration's sendRaw() function
 */
export function registerActivityWSHandler(
  subscribe: (handler: CollabWSHandler) => () => void,
  sendRaw: (msg: object) => void
): void {
  // Subscribe to incoming user:activity messages from other clients
  const unsub = subscribe((msg) => {
    if (msg.type === 'user:activity') {
      const m = msg as UserActivityMessage;
      useActivityStore.getState().addEntries(m.entries);
    }
  });

  // Expose broadcast function globally for use by canvas operation handlers
  (window as unknown as Record<string, unknown>).__vibex_broadcastActivity = (
    entry: Omit<ActivityEntry, 'id'>
  ) => {
    const userId = entry.userId;
    const now = Date.now();
    const last = throttleMap.get(userId);

    if (last && now - last.lastSent < THROTTLE_MS) {
      return; // Throttled
    }

    throttleMap.set(userId, { lastSent: now });

    const fullEntry: ActivityEntry = {
      ...entry,
      id: `${now}-${Math.random().toString(36).slice(2, 7)}`,
    };

    // Update local store
    useActivityStore.getState().addEntry(fullEntry);

    // Broadcast to server → other clients
    sendRaw({
      type: 'user:activity',
      entries: [fullEntry],
      userId,
    });
  };
}

/**
 * Broadcast a local user activity event.
 * Call this from canvas operation handlers (e.g., onNodesChange).
 * Throttled to 1 msg/sec per user.
 */
export function broadcastActivity(entry: Omit<ActivityEntry, 'id'>): void {
  const broadcaster = (window as unknown as Record<string, unknown>)
    .__vibex_broadcastActivity as
    | ((e: Omit<ActivityEntry, 'id'>) => void)
    | undefined;
  broadcaster?.(entry);
}

/**
 * Check if the activity broadcaster is registered.
 */
export function isActivityBroadcasterReady(): boolean {
  return typeof (window as unknown as Record<string, unknown>)
    .__vibex_broadcastActivity === 'function';
}
