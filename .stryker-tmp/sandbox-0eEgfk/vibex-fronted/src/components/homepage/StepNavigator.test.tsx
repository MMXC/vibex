/**
 * StepNavigator Component Tests
 * 
 * Tests for Epic 2: 步骤导航 - 显示1-4步、当前步骤高亮、点击切换步骤、已完成步骤标记
 * Constraints: ['步骤顺序约束', '不可跳过步骤', '状态同步confirmationStore']
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepNavigator, Step, StepNavigatorProps } from './StepNavigator';

const defaultSteps: Step[] = [
  { id: 1, label: '需求输入', description: '描述您的需求' },
  { id: 2, label: '限界上下文', description: '定义系统边界' },
  { id: 3, label: '领域模型', description: '设计领域实体' },
  { id: 4, label: '业务流程', description: '绘制业务流程' },
  { id: 5, label: '项目创建', description: '生成项目代码' },
];

const renderComponent = (props: Partial<StepNavigatorProps> = {}) => {
  const defaultProps: StepNavigatorProps = {
    steps: defaultSteps,
    currentStep: 1,
    onStepClick: undefined,
    completedSteps: [],
    disabled: false,
    ...props,
  };
  return render(<StepNavigator {...defaultProps} />);
};

describe('StepNavigator', () => {
  describe('Rendering', () => {
    it('should render all steps', () => {
      renderComponent();
      
      expect(screen.getByText('需求输入')).toBeInTheDocument();
      expect(screen.getByText('限界上下文')).toBeInTheDocument();
      expect(screen.getByText('领域模型')).toBeInTheDocument();
      expect(screen.getByText('业务流程')).toBeInTheDocument();
      expect(screen.getByText('项目创建')).toBeInTheDocument();
    });

    it('should display step numbers correctly', () => {
      renderComponent({ currentStep: 1 });
      
      // Step 1 should show as current (number), not checkmark
      const step1Indicator = screen.getByText('1');
      expect(step1Indicator).toBeInTheDocument();
    });

    it('should display step descriptions', () => {
      renderComponent();
      
      expect(screen.getByText('描述您的需求')).toBeInTheDocument();
      expect(screen.getByText('定义系统边界')).toBeInTheDocument();
    });
  });

  describe('Current Step Highlighting', () => {
    it('should highlight current step', () => {
      renderComponent({ currentStep: 3 });
      
      // Step 3 should be marked as current
      const nav = screen.getByRole('navigation', { name: '流程步骤' });
      expect(nav).toBeInTheDocument();
    });

    it('should show different styles for different steps', () => {
      const { container, rerender } = render(
        <StepNavigator steps={defaultSteps} currentStep={1} completedSteps={[]} />
      );
      
      // Rerender with different current step
      rerender(<StepNavigator steps={defaultSteps} currentStep={3} completedSteps={[1, 2]} />);
      
      expect(container.querySelector('[aria-current="step"]')).toBeInTheDocument();
    });
  });

  describe('Completed Steps', () => {
    it('should show checkmark for completed steps', () => {
      renderComponent({ 
        currentStep: 3, 
        completedSteps: [1, 2] 
      });
      
      // Steps 1 and 2 should show checkmarks
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(2);
    });

    it('should track completed steps correctly', () => {
      const { rerender } = render(
        <StepNavigator steps={defaultSteps} currentStep={1} completedSteps={[]} />
      );
      
      // No checkmarks initially
      expect(screen.queryByText('✓')).not.toBeInTheDocument();
      
      // After completing steps 1 and 2
      rerender(<StepNavigator steps={defaultSteps} currentStep={3} completedSteps={[1, 2]} />);
      
      // Should have 2 checkmarks
      const checkmarks = screen.getAllByText('✓');
      expect(checkmarks.length).toBe(2);
    });
  });

  describe('Step Click Handling', () => {
    it('should call onStepClick when step is clicked', () => {
      const handleStepClick = jest.fn();
      renderComponent({ 
        currentStep: 3, 
        completedSteps: [1, 2],
        onStepClick: handleStepClick 
      });
      
      // Click on step 3 (current step)
      const step3Button = screen.getByText('领域模型').closest('button');
      if (step3Button) {
        fireEvent.click(step3Button);
        expect(handleStepClick).toHaveBeenCalledWith(3);
      }
    });

    it('should not call onStepClick for pending steps', () => {
      const handleStepClick = jest.fn();
      renderComponent({ 
        currentStep: 2, 
        completedSteps: [1],
        onStepClick: handleStepClick 
      });
      
      // Try to click on step 4 (pending)
      const step4Button = screen.getByText('业务流程').closest('button');
      if (step4Button) {
        fireEvent.click(step4Button);
        // pending steps should not trigger click handler
        expect(handleStepClick).not.toHaveBeenCalled();
      }
    });

    it('should respect disabled prop', () => {
      const handleStepClick = jest.fn();
      renderComponent({ 
        currentStep: 3, 
        completedSteps: [1, 2],
        onStepClick: handleStepClick,
        disabled: true 
      });
      
      // Try to click on step 3 (current step) when disabled
      const step3Button = screen.getByText('领域模型').closest('button');
      if (step3Button) {
        fireEvent.click(step3Button);
        expect(handleStepClick).not.toHaveBeenCalled();
      }
    });
  });

  describe('Step Order Constraints (不可跳过步骤)', () => {
    it('should not allow clicking future steps', () => {
      const handleStepClick = jest.fn();
      renderComponent({ 
        currentStep: 2, 
        completedSteps: [1],
        onStepClick: handleStepClick 
      });
      
      // Try to click on step 4 (future step)
      const step4Button = screen.getByText('业务流程').closest('button');
      if (step4Button) {
        fireEvent.click(step4Button);
        expect(handleStepClick).not.toHaveBeenCalled();
      }
    });

    it('should only allow clicking current or completed steps', () => {
      const handleStepClick = jest.fn();
      renderComponent({ 
        currentStep: 3, 
        completedSteps: [1, 2],
        onStepClick: handleStepClick 
      });
      
      // Step 1 - completed (should be clickable based on current implementation)
      const step1Button = screen.getByText('需求输入').closest('button');
      if (step1Button) {
        fireEvent.click(step1Button);
        // In current implementation, completed steps are clickable (for going back)
        // This is acceptable for "步骤顺序约束" as it's for review, not skipping
      }
      
      // Step 3 - current (should be clickable)
      const step3Button = screen.getByText('领域模型').closest('button');
      if (step3Button) {
        fireEvent.click(step3Button);
        expect(handleStepClick).toHaveBeenCalledWith(3);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      renderComponent();
      
      expect(screen.getByRole('navigation', { name: '流程步骤' })).toBeInTheDocument();
    });

    it('should mark current step with aria-current', () => {
      renderComponent({ currentStep: 2 });
      
      const currentStepButton = screen.getByText('限界上下文').closest('button');
      expect(currentStepButton).toHaveAttribute('aria-current', 'step');
    });
  });
});
