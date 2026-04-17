/**
 * ProtoAttrPanel — Unit Tests
 * Epic1: E1-U4
 *
 * Key: The ProtoAttrPanel reads selectedNodeId from the store.
 * Since prototypeStore uses zustand-persist, we need to ensure
 * the store is in a known state before each test.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { userEvent } from '@testing-library/user-event';
import { ProtoAttrPanel } from '../ProtoAttrPanel';
import { usePrototypeStore } from '@/stores/prototypeStore';

// Ensure store is in a known clean state
const resetStore = () => {
  usePrototypeStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    pages: [{ id: 'page-1', name: '首页', route: '/' }],
  });
};

// Add a node and select it
const addSelectedNode = () => {
  const { addNode, selectNode } = usePrototypeStore.getState();
  const id = addNode(
    { id: 'c1', type: 'button', name: 'Button', props: { label: 'Click' } },
    { x: 0, y: 0 }
  );
  selectNode(id);
  return id;
};

describe('ProtoAttrPanel', () => {
  beforeEach(() => {
    act(() => {
      resetStore();
    });
  });

  afterEach(() => {
    cleanup();
  });

  // E1-U4: Empty state renders when no node selected
  it('renders empty state when no node is selected', () => {
    render(<ProtoAttrPanel />);
    expect(screen.getByRole('complementary', { name: /属性面板/i })).toBeInTheDocument();
    expect(screen.getByText(/选中节点以编辑属性/i)).toBeInTheDocument();
  });

  // E1-U4: Panel content when node is selected
  it('renders component info when a node is selected', () => {
    act(() => {
      addSelectedNode();
    });
    render(<ProtoAttrPanel />);
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  // E1-U4: Has Props and Mock tabs
  it('has Props and Mock tabs', () => {
    act(() => {
      addSelectedNode();
    });
    render(<ProtoAttrPanel />);
    expect(screen.getByRole('tab', { name: /属性/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Mock/i })).toBeInTheDocument();
  });

  // E1-U4: Mock tab shows textarea for JSON input
  it('renders Mock tab with textarea', async () => {
    act(() => {
      addSelectedNode();
    });
    const { container } = render(<ProtoAttrPanel />);
    await act(async () => {
      fireEvent.click(screen.getByRole('tab', { name: /Mock/i }));
    });
    const textarea = container.querySelector('textarea');
    expect(textarea).toBeInTheDocument();
  });

  // E1-U4: Delete button is present when node is selected
  it('has a delete button when node is selected', () => {
    act(() => {
      addSelectedNode();
    });
    render(<ProtoAttrPanel />);
    expect(screen.getByRole('button', { name: /删除节点/i })).toBeInTheDocument();
  });
});
