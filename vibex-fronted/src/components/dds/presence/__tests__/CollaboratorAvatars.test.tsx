/**
 * CollaboratorAvatars.test.tsx — S84-E2 vitest
 *
 * Uses mockImplementation to support Zustand selector pattern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CollaboratorAvatars } from '../CollaboratorAvatars';

// Shared mock state
const mockRemoteUsers = new Map<string, { userId: string; name: string; avatar: string; lastSeen: number }>();
let mockConnectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'connected';

function getMockStore() {
  return {
    remoteUsers: mockRemoteUsers,
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

function addUser(userId: string, name: string, lastSeen: number, avatar = '') {
  mockRemoteUsers.set(userId, { userId, name, avatar, lastSeen });
}

describe('CollaboratorAvatars', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRemoteUsers.clear();
    mockConnectionStatus = 'connected';
  });

  // Case 1: Empty state
  it('renders empty state when no collaborators', () => {
    render(<CollaboratorAvatars currentUserId="self-1" />);
    expect(screen.getByTestId('collab-avatars-empty')).toBeInTheDocument();
    expect(screen.getByTestId('collab-avatars-empty')).toHaveTextContent('暂无协作者');
  });

  // Case 2: Single collaborator
  it('renders single collaborator avatar with status dot', () => {
    const now = Date.now();
    addUser('u1', 'Alice', now);
    render(<CollaboratorAvatars currentUserId="self-1" />);
    const avatars = screen.getByTestId('collab-avatars');
    expect(avatars).toHaveAttribute('data-count', '1');
    const avatarItem = screen.getByTestId('collab-avatar-u1');
    expect(avatarItem).toHaveAttribute('data-username', 'Alice');
  });

  // Case 3: Multiple collaborators
  it('renders multiple collaborators in stack', () => {
    const now = Date.now();
    addUser('u1', 'Alice', now);
    addUser('u2', 'Bob', now);
    addUser('u3', 'Carol', now);
    render(<CollaboratorAvatars currentUserId="self-1" maxDisplay={5} />);
    expect(screen.getByTestId('collab-avatars')).toHaveAttribute('data-count', '3');
    expect(screen.getByTestId('collab-avatar-u1')).toBeInTheDocument();
    expect(screen.getByTestId('collab-avatar-u2')).toBeInTheDocument();
    expect(screen.getByTestId('collab-avatar-u3')).toBeInTheDocument();
  });

  // Case 4: Overflow "+N" badge
  it('shows overflow badge when collaborators exceed maxDisplay', () => {
    const now = Date.now();
    for (let i = 1; i <= 8; i++) addUser(`u${i}`, `User${i}`, now);
    render(<CollaboratorAvatars currentUserId="self-1" maxDisplay={5} />);
    expect(screen.getByTestId('collab-avatars-overflow')).toHaveTextContent('+3');
    expect(screen.queryByTestId('collab-avatar-u6')).not.toBeInTheDocument();
  });

  // Case 5: Online status (< 5 min)
  it('shows online status dot when lastActiveAt < 5 minutes', () => {
    const now = Date.now();
    const twoMinAgo = now - 2 * 60 * 1000;
    addUser('u1', 'Alice', twoMinAgo);
    render(<CollaboratorAvatars currentUserId="self-1" />);
    const statusDot = screen.getByTestId('collab-avatar-u1').querySelector('[data-status]');
    expect(statusDot).toHaveAttribute('data-status', 'online');
  });

  // Case 6: Idle status (5-30 min)
  it('shows idle status dot when lastActiveAt between 5 and 30 minutes', () => {
    const now = Date.now();
    const tenMinAgo = now - 10 * 60 * 1000;
    addUser('u1', 'Alice', tenMinAgo);
    render(<CollaboratorAvatars currentUserId="self-1" />);
    const statusDot = screen.getByTestId('collab-avatar-u1').querySelector('[data-status]');
    expect(statusDot).toHaveAttribute('data-status', 'idle');
  });

  // Case 7: Offline status (> 30 min)
  it('shows offline status dot when lastActiveAt > 30 minutes', () => {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    addUser('u1', 'Alice', oneHourAgo);
    render(<CollaboratorAvatars currentUserId="self-1" />);
    const statusDot = screen.getByTestId('collab-avatar-u1').querySelector('[data-status]');
    expect(statusDot).toHaveAttribute('data-status', 'offline');
  });

  // Case 8: Excludes currentUserId
  it('excludes currentUserId from collaborator list', () => {
    const now = Date.now();
    addUser('self-1', 'Me', now);
    addUser('u2', 'Bob', now);
    render(<CollaboratorAvatars currentUserId="self-1" />);
    expect(screen.getByTestId('collab-avatars')).toHaveAttribute('data-count', '1');
    expect(screen.queryByTestId('collab-avatar-self-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('collab-avatar-u2')).toBeInTheDocument();
  });

  // Case 9: Reconnect spinner
  it('shows reconnect spinner when connectionStatus is reconnecting', () => {
    const now = Date.now();
    addUser('u1', 'Alice', now);
    mockConnectionStatus = 'reconnecting';
    render(<CollaboratorAvatars currentUserId="self-1" />);
    expect(screen.getByTestId('collab-reconnect')).toBeInTheDocument();
  });

  // Case 10: Avatar with image
  it('renders avatar image when avatar URL is provided', () => {
    const now = Date.now();
    addUser('u1', 'Alice', now, 'https://example.com/alice.png');
    render(<CollaboratorAvatars currentUserId="self-1" />);
    const img = screen.getByRole('img', { name: 'Alice' });
    expect(img).toHaveAttribute('src', 'https://example.com/alice.png');
  });
});
