/**
 * P1-T5 & P1-T6: Type Utility Functions — Unit Tests
 *
 * 覆盖 deriveDomainType() 和 deriveStepType() 的边界条件。
 */
// @ts-nocheck


import {
  deriveDomainType,
  deriveStepType,
  FLOW_STEP_TYPE_CONFIG,
  DOMAIN_TYPE_CONFIG,
} from './types';
import type { BoundedContextNode, FlowStep } from './types';

describe('deriveDomainType', () => {
  const cases: Array<{ name: string; expected: BoundedContextNode['type'] }> = [
    // Core domain — 用户/账户相关
    { name: '用户管理', expected: 'core' },
    { name: 'User Management', expected: 'core' },
    { name: '账户系统', expected: 'core' },
    { name: '会员中心', expected: 'core' },
    // Generic domain — 日志/审计/配置相关
    { name: '操作日志', expected: 'generic' },
    { name: '审计日志', expected: 'generic' },
    { name: 'System Log', expected: 'generic' },
    { name: 'Audit Trail', expected: 'generic' },
    { name: '系统配置', expected: 'generic' },
    { name: 'Generic Service', expected: 'generic' },
    // External domain — 集成/第三方相关
    { name: '第三方支付集成', expected: 'external' },
    { name: 'External Gateway', expected: 'external' },
    { name: 'Webhook Handler', expected: 'external' },
    // Default — supporting
    { name: '订单管理', expected: 'supporting' },
    { name: '预约挂号', expected: 'supporting' },
    { name: '通知中心', expected: 'supporting' },
    { name: 'Product Service', expected: 'supporting' },
    { name: 'Inventory System', expected: 'supporting' },
    // Case-insensitive
    { name: 'USER MANAGEMENT', expected: 'core' },
    { name: 'PRODUCT SERVICE', expected: 'supporting' },
  ];

  it.each(cases)('"$name" → $expected', ({ name, expected }) => {
    expect(deriveDomainType(name)).toBe(expected);
  });

  it('should default to supporting for unknown names', () => {
    expect(deriveDomainType('物流管理')).toBe('supporting');
    expect(deriveDomainType('数据分析')).toBe('supporting');
  });
});

describe('deriveStepType', () => {
  const cases: Array<{ name: string; expected: FlowStep['type'] }> = [
    // Branch type
    { name: '条件判断', expected: 'branch' },
    { name: '判断用户权限', expected: 'branch' },
    { name: 'If user has access', expected: 'branch' },
    { name: '条件分支', expected: 'branch' },
    { name: '分支决策', expected: 'branch' },
    { name: 'Switch Case', expected: 'branch' },
    // Loop type
    { name: '循环处理', expected: 'loop' },
    { name: '遍历订单', expected: 'loop' },
    { name: '迭代计算', expected: 'loop' },
    { name: 'Retry Failed', expected: 'loop' },
    { name: '重试请求', expected: 'loop' },
    { name: 'Loop Through Items', expected: 'loop' },
    { name: 'Repeat Process', expected: 'loop' },
    // Default — normal
    { name: '创建订单', expected: 'normal' },
    { name: '发送通知', expected: 'normal' },
    { name: '确认支付', expected: 'normal' },
    { name: 'Update Status', expected: 'normal' },
  ];

  it.each(cases)('"$name" → $expected', ({ name, expected }) => {
    expect(deriveStepType(name)).toBe(expected);
  });
});

describe('FLOW_STEP_TYPE_CONFIG', () => {
  it('should have all three step types defined', () => {
    expect(FLOW_STEP_TYPE_CONFIG).toHaveProperty('normal');
    expect(FLOW_STEP_TYPE_CONFIG).toHaveProperty('branch');
    expect(FLOW_STEP_TYPE_CONFIG).toHaveProperty('loop');
  });

  it('should have color and bgColor for each type', () => {
    for (const config of Object.values(FLOW_STEP_TYPE_CONFIG)) {
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.bgColor).toMatch(/^rgba?\(/);
    }
  });

  it('should have labels for each type', () => {
    expect(FLOW_STEP_TYPE_CONFIG.normal.label).toBe('普通');
    expect(FLOW_STEP_TYPE_CONFIG.branch.label).toBe('分支');
    expect(FLOW_STEP_TYPE_CONFIG.loop.label).toBe('循环');
  });
});

describe('DOMAIN_TYPE_CONFIG', () => {
  it('should have all four domain types defined', () => {
    expect(DOMAIN_TYPE_CONFIG).toHaveProperty('core');
    expect(DOMAIN_TYPE_CONFIG).toHaveProperty('supporting');
    expect(DOMAIN_TYPE_CONFIG).toHaveProperty('generic');
    expect(DOMAIN_TYPE_CONFIG).toHaveProperty('external');
  });

  it('should have color and bgColor for each type', () => {
    for (const config of Object.values(DOMAIN_TYPE_CONFIG)) {
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.bgColor).toMatch(/^rgba?\(/);
    }
  });

  it('should have correct labels', () => {
    expect(DOMAIN_TYPE_CONFIG.core.label).toBe('核心域');
    expect(DOMAIN_TYPE_CONFIG.supporting.label).toBe('支撑域');
    expect(DOMAIN_TYPE_CONFIG.generic.label).toBe('通用域');
    expect(DOMAIN_TYPE_CONFIG.external.label).toBe('外部域');
  });
});
