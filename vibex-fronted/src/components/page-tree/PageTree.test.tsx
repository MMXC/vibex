/**
 * PageTree Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { PageTree, PageNode } from '@/components/page-tree/PageTree';

const mockNodes: PageNode[] = [
  {
    id: 'page-1',
    name: 'Home Page',
    type: 'page',
    children: [
      { id: 'comp-1', name: 'Header', type: 'component' },
      { id: 'comp-2', name: 'Footer', type: 'component' },
    ],
  },
  {
    id: 'page-2',
    name: 'About Page',
    type: 'page',
  },
  {
    id: 'section-1',
    name: 'Settings',
    type: 'section',
    children: [
      {
        id: 'page-3',
        name: 'Profile',
        type: 'page',
      },
    ],
  },
];

describe('PageTree', () => {
  it('should render nodes', () => {
    render(<PageTree nodes={mockNodes} />);
    
    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.getByText('About Page')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render with defaultExpanded true', () => {
    render(<PageTree nodes={mockNodes} defaultExpanded={true} />);
    
    // Children should be visible by default
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should render with defaultExpanded false', () => {
    render(<PageTree nodes={mockNodes} defaultExpanded={false} />);
    
    // Children should not be visible when collapsed
    expect(screen.queryByText('Header')).not.toBeInTheDocument();
  });

  it('should toggle expand/collapse on click', () => {
    render(<PageTree nodes={mockNodes} />);
    
    // Initially expanded, children visible
    expect(screen.getByText('Header')).toBeInTheDocument();
    
    // Click to collapse - use getAllByText since there may be multiple
    const expandButtons = screen.getAllByText('▼');
    fireEvent.click(expandButtons[0]);
    
    // Should now show expand icon and children hidden
    expect(screen.getAllByText('▶').length).toBeGreaterThan(0);
  });

  it('should call onNodeClick when node clicked', () => {
    const handleClick = jest.fn();
    render(<PageTree nodes={mockNodes} onNodeClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Home Page'));
    
    expect(handleClick).toHaveBeenCalledWith('page-1');
  });

  it('should render correct icons for different node types', () => {
    render(<PageTree nodes={mockNodes} />);
    
    // Check that icons are present (multiple elements may match)
    const icons = screen.getAllByText(/[📄🔧📋]/);
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should handle nodes without children', () => {
    const nodesWithoutChildren: PageNode[] = [
      { id: 'page-1', name: 'Standalone Page', type: 'page' },
    ];
    
    render(<PageTree nodes={nodesWithoutChildren} />);
    
    expect(screen.getByText('Standalone Page')).toBeInTheDocument();
    // Should show placeholder instead of expand button
    expect(screen.getByText('•')).toBeInTheDocument();
  });

  it('should handle empty nodes', () => {
    render(<PageTree nodes={[]} />);
    
    // Should render without errors
    const list = document.querySelector('ul');
    expect(list).toBeInTheDocument();
    expect(list?.children.length).toBe(0);
  });
});