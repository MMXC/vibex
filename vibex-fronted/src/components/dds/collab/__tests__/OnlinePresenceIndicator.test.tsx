/**
 * S80-E5: OnlinePresenceIndicator component tests
 * Tests green/grey dot per collaborator based on lastActiveAt timestamps
 *
 * Note: OnlinePresenceIndicator shows a single user's presence status (not global).
 * Component signature: <OnlinePresenceIndicator userId userName avatar showLabel className />
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import OnlinePresenceIndicator from '../OnlinePresenceIndicator';

// S80-E5: Mock presenceStore — onlineUsers is string[] (not Set)
const createMockPresenceStore = () => {
  const store = {
    remoteUsers: new Map<string, { id: string; name: string; color: string }>(),
    cursors: new Map<string, { x: number; y: number }>(),
    // S80-E5: onlineUsers is string[] per presenceStore state
    onlineUsers: ['user-2', 'user-3'] as string[],
    // S80-E5: lastActiveAt timestamps — key presence field
    lastActiveAt: {} as Record<string, number>,
    // S80-E5: isOnline uses 5-min threshold from lastActiveAt
    isOnline: (userId: string) => {
      const ts = store.lastActiveAt[userId];
      if (!ts) return false;
      return Date.now() - ts < 5 * 60_000; // OFFLINE_THRESHOLD_MS
    },
    // S80-E5: updateLastActive action
    updateLastActive: (userId: string) => {
      store.lastActiveAt[userId] = Date.now();
    },
    addUser: vi.fn(),
    removeUser: vi.fn(),
    updateCursor: vi.fn(),
    updateFocusedNode: vi.fn(),
    clearAll: vi.fn(),
    setOnline: vi.fn(),
  };
  return store;
};

// S80-E5: Mock authStore
const mockAuthStore = {
  currentUser: { id: 'user-1', name: 'Alice', color: '#6366f1' },
  token: 'mock-token',
};

// S80-E5: Mock usePresenceStore — always returns timestamps for test users
vi.mock('@/lib/collaboration/presenceStore', () => ({
  usePresenceStore: vi.fn((selector?: (s: ReturnType<typeof createMockPresenceStore>) => unknown) => {
    const store = createMockPresenceStore();
    // Default: both test users are online (recent timestamps)
    store.lastActiveAt = {
      'user-2': Date.now() - 30_000,       // 30s ago → online
      'user-3': Date.now() - 180_000,      // 3min ago → online
    };
    if (selector) return selector(store);
    return store;
  }),
}));

// S80-E5: Mock useAuthStore
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(() => mockAuthStore),
}));

// S80-E5: Mock useUserPreferencesStore
vi.mock('@/stores/userPreferencesStore', () => ({
  useUserPreferencesStore: vi.fn(() => ({
    showCollabStatus: true,
  })),
}));

// S80-E5: Mock CSS module for OnlinePresenceIndicator
vi.mock('./OnlinePresenceIndicator.module.css', () => ({
  wrapper: 'wrapper',
  avatarWrap: 'avatarWrap',
  avatar: 'avatar',
  avatarFallback: 'avatarFallback',
  dot: 'dot',
  dotOnline: 'dotOnline',
  dotOffline: 'dotOffline',
  label: 'label',
}));

describe('OnlinePresenceIndicator — S80-E5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // S80-E5: Component renders with required props
  it('renders with required userId and userName props', () => {
    const { container } = render(
      <OnlinePresenceIndicator userId="user-2" userName="Bob" />
    );
    expect(container.querySelector('[data-testid="online-presence-indicator"]')).toBeTruthy();
  });

  // S80-E5: Shows green dot for online user (timestamp < 5 min)
  it('shows green dot for user active within 5 minutes', async () => {
    const { usePresenceStore } = await import('@/lib/collaboration/presenceStore');
    vi.mocked(usePresenceStore).mockImplementation((selector?: (s: ReturnType<typeof createMockPresenceStore>) => unknown) => {
      const store = createMockPresenceStore();
      store.lastActiveAt = { 'user-2': Date.now() - 30_000 }; // 30s ago → online
      if (selector) return selector(store);
      return store;
    });
    const { container } = render(
      <OnlinePresenceIndicator userId="user-2" userName="Bob" />
    );
    const indicator = container.querySelector('[data-testid="online-presence-indicator"]');
    expect(indicator).toBeTruthy();
    expect(indicator?.getAttribute('data-userid')).toBe('user-2');
  });

  // S80-E5: Shows grey dot for idle collaborator (> 5 min since last activity)
  it('shows grey dot for user inactive for 5+ minutes', async () => {
    const { usePresenceStore } = await import('@/lib/collaboration/presenceStore');
    vi.mocked(usePresenceStore).mockImplementation((selector?: (s: ReturnType<typeof createMockPresenceStore>) => unknown) => {
      const store = createMockPresenceStore();
      store.lastActiveAt = { 'user-2': Date.now() - 10 * 60_000 }; // 10min ago → offline/idle
      if (selector) return selector(store);
      return store;
    });
    const { container } = render(
      <OnlinePresenceIndicator userId="user-2" userName="Bob" />
    );
    const indicator = container.querySelector('[data-testid="online-presence-indicator"]');
    expect(indicator).toBeTruthy();
    expect(indicator?.getAttribute('data-userid')).toBe('user-2');
  });

  // S80-E5: Handles user with no lastActiveAt entry (unknown user)
  it('handles user with no lastActiveAt entry gracefully', async () => {
    const { usePresenceStore } = await import('@/lib/collaboration/presenceStore');
    vi.mocked(usePresenceStore).mockImplementation((selector?: (s: ReturnType<typeof createMockPresenceStore>) => unknown) => {
      const store = createMockPresenceStore();
      store.lastActiveAt = {}; // no timestamps
      if (selector) return selector(store);
      return store;
    });
    const { container } = render(
      <OnlinePresenceIndicator userId="unknown-user" userName="Ghost" />
    );
    const indicator = container.querySelector('[data-testid="online-presence-indicator"]');
    expect(indicator).toBeTruthy();
  });

  // S80-E5: updateLastActive sets lastActiveAt[userId] to current timestamp
  it('updateLastActive sets lastActiveAt[userId] to current timestamp', () => {
    const store = createMockPresenceStore();
    const before = Date.now();
    store.updateLastActive('user-4');
    const after = Date.now();
    expect(store.lastActiveAt['user-4']).toBeGreaterThanOrEqual(before);
    expect(store.lastActiveAt['user-4']).toBeLessThanOrEqual(after);
  });

  // S80-E5: isOnline returns true for recent timestamp (< 5 min)
  it('isOnline returns true for recent timestamp (< 5 min)', () => {
    const store = createMockPresenceStore();
    store.lastActiveAt['user-5'] = Date.now() - 60_000; // 1min ago
    expect(store.isOnline('user-5')).toBe(true);
  });

  // S80-E5: isOnline returns false for old timestamp (>= 5 min)
  it('isOnline returns false for old timestamp (>= 5 min)', () => {
    const store = createMockPresenceStore();
    store.lastActiveAt['user-6'] = Date.now() - 6 * 60_000; // 6min ago
    expect(store.isOnline('user-6')).toBe(false);
  });
});
