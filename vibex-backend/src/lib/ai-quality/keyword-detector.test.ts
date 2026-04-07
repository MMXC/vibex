import { detectVagueInput } from './keyword-detector';

describe('detectVagueInput', () => {
  test('正常需求描述 → 不模糊', () => {
    const result = detectVagueInput('我要做一个课程管理网站，支持教师创建课程、学生选课、作业提交');
    expect(result.isVague).toBe(false);
  });

  test('"我想做个" → 模糊', () => {
    const result = detectVagueInput('我想做个网站');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('需求过于笼统（想做xxx）');
    expect(result.suggestions).toBeDefined();
    expect(result.suggestions!.length).toBeGreaterThan(0);
  });

  test('"帮我做" → 模糊', () => {
    const result = detectVagueInput('帮我做');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('缺少具体功能描述');
  });

  test('"登录" → 模糊', () => {
    const result = detectVagueInput('登录');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('缺少上下文（谁登录？从哪里登录？）');
  });

  test('过短输入 → 模糊', () => {
    const result = detectVagueInput('好的');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('输入过短，缺少详细描述');
  });

  test('English "i want a" → 模糊', () => {
    const result = detectVagueInput('I want a');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('Vague: specify which type of application');
  });

  test('正常英文描述 → 不模糊', () => {
    const result = detectVagueInput('Build a user authentication system with email and OAuth support');
    expect(result.isVague).toBe(false);
  });

  test('包含具体功能的描述 → 不模糊', () => {
    const result = detectVagueInput('我要做一个用户管理系统，包括用户注册、登录、个人资料编辑');
    expect(result.isVague).toBe(false);
  });

  test('"做个网站" → 模糊', () => {
    const result = detectVagueInput('做个网站');
    expect(result.isVague).toBe(true);
  });

  test('"simple app" → 模糊', () => {
    const result = detectVagueInput('simple app');
    expect(result.isVague).toBe(true);
    expect(result.reason).toBe('What should the app do?');
  });
});
