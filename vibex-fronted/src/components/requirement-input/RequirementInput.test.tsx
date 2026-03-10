/**
 * Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RequirementInput } from '../requirement-input/RequirementInput';

describe('RequirementInput', () => {
  it('should render', () => {
    const onSubmit = jest.fn();
    render(<RequirementInput onSubmit={onSubmit} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should call onSubmit when submitting', () => {
    const onSubmit = jest.fn();
    render(<RequirementInput onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Test requirement' } });
    fireEvent.click(screen.getByText('提交'));
    expect(onSubmit).toHaveBeenCalledWith('Test requirement');
  });

  it('should handle empty input', () => {
    const onSubmit = jest.fn();
    render(<RequirementInput onSubmit={onSubmit} />);
    fireEvent.click(screen.getByText('提交'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should clear input when clear button clicked', () => {
    render(<RequirementInput />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.click(screen.getByRole('button', { name: /清空/i }));
    expect(input).toHaveValue('');
  });
});
