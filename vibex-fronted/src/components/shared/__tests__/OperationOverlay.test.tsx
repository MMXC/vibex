/**
 * OperationOverlay.test.tsx — Sprint38 P002-E3
 * Unit tests for Ctrl+H operation overlay component.
 */

'use client';

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OperationOverlay } from '../OperationOverlay';
import { useOplogStore } from '@/stores/oplogStore';

describe('OperationOverlay', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // Reset store to known state
    useOplogStore.getState().clearOplog();
    // Add test entries directly to the real store
    const store = useOplogStore.getState();
    const baseTs = 1748140800000;
    store.addOplogEntry({ userId: 'user-abc', type: 'ai', nodeId: 'node-123', action: 'Edit node content' });
    store.addOplogEntry({ userId: 'user-xyz', type: 'user', nodeId: 'node-456', action: 'Move node' });
    store.addOplogEntry({ userId: 'system', type: 'system', nodeId: 'node-789', action: 'Node created', diff: '[+content]' });
    mockOnClose.mockClear();
  });

  afterEach(() => {
    useOplogStore.getState().clearOplog();
  });

  it('renders nothing when isOpen=false', () => {
    const { container } = render(
      <OperationOverlay isOpen={false} onClose={mockOnClose} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders overlay when isOpen=true', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByTestId('operation-overlay')).toBeInTheDocument();
  });

  it('displays all oplog entries by default', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('node-123')).toBeInTheDocument();
    expect(screen.getByText('node-456')).toBeInTheDocument();
    expect(screen.getByText('node-789')).toBeInTheDocument();
  });

  it('displays AI / User / System badges', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText('🤖 AI')).toBeInTheDocument();
    expect(screen.getByText('👤 User')).toBeInTheDocument();
    expect(screen.getByText('⚙️ System')).toBeInTheDocument();
  });

  it('filters entries by nodeId search', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    const searchInput = screen.getByPlaceholderText('Filter by nodeId…');
    fireEvent.change(searchInput, { target: { value: 'node-123' } });
    expect(screen.getByText('node-123')).toBeInTheDocument();
    expect(screen.queryByText('node-456')).not.toBeInTheDocument();
  });

  it('shows empty message when filter has no matches', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    const searchInput = screen.getByPlaceholderText('Filter by nodeId…');
    fireEvent.change(searchInput, { target: { value: 'nonexistent-node' } });
    expect(screen.getByText(/no entries match/i)).toBeInTheDocument();
  });

  it('shows total count in footer', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    expect(screen.getByText(/3 total entries/)).toBeInTheDocument();
  });

  it('shows diff badge for entries with diff payload', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    // op-3 has diff, rendered as a 'diff' badge
    const diffBadges = screen.getAllByText('diff');
    expect(diffBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('closes on overlay background click', () => {
    render(<OperationOverlay isOpen={true} onClose={mockOnClose} />);
    const overlay = screen.getByTestId('operation-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
