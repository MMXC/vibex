/**
 * Dropdown Component Tests
 */

import { render, screen } from '@testing-library/react';
import { Dropdown, DropdownOption } from '@/components/ui/Dropdown';

const mockOptions: DropdownOption[] = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2', disabled: true },
  { value: 'opt3', label: 'Option 3' },
];

describe('Dropdown', () => {
  it('should render component', () => {
    render(<Dropdown options={mockOptions} onChange={jest.fn()} />);
    
    // Component should render
    const dropdown = document.querySelector('.wrapper');
    expect(dropdown).toBeInTheDocument();
  });

  it('should render with placeholder', () => {
    render(
      <Dropdown 
        options={mockOptions} 
        placeholder="Choose..." 
        onChange={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Choose...')).toBeInTheDocument();
  });

  it('should render with label', () => {
    render(
      <Dropdown 
        options={mockOptions} 
        label="Select Label" 
        onChange={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Select Label')).toBeInTheDocument();
  });

  it('should render error message', () => {
    render(
      <Dropdown 
        options={mockOptions} 
        error="Error message" 
        onChange={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <Dropdown 
        options={mockOptions} 
        disabled={true} 
        onChange={jest.fn()} 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should render with custom className', () => {
    const { container } = render(
      <Dropdown 
        options={mockOptions} 
        className="custom-class" 
        onChange={jest.fn()} 
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { container } = render(
      <Dropdown 
        options={mockOptions} 
        size="lg" 
        onChange={jest.fn()} 
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render different variants', () => {
    const { container } = render(
      <Dropdown 
        options={mockOptions} 
        variant="filled" 
        onChange={jest.fn()} 
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});