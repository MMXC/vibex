/**
 * Completeness Scorer Tests
 */

import { scoreCompleteness } from './CompletenessScorer';

describe('CompletenessScorer', () => {
  it('should return score for empty text', () => {
    const result = scoreCompleteness('');
    expect(result.totalScore).toBeGreaterThanOrEqual(0);
  });

  it('should score project type', () => {
    const result = scoreCompleteness('管理系统');
    expect(result.totalScore).toBeGreaterThan(0);
  });

  it('should return suggestions', () => {
    const result = scoreCompleteness('测试');
    expect(result.suggestions).toBeInstanceOf(Array);
  });

  it('should cap score at 100', () => {
    const long = '管理系统 用户 订单 功能 界面 设计 技术 框架 数据库 API'.repeat(5);
    const result = scoreCompleteness(long);
    expect(result.totalScore).toBeLessThanOrEqual(100);
  });
});
