// @ts-nocheck
import {
  isNameFiltered,
  filterInvalidContexts,
  validateCoreRatio,
} from './bounded-contexts-filter';

describe('isNameFiltered', () => {
  it('C1: should filter names containing forbidden words (系统/模块/功能/平台)', () => {
    expect(isNameFiltered('数据模块')).toBe(true);
    expect(isNameFiltered('权限功能')).toBe(true);
    expect(isNameFiltered('测试平台')).toBe(true);
    expect(isNameFiltered('订单系统')).toBe(true);
  });

  it('C1: should filter combined generic + forbidden suffix', () => {
    // "患者管理系统" contains "系统" — not a real bounded context
    expect(isNameFiltered('患者管理系统')).toBe(true);
    expect(isNameFiltered('医生系统')).toBe(true);
  });

  it('C2: should filter names that are too short (< 2 chars)', () => {
    expect(isNameFiltered('A')).toBe(true);
    expect(isNameFiltered('艾')).toBe(true);
  });

  it('C2: should filter names that are too long (> 12 chars)', () => {
    // 13 chars: exceeds maxNameLength=12
    expect(isNameFiltered('患者管理系统集成模块啊啊啊')).toBe(true);
  });

  it('C2: maxNameLength=12 boundary tests', () => {
    expect(isNameFiltered('在线问诊图文')).toBe(false); // 6 chars, valid
    expect(isNameFiltered('预约挂号问诊处方啊啊啊')).toBe(false); // 11 chars = valid
    expect(isNameFiltered('预约挂号问诊处方啊啊啊加')).toBe(false); // 12 chars = at boundary, valid (≤12)
    expect(isNameFiltered('患者管理系统集成模块啊啊啊')).toBe(true); // 13 chars > 12 = too long
  });

  it('C3: names with "管理" should be filtered (generic suffix)', () => {
    // "管理" is a generic suffix — filtered to enforce meaningful bounded context names
    expect(isNameFiltered('患者管理')).toBe(true);
    expect(isNameFiltered('订单管理')).toBe(true);
    expect(isNameFiltered('医生管理')).toBe(true);
    expect(isNameFiltered('问诊管理')).toBe(true);
    // "认证授权" and "通知推送" do not contain "管理"
    expect(isNameFiltered('认证授权')).toBe(false);
    expect(isNameFiltered('通知推送')).toBe(false);
  });

  it('C3: combined "管理" + generic suffix still filtered', () => {
    // "患者管理系统" has "系统" suffix — not a real bounded context
    expect(isNameFiltered('患者管理系统')).toBe(true);
    expect(isNameFiltered('患者管理模块')).toBe(true);
    expect(isNameFiltered('患者管理平台')).toBe(true);
  });

  it('generic valid names should not be filtered', () => {
    expect(isNameFiltered('认证授权')).toBe(false);
    expect(isNameFiltered('通知推送')).toBe(false);
    expect(isNameFiltered('日志')).toBe(false);
    expect(isNameFiltered('患者档案')).toBe(false);
  });
});

describe('filterInvalidContexts', () => {
  it('should filter out invalid contexts', () => {
    const input = [
      { name: '患者档案', type: 'core' as const, description: '有效', ubiquitousLanguage: [] },
      { name: '患者管理系统', type: 'core' as const, description: '无效-含"系统"', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic' as const, description: '有效', ubiquitousLanguage: [] },
      { name: '数据模块', type: 'supporting' as const, description: '无效-含"模块"', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(2);
    expect(result.map(c => c.name)).toEqual(['患者档案', '认证授权']);
  });

  it('should NOT filter legitimate DDD names', () => {
    const input = [
      { name: '患者档案', type: 'core' as const, description: '有效', ubiquitousLanguage: [] },
      { name: '订单处理', type: 'core' as const, description: '有效', ubiquitousLanguage: [] },
      { name: '问诊记录', type: 'core' as const, description: '有效', ubiquitousLanguage: [] },
      { name: '患者管理系统', type: 'core' as const, description: '无效-含"系统"', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(3);
    expect(result.map(c => c.name)).toEqual(['患者档案', '订单处理', '问诊记录']);
  });

  it('should return empty array for all invalid inputs', () => {
    const input = [
      { name: '管理系统', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '测试系统', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = filterInvalidContexts(input);
    expect(result.length).toBe(0);
  });

  it('should return original array for all valid inputs', () => {
    const input = [
      { name: '患者档案', type: 'core' as const, description: '', ubiquitousLanguage: [] },
      { name: '认证授权', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
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
  });

  it('should fail when core ratio is 0% (below minCoreRatio=0.4)', () => {
    const contexts = [
      { name: '认证授权', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
      { name: '通知推送', type: 'generic' as const, description: '', ubiquitousLanguage: [] },
    ];
    const result = validateCoreRatio(contexts);
    // 0% core ratio is below minCoreRatio=0.4
    expect(result.valid).toBe(false);
  });

  it('empty contexts is valid', () => {
    const result = validateCoreRatio([]);
    expect(result.valid).toBe(true);
  });
});
