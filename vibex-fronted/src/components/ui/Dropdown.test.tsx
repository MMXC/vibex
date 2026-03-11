import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from './Dropdown';

describe('Dropdown', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3', disabled: true },
  ];

  it('renders with placeholder', () => {
    render(<Dropdown options={options} placeholder="Select..." />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders options', () => {
    render(<Dropdown options={options} />);
    fireEvent.click(screen.getByText('Select an option'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('calls onChange when option selected', () => {
    const onChange = jest.fn();
    render(<Dropdown options={options} onChange={onChange} />);
    fireEvent.click(screen.getByText('Select an option'));
    fireEvent.click(screen.getByText('Option 1'));
    expect(onChange).toHaveBeenCalledWith('1');
  });

  it('disables dropdown when disabled prop is true', () => {
    render(<Dropdown options={options} disabled />);
    const button = screen.getByText('Select an option').closest('button');
    expect(button).toBeDisabled();
  });

  it('renders with label', () => {
    render(<Dropdown options={options} label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(<Dropdown options={options} error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('shows selected value', () => {
    render(<Dropdown options={options} value="2" />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Dropdown options={options} size="sm" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    
    rerender(<Dropdown options={options} size="lg" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Dropdown options={options} variant="filled" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
    
    rerender(<Dropdown options={options} variant="ghost" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });
});
