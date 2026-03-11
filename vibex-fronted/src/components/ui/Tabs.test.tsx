/**
 * Tabs Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  const mockItems = [
    { label: 'Tab 1', content: 'Content 1', key: 'tab1' },
    { label: 'Tab 2', content: 'Content 2', key: 'tab2' },
    { label: 'Tab 3', content: 'Content 3', key: 'tab3', disabled: true },
  ];

  it('renders tabs with items', () => {
    render(<Tabs items={mockItems} />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('shows first tab content by default', () => {
    render(<Tabs items={mockItems} />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches tab content on click', () => {
    render(<Tabs items={mockItems} />);
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('calls onChange callback', () => {
    const handleChange = jest.fn();
    render(<Tabs items={mockItems} onChange={handleChange} />);
    
    fireEvent.click(screen.getByText('Tab 2'));
    expect(handleChange).toHaveBeenCalledWith(1);
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Tabs items={mockItems} variant="line" />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    
    rerender(<Tabs items={mockItems} variant="pill" />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    
    rerender(<Tabs items={mockItems} variant="card" />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  it('respects defaultIndex prop', () => {
    render(<Tabs items={mockItems} defaultIndex={1} />);
    expect(screen.getByText('Content 2')).toBeInTheDocument();
  });

  it('respects activeIndex prop (controlled)', () => {
    render(<Tabs items={mockItems} activeIndex={2} />);
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });

  it('does not switch to disabled tab', () => {
    render(<Tabs items={mockItems} />);
    
    fireEvent.click(screen.getByText('Tab 3'));
    // Should still show first tab content since tab 3 is disabled
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<Tabs items={mockItems} className="custom-tabs" />);
    expect(document.querySelector('.custom-tabs')).toBeInTheDocument();
  });

  it('renders tabs at bottom position', () => {
    render(<Tabs items={mockItems} position="bottom" />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
  });

  it('renders with actions', () => {
    render(
      <Tabs 
        items={mockItems} 
        showActions 
        actions={<button>Action</button>} 
      />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
  });
});
