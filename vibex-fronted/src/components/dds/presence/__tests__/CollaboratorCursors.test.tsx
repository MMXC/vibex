/**
 * CollaboratorCursors.test.tsx — S84-E2 vitest
 *
 * Uses mockImplementation to support Zustand selector pattern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CollaboratorCursors } from '../CollaboratorCursors';

// Shared mock state
const mockRemoteUsers = new Map<string, { userId: string; name: string; avatar: string; lastSeen: number }>();
const mockCursors: Record<string, { userId: string; userName: string; x: number; y: number; lastSeen: number; avatar?: string }> = {};
let mockConnectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'connected';

function getMockStore() {
  return {
    remoteUsers: mockRemoteUsers,
    cursors: mockCursors,
    connectionStatus: mockConnectionStatus,
  };
}

vi.mock('@/lib/collaboration/presenceStore', () => ({
  usePresenceStore: vi.fn((selector?: (s: ReturnType<typeof getMockStore>) => unknown) => {
    const store = getMockStore();
    if (selector) return selector(store);
    return store;
  }),
}));

vi.mock('@/lib/collaboration/presence/wsPresenceHandler', () => ({
  getCollaboratorColor: vi.fn((userId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) | 0;
    return colors[Math.abs(hash) % 8]!;
  }),
}));

function addCursor(userId: string, userName: string, x: number, y: number, lastSeen: number) {
  mockCursors[userId] = { userId, userName, x, y, lastSeen };
}

describe('CollaboratorCursors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoteUsers.clear();
    Object.keys(mockCursors).forEach((k) => delete mockCursors[k]);
    mockConnectionStatus = 'connected';
  });

  // Case 1: No cursors
  it('renders nothing when no remote cursors', () => {
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.queryByTestId('collab-cursors')).not.toBeInTheDocument();
  });

  // Case 2: Single cursor with SVG and label
  it('renders single cursor with SVG cursor and name label', () => {
    const now = Date.now();
    addCursor('u1', 'Alice', 100, 200, now);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: now });
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.getByTestId('collab-cursors')).toBeInTheDocument();
    expect(screen.getByTestId('collab-cursor-u1')).toHaveAttribute('data-username', 'Alice');
    expect(screen.getByTestId('collab-cursor-u1')).toHaveTextContent('Alice');
  });

  // Case 3: Multiple cursors
  it('renders multiple cursors', () => {
    const now = Date.now();
    addCursor('u1', 'Alice', 100, 200, now);
    addCursor('u2', 'Bob', 300, 150, now);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: now });
    mockRemoteUsers.set('u2', { userId: 'u2', name: 'Bob', avatar: '', lastSeen: now });
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.getByTestId('collab-cursors')).toHaveAttribute('data-count', '2');
    expect(screen.getByTestId('collab-cursor-u1')).toBeInTheDocument();
    expect(screen.getByTestId('collab-cursor-u2')).toBeInTheDocument();
  });

  // Case 4: Excludes own cursor
  it('excludes current user cursor', () => {
    const now = Date.now();
    addCursor('self-1', 'Me', 100, 200, now);
    addCursor('u2', 'Bob', 300, 150, now);
    mockRemoteUsers.set('self-1', { userId: 'self-1', name: 'Me', avatar: '', lastSeen: now });
    mockRemoteUsers.set('u2', { userId: 'u2', name: 'Bob', avatar: '', lastSeen: now });
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.getByTestId('collab-cursors')).toHaveAttribute('data-count', '1');
    expect(screen.queryByTestId('collab-cursor-self-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('collab-cursor-u2')).toBeInTheDocument();
  });

  // Case 5: Stale cursor (> 60s) not shown
  it('does not show cursor with stale lastSeen (> 60 seconds)', () => {
    const staleTimestamp = Date.now() - 90 * 1000;
    addCursor('u1', 'Alice', 100, 200, staleTimestamp);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: staleTimestamp });
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.queryByTestId('collab-cursors')).not.toBeInTheDocument();
  });

  // Case 6: Recent cursor (< 60s) is shown
  it('shows cursor with recent lastSeen (< 60 seconds)', () => {
    const recentTimestamp = Date.now() - 30 * 1000;
    addCursor('u1', 'Alice', 100, 200, recentTimestamp);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: recentTimestamp });
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.getByTestId('collab-cursor-u1')).toBeInTheDocument();
  });

  // Case 7: Viewport offset applied
  it('applies viewport offset to cursor position', () => {
    const now = Date.now();
    addCursor('u1', 'Alice', 200, 300, now);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: now });
    render(<CollaboratorCursors currentUserId="self-1" viewportOffsetX={50} viewportOffsetY={100} />);
    const cursorEl = screen.getByTestId('collab-cursor-u1');
    // Position = (200-50, 300-100) = (150, 200)
    expect(cursorEl).toHaveStyle({ transform: 'translate(150px, 200px)' });
  });

  // Case 8: Connection status in data attribute
  it('reflects connection status in data attribute', () => {
    const now = Date.now();
    addCursor('u1', 'Alice', 100, 200, now);
    mockRemoteUsers.set('u1', { userId: 'u1', name: 'Alice', avatar: '', lastSeen: now });
    mockConnectionStatus = 'reconnecting';
    render(<CollaboratorCursors currentUserId="self-1" />);
    expect(screen.getByTestId('collab-cursors')).toHaveAttribute('data-connection', 'reconnecting');
  });
});
