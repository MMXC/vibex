/**
 * CollaboratorEditorBadge.test.tsx — Vitest tests for CollaboratorEditorBadge
 * S95-E3: Node Edit Locking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CollaboratorEditorBadge } from './CollaboratorEditorBadge';

// Shared mock state — mutable so tests can configure it
const mockLockedNodes = new Map<string, {
  locked_by: string;
  user_name: string;
  avatar: string | null;
  expires_at: number;
}>();

function mockGetLock(nodeId: string) {
  return mockLockedNodes.get(nodeId);
}

const mockCurrentUser = { id: 'user-current', email: 'test@example.com', name: 'Current User' };

vi.mock('@/stores/nodeLockStore', () => ({
  useNodeLockStore: vi.fn((selector?: (s: any) => any) => {
    // When called with a selector (Zustand pattern), execute it
    if (typeof selector === 'function') {
      return selector({
        getLock: mockGetLock,
        lockedNodes: mockLockedNodes,
      });
    }
    // Fallback: return the full mock store
    return {
      getLock: mockGetLock,
      lockedNodes: mockLockedNodes,
    };
  }),
}));

vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      user: mockCurrentUser,
      isAuthenticated: true,
    };
    if (typeof selector === 'function') {
      return selector(state);
    }
    return state;
  }),
}));

describe('CollaboratorEditorBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLockedNodes.clear();
  });

  it('renders avatar and user name when remote user has the lock', () => {
    const futureExpiry = Date.now() + 60_000;
    mockLockedNodes.set('node-1', {
      locked_by: 'user-other',
      user_name: 'Alice',
      avatar: null,
      expires_at: futureExpiry,
    });

    render(<CollaboratorEditorBadge nodeId="node-1" />);

    expect(screen.getByTestId('collaborator-editor-badge')).toBeInTheDocument();
    expect(screen.getByTestId('badge-avatar-fallback')).toHaveTextContent('AL');
    expect(screen.getByTestId('badge-username')).toHaveTextContent('Alice');
  });

  it('renders avatar img when avatar URL is provided', () => {
    const futureExpiry = Date.now() + 60_000;
    mockLockedNodes.set('node-1', {
      locked_by: 'user-other',
      user_name: 'Bob',
      avatar: 'https://example.com/bob.png',
      expires_at: futureExpiry,
    });

    render(<CollaboratorEditorBadge nodeId="node-1" />);

    const img = screen.getByTestId('badge-avatar') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/bob.png');
    expect(screen.getByTestId('badge-username')).toHaveTextContent('Bob');
  });

  it('returns null (does not render) when no lock exists', () => {
    // mockLockedNodes is empty
    render(<CollaboratorEditorBadge nodeId="node-unlocked" />);
    expect(screen.queryByTestId('collaborator-editor-badge')).not.toBeInTheDocument();
  });

  it('returns null when current user is the lock holder', () => {
    const futureExpiry = Date.now() + 60_000;
    mockLockedNodes.set('node-own', {
      locked_by: 'user-current', // same as the mocked current user
      user_name: 'Current User',
      avatar: null,
      expires_at: futureExpiry,
    });

    render(<CollaboratorEditorBadge nodeId="node-own" />);
    // Should not Render — current user sees LockIndicator instead
    expect(screen.queryByTestId('collaborator-editor-badge')).not.toBeInTheDocument();
  });

  it('returns null when lock has expired', () => {
    mockLockedNodes.set('node-expired', {
      locked_by: 'user-other',
      user_name: 'Charlie',
      avatar: null,
      expires_at: Date.now() - 1_000, // expired 1s ago
    });

    render(<CollaboratorEditorBadge nodeId="node-expired" />);
    expect(screen.queryByTestId('collaborator-editor-badge')).not.toBeInTheDocument();
  });

  it('uses aria-label with user name', () => {
    const futureExpiry = Date.now() + 60_000;
    mockLockedNodes.set('node-1', {
      locked_by: 'user-other',
      user_name: 'Dana',
      avatar: null,
      expires_at: futureExpiry,
    });

    render(<CollaboratorEditorBadge nodeId="node-1" />);

    const badge = screen.getByTestId('collaborator-editor-badge');
    expect(badge).toHaveAttribute('aria-label', 'Dana 正在编辑此节点');
  });
});
