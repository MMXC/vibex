/**
 * Generation Progress Tests - Extended
 */

import { render, screen } from '@testing-library/react';
import { GenerationProgress } from '../generation-progress/GenerationProgress';

describe('GenerationProgress', () => {
  const mockSteps = [
    { id: '1', label: 'Step 1', status: 'completed' as const },
    { id: '2', label: 'Step 2', status: 'processing' as const, progress: 50 },
    { id: '3', label: 'Step 3', status: 'pending' as const },
  ];

  it('should render', () => {
    render(<GenerationProgress steps={mockSteps} />);
    expect(screen.getByText(/生成完成|正在生成/)).toBeInTheDocument();
  });

  it('should show steps', () => {
    render(<GenerationProgress steps={mockSteps} />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.getByText('Step 3')).toBeInTheDocument();
  });

  it('should display all step statuses', () => {
    render(<GenerationProgress steps={mockSteps} />);
    // Check that steps are rendered
    const steps = document.querySelectorAll('[class*="step"]');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('should handle empty steps', () => {
    render(<GenerationProgress steps={[]} />);
    expect(document.querySelector('[class*="progress"]')).toBeInTheDocument();
  });

  it('should show current step', () => {
    render(<GenerationProgress steps={mockSteps} currentStepId="2" />);
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });
});
