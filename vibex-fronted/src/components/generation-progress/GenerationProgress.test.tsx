/**
 * Generation Progress Tests
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
  });
});
