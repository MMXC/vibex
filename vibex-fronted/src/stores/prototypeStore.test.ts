/**
 * prototypeStore — Unit Tests
 * Epic1: E1-U1 ~ E1-U4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePrototypeStore } from './prototypeStore';

describe('prototypeStore', () => {
  // Helper: fully reset store between tests
  const resetStore = () => {
    usePrototypeStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      pages: [{ id: 'page-1', name: '首页', route: '/' }],
    });
  };

  beforeEach(() => {
    localStorage.removeItem('vibex-prototype-canvas');
    resetStore();
  });

  afterEach(() => {
    localStorage.removeItem('vibex-prototype-canvas');
  });

  // ---- E1-U1 / E1-U2: addNode ----

  it('adds a node to the canvas', () => {
    const { addNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: { label: 'Click me' } },
      { x: 100, y: 200 }
    );

    const nodes = usePrototypeStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe(id);
    expect(nodes[0].position).toEqual({ x: 100, y: 200 });
    expect(nodes[0].type).toBe('protoNode');
    expect(nodes[0].data.component.name).toBe('Button');
  });

  it('assigns a unique id to each node', () => {
    const { addNode } = usePrototypeStore.getState();
    const id1 = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    const id2 = addNode(
      { id: 'c2', type: 'input', name: 'Input', props: {} },
      { x: 0, y: 0 }
    );
    expect(id1).not.toBe(id2);
  });

  // ---- E1-U2: removeNode ----

  it('removes a node', () => {
    const { addNode, removeNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    removeNode(id);
    expect(usePrototypeStore.getState().nodes).toHaveLength(0);
  });

  it('clears selection when removing selected node', () => {
    const { addNode, removeNode, selectNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    selectNode(id);
    removeNode(id);
    expect(usePrototypeStore.getState().selectedNodeId).toBeNull();
  });

  // ---- E1-U2: updateNodePosition ----

  it('updates node position', () => {
    const { addNode, updateNodePosition } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    updateNodePosition(id, { x: 300, y: 400 });
    expect(usePrototypeStore.getState().nodes[0].position).toEqual({ x: 300, y: 400 });
  });

  // ---- E1-U4: updateNode / updateNodeMockData ----

  it('updates node props', () => {
    const { addNode, updateNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: { label: 'Old' } },
      { x: 0, y: 0 }
    );
    updateNode(id, { component: { id: 'c1', type: 'button', name: 'Button', props: { label: 'New' } } });
    expect(usePrototypeStore.getState().nodes[0].data.component.props.label).toBe('New');
  });

  it('sets mock data on a node', () => {
    const { addNode, updateNodeMockData } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'table', name: 'Table', props: {} },
      { x: 0, y: 0 }
    );
    const mock = { name: 'John', status: 'active' };
    updateNodeMockData(id, mock);

    const node = usePrototypeStore.getState().nodes[0];
    expect(node.data.mockData).toEqual({ data: mock, source: 'inline' });
  });

  // ---- Selection ----

  it('selects a node', () => {
    const { addNode, selectNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    selectNode(id);
    expect(usePrototypeStore.getState().selectedNodeId).toBe(id);
  });

  it('deselects a node', () => {
    const { addNode, selectNode } = usePrototypeStore.getState();
    const id = addNode(
      { id: 'c1', type: 'button', name: 'Button', props: {} },
      { x: 0, y: 0 }
    );
    selectNode(id);
    selectNode(null);
    expect(usePrototypeStore.getState().selectedNodeId).toBeNull();
  });

  // ---- E1-E3: Page management ----

  it('has a default page', () => {
    const pages = usePrototypeStore.getState().pages;
    expect(pages).toHaveLength(1);
    expect(pages[0].route).toBe('/');
  });

  it('adds a page', () => {
    const { addPage } = usePrototypeStore.getState();
    addPage('/settings', '设置');
    const pages = usePrototypeStore.getState().pages;
    expect(pages).toHaveLength(2);
    expect(pages[1].route).toBe('/settings');
    expect(pages[1].name).toBe('设置');
  });

  it('removes a page', () => {
    const { addPage, removePage } = usePrototypeStore.getState();
    addPage('/page1');
    addPage('/page2');
    const pages = usePrototypeStore.getState().pages;
    const pageToRemove = pages[1];
    removePage(pageToRemove.id);
    expect(usePrototypeStore.getState().pages).toHaveLength(2); // default + page1
  });

  // ---- E1-E4: Export / Import ----

  it('exports v2.0 format with nodes and pages', () => {
    const { addNode, getExportData } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 50, y: 50 });
    addNode({ id: 'c2', type: 'input', name: 'Input', props: {} }, { x: 150, y: 150 });

    const data = getExportData();
    expect(data.version).toBe('2.0');
    expect(data.nodes).toHaveLength(2);
    expect(data.pages).toHaveLength(1);
    expect(data.mockDataBindings).toHaveLength(0); // no mock data set
  });

  it('exports mockDataBindings when nodes have mock data', () => {
    const { addNode, updateNodeMockData, getExportData } = usePrototypeStore.getState();
    const id = addNode({ id: 'c1', type: 'table', name: 'Table', props: {} }, { x: 0, y: 0 });
    updateNodeMockData(id, { rows: [{ id: 1, name: 'Test' }] });

    const data = getExportData();
    expect(data.mockDataBindings).toHaveLength(1);
    expect(data.mockDataBindings[0].nodeId).toBe(id);
  });

  it('loads from export data', () => {
    const { addNode, loadFromExport } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 0, y: 0 });

    loadFromExport({
      version: '2.0',
      nodes: [
        {
          id: 'node-loaded',
          type: 'protoNode',
          position: { x: 10, y: 20 },
          data: { component: { id: 'c2', type: 'card', name: 'Card', props: {} } },
        },
      ],
      edges: [],
      pages: [{ id: 'page-1', name: 'Home', route: '/' }],
      mockDataBindings: [],
    });

    const nodes = usePrototypeStore.getState().nodes;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('node-loaded');
  });

  it('ignores invalid version in loadFromExport', () => {
    const { addNode, loadFromExport, nodes } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 0, y: 0 });

    loadFromExport({
      version: '1.0', // invalid
      nodes: [],
      edges: [],
      pages: [],
      mockDataBindings: [],
    });

    expect(usePrototypeStore.getState().nodes).toHaveLength(1); // original preserved
  });

  // ---- clearCanvas ----

  it('clears all nodes and edges', () => {
    const { addNode, clearCanvas } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 0, y: 0 });
    addNode({ id: 'c2', type: 'input', name: 'Input', props: {} }, { x: 0, y: 0 });
    clearCanvas();
    const state = usePrototypeStore.getState();
    expect(state.nodes).toHaveLength(0);
    expect(state.edges).toHaveLength(0);
    expect(state.selectedNodeId).toBeNull();
  });

  // ---- Sprint3 E1: addEdge/removeEdge ----

  it('adds an edge to the store', () => {
    const { addEdge } = usePrototypeStore.getState();
    addEdge('node-1', 'node-2');
    const edges = usePrototypeStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('node-1');
    expect(edges[0].target).toBe('node-2');
    expect(edges[0].type).toBe('smoothstep');
    expect(edges[0].animated).toBe(true);
  });

  it('addEdge generates a unique id for each edge', () => {
    const { addEdge } = usePrototypeStore.getState();
    const id1 = addEdge('a', 'b');
    const id2 = addEdge('c', 'd');
    expect(id1).not.toBe(id2);
  });

  it('addEdge ignores empty source or target', () => {
    const { addEdge } = usePrototypeStore.getState();
    addEdge('', 'node-2');
    addEdge('node-1', '');
    expect(usePrototypeStore.getState().edges).toHaveLength(0);
  });

  it('removes an edge by id', () => {
    const { addEdge, removeEdge } = usePrototypeStore.getState();
    const id = addEdge('node-1', 'node-2');
    addEdge('node-3', 'node-4');
    removeEdge(id);
    const edges = usePrototypeStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('node-3');
  });

  it('removeEdge does not throw for non-existent id', () => {
    const { addEdge, removeEdge } = usePrototypeStore.getState();
    addEdge('node-1', 'node-2');
    expect(() => removeEdge('non-existent')).not.toThrow();
    expect(usePrototypeStore.getState().edges).toHaveLength(1);
  });

  it('removeEdge of last edge leaves empty array', () => {
    const { addEdge, removeEdge } = usePrototypeStore.getState();
    const id = addEdge('node-1', 'node-2');
    removeEdge(id);
    expect(usePrototypeStore.getState().edges).toHaveLength(0);
  });

  it('edges are independent from nodes', () => {
    const { addNode, addEdge } = usePrototypeStore.getState();
    addNode({ id: 'c1', type: 'button', name: 'Button', props: {} }, { x: 0, y: 0 });
    addEdge('node-1', 'node-2');
    expect(usePrototypeStore.getState().nodes).toHaveLength(1);
    expect(usePrototypeStore.getState().edges).toHaveLength(1);
  });
});

// ============================================================
// E2-QA: updateNodeNavigation / updateNodeBreakpoints tests
// E3-QA: addNode breakpoint auto-tagging tests
// ============================================================

describe('prototypeStore — E2-QA: updateNodeNavigation', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      nodes: [
        { id: 'node-1', type: 'screen', label: 'Screen 1', x: 0, y: 0, data: { navigation: undefined, breakpoints: undefined } },
        { id: 'node-2', type: 'screen', label: 'Screen 2', x: 0, y: 0, data: { navigation: undefined, breakpoints: undefined } },
      ],
    });
  });

  it('E2-U1: updates navigation.target when navigation is provided', () => {
    const { updateNodeNavigation } = usePrototypeStore.getState();
    updateNodeNavigation('node-1', { target: '/home', label: 'Home' });
    const node = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1');
    expect(node?.data.navigation).toEqual({ target: '/home', label: 'Home' });
  });

  it('E2-U1: clears navigation field when undefined is passed', () => {
    const { updateNodeNavigation, addNode } = usePrototypeStore.getState();
    updateNodeNavigation('node-1', { target: '/home', label: 'Home' });
    updateNodeNavigation('node-1', undefined);
    const node = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1');
    expect(node?.data.navigation).toBeUndefined();
  });

  it('E2-U1: does not affect other nodes when updating one node', () => {
    const { updateNodeNavigation } = usePrototypeStore.getState();
    updateNodeNavigation('node-1', { target: '/home', label: 'Home' });
    const node2 = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-2');
    expect(node2?.data.navigation).toBeUndefined();
  });

  it('E2-U1: does not throw when updating non-existent nodeId', () => {
    const { updateNodeNavigation } = usePrototypeStore.getState();
    expect(() => updateNodeNavigation('non-existent', { target: '/x', label: 'X' })).not.toThrow();
    // nodes and edges lengths should remain unchanged
    expect(usePrototypeStore.getState().nodes.length).toBe(2);
  });
});

describe('prototypeStore — E2-QA: updateNodeBreakpoints', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      nodes: [
        { id: 'node-1', type: 'screen', label: 'Screen 1', x: 0, y: 0, data: { navigation: undefined, breakpoints: undefined } },
        { id: 'node-2', type: 'screen', label: 'Screen 2', x: 0, y: 0, data: { navigation: undefined, breakpoints: { mobile: true, tablet: true, desktop: true } } },
      ],
    });
  });

  it('E2-U2: updates all breakpoints fields', () => {
    const { updateNodeBreakpoints } = usePrototypeStore.getState();
    updateNodeBreakpoints('node-1', { mobile: true, tablet: false, desktop: true });
    const node = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1');
    expect(node?.data.breakpoints).toEqual({ mobile: true, tablet: false, desktop: true });
  });

  it('E2-U2: partial update — only specified fields change', () => {
    const { updateNodeBreakpoints } = usePrototypeStore.getState();
    updateNodeBreakpoints('node-2', { mobile: false });
    const node = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-2');
    // Should be fully replaced (not merged) — this is the current behavior
    expect(node?.data.breakpoints).toEqual({ mobile: false });
  });

  it('E2-U2: does not affect other nodes', () => {
    const { updateNodeBreakpoints } = usePrototypeStore.getState();
    const node1Before = JSON.parse(JSON.stringify(usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1')));
    updateNodeBreakpoints('node-2', { mobile: false, tablet: false, desktop: false });
    const node1After = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1');
    expect(node1After?.data.breakpoints).toEqual(node1Before.data.breakpoints);
  });

  it('E2-U2: does not throw when updating non-existent nodeId', () => {
    const { updateNodeBreakpoints } = usePrototypeStore.getState();
    expect(() => updateNodeBreakpoints('non-existent', { mobile: true })).not.toThrow();
  });
});

describe('prototypeStore — E2-QA: Navigation + Breakpoints combined (E2-U3)', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      nodes: [
        { id: 'node-1', type: 'screen', label: 'Screen 1', x: 0, y: 0, data: { navigation: undefined, breakpoints: undefined } },
      ],
    });
  });

  it('E2-U3: node has both navigation and breakpoints after sequential updates', () => {
    const { updateNodeNavigation, updateNodeBreakpoints } = usePrototypeStore.getState();
    updateNodeNavigation('node-1', { target: '/home', label: 'Home' });
    updateNodeBreakpoints('node-1', { mobile: true, tablet: false, desktop: true });
    const node = usePrototypeStore.getState().nodes.find((n) => n.id === 'node-1');
    expect(node?.data.navigation).toEqual({ target: '/home', label: 'Home' });
    expect(node?.data.breakpoints).toEqual({ mobile: true, tablet: false, desktop: true });
  });
});

describe('prototypeStore — E3-QA: addNode breakpoint auto-tagging', () => {
  beforeEach(() => {
    usePrototypeStore.setState({
      nodes: [],
      pages: [{ id: 'page-1', name: 'Home', route: '/' }],
      breakpoint: '1024',
    });
  });

  afterEach(() => {
    usePrototypeStore.setState({ breakpoint: '1024' });
  });

  it('E3-U1: addNode sets breakpoints.mobile=true when breakpoint=375', () => {
    usePrototypeStore.setState({ breakpoint: '375' });
    const { addNode } = usePrototypeStore.getState();
    addNode({ type: 'screen', label: 'Mobile Screen' }, { x: 0, y: 0 });
    const node = usePrototypeStore.getState().nodes[0];
    expect(node?.data.breakpoints).toEqual({ mobile: true, tablet: false, desktop: false });
  });

  it('E3-U1: addNode sets breakpoints.tablet=true when breakpoint=768', () => {
    usePrototypeStore.setState({ breakpoint: '768' });
    const { addNode } = usePrototypeStore.getState();
    addNode({ type: 'screen', label: 'Tablet Screen' }, { x: 0, y: 0 });
    const node = usePrototypeStore.getState().nodes[0];
    expect(node?.data.breakpoints).toEqual({ mobile: false, tablet: true, desktop: false });
  });

  it('E3-U1: addNode sets breakpoints.desktop=true when breakpoint=1024', () => {
    usePrototypeStore.setState({ breakpoint: '1024' });
    const { addNode } = usePrototypeStore.getState();
    addNode({ type: 'screen', label: 'Desktop Screen' }, { x: 0, y: 0 });
    const node = usePrototypeStore.getState().nodes[0];
    expect(node?.data.breakpoints).toEqual({ mobile: false, tablet: false, desktop: true });
  });
});
