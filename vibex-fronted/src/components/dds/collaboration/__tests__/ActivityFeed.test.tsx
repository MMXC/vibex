'use client';

/**
 * ActivityFeed vitest — S60-E3
 * Tests: renders entries, empty state, aria attributes, user/status display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ActivityFeed } from '../ActivityFeed';
import { useActivityStore } from '@/lib/collaboration/activityStore';

describe('ActivityFeed', () => {
  beforeEach(() => {
    useActivityStore.setState({ entries: [], userStatuses: {} });
  });

  it('renders empty state when no entries', () => {
    render(<ActivityFeed />);
    expect(screen.getByTestId('activity-empty')).toHaveTextContent('暂无活动');
  });

  it('renders activity items', () => {
    useActivityStore.setState({
      entries: [
        {
          id: '1',
          userId: 'u1',
          userName: 'Alice',
          type: 'join',
          timestamp: Date.now() - 30_000,
        },
        {
          id: '2',
          userId: 'u2',
          userName: 'Bob',
          type: 'edit',
          nodeName: 'TestNode',
          timestamp: Date.now() - 90_000,
        },
      ],
    });

    render(<ActivityFeed />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
  });

  it('respects maxEntries prop', () => {
    useActivityStore.setState({
      entries: [
        { id: '1', userId: 'u1', userName: 'Alice', type: 'join', timestamp: 3000 },
        { id: '2', userId: 'u2', userName: 'Bob', type: 'edit', timestamp: 2000 },
        { id: '3', userId: 'u3', userName: 'Carol', type: 'leave', timestamp: 1000 },
      ],
    });

    render(<ActivityFeed maxEntries={2} />);
    expect(screen.getAllByTestId('activity-item')).toHaveLength(2);
  });

  it('has correct ARIA attributes', () => {
    render(<ActivityFeed />);
    expect(screen.getByRole('feed')).toHaveAttribute('aria-label', '协作活动流');
  });

  it('shows header with count when entries present', () => {
    useActivityStore.setState({
      entries: [
        { id: '1', userId: 'u1', userName: 'Alice', type: 'join', timestamp: Date.now() },
      ],
    });

    render(<ActivityFeed />);
    expect(screen.getByTestId('activity-count')).toHaveTextContent('1');
  });
});
