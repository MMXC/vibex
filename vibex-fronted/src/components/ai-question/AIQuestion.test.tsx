/**
 * AI Question Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { AIQuestion } from '../ai-question/AIQuestion';

describe('AIQuestion', () => {
  const mockOptions = [
    { id: '1', label: 'Yes', value: 'yes' },
    { id: '2', label: 'No', value: 'no' },
  ];

  it('should render question', () => {
    render(<AIQuestion question="Test question?" onAnswer={jest.fn()} />);
    expect(screen.getByText('Test question?')).toBeInTheDocument();
  });

  it('should render options', () => {
    render(<AIQuestion question="Test?" options={mockOptions} onAnswer={jest.fn()} />);
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('should show submit button', () => {
    render(<AIQuestion question="Test?" onAnswer={jest.fn()} />);
    expect(screen.getByText('提交回答')).toBeInTheDocument();
  });
});
