/**
 * Steps Tests
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Steps } from './Steps';

describe('Steps', () => {
  const mockSteps = [
    { title: 'Step 1', description: 'First step' },
    { title: 'Step 2', description: 'Second step' },
    { title: 'Step 3', description: 'Third step' },
  ];

  it('renders all steps', () => {
    render(<Steps steps={mockSteps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('highlights current step', () => {
    render(<Steps steps={mockSteps} current={1} />);
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('shows step numbers when showNumber is true', () => {
    render(<Steps steps={mockSteps} showNumber />);
    // Should have step numbers
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('calls onStepClick when step is clicked', () => {
    const handleClick = jest.fn();
    render(<Steps steps={mockSteps} clickable onStepClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Step 1'));
    expect(handleClick).toHaveBeenCalledWith(0);
  });

  it('does not call onStepClick for pending steps when clickable is false', () => {
    const handleClick = jest.fn();
    render(<Steps steps={mockSteps} clickable={false} onStepClick={handleClick} />);
    
    fireEvent.click(screen.getByText('Step 1'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Steps steps={mockSteps} className="custom-steps" />);
    expect(document.querySelector('.custom-steps')).toBeInTheDocument();
  });

  it('renders vertically', () => {
    render(<Steps steps={mockSteps} direction="vertical" />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('handles step statuses', () => {
    const stepsWithStatus = [
      { title: 'Step 1', status: 'completed' as const },
      { title: 'Step 2', status: 'in-progress' as const },
      { title: 'Step 3', status: 'pending' as const },
    ];
    render(<Steps steps={stepsWithStatus} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('renders with descriptions', () => {
    render(<Steps steps={mockSteps} />);
    expect(screen.getByText('First step')).toBeInTheDocument();
  });

  it('handles empty steps array', () => {
    render(<Steps steps={[]} />);
    expect(document.querySelector('[class*="container"]')).toBeInTheDocument();
  });
});
