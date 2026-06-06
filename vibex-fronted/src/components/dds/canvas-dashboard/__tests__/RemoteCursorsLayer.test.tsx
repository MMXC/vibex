/**
 * RemoteCursorsLayer.test.tsx — S72-E3
 * Tests for RemoteCursorsLayer collaborative cursor overlay.
 * Verifies E3.5 DoD: RemoteCursorsLayer 重构测试
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock CSS module
vi.mock('./RemoteCursorsLayer.module.css', () => ({}));

interface CursorState {
  userId: string;
  userName: string;
  avatar: string;
  x: number;
  y: number;
  lastSeen: number;
}

interface MockPresenceState {
  cursors: Record<string, CursorState>;
}

// Module-level shared mock state — persists across vi.resetModules()
const mockState: { cursors: Record<string, CursorState> } = { cursors: {} };

const mockUsePresenceStore = vi.fn((selector?: (s: MockPresenceState) => unknown) => {
  if (!selector) return mockState;
  return selector(mockState);
});
Object.assign(mockUsePresenceStore, { getState: () => mockState });

vi.mock('@/lib/collaboration/presenceStore', () => ({
  usePresenceStore: mockUsePresenceStore,
}));

// Lazy import after mocks are set up
let RemoteCursorsLayer: typeof import('../RemoteCursorsLayer').RemoteCursorsLayer;

beforeEach(async () => {
  vi.resetModules();
  // Clear mock state between tests
  for (const k of Object.keys(mockState.cursors)) delete mockState.cursors[k];
  mockUsePresenceStore.mockClear();
  mockUsePresenceStore.mockImplementation((selector?: (s: MockPresenceState) => unknown) => {
    if (!selector) return mockState;
    return selector(mockState);
  });
  const mod = await import('../RemoteCursorsLayer');
  RemoteCursorsLayer = mod.RemoteCursorsLayer;
});

describe('RemoteCursorsLayer', () => {
  it('renders nothing when cursors map is empty', () => {
    const { container } = render(<RemoteCursorsLayer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders cursor for remote user with valid position', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: 'Alice', avatar: '', x: 150, y: 200, lastSeen: Date.now() };
    render(<RemoteCursorsLayer />);
    const cursors = screen.getAllByTestId('ws-remote-cursor');
    expect(cursors).toHaveLength(1);
    expect(screen.getByTestId('ws-remote-cursor-label')).toHaveTextContent('Alice');
  });

  it('excludes currentUserId from cursor list', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: 'Alice', avatar: '', x: 100, y: 100, lastSeen: Date.now() };
    mockState.cursors['user-2'] = { userId: 'user-2', userName: 'Bob', avatar: '', x: 200, y: 200, lastSeen: Date.now() };
    render(<RemoteCursorsLayer currentUserId="user-1" />);
    const cursors = screen.getAllByTestId('ws-remote-cursor');
    expect(cursors).toHaveLength(1);
    expect(cursors[0]).toHaveAttribute('data-user-id', 'user-2');
  });

  it('excludes cursors with x=0 and y=0', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: 'Alice', avatar: '', x: 0, y: 0, lastSeen: Date.now() };
    mockState.cursors['user-2'] = { userId: 'user-2', userName: 'Bob', avatar: '', x: 100, y: 100, lastSeen: Date.now() };
    render(<RemoteCursorsLayer />);
    const cursors = screen.getAllByTestId('ws-remote-cursor');
    expect(cursors).toHaveLength(1);
    expect(cursors[0]).toHaveAttribute('data-user-id', 'user-2');
  });

  it('renders multiple cursors for multiple remote users', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: 'Alice', avatar: '', x: 100, y: 100, lastSeen: Date.now() };
    mockState.cursors['user-2'] = { userId: 'user-2', userName: 'Bob', avatar: '', x: 200, y: 300, lastSeen: Date.now() };
    mockState.cursors['user-3'] = { userId: 'user-3', userName: 'Carol', avatar: '', x: 50, y: 50, lastSeen: Date.now() };
    render(<RemoteCursorsLayer />);
    expect(screen.getAllByTestId('ws-remote-cursor')).toHaveLength(3);
  });

  it('uses userId as label when userName is empty', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: '', avatar: '', x: 100, y: 100, lastSeen: Date.now() };
    render(<RemoteCursorsLayer />);
    expect(screen.getByTestId('ws-remote-cursor-label')).toHaveTextContent('user-1');
  });

  it('renders cursor with aria-hidden=true', () => {
    mockState.cursors['user-1'] = { userId: 'user-1', userName: 'Alice', avatar: '', x: 100, y: 100, lastSeen: Date.now() };
    render(<RemoteCursorsLayer />);
    expect(screen.getByTestId('ws-remote-cursor')).toHaveAttribute('aria-hidden', 'true');
  });
});
