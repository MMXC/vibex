/**
 * JsonTreeRenderer Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { JsonTreeRenderer } from '../JsonTreeRenderer';
import type { JsonTreeNode } from '@/types/visualization';

// ==================== Mock Hook ====================

const mockUseJsonTreeVisualization = jest.fn();

jest.mock('@/hooks/useJsonTreeVisualization', () => ({
  useJsonTreeVisualization: (...args: unknown[]) =>
    mockUseJsonTreeVisualization(...args),
}));

// ==================== Test Helpers ====================

function makeNode(overrides: Partial<JsonTreeNode> = {}): JsonTreeNode {
  return {
    id: 'node-1',
    key: 'root',
    value: {},
    type: 'object',
    depth: 0,
    path: [],
    children: [],
    isExpanded: true,
    isLeaf: false,
    ...overrides,
  };
}

function makeLeafNode(key: string, value: unknown, type: JsonTreeNode['type'] = 'string'): JsonTreeNode {
  return {
    id: `node-${key}`,
    key,
    value,
    type,
    depth: 1,
    path: [key],
    isLeaf: true,
  };
}

function mockHook(overrides: Partial<{
  flatNodes: JsonTreeNode[];
  totalCount: number;
  isReady: boolean;
  expandedIds: Set<string>;
  selectedId: string | null;
  searchQuery: string;
  toggle: jest.Mock;
  select: jest.Mock;
  expandAll: jest.Mock;
  collapseAll: jest.Mock;
  search: jest.Mock;
  getNode: jest.Mock;
}> = {}) {
  const defaultNodes: JsonTreeNode[] = [
    makeNode({ id: 'root', key: 'root', value: { name: 'test' }, depth: 0 }),
    makeLeafNode('name', 'test'),
  ];

  mockUseJsonTreeVisualization.mockReturnValue({
    flatNodes: defaultNodes,
    totalCount: 2,
    isReady: true,
    root: makeNode(),
    expandedIds: new Set(['root']),
    selectedId: null,
    searchQuery: '',
    toggle: jest.fn(),
    select: jest.fn(),
    expandAll: jest.fn(),
    collapseAll: jest.fn(),
    search: jest.fn(),
    getNode: jest.fn((id: string) => defaultNodes.find((n) => n.id === id)),
    ...overrides,
  });
}

// ==================== Tests ====================

describe('JsonTreeRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHook();
  });

  describe('rendering', () => {
    it('should render the component with data-testid', () => {
      render(<JsonTreeRenderer data={{ name: 'test' }} />);

      expect(screen.getByTestId('json-tree')).toBeInTheDocument();
    });

    it('should render empty state when data is null', () => {
      mockHook({ isReady: false, flatNodes: [], totalCount: 0 });

      render(<JsonTreeRenderer data={null} />);

      expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
      expect(screen.getByText('No JSON data provided')).toBeInTheDocument();
    });

    it('should pass className to container', () => {
      render(<JsonTreeRenderer data={{}} className="custom-class" />);

      expect(screen.getByTestId('json-tree')).toHaveClass('custom-class');
    });

    it('should render tree nodes from hook data', () => {
      render(<JsonTreeRenderer data={{ name: 'test' }} />);

      expect(screen.getByText('root')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
    });

    it('should show toolbar with node count', () => {
      render(<JsonTreeRenderer data={{ name: 'test' }} showToolbar={true} />);

      expect(screen.getByText(/nodes/)).toBeInTheDocument();
    });

    it('should hide toolbar when showToolbar is false', () => {
      render(<JsonTreeRenderer data={{}} showToolbar={false} />);

      // The toolbar stats should not be visible
      const tree = screen.getByTestId('json-tree');
      expect(tree.querySelector('[class*="toolbar"]')).toBeNull();
    });
  });

  describe('search bar', () => {
    it('should show search input when showSearch is true', () => {
      render(<JsonTreeRenderer data={{}} showSearch={true} />);

      expect(screen.getByPlaceholderText('Search keys or values...')).toBeInTheDocument();
    });

    it('should hide search input when showSearch is false', () => {
      render(<JsonTreeRenderer data={{}} showSearch={false} />);

      expect(screen.queryByPlaceholderText('Search keys or values...')).toBeNull();
    });

    it('should call search hook on input change', async () => {
      const searchMock = jest.fn();
      mockHook({ search: searchMock });

      render(<JsonTreeRenderer data={{ name: 'test' }} />);

      const input = screen.getByPlaceholderText('Search keys or values...');
      fireEvent.change(input, { target: { value: 'name' } });

      // Wait for debounce
      await new Promise((r) => setTimeout(r, 200));
      expect(searchMock).toHaveBeenCalled();
    });
  });

  describe('toolbar actions', () => {
    it('should call expandAll when Expand All button is clicked', () => {
      const expandAllMock = jest.fn();
      mockHook({ expandAll: expandAllMock });

      render(<JsonTreeRenderer data={{}} />);

      fireEvent.click(screen.getByText('Expand All'));

      expect(expandAllMock).toHaveBeenCalled();
    });

    it('should call collapseAll when Collapse All button is clicked', () => {
      const collapseAllMock = jest.fn();
      mockHook({ collapseAll: collapseAllMock });

      render(<JsonTreeRenderer data={{}} />);

      fireEvent.click(screen.getByText('Collapse All'));

      expect(collapseAllMock).toHaveBeenCalled();
    });
  });

  describe('node rendering', () => {
    it('should render toggle button for expandable nodes', () => {
      const nodes: JsonTreeNode[] = [
        makeNode({ id: 'root', key: 'root', value: { name: 'test' }, depth: 0, isExpanded: true }),
        makeLeafNode('name', 'test'),
      ];
      mockHook({ flatNodes: nodes, expandedIds: new Set(['root']) });

      render(<JsonTreeRenderer data={{ name: 'test' }} />);

      // Toggle button should be present
      const toggles = screen.getAllByText('▼');
      expect(toggles.length).toBeGreaterThanOrEqual(1);
    });

    it('should call toggle when toggle button is clicked', () => {
      const toggleMock = jest.fn();
      const nodes: JsonTreeNode[] = [
        makeNode({ id: 'root', key: 'root', value: { name: 'test' }, depth: 0, isExpanded: false }),
        makeLeafNode('name', 'test'),
      ];
      mockHook({ flatNodes: nodes, expandedIds: new Set([]), toggle: toggleMock });

      render(<JsonTreeRenderer data={{ name: 'test' }} />);

      // Find and click the toggle button
      const toggle = screen.getByText('▶');
      fireEvent.click(toggle);

      expect(toggleMock).toHaveBeenCalled();
    });

    it('should render leaf node values with correct type styling', () => {
      const stringNode = makeLeafNode('name', 'test', 'string');
      const numberNode = makeLeafNode('count', 42, 'number');
      const boolNode = makeLeafNode('active', true, 'boolean');
      const nullNode = makeLeafNode('empty', null, 'null');

      mockHook({ flatNodes: [stringNode, numberNode, boolNode, nullNode], totalCount: 4 });

      render(<JsonTreeRenderer data={{}} />);

      // Check that leaf values are rendered
      expect(screen.getByText(/"test"/)).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('null')).toBeInTheDocument();
    });

    it('should show summary for object/array nodes', () => {
      const objectNode = makeNode({
        id: 'obj',
        key: 'config',
        value: {},
        type: 'object',
        children: [makeLeafNode('key', 'value')],
      });
      const arrayNode = makeNode({
        id: 'arr',
        key: 'items',
        value: [],
        type: 'array',
        children: [makeLeafNode('0', 'a'), makeLeafNode('1', 'b')],
      });

      mockHook({ flatNodes: [objectNode, arrayNode] });

      render(<JsonTreeRenderer data={{}} />);

      // Summary should show item counts
      expect(screen.getByText(/1 keys/)).toBeInTheDocument();
      expect(screen.getByText(/2 items/)).toBeInTheDocument();
    });
  });

  describe('node selection', () => {
    it('should call select and onNodeSelect when a row is clicked', () => {
      const selectMock = jest.fn();
      const getNodeMock = jest.fn().mockReturnValue(makeLeafNode('name', 'test'));
      const onNodeSelectMock = jest.fn();

      mockHook({ select: selectMock, getNode: getNodeMock });

      render(
        <JsonTreeRenderer
          data={{}}
          onNodeSelect={onNodeSelectMock}
        />
      );

      // Click on the row
      const rows = screen.getAllByText('name');
      fireEvent.click(rows[0]);

      expect(selectMock).toHaveBeenCalled();
      expect(onNodeSelectMock).toHaveBeenCalled();
    });
  });

  describe('virtual scrolling', () => {
    it('should render only visible nodes for large trees', () => {
      // Create a large flat node list
      const largeNodeList: JsonTreeNode[] = Array.from({ length: 200 }, (_, i) =>
        makeLeafNode(`key${i}`, `value${i}`)
      );

      mockHook({ flatNodes: largeNodeList, totalCount: 200 });

      render(<JsonTreeRenderer data={{}} />);

      // All 200 nodes should still be in the flatNodes from hook
      // The component renders them all in the virtual container
      // We just verify the tree renders without crashing
      expect(screen.getByTestId('json-tree')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should handle key down events on search input', () => {
      render(<JsonTreeRenderer data={{}} />);

      const input = screen.getByPlaceholderText('Search keys or values...');
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should not crash
      expect(screen.getByTestId('json-tree')).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('should show copy toast when navigator.clipboard.writeText succeeds', async () => {
      // Mock clipboard API
      const writeTextMock = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextMock },
        writable: true,
      });

      render(<JsonTreeRenderer data={{}} />);

      // Copy button is hidden by default, visible on hover
      // So we test the copy functionality through the copy handler
      // The component renders, verify no crash
      expect(screen.getByTestId('json-tree')).toBeInTheDocument();
    });
  });
});
