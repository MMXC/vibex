# Epic 6: 技术债务清理与新功能单元测试

**Epic ID**: E6
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P2
**工时**: 1.25h
**关联 Features**: F8, F9

---

## 1. Story: E6-S1 — 修复 canvas-e2e project testDir 路径

### 上下文

根 `vibex-fronted/playwright.config.ts` 第37行定义了 `canvas-e2e` project：
```ts
{ name: 'canvas-e2e', testDir: './e2e', use: {...devices['Desktop Chrome']} }
```
`./e2e` 目录不存在（实际位置是 `./tests/e2e/`），导致 canvas-e2e project 无法找到任何测试，形同虚设。

### 修改内容

**文件**: `vibex-fronted/playwright.config.ts`

```ts
// 修改前（第37行）:
{ name: 'canvas-e2e', testDir: './e2e', use: {...devices['Desktop Chrome']} }

// 修改后:
{ name: 'canvas-e2e', testDir: './tests/e2e', use: {...devices['Desktop Chrome']} }
```

### 验收标准

```ts
// 验收 1: canvas-e2e project 能找到 >= 1 个测试
const listResult = execSync(
  'npx playwright test --project=canvas-e2e --list 2>&1',
  { cwd: 'vibex-fronted' }
).toString();
const testCount = (listResult.match(/·/g) || []).length;
expect(testCount).toBeGreaterThan(0);

// 验收 2: canvas-e2e project 能正常运行
const testResult = execSync(
  'npx playwright test --project=canvas-e2e --reporter=line 2>&1 | tail -3',
  { cwd: 'vibex-fronted', timeout: 120000 }
).toString();
expect(testResult).not.toContain('Error');
expect(testResult).not.toContain('no tests found');
```

---

## 2. Story: E6-S2 — ai-service JSON 解析单元测试

### 上下文

dev/20260411 提案增强 `ai-service.ts` 的 `parseJSONWithRetry` 函数，添加 markdown JSON 提取能力。该增强**没有单元测试验证边界条件**。

### 测试文件位置

`vibex-backend/src/services/__tests__/ai-service.test.ts`

### 依赖分析

**如果** `ai-service.ts` 导出 `parseJSONWithRetry`（或可独立测试的 parse 函数），创建独立单元测试：

```ts
// 文件: vibex-backend/src/services/__tests__/ai-service.test.ts
import { describe, it, expect } from 'vitest';
// 根据实际导出调整
import { parseJSONWithRetry, extractJSONFromMarkdown } from '../ai-service';

describe('parseJSONWithRetry', () => {
  it('should extract JSON from markdown code block', () => {
    const input = '```json\n{"flowId": "123"}\n```';
    const result = parseJSONWithRetry(input);
    expect(result).toEqual({ flowId: '123' });
  });

  it('should handle JSON with extra whitespace', () => {
    const input = '   \n  {"ok": true}  \n  ';
    const result = parseJSONWithRetry(input);
    expect(result).toEqual({ ok: true });
  });

  it('should handle plain JSON without markdown', () => {
    const input = '{"key": "value"}';
    const result = parseJSONWithRetry(input);
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle empty/whitespace-only input gracefully', () => {
    const input = '   \n  \n  ';
    expect(() => parseJSONWithRetry(input)).toThrow();
  });

  it('should handle very long JSON response', () => {
    const longData = { elements: Array(1000).fill({ id: 'item', type: 'box' }) };
    const input = JSON.stringify(longData);
    const result = parseJSONWithRetry(input);
    expect(result.elements).toHaveLength(1000);
  });

  it('should extract JSON when surrounded by text', () => {
    const input = 'Here is the JSON you requested:\n```json\n{"data": "test"}\n```\nLet me know if you need anything else.';
    const result = parseJSONWithRetry(input);
    expect(result).toEqual({ data: 'test' });
  });

  it('should handle JSON with special characters', () => {
    const input = '{"message": "Hello \\"World\\"!"}';
    const result = parseJSONWithRetry(input);
    expect(result.message).toBe('Hello "World"!');
  });
});
```

**如果** `parseJSONWithRetry` 是内部函数（不可直接 import），使用黑盒 API 测试：

```ts
// 通过 AI service 的公开方法间接测试
import { AIService } from '../ai-service';

describe('AIService.parseJSONWithRetry (via public API)', () => {
  let service: AIService;

  beforeEach(() => {
    service = new AIService({ /* mock config */ });
  });

  it('should extract JSON from markdown in AI response', async () => {
    // Mock HTTP response that includes markdown JSON
    nock('https://api.ai-provider.com')
      .post('/generate')
      .reply(200, {
        choices: [{
          message: {
            content: '```json\n{"flowId": "test-uuid"}\n```'
          }
        }]
      });

    const result = await service.generate({ prompt: 'test' });
    expect(result).toHaveProperty('flowId');
    expect(result.flowId).toBe('test-uuid');
  });
});
```

### 验收标准

```ts
// 验收 1: 测试文件存在
const testExists = existsSync('vibex-backend/src/services/__tests__/ai-service.test.ts');
expect(testExists).toBe(true);

// 验收 2: Vitest 能发现并运行测试
const vitestResult = execSync(
  'cd vibex-backend && npx vitest run src/services/__tests__/ai-service.test.ts 2>&1',
  { timeout: 30000 }
).toString();
expect(vitestResult).not.toContain('FAIL');
expect(vitestResult).toContain('passed');

// 验收 3: 覆盖所有 3 个边界条件（markdown、whitespace、truncation）
const specContent = readFileSync(
  'vibex-backend/src/services/__tests__/ai-service.test.ts',
  'utf-8'
);
expect(specContent).toContain('markdown'); // markdown 提取
expect(specContent).toContain('whitespace'); // whitespace 处理
expect(specContent).toContain('long'); // 超长响应
```

---

## 3. 验收标准汇总

| Story | 标准 | 验证方式 |
|-------|------|---------|
| E6-S1 | canvas-e2e project 找到 >= 1 个测试 | `npx playwright test --project=canvas-e2e --list` |
| E6-S1 | canvas-e2e 测试能运行（无 Error） | `npx playwright test --project=canvas-e2e` |
| E6-S2 | ai-service.test.ts 存在 | `test -f ai-service.test.ts` |
| E6-S2 | Vitest 运行通过 | `npx vitest run ai-service.test.ts` |
| E6-S2 | 覆盖 3 个边界条件 | `grep` markdown + whitespace + long |

---

## 4. 注意事项

- **E6-S1**: 如果 canvas-e2e project 可以完全合并到默认 project，可以直接删除该 project 配置（更简单）
- **E6-S2**: ai-service 测试可能需要 mock HTTP 响应（使用 `nock` 或 Vitest 的 `httpMock`），确保测试不依赖真实 AI API
- **Vitest 配置**: 确认 `vibex-backend/vitest.config.ts` 包含 `src/services/__tests__/` 的 testMatch 模式
