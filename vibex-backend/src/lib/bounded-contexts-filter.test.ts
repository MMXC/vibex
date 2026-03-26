import {
  isNameFiltered,
  filterInvalidContexts,
  validateCoreRatio,
} from './bounded-contexts-filter';

describe('isNameFiltered', () => {
  it('should filter names containing "管理"', () => {
    expect(isNameFiltered('患者管理系统')).toBe(true);
    expect(isNameFiltered('订单管理')).toBe(true);
    expect(isNameFiltered('患者管理')).toBe(true); // contains "管理"
  });

  it('should filter names containing forbidden words', () => {
    expect(isNameFiltered('数据模块')).toBe(true);
    expect(isNameFiltered('权限功能')).toBe(true);
    expect(isNameFiltered('测试平台')).toBe(true);
  });

  it('should filter names that are too short', () => {
    expect(isNameFiltered('A')).toBe(true); // length < 2
  });

  it('should filter names that are too long', () => {
    expect(isNameFiltered('患者管理系统集成模块')).toBe(true); // length > 10
  });

  it('should allow valid names', () => {
    expect(isNameFiltered('患者档案')).toBe(false);
    expect(isNameFiltered('问诊')).toBe(false);
    expect(isNameFiltered('医生')).toBe(false);
    expect(isNameFiltered('认证授权')).toBe(false);
  });
});

describe('filterInvalidContexts', () => {
  it('should filter out invalid contexts', () => {
    const input = [
      { name: '患者档案', type: 'core', description: '有效', ubiquitousLanguage: [] },
      { name: '患者管理系统', type: 'core', description: '无效-管理', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic', description: '有效', ubiquitousLanguage: [] },
      { name: '数据模块', type: 'supporting', description: '无效-模块', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(2);
    expect(result.map(c => c.name)).toEqual(['患者档案', '认证授权']);
  });

  it('should return empty array for all invalid inputs', () => {
    const input = [
      { name: '管理系统', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: '测试系统', type: 'generic', description: '', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(0);
  });

  it('should return original array for all valid inputs', () => {
    const input = [
      { name: '患者档案', type: 'core', description: '', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic', description: '', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(2);
  });
});

describe('validateCoreRatio', () => {
  it('should pass when core ratio is 50%', () => {
    const contexts = [
      { name: '患者档案', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '患者认证', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
      { name: '通知推送', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBe(0.5);
  });

  it('should pass when core ratio is within 40%-70%', () => {
    const contexts = [
      { name: '患者档案', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '医生主页', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '问诊记录', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
      { name: '通知推送', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBeCloseTo(0.6);
  });

  it('should fail when core ratio is 100%', () => {
    const contexts = [
      { name: '患者档案', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '医生主页', type: 'core' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不在');
    expect(result.message).toContain('40%');
    expect(result.message).toContain('70%');
  });

  it('should fail when core ratio is 0%', () => {
    const contexts = [
      { name: '认证授权', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
      { name: '微信支付', type: 'external' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('不在');
  });

  it('should pass for empty array', () => {
    const result = validateCoreRatio([]);
    expect(result.valid).toBe(true);
    expect(result.ratio).toBe(0);
  });
});
