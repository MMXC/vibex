/**
 * PresenceIndicator component tests
 * Sprint 53 E1: 协作实时 Presence UI
 *
 * Covers:
 * - D1.1: 0/单/多用户 rendering
 * - D1.5: Empty state, single user name, multi-user avatar stack
 */
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PresenceIndicator } from '@/components/dds/presence/PresenceIndicator';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';

// Reset presenceStore between tests
function resetPresenceStore() {
  usePresenceStore.setState({ remoteUsers: new Map(), lockedNodes: {} });
}

beforeEach(() => {
  resetPresenceStore();
  cleanup();
});

describe('PresenceIndicator', () => {
  // D1.5: 0 users — empty state
  describe('0 users', () => {
    it('renders nothing when there are no remote users', () => {
      render(<PresenceIndicator />);
      expect(screen.queryByTestId('presence-indicator')).toBeNull();
    });
  });

  // D1.1: Single user — shows name + avatar
  describe('single user', () => {
    beforeEach(() => {
      usePresenceStore.setState({
        remoteUsers: new Map([
          ['user-1', { userId: 'user-1', name: 'Alice', avatar: '#4F46E5', lastSeen: Date.now() }],
        ]),
      });
    });

    it('renders the presence indicator', () => {
      render(<PresenceIndicator />);
      expect(screen.getByTestId('presence-indicator')).toBeInTheDocument();
    });

    it('displays the user name via avatar aria-label', () => {
      render(<PresenceIndicator />);
      // name is in aria-label (accessible name of the img role)
      expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
    });

    it('shows one avatar with correct initial', () => {
      render(<PresenceIndicator />);
      const avatars = screen.getAllByRole('img');
      expect(avatars).toHaveLength(1);
    });

    it('shows online count as "1 在线"', () => {
      render(<PresenceIndicator />);
      expect(screen.getByTestId('presence-count')).toHaveTextContent('1 在线');
    });
  });

  // D1.5: Multiple users — avatar stack
  describe('multiple users', () => {
    beforeEach(() => {
      usePresenceStore.setState({
        remoteUsers: new Map([
          ['user-1', { userId: 'user-1', name: 'Alice', avatar: '#4F46E5', lastSeen: Date.now() }],
          ['user-2', { userId: 'user-2', name: 'Bob', avatar: '#059669', lastSeen: Date.now() }],
          ['user-3', { userId: 'user-3', name: 'Carol', avatar: '#DC2626', lastSeen: Date.now() }],
        ]),
      });
    });

    it('renders presence indicator with correct user count', () => {
      render(<PresenceIndicator />);
      expect(screen.getByTestId('presence-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('presence-count')).toHaveTextContent('3 在线');
    });

    it('displays all three user names via aria-labels', () => {
      render(<PresenceIndicator />);
      expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Bob' })).toBeInTheDocument();
      expect(screen.getByRole('img', { name: 'Carol' })).toBeInTheDocument();
    });

    it('shows avatar stack with correct number of avatars', () => {
      render(<PresenceIndicator />);
      const avatars = screen.getAllByRole('img');
      expect(avatars).toHaveLength(3);
    });
  });

  // Overflow: more than maxVisible users
  describe('overflow', () => {
    beforeEach(() => {
      const users = new Map();
      for (let i = 1; i <= 7; i++) {
        users.set(`user-${i}`, {
          userId: `user-${i}`,
          name: `User${i}`,
          avatar: '#6366f1',
          lastSeen: Date.now(),
        });
      }
      usePresenceStore.setState({ remoteUsers: users });
    });

    it('shows maxVisible avatars and overflow badge', () => {
      render(<PresenceIndicator maxVisible={5} />);
      const imgs = screen.getAllByRole('img');
      // 5 visible avatars + 1 overflow badge
      expect(imgs).toHaveLength(6);
      expect(screen.getByTestId('presence-overflow')).toBeInTheDocument();
      expect(screen.getByTestId('presence-overflow')).toHaveTextContent('+2');
    });

    it('shows total count "7 在线"', () => {
      render(<PresenceIndicator maxVisible={5} />);
      expect(screen.getByTestId('presence-count')).toHaveTextContent('7 在线');
    });
  });

  // D1.1: User with default avatar color
  describe('avatar colors', () => {
    it('uses provided avatar color', () => {
      usePresenceStore.setState({
        remoteUsers: new Map([
          ['user-1', { userId: 'user-1', name: 'Test', avatar: '#FF5733', lastSeen: Date.now() }],
        ]),
      });
      render(<PresenceIndicator />);
      const avatar = screen.getByTestId('presence-user-user-1');
      expect(avatar).toHaveStyle({ background: '#FF5733' });
    });
  });
});
