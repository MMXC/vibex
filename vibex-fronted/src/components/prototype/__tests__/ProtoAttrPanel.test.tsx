/**
 * ProtoAttrPanel — Unit Tests
 * Epic1: E1-U4
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProtoAttrPanel } from '../ProtoAttrPanel';
import { usePrototypeStore } from '@/stores/prototypeStore';

// Reset persist store between tests
const resetStore = () => {
  usePrototypeStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    pages: [{ id: 'page-1', name: '首页', route: '/' }],
  });
};

describe('ProtoAttrPanel', () => {
  beforeEach(() => {
    // Mock localStorage.getItem to return null — prevents persist from loading old state
    vi.spyOn(localStorage, 'getItem').mockReturnValue(null);
    resetStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when no node is selected', () => {
    const { container } = render(<ProtoAttrPanel />);
    expect(container.querySelector('[aria-label*="属性面板"]')).not.toBeInTheDocument();
  });

  it('renders when a node is selected', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: { label: 'Click' } },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    const { container } = render(<ProtoAttrPanel />);
    // Panel should be present with the component name
    expect(container.querySelector('[aria-label*="属性面板"]')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('switches between Props and Mock tabs', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: { label: 'Click' } },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    render(<ProtoAttrPanel />);
    expect(screen.getByRole('tab', { name: /属性/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Mock/i })).toBeInTheDocument();
  });

  it('shows error for invalid JSON in mock tab', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    render(<ProtoAttrPanel />);
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /Mock/i }));
    });
    const textarea = screen.getByRole('textbox');
    act(() => {
      fireEvent.change(textarea, { target: { value: 'not valid json' } });
      fireEvent.blur(textarea);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/JSON 格式错误/i);
  });

  it('clears mock error when valid JSON is entered', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    render(<ProtoAttrPanel />);
    act(() => {
      fireEvent.click(screen.getByRole('tab', { name: /Mock/i }));
    });
    const textarea = screen.getByRole('textbox');
    // First invalid
    act(() => {
      fireEvent.change(textarea, { target: { value: 'bad' } });
      fireEvent.blur(textarea);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/JSON 格式错误/i);
    // Then valid
    act(() => {
      fireEvent.change(textarea, { target: { value: '{"key": "value"}' } });
      fireEvent.blur(textarea);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('has a delete button', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    render(<ProtoAttrPanel />);
    expect(screen.getByRole('button', { name: /删除节点/i })).toBeInTheDocument();
  });

  it('removes the selected node when delete is clicked', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<ProtoAttrPanel />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /删除节点/i }));
    });
    expect(confirmSpy).toHaveBeenCalled();
    expect(usePrototypeStore.getState().nodes).toHaveLength(0);
    confirmSpy.mockRestore();
  });

  it('does not delete if user cancels', () => {
    let nodeId: string;
    act(() => {
      const { addNode, selectNode } = usePrototypeStore.getState();
      nodeId = addNode(
        { id: 'c1', type: 'button', name: 'Button', props: {} },
        { x: 0, y: 0 }
      );
      selectNode(nodeId);
    });
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<ProtoAttrPanel />);
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /删除节点/i }));
    });
    expect(usePrototypeStore.getState().nodes).toHaveLength(1);
    confirmSpy.mockRestore();
  });

});
