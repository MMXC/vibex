/**
 * CursorOverlay.test.tsx — Vitest tests for CursorOverlay
 * Sprint 54 E3: 协作者 Cursor 实时同步
 * DoD: vitest CursorOverlay.test.tsx 8/8 通过
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CursorOverlay } from './CursorOverlay';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import { useUserPreferencesStore } from '@/stores/userPreferencesStore';

// Helper: set remote users in presenceStore
function setRemoteUsers(users: Array<{
  userId: string;
  name: string;
  cursorX?: number;
  cursorY?: number;
}>) {
  const map = new Map<string, { userId: string; name: string; avatar: string; cursorX?: number; cursorY?: number; lastSeen: number }>();
  for (const u of users) {
    map.set(u.userId, { userId: u.userId, name: u.name, avatar: '#6366f1', cursorX: u.cursorX, cursorY: u.cursorY, lastSeen: Date.now() });
  }
  usePresenceStore.setState({ remoteUsers: map });
}

// Helper: reset store
function resetStores() {
  usePresenceStore.setState({ remoteUsers: new Map(), lockedNodes: {} });
  useUserPreferencesStore.setState({ cursorVisible: true });
}

describe('CursorOverlay', () => {
  beforeEach(() => {
    resetStores();
  });

  // E3.3: no cursor-overlay in DOM when no remote cursors
  it('E3.3 — no cursor-overlay when there are no remote cursors', () => {
    render(<CursorOverlay />);
    expect(screen.queryByTestId('cursor-overlay')).not.toBeInTheDocument();
  });

  // E3.3 variant: cursorVisible=false
  it('E3.3 variant — no cursor-overlay when cursorVisible is false', () => {
    useUserPreferencesStore.setState({ cursorVisible: false });
    setRemoteUsers([{ userId: 'user-1', name: 'User', cursorX: 100, cursorY: 200 }]);
    render(<CursorOverlay />);
    expect(screen.queryByTestId('cursor-overlay')).not.toBeInTheDocument();
  });

  // E3.1: renders cursor-overlay with remote cursors having role="img"
  it('E3.1 — renders cursor-overlay with remote cursors having role="img"', () => {
    setRemoteUsers([
      { userId: 'user-alice', name: 'Alice', cursorX: 100, cursorY: 200 },
      { userId: 'user-bob', name: 'Bob', cursorX: 300, cursorY: 150 },
    ]);
    render(<CursorOverlay />);
    const overlay = screen.getByTestId('cursor-overlay');
    expect(overlay.querySelectorAll('[role="img"]').length).toBeGreaterThanOrEqual(1);
  });

  // Multiple cursors
  it('renders all 3 remote cursors', () => {
    setRemoteUsers([
      { userId: 'user-1', name: 'User 1', cursorX: 10, cursorY: 20 },
      { userId: 'user-2', name: 'User 2', cursorX: 30, cursorY: 40 },
      { userId: 'user-3', name: 'User 3', cursorX: 50, cursorY: 60 },
    ]);
    render(<CursorOverlay />);
    const overlay = screen.getByTestId('cursor-overlay');
    expect(overlay.querySelectorAll('[role="img"]').length).toBe(3);
  });

  // E3.2: own cursor excluded
  it('E3.2 — excludes own cursor, cursor-self not found', () => {
    setRemoteUsers([
      { userId: 'my-user-id', name: 'Me', cursorX: 50, cursorY: 50 },
      { userId: 'other-user', name: 'Other', cursorX: 200, cursorY: 200 },
    ]);
    render(<CursorOverlay excludeUserId="my-user-id" />);
    expect(screen.queryByTestId('cursor-self')).not.toBeInTheDocument();
    const overlay = screen.getByTestId('cursor-overlay');
    expect(overlay.querySelectorAll('[role="img"]').length).toBe(1);
  });

  // Users without cursor position are skipped
  it('skips users without cursorX/cursorY', () => {
    setRemoteUsers([
      { userId: 'user-no-cursor', name: 'NoPos' },
      { userId: 'user-with-cursor', name: 'HasPos', cursorX: 10, cursorY: 20 },
    ]);
    render(<CursorOverlay />);
    const overlay = screen.getByTestId('cursor-overlay');
    expect(overlay.querySelectorAll('[role="img"]').length).toBe(1);
  });

  // Cursor label shows user name
  it('renders cursor label with user name', () => {
    setRemoteUsers([{ userId: 'user-alice', name: 'Alice', cursorX: 100, cursorY: 200 }]);
    render(<CursorOverlay />);
    expect(screen.getByTestId('ws-remote-cursor-label')).toHaveTextContent('Alice');
  });

  // cursor-overlay has correct positioning styles
  it('cursor-overlay has correct positioning styles', () => {
    setRemoteUsers([{ userId: 'user-1', name: 'User', cursorX: 0, cursorY: 0 }]);
    render(<CursorOverlay />);
    const overlay = screen.getByTestId('cursor-overlay');
    expect(overlay).toHaveStyle({
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
    });
  });
});
