/**
 * E1: ClarifyStep + PreviewStep Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock useTemplates hook
vi.mock('@/hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: [
      { id: 'saas-crm', name: 'SaaS 产品设计', description: '适用于 SaaS CRM', chapters: { requirement: '## 用户\n- 角色：管理员\n- 核心需求：多租户' } },
      { id: 'mobile-app', name: '移动端 App', description: '适用于 iOS/Android', chapters: { requirement: '' } },
      { id: 'blank', name: '空白项目', description: '从零开始', chapters: { requirement: '' } },
    ],
    selectTemplate: (id: string) => {
      const map: Record<string, ReturnType<typeof vi.mock>> = {
        'saas-crm': { id: 'saas-crm', name: 'SaaS', chapters: { requirement: '## 用户\n- 角色：管理员' } },
      };
      return map[id];
    },
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

import { ClarifyStep } from '@/components/onboarding/steps/ClarifyStep';
import { SCENARIO_OPTIONS } from '@/stores/onboarding';

describe('E1-S3: ClarifyStep — Scenario Selection', () => {
  const defaultProps = { onNext: vi.fn(), onPrev: vi.fn(), onSkip: vi.fn() };

  it('should render scenario options', () => {
    render(<ClarifyStep {...defaultProps} />);
    SCENARIO_OPTIONS.forEach((opt) => {
      expect(screen.getByText(opt.label)).toBeInTheDocument();
    });
  });

  it('should have correct data-testid', () => {
    render(<ClarifyStep {...defaultProps} />);
    expect(screen.getByTestId('onboarding-step-2')).toBeInTheDocument();
  });

  it('should call onNext when next button clicked', () => {
    const onNext = vi.fn();
    render(<ClarifyStep {...defaultProps} onNext={onNext} />);
    fireEvent.click(screen.getByTestId('onboarding-step-2-next-btn'));
    expect(onNext).toHaveBeenCalled();
  });

  it('should call onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ClarifyStep {...defaultProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByTestId('onboarding-step-2-skip-btn'));
    expect(onSkip).toHaveBeenCalled();
  });

  it('should call onPrev when back button clicked', () => {
    const onPrev = vi.fn();
    render(<ClarifyStep {...defaultProps} onPrev={onPrev} />);
    fireEvent.click(screen.getByTestId('onboarding-step-2-prev-btn'));
    expect(onPrev).toHaveBeenCalled();
  });
});

describe('E1-S1: PreviewStep — Template Selection', () => {
  const defaultProps = { onNext: vi.fn(), onPrev: vi.fn(), onSkip: vi.fn() };

  it('should render template cards', async () => {
    const { default: PreviewStep } = await import('@/components/onboarding/steps/PreviewStep');
    render(<PreviewStep {...defaultProps} />);
    // Wait for templates to load
    const cards = await screen.findAllByTestId('onboarding-template-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should have template card data-testid', async () => {
    const { default: PreviewStep } = await import('@/components/onboarding/steps/PreviewStep');
    render(<PreviewStep {...defaultProps} />);
    // findByTestId throws on multiple; use findAllByTestId for template cards (multiple exist)
    const cards = await screen.findAllByTestId('onboarding-template-card');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should have correct data-testid for the step container', async () => {
    const { default: PreviewStep } = await import('@/components/onboarding/steps/PreviewStep');
    render(<PreviewStep {...defaultProps} />);
    expect(screen.getByTestId('onboarding-step-4')).toBeInTheDocument();
  });
});
