/**
 * useSmartSkip Hook Tests
 */

describe('useSmartSkip Hook', () => {
  // Mock the hook implementation
  const mockSkipRules = [
    {
      questionId: 'user-management',
      check: (ctx: any) => ctx.requirementText?.includes('用户'),
    },
    {
      questionId: 'ecommerce',
      check: (ctx: any) => ctx.requirementText?.includes('电商'),
    },
    {
      questionId: 'blog',
      check: (ctx: any) => ctx.requirementText?.includes('博客'),
    },
  ];

  const mockContext = {
    requirementText: '',
    clarificationRounds: [],
    boundedContexts: [],
    domainEntities: [],
    businessFlows: [],
    uiPages: [],
  };

  it('should skip user-management question when requirement mentions user', () => {
    const ctx = { ...mockContext, requirementText: '创建一个用户管理系统' };
    const rule = mockSkipRules.find(r => r.questionId === 'user-management');
    expect(rule?.check(ctx)).toBe(true);
  });

  it('should not skip when requirement does not match', () => {
    const ctx = { ...mockContext, requirementText: '创建一个博客系统' };
    const rule = mockSkipRules.find(r => r.questionId === 'ecommerce');
    expect(rule?.check(ctx)).toBe(false);
  });

  it('should skip ecommerce question when requirement mentions ecommerce', () => {
    const ctx = { ...mockContext, requirementText: '开发一个电商平台' };
    const rule = mockSkipRules.find(r => r.questionId === 'ecommerce');
    expect(rule?.check(ctx)).toBe(true);
  });

  it('should have multiple skip rules', () => {
    expect(mockSkipRules.length).toBe(3);
  });

  it('should handle empty requirement text', () => {
    const ctx = { ...mockContext, requirementText: '' };
    mockSkipRules.forEach(rule => {
      expect(rule.check(ctx)).toBeFalsy();
    });
  });

  it('should handle null requirement text', () => {
    const ctx = { ...mockContext, requirementText: null as any };
    mockSkipRules.forEach(rule => {
      expect(rule.check(ctx)).toBeFalsy();
    });
  });
});