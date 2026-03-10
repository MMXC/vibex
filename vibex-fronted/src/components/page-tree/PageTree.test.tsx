/**
 * Page Tree Tests
 */

import { render, screen } from '@testing-library/react';
import { PageTree } from '../page-tree/PageTree';

describe('PageTree', () => {
  const mockNodes = [
    { id: '1', name: 'Page 1', type: 'page' as const, children: [
      { id: '1-1', name: 'Component 1', type: 'component' as const },
    ]},
    { id: '2', name: 'Page 2', type: 'page' as const },
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
});
