/**
 * StepGuard Component Tests
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepGuard, StepGuardAlert } from '../StepGuard';
import { useConfirmationState } from '@/hooks/useConfirmationState';
import { useRouter } from 'next/navigation';

// Mock dependencies
jest.mock('@/hooks/useConfirmationState');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

const mockUseConfirmationState = useConfirmationState as jest.MockedFunction<
  typeof useConfirmationState
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('StepGuard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockUseRouter.mockReturnValue({ push: mockPush } as any);
  });

  describe('when step is valid', () => {
    beforeEach(() => {
      mockUseConfirmationState.mockReturnValue({
        isValid: true,
        redirectTo: '/confirm',
        message: '',
        checks: {
          hasRequirementText: true,
          hasBoundedContexts: true,
          hasDomainModels: true,
          hasBusinessFlow: true,
        },
      });
    });

    it('should render children when step is valid', () => {
      render(
        <StepGuard step="context">
          <div data-testid="child-content">Child Content</div>
        </StepGuard>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });
  });

  describe('when step is invalid', () => {
    beforeEach(() => {
      mockUseConfirmationState.mockReturnValue({
        isValid: false,
        redirectTo: '/confirm?step=context',
        message: '请先输入需求描述',
        checks: {
          hasRequirementText: false,
          hasBoundedContexts: false,
          hasDomainModels: false,
          hasBusinessFlow: false,
        },
      });
    });

    it('should render fallback when provided and step is invalid', () => {
      render(
        <StepGuard
          step="context"
          fallback={<div data-testid="fallback">Fallback</div>}
        >
          <div data-testid="child">Child</div>
        </StepGuard>
      );

      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('StepGuardAlert', () => {
    it('should not render when step is valid', () => {
      mockUseConfirmationState.mockReturnValue({
        isValid: true,
        redirectTo: '',
        message: '',
        checks: {
          hasRequirementText: true,
          hasBoundedContexts: true,
          hasDomainModels: true,
          hasBusinessFlow: true,
        },
      });

      const { container } = render(<StepGuardAlert step="context" />);
      expect(container.firstChild).toBeNull();
    });

    it('should render alert message when step is invalid', () => {
      mockUseConfirmationState.mockReturnValue({
        isValid: false,
        redirectTo: '/confirm',
        message: '请先完成上一步骤',
        checks: {
          hasRequirementText: false,
          hasBoundedContexts: false,
          hasDomainModels: false,
          hasBusinessFlow: false,
        },
      });

      render(<StepGuardAlert step="context" />);
      expect(screen.getByText(/请先完成上一步骤/)).toBeInTheDocument();
    });

    it('should render custom message when provided', () => {
      mockUseConfirmationState.mockReturnValue({
        isValid: false,
        redirectTo: '/confirm',
        message: 'Custom message',
        checks: {
          hasRequirementText: false,
          hasBoundedContexts: false,
          hasDomainModels: false,
          hasBusinessFlow: false,
        },
      });

      render(<StepGuardAlert step="context" />);
      expect(screen.getByText('Custom message')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle different step types', () => {
      mockUseConfirmationState.mockReturnValue({
        isValid: true,
        redirectTo: '',
        message: '',
        checks: {
          hasRequirementText: true,
          hasBoundedContexts: true,
          hasDomainModels: true,
          hasBusinessFlow: true,
        },
      });

      const { rerender } = render(
        <StepGuard step="context">
          <div>Content</div>
        </StepGuard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(
        <StepGuard step="model">
          <div>Content</div>
        </StepGuard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();

      rerender(
        <StepGuard step="flow">
          <div>Content</div>
        </StepGuard>
      );
      expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('should apply custom className to StepGuardAlert', () => {
      mockUseConfirmationState.mockReturnValue({
        isValid: false,
        redirectTo: '/confirm',
        message: 'Test message',
        checks: {
          hasRequirementText: false,
          hasBoundedContexts: false,
          hasDomainModels: false,
          hasBusinessFlow: false,
        },
      });

      render(<StepGuardAlert step="context" className="custom-class" />);
      const alert = screen.getByText('Test message').parentElement;
      expect(alert).toHaveClass('custom-class');
    });
  });
});
