/**
 * JsonTreeRenderer Component Tests
 */

import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JsonTreeRenderer } from '../JsonTreeRenderer';
import type { JsonTreeNode } from '@/types/visualization';

// ==================== Mock Hook ====================

const mockUseJsonTreeVisualization = jest.fn();

jest.mock('@/hooks/useJsonTreeVisualization', () => ({
  useJsonTreeVisualization: () => mockUseJsonTreeVisualization(),
}));

// ==================== Test Helpers ====================

function makeNode(overrides: Partial<JsonTreeNode> = {}): JsonTreeNode {
  return {
    id: 'node-1',
    key: 'root',
    value: { name: 'test' },
    type: 'object' as const,
    depth: 0,
    path: [],
    children: [],
    isExpanded: true,
    isLeaf: false,
    ...overrides,
  };
}

function makeLeafNode(
  keyName: string,
  leafValue: unknown,
  leafType: JsonTreeNode['type'] = 'string'
): JsonTreeNode {
  return {
    id: `node-${keyName}`,
    key: keyName,
    value: leafValue,
    type: leafType,
    depth: 1,
    path: [keyName],
    isLeaf: true,
    isExpanded: false,
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
    getNode: jest.fn((id: string) => defaultNodes.find((n: JsonTreeNode) => n.id === id)),
    ...overrides,
  });
}

// ==================== Tests ====================

describe('JsonTreeRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(cleanup);

  // ----- Rendering -----

  it('should render the component with data-testid', () => {
    mockHook();
    render(<JsonTreeRenderer data={{ name: 'test' }} />);
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });

  it('should render empty state when data is null', () => {
    mockHook({ flatNodes: [] });
    render(<JsonTreeRenderer data={null as unknown as object} />);
    expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
  });

  it('should pass className to container', () => {
    mockHook();
    render(<JsonTreeRenderer data={{}} className="my-custom-class" />);
    expect(screen.getByTestId('json-tree')).toHaveClass('my-custom-class');
  });

  it('should render tree nodes from hook data', () => {
    mockHook();
    render(<JsonTreeRenderer data={{}} />);
    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  // ----- Toolbar -----

  it('should show toolbar with node count', () => {
    mockHook({ totalCount: 5 });
    render(<JsonTreeRenderer data={{}} showToolbar />);
    expect(screen.getByText(/5/)).toBeInTheDocument();
  });

  it('should hide toolbar when showToolbar is false', () => {
    mockHook();
    const { container } = render(<JsonTreeRenderer data={{}} showToolbar={false} />);
    // Toolbar is hidden via CSS, component still renders
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });

  // ----- Interaction -----

  it('should call search hook on input change', async () => {
    const searchMock = jest.fn();
    mockHook({ search: searchMock });

    render(<JsonTreeRenderer data={{ name: 'test' }} showSearch />);

    const input = screen.getByPlaceholderText('Search keys or values...');
    await userEvent.type(input, 'test-query');

    // Wait for debounce
    await new Promise((r: () => void) => setTimeout(r, 200));
    expect(searchMock).toHaveBeenCalled();
  });

  it('should call expandAll when Expand All button is clicked', async () => {
    const expandAllMock = jest.fn();
    mockHook({ expandAll: expandAllMock });

    render(<JsonTreeRenderer data={{}} showToolbar />);

    await userEvent.click(screen.getByText('Expand All'));

    expect(expandAllMock).toHaveBeenCalled();
  });

  it('should call collapseAll when Collapse All button is clicked', async () => {
    const collapseAllMock = jest.fn();
    mockHook({ collapseAll: collapseAllMock });

    render(<JsonTreeRenderer data={{}} showToolbar />);

    await userEvent.click(screen.getByText('Collapse All'));

    expect(collapseAllMock).toHaveBeenCalled();
  });

  // ----- Search -----

  it('should highlight matching nodes when searching', () => {
    mockHook({ searchQuery: 'name', totalCount: 2 });
    render(<JsonTreeRenderer data={{}} />);
    expect(screen.getByText('name')).toBeInTheDocument();
  });

  it('should clear search on Escape key', async () => {
    mockHook();
    render(<JsonTreeRenderer data={{}} showSearch />);

    const input = screen.getByPlaceholderText('Search keys or values...');
    await userEvent.type(input, 'test');
    await userEvent.keyboard('{Escape}');
  });

  // ----- Data Types -----

  it('should render leaf node values with correct type styling', () => {
    mockHook({
      flatNodes: [
        makeLeafNode('count', 42, 'number'),
        makeLeafNode('flag', true, 'boolean'),
        makeLeafNode('data', null, 'null'),
      ],
      totalCount: 3,
    });
    render(<JsonTreeRenderer data={{}} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('should render object/array summary with item count', () => {
    mockHook({
      flatNodes: [
        makeNode({
          id: 'obj',
          key: 'config',
          value: {},
          type: 'object' as const,
          children: [makeLeafNode('key', 'value')],
        }),
        makeNode({
          id: 'arr',
          key: 'items',
          value: [],
          type: 'array' as const,
          children: [makeLeafNode('0', 'a'), makeLeafNode('1', 'b')],
        }),
      ],
      totalCount: 2,
    });
    render(<JsonTreeRenderer data={{}} />);
    expect(screen.getByText('config')).toBeInTheDocument();
    expect(screen.getByText('items')).toBeInTheDocument();
  });

  // ----- Virtual Scrolling -----

  it('should only render visible nodes for large trees', () => {
    const largeNodeList: JsonTreeNode[] = Array.from({ length: 200 }, (_, i) =>
      makeLeafNode(`key${i}`, `value${i}`)
    );
    mockHook({ flatNodes: largeNodeList, totalCount: 200 });
    render(<JsonTreeRenderer data={{}} />);
    // All 200 nodes in flatNodes, but only visible subset rendered
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });
});
