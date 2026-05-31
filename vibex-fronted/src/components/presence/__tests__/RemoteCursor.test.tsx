/**
 * RemoteCursor WebSocket — S45-P002-E2 vitest
 * Migrated from Firebase usePresence to Zustand usePresenceStore.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RemoteCursor } from '../RemoteCursor';
import { usePresenceStore } from '@/lib/collaboration/presenceStore';

describe('RemoteCursor (WebSocket)', () => {
  beforeEach(() => {
    // Reset store
    usePresenceStore.setState({
      remoteUsers: new Map(),
      lockedNodes: {},
    });
  });

  it('renders no cursor when remoteUsers is empty', () => {
    render(<RemoteCursor userId="self-1" />);
    expect(screen.queryAllByTestId('remote-cursor')).toHaveLength(0);
  });

  it('renders one remote cursor when one remote user is present', () => {
    usePresenceStore.setState({
      remoteUsers: new Map([
        ['user-alice', { userId: 'user-alice', name: 'Alice', avatar: 'A', cursorX: 100, cursorY: 200, lastSeen: Date.now() }],
      ]),
    });

    render(<RemoteCursor userId="self-1" />);
    const cursors = screen.getAllByTestId('remote-cursor');
    expect(cursors).toHaveLength(1);
    expect(screen.getByTestId('remote-cursor-label')).toHaveTextContent('Alice');
  });

  it('renders multiple remote cursors for multiple users', () => {
    usePresenceStore.setState({
      remoteUsers: new Map([
        ['user-alice', { userId: 'user-alice', name: 'Alice', avatar: 'A', cursorX: 100, cursorY: 200, lastSeen: Date.now() }],
        ['user-bob', { userId: 'user-bob', name: 'Bob', avatar: 'B', cursorX: 300, cursorY: 400, lastSeen: Date.now() }],
        ['user-carol', { userId: 'user-carol', name: 'Carol', avatar: 'C', cursorX: 500, cursorY: 600, lastSeen: Date.now() }],
      ]),
    });

    render(<RemoteCursor userId="self-1" />);
    expect(screen.getAllByTestId('remote-cursor')).toHaveLength(3);
  });

  it('does not render self cursor', () => {
    usePresenceStore.setState({
      remoteUsers: new Map([
        ['self-1', { userId: 'self-1', name: 'Me', avatar: 'M', cursorX: 10, cursorY: 20, lastSeen: Date.now() }],
        ['user-alice', { userId: 'user-alice', name: 'Alice', avatar: 'A', cursorX: 100, cursorY: 200, lastSeen: Date.now() }],
      ]),
    });

    render(<RemoteCursor userId="self-1" />);
    const cursors = screen.getAllByTestId('remote-cursor');
    expect(cursors).toHaveLength(1);
    expect(screen.getByTestId('remote-cursor-label')).toHaveTextContent('Alice');
  });

  it('uses userId as fallback when name is missing', () => {
    usePresenceStore.setState({
      remoteUsers: new Map([
        ['anon-123', { userId: 'anon-123', name: '', avatar: '?', cursorX: 0, cursorY: 0, lastSeen: Date.now() }],
      ]),
    });

    render(<RemoteCursor userId="self-1" />);
    expect(screen.getByTestId('remote-cursor-label')).toHaveTextContent('anon-123');
  });

  it('renders with correct cursor position', () => {
    usePresenceStore.setState({
      remoteUsers: new Map([
        ['user-alice', { userId: 'user-alice', name: 'Alice', avatar: 'A', cursorX: 150, cursorY: 250, lastSeen: Date.now() }],
      ]),
    });

    render(<RemoteCursor userId="self-1" />);
    const cursor = screen.getByTestId('remote-cursor');
    const style = cursor.style as unknown as Record<string, string>;
    expect(style.transform).toContain('translate(150px, 250px)');
  });
});
