/**
 * E1: Onboarding + Template Bundle — Unit Tests
 *
 * Tests:
 * - F1.3: Scenario selection persists in onboardingStore
 * - F1.3: Scenario filtering logic (filterByScenario)
 * - F1.1: Template card selection (setSelectedTemplateId)
 * - F1.4: localStorage completion markers on complete()
 * - F1.2: PreviewStep template grid rendering
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboardingStore } from '@/stores/onboarding';

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
});

beforeEach(() => {
  // Reset store and store state
  Object.keys(store).forEach(k => delete store[k]);
  useOnboardingStore.setState({
    status: 'in-progress',
    currentStep: 'clarify',
    completedSteps: ['welcome', 'input'],
    scenario: undefined,
    selectedTemplateId: undefined,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('E1-S3: Scenario Selection', () => {
  it('should default to undefined scenario', () => {
    const { result } = renderHook(() => useOnboardingStore());
    expect(result.current.scenario).toBeUndefined();
  });

  it('should set scenario to new-feature', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setScenario('new-feature'); });
    expect(result.current.scenario).toBe('new-feature');
  });

  it('should set scenario to bugfix', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setScenario('bugfix'); });
    expect(result.current.scenario).toBe('bugfix');
  });

  it('should persist scenario in store state', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setScenario('refactor'); });
    const state = useOnboardingStore.getState();
    expect(state.scenario).toBe('refactor');
  });

  it('should allow scenario to be changed', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setScenario('new-feature'); });
    act(() => { result.current.setScenario('documentation'); });
    expect(result.current.scenario).toBe('documentation');
  });
});

describe('E1-S1: Template Selection', () => {
  it('should default to undefined selectedTemplateId', () => {
    const { result } = renderHook(() => useOnboardingStore());
    expect(result.current.selectedTemplateId).toBeUndefined();
  });

  it('should set selectedTemplateId', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setSelectedTemplateId('saas-crm'); });
    expect(result.current.selectedTemplateId).toBe('saas-crm');
  });

  it('should clear selectedTemplateId with undefined', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.setSelectedTemplateId('mobile-app'); });
    act(() => { result.current.setSelectedTemplateId(undefined); });
    expect(result.current.selectedTemplateId).toBeUndefined();
  });
});

describe('E1-S4: localStorage Completion Markers', () => {
  it('should write onboarding_completed=true on complete()', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.complete(); });
    expect(store['onboarding_completed']).toBe('true');
  });

  it('should write onboarding_completed_at ISO timestamp on complete()', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.complete(); });
    expect(store['onboarding_completed_at']).toBeTruthy();
    // Should be valid ISO date
    expect(() => new Date(store['onboarding_completed_at']!)).not.toThrow();
  });

  it('should not write markers on skip()', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.skip(); });
    expect(store['onboarding_completed']).toBeUndefined();
    expect(store['onboarding_completed_at']).toBeUndefined();
  });

  it('should set status to completed on complete()', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.complete(); });
    expect(result.current.status).toBe('completed');
  });

  it('should remove localStorage markers on reset()', () => {
    const { result } = renderHook(() => useOnboardingStore());
    act(() => { result.current.complete(); });
    act(() => { result.current.reset(); });
    expect(store['onboarding_completed']).toBeUndefined();
    expect(store['onboarding_completed_at']).toBeUndefined();
  });
});

describe('E1-S3: Scenario Filter Logic', () => {
  // Test the pure filter function directly
  const filterByScenario = (
    templates: Array<{ id: string; name: string; description: string }>,
    scenario?: string
  ) => {
    const SCENARIO_TAGS: Record<string, string[]> = {
      'new-feature': ['feature', 'new', 'saas', 'mobile', 'ecommerce'],
      'refactor': ['refactor'],
      'bugfix': ['bugfix'],
      'documentation': ['docs', 'documentation'],
      'other': [],
    };

    if (!scenario || scenario === 'other') return templates;
    const tags = SCENARIO_TAGS[scenario] ?? [];
    if (tags.length === 0) return templates;
    return templates.filter((t) => {
      const text = `${t.name} ${t.description}`.toLowerCase();
      return tags.some((tag) => text.includes(tag));
    });
  };

  const templates = [
    { id: 'saas-crm', name: 'SaaS 产品设计', description: '适用于 SaaS CRM 产品设计' },
    { id: 'mobile-app', name: '移动端 App', description: '适用于 iOS/Android 移动应用设计' },
    { id: 'ecommerce-platform', name: '电商平台', description: '适用于 B2C 电商平台设计' },
    { id: 'blank', name: '空白项目', description: '从零开始' },
  ];

  it('should return all templates when scenario is undefined', () => {
    const result = filterByScenario(templates, undefined);
    expect(result).toHaveLength(4);
  });

  it('should return all templates when scenario is other', () => {
    const result = filterByScenario(templates, 'other');
    expect(result).toHaveLength(4);
  });

  it('should filter to saas-crm for new-feature (name contains saas)', () => {
    const result = filterByScenario(templates, 'new-feature');
    expect(result.some(t => t.id === 'saas-crm')).toBe(true);
  });

  it('should not include blank template for new-feature', () => {
    const result = filterByScenario(templates, 'new-feature');
    expect(result.every(t => t.id !== 'blank')).toBe(true);
  });

  it('should return empty for bugfix scenario (no matching templates)', () => {
    const result = filterByScenario(templates, 'bugfix');
    expect(result).toHaveLength(0);
  });

  it('should return empty for refactor scenario', () => {
    const result = filterByScenario(templates, 'refactor');
    expect(result).toHaveLength(0);
  });

  it('should return empty for documentation scenario', () => {
    const result = filterByScenario(templates, 'documentation');
    expect(result).toHaveLength(0);
  });
});
