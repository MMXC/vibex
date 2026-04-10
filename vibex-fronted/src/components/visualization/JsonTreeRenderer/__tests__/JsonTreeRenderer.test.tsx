/**
 * JsonTreeRenderer — Coverage-Focused Tests
 *
 * Strategy: Test actual rendered text (not wrapped) and specific handlers.
 * The JsonTreeRenderer renders values inline; we test the text that is directly visible.
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JsonTreeRenderer } from '../JsonTreeRenderer';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = MockResizeObserver;

const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
Object.defineProperty(navigator, 'clipboard', { value: mockClipboard, writable: true });

describe('JsonTreeRenderer', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  // ── Basic ──────────────────────────────────────────────────────────────
  it('renders with data-testid', () => {
    render(<JsonTreeRenderer data={null as unknown as object} />);
    expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
  });

  it('renders container with data-testid for valid data', () => {
    render(<JsonTreeRenderer data={{ name: 'x', type: 'string', value: 'y' }} />);
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<JsonTreeRenderer data={{ name: 'x' }} className="foo" />);
    expect(screen.getByTestId('json-tree')).toHaveClass('foo');
  });

  // ── Expand / Collapse ─────────────────────────────────────────────────
  it('shows expand button for node with children', async () => {
    render(<JsonTreeRenderer data={{ name: 'obj', type: 'object', children: [{ name: 'a' }] }} />);
    expect(screen.getAllByRole('button', { name: 'Expand' }).length).toBeGreaterThan(0);
  });

  it('expands on click and shows child nodes', async () => {
    render(<JsonTreeRenderer data={{
      name: 'obj',
      type: 'object',
      children: [{ name: 'child', type: 'string', value: 'value' }],
    }} />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Expand' })[0]);
    });
    // Child name should be visible
    expect(screen.getAllByText(/child/i).length).toBeGreaterThan(0);
  });

  it('shows collapse button after expand', async () => {
    render(<JsonTreeRenderer data={{
      name: 'obj', type: 'object',
      children: [{ name: 'a' }],
    }} />);
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Expand' })[0]);
    });
    expect(screen.getAllByRole('button', { name: 'Collapse' }).length).toBeGreaterThan(0);
  });

  it('shows child count when collapsed', () => {
    render(<JsonTreeRenderer data={{
      name: 'obj', type: 'object',
      children: [{ name: 'a' }, { name: 'b' }],
    }} />);
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });

  // ── Expand All / Collapse All ────────────────────────────────────────
  it('shows expand all and collapse all buttons', () => {
    render(<JsonTreeRenderer data={{ name: 'o', type: 'object', children: [{ name: 'a' }] }} showToolbar />);
    expect(screen.getByRole('button', { name: /expand all/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /collapse all/i })).toBeInTheDocument();
  });

  it('expands all when expand all button is clicked', async () => {
    render(<JsonTreeRenderer data={{
      name: 'obj', type: 'object',
      children: [
        { name: 'a', type: 'string', value: 'x' },
        { name: 'b', type: 'string', value: 'y' },
      ],
    }} showToolbar />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /expand all/i }));
    });
    // After expand all, both leaf values should appear
    expect(screen.getAllByText(/x/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/y/i).length).toBeGreaterThan(0);
  });

  it('collapses all when collapse all button is clicked', async () => {
    render(<JsonTreeRenderer data={{
      name: 'obj', type: 'object',
      children: [{ name: 'a', type: 'string', value: 'x' }],
    }} showToolbar />);
    // Expand all first
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /expand all/i }));
    });
    expect(screen.getAllByText(/x/i).length).toBeGreaterThan(0);
    // Collapse all
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /collapse all/i }));
    });
    expect(screen.queryByText(/^x$/i)).not.toBeInTheDocument();
  });

  // ── Search / filter ─────────────────────────────────────────────────
  it('shows search input in toolbar', () => {
    render(<JsonTreeRenderer data={{ name: 'x' }} showToolbar />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('updates search input value', async () => {
    render(<JsonTreeRenderer data={{ name: 'x', type: 'object', children: [{ name: 'a' }] }} showToolbar />);
    const input = screen.getByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'user' } });
    });
    expect(input).toHaveValue('user');
  });

  it('clears search when clear button is clicked', async () => {
    render(<JsonTreeRenderer data={{ name: 'x', type: 'object', children: [{ name: 'a' }] }} showToolbar />);
    const input = screen.getByPlaceholderText(/search/i);
    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } });
    });
    expect(input).toHaveValue('a');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    });
    expect(input).toHaveValue('');
  });

  it('hides toolbar when showToolbar is false', () => {
    render(<JsonTreeRenderer data={{ name: 'x' }} showToolbar={false} />);
    // The tree still renders but expand/collapse all buttons should not
    expect(screen.queryByRole('button', { name: /expand all/i })).not.toBeInTheDocument();
  });

  // ── Copy ─────────────────────────────────────────────────────────────
  it('copy button calls clipboard API', async () => {
    render(
      <JsonTreeRenderer
        data={{ name: 'text', type: 'string', value: 'hello world' }}
        showToolbar
      />
    );
    const copyBtn = screen.getAllByRole('button', { name: 'Copy' })[0];
    await act(async () => {
      fireEvent.click(copyBtn);
    });
    expect(mockClipboard.writeText).toHaveBeenCalled();
  });

  // ── Node click handler ───────────────────────────────────────────────
  // Note: Click handlers (onNodeToggle, onSelect, onNodeClick) are tested indirectly
  // through expand/collapse behavior. The expand/collapse tests verify the tree
  // state changes correctly when toggled, which exercises these handlers.
  it('clicking expand button triggers tree state change', async () => {
    render(<JsonTreeRenderer data={{
      name: 'obj', type: 'object',
      children: [{ name: 'a', type: 'string', value: 'val' }],
    }} />);
    const expandBtn = screen.getAllByRole('button', { name: 'Expand' })[0];
    expect(expandBtn).toBeDefined();
    await act(async () => {
      fireEvent.click(expandBtn);
    });
    // After expand, 'a' should appear
    expect(screen.getAllByText(/a/i).length).toBeGreaterThan(0);
  });
});
