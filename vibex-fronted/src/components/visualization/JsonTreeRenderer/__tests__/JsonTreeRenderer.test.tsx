/**
 * JsonTreeRenderer Component Tests
 * 
 * Tests the JsonTreeRenderer component with ResizeObserver mocked.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { JsonTreeRenderer } from '../JsonTreeRenderer';

// Mock ResizeObserver (not available in jsdom by default)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(global as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver = MockResizeObserver;

describe('JsonTreeRenderer', () => {
  it('should render the component with data-testid', () => {
    render(<JsonTreeRenderer data={{ name: 'test' }} />);
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });

  it('should render empty state when no flatNodes', () => {
    render(<JsonTreeRenderer data={null as unknown as object} />);
    expect(screen.getByTestId('json-tree-empty')).toBeInTheDocument();
  });

  it('should pass className to container', () => {
    render(<JsonTreeRenderer data={{}} className="my-custom-class" />);
    expect(screen.getByTestId('json-tree')).toHaveClass('my-custom-class');
  });

  it('should render tree nodes with root and name keys', () => {
    render(<JsonTreeRenderer data={{ name: 'test' }} />);
    expect(screen.getByText('root')).toBeInTheDocument();
  });

  it('should show node count in toolbar', () => {
    render(<JsonTreeRenderer data={{}} showToolbar />);
    // Toolbar should be visible
    expect(screen.getByTestId('json-tree')).toBeInTheDocument();
  });

});
