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
});
