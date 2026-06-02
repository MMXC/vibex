/**
 * Presence Sync — WebSocket presence message handling
 * Sprint 53 E1: 协作实时 Presence UI
 *
 * Responsibilities:
 * - Handle presence:join / presence:leave / presence:ping WebSocket messages
 * - Update presenceStore with remote users
 * - 30-second inactivity timeout auto-removes users
 */
import { MessageRouter, type BaseMessage } from '@/lib/websocket/MessageRouter';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { canvasLogger } from '@/lib/canvas/canvasLogger';

// ============================================================================
// Module-level router reference
// ============================================================================

let globalPresenceRouter: MessageRouter | null = null;

/** Called by useCollaboration when the MessageRouter is initialized */
export function initPresenceSync(router: MessageRouter): void {
  globalPresenceRouter = router;
  canvasLogger.default.debug('[PresenceSync] Initialized with MessageRouter');
}

// ============================================================================
// Presence message types
// ============================================================================

export interface PresenceJoinPayload {
  userId: string;
  name: string;
  avatar?: string;
}

export interface PresenceLeavePayload {
  userId: string;
}

export interface PresencePingPayload {
  userId: string;
}

export interface CursorMovePayload {
  userId: string;
  x: number;
  y: number;
}

// ============================================================================
// Internal state
// ============================================================================

// 30-second timeout map: userId → timeout timer
const pingTimers = new Map<string, ReturnType<typeof setTimeout>>();

// Auto-remove threshold in ms
const PRESENCE_TIMEOUT_MS = 30_000;

function scheduleTimeoutRemoval(userId: string): void {
  // Cancel any existing timer for this user
  const existing = pingTimers.get(userId);
  if (existing) {
    clearTimeout(existing);
  }

  const timer = setTimeout(() => {
    usePresenceStore.getState().removeUser(userId);
    pingTimers.delete(userId);
    canvasLogger.default.debug('[PresenceSync] User removed due to inactivity:', userId);
  }, PRESENCE_TIMEOUT_MS);

  pingTimers.set(userId, timer);
}

// ============================================================================
// Message handlers
// ============================================================================

function handlePresenceJoin(msg: BaseMessage): void {
  const payload = msg.payload as PresenceJoinPayload;
  if (!payload?.userId) return;

  const { userId, name, avatar } = payload;
  canvasLogger.default.debug('[PresenceSync] presence:join', { userId, name });

  // Add user to presence store
  usePresenceStore.getState().setRemoteUsers([{
    userId,
    name: name || 'Unknown',
    avatar: avatar || '#6366f1',
  }]);

  // Start 30s timeout countdown
  scheduleTimeoutRemoval(userId);
}

function handlePresenceLeave(msg: BaseMessage): void {
  const payload = msg.payload as PresenceLeavePayload;
  if (!payload?.userId) return;

  const { userId } = payload;
  canvasLogger.default.debug('[PresenceSync] presence:leave', { userId });

  // Cancel timeout
  const timer = pingTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    pingTimers.delete(userId);
  }

  // Remove user from presence store
  usePresenceStore.getState().removeUser(userId);
}

function handlePresencePing(msg: BaseMessage): void {
  const payload = msg.payload as PresencePingPayload;
  if (!payload?.userId) return;

  const { userId } = payload;

  // Update lastSeen in store
  const store = usePresenceStore.getState();
  const existing = store.remoteUsers.get(userId);
  if (existing) {
    const updated = new Map(store.remoteUsers);
    updated.set(userId, { ...existing, lastSeen: Date.now() });
    // Directly update without full setRemoteUsers (which resets cursor)
    usePresenceStore.setState({ remoteUsers: updated });
  }

  // Reset 30s timeout countdown
  scheduleTimeoutRemoval(userId);
}

function handleCursorMove(msg: BaseMessage): void {
  const payload = msg.payload as CursorMovePayload;
  if (!payload?.userId) return;

  const { userId, x, y } = payload;
  usePresenceStore.getState().updateCursor(userId, x, y);
}

// ============================================================================
// Subscription management
// ============================================================================

let subscriptionsRegistered = false;

export function registerPresenceHandlers(): void {
  if (!globalPresenceRouter) {
    canvasLogger.default.warn('[PresenceSync] No router available, skipping registration');
    return;
  }

  if (subscriptionsRegistered) {
    canvasLogger.default.debug('[PresenceSync] Handlers already registered');
    return;
  }

  globalPresenceRouter.subscribe('presence', (msg: BaseMessage) => {
    const subType = (msg.payload as { subType?: string }).subType;
    switch (subType) {
      case 'join':
        handlePresenceJoin(msg);
        break;
      case 'leave':
        handlePresenceLeave(msg);
        break;
      case 'ping':
        handlePresencePing(msg);
        break;
      case 'cursor:move':
        handleCursorMove(msg);
        break;
      default:
        canvasLogger.default.debug('[PresenceSync] Unknown presence subType:', subType);
    }
  });

  subscriptionsRegistered = true;
  canvasLogger.default.debug('[PresenceSync] Presence handlers registered');
}

export function unregisterPresenceHandlers(): void {
  subscriptionsRegistered = false;
  // Clear all pending timers
  for (const timer of pingTimers.values()) {
    clearTimeout(timer);
  }
  pingTimers.clear();
}
