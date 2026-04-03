/**
 * OnboardingProgressBar Unit Tests
 * 
 * 验收标准:
 * - 语句覆盖 ≥ 80%
 * - 分支覆盖 ≥ 70%
 */
// @ts-nocheck


import React from 'react';
import { render, screen } from '@testing-library/react';
import { OnboardingProgressBar } from './OnboardingProgressBar';

const defaultStore = {
  status: 'in-progress' as const,
  currentStep: 'welcome' as const,
  completedSteps: [] as string[],
  start: jest.fn(),
  nextStep: jest.fn(),
  prevStep: jest.fn(),
  goToStep: jest.fn(),
  completeStep: jest.fn(),
  complete: jest.fn(),
  skip: jest.fn(),
  reset: jest.fn(),
};

const mockUseOnboardingStore = jest.fn(() => defaultStore);

jest.mock('@/stores/onboarding/onboardingStore', () => ({
  useOnboardingStore: () => mockUseOnboardingStore(),
  ONBOARDING_STEPS: [
    { id: 'welcome', title: 'Welcome', description: '', icon: '🎯' },
    { id: 'input', title: 'Input', description: '', icon: '📝' },
    { id: 'clarify', title: 'Clarify', description: '', icon: '🤖' },
    { id: 'model', title: 'Model', description: '', icon: '🏗️' },
    { id: 'prototype', title: 'Prototype', description: '', icon: '🎨' },
  ],
  getStepIndex: (step: string) => {
    const map: Record<string, number> = { welcome: 0, input: 1, clarify: 2, model: 3, prototype: 4 };
    return map[step] ?? 0;
  },
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => (
      <div data-testid="motion-div" {...props}>{children}</div>
    ),
  },
}));

describe('OnboardingProgressBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOnboardingStore.mockReturnValue(defaultStore);
  });

  // ===== Branch: status !== 'in-progress' → returns null =====
  describe('returns null when not in-progress', () => {
    it('returns null when status is not-started', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, status: 'not-started' });
      const { container } = render(<OnboardingProgressBar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when status is completed', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, status: 'completed' });
      const { container } = render(<OnboardingProgressBar />);
      expect(container.firstChild).toBeNull();
    });

    it('returns null when status is skipped', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, status: 'skipped' });
      const { container } = render(<OnboardingProgressBar />);
      expect(container.firstChild).toBeNull();
    });
  });

  // ===== Branch: status === 'in-progress' → renders progress =====
  describe('renders progress bar when in-progress', () => {
    it('renders the progress container', () => {
      const { container } = render(<OnboardingProgressBar />);
      expect(container.querySelector('[class*="container"]') ?? container.firstChild).toBeInTheDocument();
    });

    it('renders step info with step text', () => {
      render(<OnboardingProgressBar />);
      expect(screen.getByText(/第 .* 步 \/ 共 .* 步/)).toBeInTheDocument();
    });

    it('renders remaining time estimate', () => {
      render(<OnboardingProgressBar />);
      expect(screen.getByText(/预计剩余/)).toBeInTheDocument();
    });

    it('renders progress percentage', () => {
      render(<OnboardingProgressBar />);
      expect(screen.getByText('5%')).toBeInTheDocument();
    });
  });

  // ===== Branch: progressPercent calculation =====
  describe('progress percentage calculation', () => {
    it('shows 5% when no steps are completed', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, completedSteps: [] });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('shows 20% when 1 of 5 steps is completed', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, completedSteps: ['welcome'] });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    it('shows 60% when 3 of 5 steps are completed', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, completedSteps: ['welcome', 'input', 'clarify'] });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('shows 100% when all steps are completed', () => {
      mockUseOnboardingStore.mockReturnValue({
        ...defaultStore,
        completedSteps: ['welcome', 'input', 'clarify', 'model', 'prototype'],
      });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  // ===== Branch: remainingTime calculation =====
  describe('remaining time calculation', () => {
    it('shows minutes when remaining time < 60 min', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, currentStep: 'clarify', completedSteps: [] });
      render(<OnboardingProgressBar />);
      // clarify(2)+model(3)+prototype(2)=7 min
      expect(screen.getByText(/约 7 分钟/)).toBeInTheDocument();
    });

    it('updates remaining time when currentStep changes', () => {
      const { rerender } = render(<OnboardingProgressBar />);
      // Loop i=0→4, each defaults to 2min: 2+2+2+2+2=10 min
      expect(screen.getByText(/约 10 分钟/)).toBeInTheDocument();

      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, currentStep: 'clarify', completedSteps: ['welcome', 'input'] });
      rerender(<OnboardingProgressBar />);
      // Loop i=2→4: clarify(2)+model(3)+prototype(2)=7 min
      expect(screen.getByText(/约 7 分钟/)).toBeInTheDocument();
    });
  });

  // ===== Branch: stepText =====
  describe('step text display', () => {
    it('shows "第 1 步 / 共 5 步" for welcome step', () => {
      render(<OnboardingProgressBar />);
      expect(screen.getByText('第 1 步 / 共 5 步')).toBeInTheDocument();
    });

    it('shows "第 3 步 / 共 5 步" for clarify step', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, currentStep: 'clarify' });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('第 3 步 / 共 5 步')).toBeInTheDocument();
    });

    it('shows "第 5 步 / 共 5 步" for prototype step', () => {
      mockUseOnboardingStore.mockReturnValue({ ...defaultStore, currentStep: 'prototype' });
      render(<OnboardingProgressBar />);
      expect(screen.getByText('第 5 步 / 共 5 步')).toBeInTheDocument();
    });
  });
});
