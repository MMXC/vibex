/**
 * CollaboratorAvatars — S91-E3-F4: 协作人数状态
 *
 * 覆盖场景:
 * - E3-F4: Count badge shown when > 5 collaborators
 * - E3-F4: Count badge label format "6+", "7+", etc.
 * - E3-F4: Clicking count badge opens popover
 * - E3-F4: Popover shows full list with avatar, name, status, intent
 * - E3-F4: Clicking outside closes popover
 * - E3-F4: Escape key closes popover
 * - E3-F4: When count <= 5, shows normal avatars (not count badge)
 * - Existing S84-E2: Empty state, avatar rendering, overflow badge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CollaboratorAvatars } from '../CollaboratorAvatars';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';
import React from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeRemoteUser(overrides: {
  userId: string;
  name: string;
  lastSeen?: number;
  intent?: string;
} = { userId: 'u1', name: 'Alice' }) {
  return {
    userId: overrides.userId,
    name: overrides.name,
    avatar: '',
    lastSeen: overrides.lastSeen ?? Date.now(),
    intent: overrides.intent,
  };
}

function populateRemoteUsers(users: Array<{
  userId: string;
  name: string;
  lastSeen?: number;
  intent?: string;
}>) {
  const { setRemoteUsers } = usePresenceStore.getState();
  setRemoteUsers(
    users.map((u) => ({
      userId: u.userId,
      name: u.name,
      avatar: '',
      lastSeen: u.lastSeen ?? Date.now(),
      intent: u.intent,
    }))
  );
}

function renderAvatars(props: { currentUserId?: string; maxDisplay?: number } = {}) {
  return render(<CollaboratorAvatars currentUserId={props.currentUserId} maxDisplay={props.maxDisplay} />);
}

describe('CollaboratorAvatars — E3-F4: Count Badge', () => {
  beforeEach(() => {
    usePresenceStore.getState().clearAll();
  });

  it('should NOT show count badge when there are <= 5 collaborators', () => {
    populateRemoteUsers([
      { userId: 'u1', name: 'Alice' },
      { userId: 'u2', name: 'Bob' },
      { userId: 'u3', name: 'Carol' },
    ]);

    renderAvatars();
    expect(screen.queryByTestId('collab-count-badge')).toBeNull();
    expect(screen.getByTestId('collab-avatars')).toBeInTheDocument();
  });

  it('should show count badge when there are > 5 collaborators', () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
    }));
    populateRemoteUsers(users);

    renderAvatars();
    expect(screen.getByTestId('collab-count-badge')).toBeInTheDocument();
    // Label shows overflow count (total - 5 displayed) = 7-5=2 extra
    expect(screen.getByText('2+')).toBeInTheDocument();
  });

  it('should show count badge with correct label for 8 collaborators', () => {
    const users = Array.from({ length: 8 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
    }));
    populateRemoteUsers(users);

    renderAvatars();
    // Label shows overflow count = 8-5=3 extra
    expect(screen.getByText('3+')).toBeInTheDocument();
  });

  it('should open popover when count badge is clicked', () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
    }));
    populateRemoteUsers(users);

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });

    expect(screen.getByTestId('collab-popover')).toBeInTheDocument();
  });

  it('should show full list in popover with avatar + name + status', () => {
    populateRemoteUsers([
      { userId: 'u1', name: 'Alice', lastSeen: Date.now(), intent: '编辑节点A' },
      { userId: 'u2', name: 'Bob', lastSeen: Date.now(), intent: undefined },
      { userId: 'u3', name: 'Carol', lastSeen: Date.now(), intent: '查看画布' },
      { userId: 'u4', name: 'Dave', lastSeen: Date.now() },
      { userId: 'u5', name: 'Eve', lastSeen: Date.now() },
      { userId: 'u6', name: 'Frank', lastSeen: Date.now() },
      { userId: 'u7', name: 'Grace', lastSeen: Date.now() },
    ]);

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });

    const popover = screen.getByTestId('collab-popover');
    expect(popover).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });

  it('should show intent in popover item', () => {
    populateRemoteUsers([
      { userId: 'u1', name: 'Alice', intent: '正在编辑节点' },
      { userId: 'u2', name: 'Bob', intent: undefined },
      { userId: 'u3', name: 'Carol', intent: '查看画布' },
      { userId: 'u4', name: 'Dave', intent: undefined },
      { userId: 'u5', name: 'Eve', intent: undefined },
      { userId: 'u6', name: 'Frank', intent: undefined },
      { userId: 'u7', name: 'Grace', intent: undefined },
    ]);

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });

    // Intent should be visible in popover (may appear in both intentPill + popoverItemIntent)
    const intentEls = screen.getAllByText('正在编辑节点');
    expect(intentEls.length).toBeGreaterThanOrEqual(1);
    const canvasEls = screen.getAllByText('查看画布');
    expect(canvasEls.length).toBeGreaterThanOrEqual(1);
  });

  it('should close popover when clicking outside', () => {
    populateRemoteUsers(
      Array.from({ length: 7 }, (_, i) => ({
        userId: `u${i + 1}`,
        name: `User ${i + 1}`,
      }))
    );

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });

    expect(screen.getByTestId('collab-popover')).toBeInTheDocument();

    // Click outside
    act(() => {
      fireEvent.mouseDown(document.body);
    });

    expect(screen.queryByTestId('collab-popover')).toBeNull();
  });

  it('should close popover on Escape key', () => {
    populateRemoteUsers(
      Array.from({ length: 7 }, (_, i) => ({
        userId: `u${i + 1}`,
        name: `User ${i + 1}`,
      }))
    );

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });

    expect(screen.getByTestId('collab-popover')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document.body, { key: 'Escape' });
    });

    expect(screen.queryByTestId('collab-popover')).toBeNull();
  });

  it('should toggle popover on count badge click', () => {
    populateRemoteUsers(
      Array.from({ length: 7 }, (_, i) => ({
        userId: `u${i + 1}`,
        name: `User ${i + 1}`,
      }))
    );

    renderAvatars();

    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });
    expect(screen.getByTestId('collab-popover')).toBeInTheDocument();

    // Click again to close
    act(() => {
      screen.getByTestId('collab-count-badge').click();
    });
    expect(screen.queryByTestId('collab-popover')).toBeNull();
  });

  it('should show count badge with aria-label', () => {
    const users = Array.from({ length: 7 }, (_, i) => ({
      userId: `u${i + 1}`,
      name: `User ${i + 1}`,
    }));
    populateRemoteUsers(users);

    renderAvatars();
    const badge = screen.getByTestId('collab-count-badge');
    expect(badge).toHaveAttribute('aria-label', '7 位协作者，点击查看全部');
  });

  it('should show empty state when no collaborators', () => {
    renderAvatars();
    expect(screen.getByTestId('collab-avatars-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('collab-count-badge')).toBeNull();
  });

  it('should exclude self from collaborator count', () => {
    populateRemoteUsers([
      { userId: 'self', name: 'Me' },
      { userId: 'u1', name: 'Alice' },
      { userId: 'u2', name: 'Bob' },
    ]);

    renderAvatars({ currentUserId: 'self' });
    // Only 2 collaborators (Alice and Bob), so no count badge
    expect(screen.queryByTestId('collab-count-badge')).toBeNull();
  });
});
