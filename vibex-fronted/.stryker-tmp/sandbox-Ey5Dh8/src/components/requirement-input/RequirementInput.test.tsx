/**
 * Component Tests
 */
// @ts-nocheck


import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementInput } from '../requirement-input/RequirementInput';

describe('RequirementInput', () => {
  it('should render', () => {
    render(<RequirementInput />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should call onGenerate when generate button clicked', () => {
    const onGenerate = jest.fn();
    render(<RequirementInput onGenerate={onGenerate} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test requirement' } });
    fireEvent.click(screen.getByText(/开始生成/));
    expect(onGenerate).toHaveBeenCalledWith('Test requirement');
  });

  it('should not call onGenerate when input is empty', () => {
    const onGenerate = jest.fn();
    render(<RequirementInput onGenerate={onGenerate} />);
    // Generate button should be disabled when input is empty
    const generateButton = screen.getByText(/开始生成/);
    expect(generateButton).toBeDisabled();
  });

  it('should clear input when clear button clicked', () => {
    render(<RequirementInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(input).toHaveValue('');
  });

  it('should call onValueChange when text changes', () => {
    const onValueChange = jest.fn();
    render(<RequirementInput onValueChange={onValueChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test' } });
    expect(onValueChange).toHaveBeenCalledWith('Test');
  });
});