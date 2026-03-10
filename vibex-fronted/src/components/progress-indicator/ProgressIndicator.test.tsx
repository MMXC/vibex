/**
 * Progress Indicator Tests
 */

import { render, screen } from '@testing-library/react';
import { ProgressIndicator } from '../progress-indicator/ProgressIndicator';

describe('ProgressIndicator', () => {
  const mockSteps = [
    { id: '1', label: 'Step 1', completed: true },
    { id: '2', label: 'Step 2', completed: false },
    { id: '3', label: 'Step 3', completed: false },
  ];

  it('should render steps', () => {
    render(<ProgressIndicator steps={mockSteps} />);
    expect(screen.getByText('已完成 1/3')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should calculate progress correctly', () => {
    render(<ProgressIndicator steps={mockSteps} />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should handle empty steps', () => {
    render(<ProgressIndicator steps={[]} />);
    expect(screen.getByText('0/0')).toBeInTheDocument();
  });

  it('should show labels when showLabels is true', () => {
    render(<ProgressIndicator steps={mockSteps} showLabels />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('should hide labels when showLabels is false', () => {
    render(<ProgressIndicator steps={mockSteps} showLabels={false} />);
    // Labels should not be visible
  });
});
