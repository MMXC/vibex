/**
 * OnboardingModal Component Tests
 */

import { render, screen } from '@testing-library/react';
import { OnboardingModal } from './OnboardingModal';
import { useOnboardingStore, ONBOARDING_STEPS } from '@/stores/onboarding';

// Mock the store
vi.mock('@/stores/onboarding', () => ({
  useOnboardingStore: vi.fn(),
  ONBOARDING_STEPS: [
    { id: 'welcome', title: '欢迎', icon: '🎯', description: '欢迎使用', duration: '1min' },
    { id: 'input', title: '输入', icon: '📝', description: '输入需求', duration: '2min' },
    { id: 'clarify', title: '澄清', icon: '🤖', description: 'AI澄清', duration: '2min' },
    { id: 'model', title: '建模', icon: '🏗️', description: '领域建模', duration: '3min' },
    { id: 'prototype', title: '原型', icon: '🎨', description: '原型生成', duration: '2min' },
  ],
}));

describe('OnboardingModal', () => {
  const mockStore = {
    status: 'in-progress' as const,
    currentStep: 'welcome',
    completedSteps: [],
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    skip: vi.fn(),
    complete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useOnboardingStore as any).mockReturnValue(mockStore);
  });

  it('should not render when status is not in-progress', () => {
    (useOnboardingStore as any).mockReturnValue({
      ...mockStore,
      status: 'not-started',
    });

    render(<OnboardingModal />);
    // Modal should not be visible
    expect(screen.queryByTestId('onboarding-overlay')).toBeNull();
  });

  it('should render when status is in-progress', () => {
    render(<OnboardingModal />);
    expect(screen.getByTestId('onboarding-overlay')).toBeInTheDocument();
  });

  it('should display all steps in indicator', () => {
    render(<OnboardingModal />);
    
    // Check that steps are displayed (using getAllByText for multiple matches)
    expect(screen.getAllByText('欢迎').length).toBeGreaterThan(0);
    expect(screen.getAllByText('输入').length).toBeGreaterThan(0);
    expect(screen.getAllByText('澄清').length).toBeGreaterThan(0);
    expect(screen.getAllByText('建模').length).toBeGreaterThan(0);
    expect(screen.getAllByText('原型').length).toBeGreaterThan(0);
  });

  it('should display current step content', () => {
    render(<OnboardingModal />);
    
    expect(screen.getByText('欢迎使用')).toBeInTheDocument();
    expect(screen.getByText('预计时长: 1min')).toBeInTheDocument();
  });

  it('should call skip when close button clicked', () => {
    render(<OnboardingModal />);
    
    const closeButton = screen.getByText('✕');
    closeButton.click();
    
    expect(mockStore.skip).toHaveBeenCalled();
  });

  it('should call nextStep when next button clicked', () => {
    render(<OnboardingModal />);
    
    const nextButton = screen.getByText(/下一步/);
    nextButton.click();
    
    expect(mockStore.nextStep).toHaveBeenCalled();
  });

  it('should show back button when not on first step', () => {
    (useOnboardingStore as any).mockReturnValue({
      ...mockStore,
      currentStep: 'input',
    });

    render(<OnboardingModal />);
    
    expect(screen.getByText(/上一步/)).toBeInTheDocument();
  });

  it('should not show back button on first step', () => {
    render(<OnboardingModal />);
    
    expect(screen.queryByText('上一步')).not.toBeInTheDocument();
  });
});
