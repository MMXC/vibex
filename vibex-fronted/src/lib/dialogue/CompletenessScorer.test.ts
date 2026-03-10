/**
 * Completeness Scorer Tests
 */

import { scoreCompleteness, ScoringResult } from './CompletenessScorer';

describe('CompletenessScorer', () => {
  describe('scoreCompleteness', () => {
    it('should return base score for empty text', () => {
      const result = scoreCompleteness('');
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });

    it('should score project type keywords', () => {
      const result = scoreCompleteness('这是一个用户管理系统');
      expect(result.criteria.find(c => c.name === 'project_type')?.score).toBeGreaterThan(0);
    });

    it('should score core features keywords', () => {
      const result = scoreCompleteness('需要实现用户管理功能');
      expect(result.criteria.find(c => c.name === 'core_features')?.score).toBeGreaterThan(0);
    });

    it('should score target users keywords', () => {
      const result = scoreCompleteness('目标用户是会员和客户');
      expect(result.criteria.find(c => c.name === 'target_users')?.score).toBeGreaterThan(0);
    });

    it('should score technical requirements keywords', () => {
      const result = scoreCompleteness('使用React框架和MySQL数据库');
      expect(result.criteria.find(c => c.name === 'technical_requirements')?.score).toBeGreaterThan(0);
    });

    it('should score UI requirements keywords', () => {
      const result = scoreCompleteness('需要响应式界面设计');
      expect(result.criteria.find(c => c.name === 'ui_requirements')?.score).toBeGreaterThan(0);
    });

    it('should score business requirements keywords', () => {
      const result = scoreCompleteness('包含订单管理和支付流程');
      expect(result.criteria.find(c => c.name === 'business_requirements')?.score).toBeGreaterThan(0);
    });

    it('should handle Chinese keywords case-insensitively', () => {
      const result1 = scoreCompleteness('管理系统');
      const result2 = scoreCompleteness('管理系統');
      expect(result1.criteria.find(c => c.name === 'project_type')?.score)
        .toBe(result2.criteria.find(c => c.name === 'project_type')?.score);
    });

    it('should return suggestions for missing criteria', () => {
      const result = scoreCompleteness('这是一个测试');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should cap total score at 100', () => {
      const longText = `
        这是一个管理系统平台
        包含用户管理功能
        目标用户是会员和客户
        使用React框架和MySQL数据库
        需要响应式界面设计
        包含订单管理和支付流程
        需要高质量测试和维护
      `;
      const result = scoreCompleteness(longText);
      expect(result.totalScore).toBeLessThanOrEqual(100);
    });
  });

  describe('ScoringResult', () => {
    it('should have required properties', () => {
      const result: ScoringResult = {
        totalScore: 75,
        criteria: [],
        suggestions: [],
      };
      expect(result.totalScore).toBe(75);
      expect(result.criteria).toBeInstanceOf(Array);
      expect(result.suggestions).toBeInstanceOf(Array);
    });
  });
});
