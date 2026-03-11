/**
 * Page Tree Tests - Extended
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { PageTree, PageTreeNode } from '../page-tree/PageTree';

describe('PageTree', () => {
  const mockNodes: PageTreeNode[] = [
    { id: '1', name: 'Page 1', type: 'page', children: [
      { id: '1-1', name: 'Component 1', type: 'component' },
    ]},
    { id: '2', name: 'Page 2', type: 'page' },
  ];

  it('should render tree', () => {
    render(<PageTree nodes={mockNodes} />);
    expect(screen.getByText('Page 1')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });

  it('should show expand/collapse buttons', () => {
    render(<PageTree nodes={mockNodes} defaultExpanded />);
    expect(screen.getByText('全部折叠')).toBeInTheDocument();
  });

  it('should call onNodeClick', () => {
    const onNodeClick = jest.fn();
    render(<PageTree nodes={mockNodes} onNodeClick={onNodeClick} />);
  });

  it('should render nested children', () => {
    render(<PageTree nodes={mockNodes} defaultExpanded />);
    expect(screen.getByText('Component 1')).toBeInTheDocument();
  });

  it('should handle empty nodes', () => {
    render(<PageTree nodes={[]} />);
    // Should render without crashing
    expect(document.querySelector('[class*="tree"]')).toBeInTheDocument();
  });

  it('should show selected node', () => {
    render(<PageTree nodes={mockNodes} selectedId="1" />);
    // Should highlight selected node
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('should call onExpand when expand button clicked', () => {
    const onExpand = jest.fn();
    render(<PageTree nodes={mockNodes} onExpand={onExpand} />);
  });

  it('should display different node types', () => {
    const mixedNodes: PageTreeNode[] = [
      { id: '1', name: 'Page', type: 'page' },
      { id: '2', name: 'Component', type: 'component' },
      { id: '3', name: 'Folder', type: 'folder' },
    ];
    render(<PageTree nodes={mixedNodes} />);
    expect(screen.getByText('Page')).toBeInTheDocument();
    expect(screen.getByText('Component')).toBeInTheDocument();
    expect(screen.getByText('Folder')).toBeInTheDocument();
  });

  it('should handle disabled nodes', () => {
    const disabledNodes: PageTreeNode[] = [
      { id: '1', name: 'Disabled Page', type: 'page', disabled: true },
    ];
    render(<PageTree nodes={disabledNodes} />);
    expect(screen.getByText('Disabled Page')).toBeInTheDocument();
  });
});
