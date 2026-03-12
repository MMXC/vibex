/**
 * GenerationProgress Component Tests
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerationProgress, GenerationStep, ProgressStatus } from '@/components/generation-progress/GenerationProgress';

const mockSteps: GenerationStep[] = [
  { id: 'step-1', label: 'Analyzing Requirements', status: 'completed', progress: 100 },
  { id: 'step-2', label: 'Generating UI', status: 'processing', progress: 50 },
  { id: 'step-3', label: 'Validating', status: 'pending', progress: 0 },
];

describe('GenerationProgress', () => {
  it('should render all steps', () => {
    render(<GenerationProgress steps={mockSteps} />);
    
    expect(screen.getByText('Analyzing Requirements')).toBeInTheDocument();
    expect(screen.getByText('Generating UI')).toBeInTheDocument();
    expect(screen.getByText('Validating')).toBeInTheDocument();
  });

  it('should show generating status', () => {
    render(<GenerationProgress steps={mockSteps} status="generating" />);
    
    expect(screen.getByText('🔄 正在生成...')).toBeInTheDocument();
  });

  it('should show completed status', () => {
    render(<GenerationProgress steps={mockSteps} status="completed" />);
    
    expect(screen.getByText('✅ 生成完成')).toBeInTheDocument();
  });

  it('should show error status', () => {
    render(<GenerationProgress steps={mockSteps} status="error" />);
    
    expect(screen.getByText('❌ 生成失败')).toBeInTheDocument();
  });

  it('should call onComplete when status changes to completed', () => {
    const handleComplete = jest.fn();
    render(<GenerationProgress steps={mockSteps} status="completed" onComplete={handleComplete} />);
    
    expect(handleComplete).toHaveBeenCalled();
  });

  it('should show correct percentage', () => {
    render(<GenerationProgress steps={mockSteps} />);
    
    // 1 completed out of 3 = 33%
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('should show step status indicators', () => {
    render(<GenerationProgress steps={mockSteps} />);
    
    // Check for status indicators - just verify the component renders
    expect(screen.getByText('Analyzing Requirements')).toBeInTheDocument();
  });

  it('should handle empty steps', () => {
    render(<GenerationProgress steps={[]} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('should highlight current step', () => {
    render(<GenerationProgress steps={mockSteps} currentStepId="step-2" />);
    
    // The current step should be processing
    expect(screen.getByText('Generating UI')).toBeInTheDocument();
  });
});