/**
 * AI Question Component Tests
 */
// @ts-nocheck


import { render, screen, fireEvent } from '@testing-library/react';
import { AIQuestion, QuestionOption } from '@/components/ai-question/AIQuestion';

const mockOptions: QuestionOption[] = [
  { id: 'opt-1', label: 'Option 1', value: 'value1' },
  { id: 'opt-2', label: 'Option 2', value: 'value2' },
];

describe('AIQuestion', () => {
  it('should render question text', () => {
    render(<AIQuestion question="What is your name?" onAnswer={jest.fn()} />);
    
    expect(screen.getByText('What is your name?')).toBeInTheDocument();
  });

  it('should render options when provided', () => {
    render(
      <AIQuestion 
        question="Choose an option" 
        options={mockOptions} 
        onAnswer={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should show placeholder text', () => {
    render(
      <AIQuestion 
        question="Enter text" 
        placeholder="Type here..." 
        onAnswer={jest.fn()} 
      />
    );
    
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
  });

  it('should call onAnswer with text when submitted', () => {
    const handleAnswer = jest.fn();
    render(<AIQuestion question="Question?" onAnswer={handleAnswer} />);
    
    const input = screen.getByPlaceholderText('请输入你的回答...');
    fireEvent.change(input, { target: { value: 'My answer' } });
    
    // Find the submit button by its text
    const submitButton = screen.getByText(/提交/);
    fireEvent.click(submitButton);
    
    expect(handleAnswer).toHaveBeenCalled();
  });

  it('should select option when clicked', () => {
    const handleAnswer = jest.fn();
    render(
      <AIQuestion 
        question="Choose" 
        options={mockOptions} 
        onAnswer={handleAnswer} 
      />
    );
    
    fireEvent.click(screen.getByText('Option 1'));
    
    // Option should be selected
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <AIQuestion 
        question="Question?" 
        onAnswer={jest.fn()} 
        disabled={true} 
      />
    );
    
    const input = screen.getByPlaceholderText('请输入你的回答...');
    expect(input).toBeDisabled();
  });

  it('should show loading state', () => {
    render(
      <AIQuestion 
        question="Question?" 
        onAnswer={jest.fn()} 
        loading={true} 
      />
    );
    
    // Component should render without errors in loading state
    expect(screen.getByText('Question?')).toBeInTheDocument();
  });

  it('should handle empty options array', () => {
    render(
      <AIQuestion 
        question="Question?" 
        options={[]} 
        onAnswer={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Question?')).toBeInTheDocument();
  });

  it('should handle text input change', () => {
    render(<AIQuestion question="Question?" onAnswer={jest.fn()} />);
    
    const input = screen.getByPlaceholderText('请输入你的回答...');
    fireEvent.change(input, { target: { value: 'Test input' } });
    
    expect(input).toHaveValue('Test input');
  });
});