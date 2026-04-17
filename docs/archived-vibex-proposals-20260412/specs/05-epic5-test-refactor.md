# Spec: Epic 5 — 测试重构优化

**Epic**: E5  
**PRD 引用**: `prd.md` § Epic 5  
**优先级**: P1  
**目标 Sprint**: Sprint 2（04/15-04/18）  
**工时**: 6h（S5.1: 4h, S5.2: 2h, S5.3: 1h）  
**前置依赖**: E0 完成（Auth Mock 修复 + TypeScript 编译通过）  
**状态**: 待开发

---

## 概述

测试稳定性是 CI 门禁有效性的基石。本 Epic 重构 3 个关键测试问题：
1. **S5.1**: waitForTimeout 从 87 处减少到 ≤10 处
2. **S5.2**: flowId E2E 测试覆盖
3. **S5.3**: JsonTreeModal 单元测试覆盖率 >80%

---

## 详细设计

### S5.1 — waitForTimeout 重构

#### F5.1: waitForTimeout 消除计划

**问题描述**: E2E 测试中大量使用 `waitForTimeout(hardcoded_ms)` 做等待，导致：
- 测试运行时间过长（累计等待浪费大量时间）
- 测试结果不稳定（等待时间与实际加载不匹配）

**当前分布**（87 处）:
```
apps/frontend/playwright/
├── tests/
│   ├── chat.spec.ts      ~30 处
│   ├── canvas.spec.ts    ~25 处
│   ├── settings.spec.ts  ~20 处
│   └── auth.spec.ts      ~12 处
```

**重构策略**:

| 策略 | 适用场景 | 替换方案 |
|------|----------|----------|
| 显式断言等待 | 等待元素出现 | `await expect(locator).toBeVisible()` |
| 网络空闲等待 | 等待 API 完成 | `await page.waitForLoadState('networkidle')` |
| 函数轮询 | 等待条件满足 | `await page.waitForFunction(fn, timeout)` |
| 固定超时兜底 | 极特殊情况 | `waitForTimeout(500)`（仅保留紧急兜底） |

**重构脚本**:
```typescript
// scripts/refactor/wait-for-timeout-migrator.ts
import fs from 'fs';
import path from 'path';

const HARDCODED_TIMEOUT_PATTERN = /waitForTimeout\((\d+)\)/g;
const ALLOWED_TIMEOUTS = [500]; // 允许保留的兜底超时

export function migrateWaitForTimeout(filePath: string): { replaced: number; remaining: number[] } {
  const content = fs.readFileSync(filePath, 'utf-8');
  let replaced = 0;
  const remaining: number[] = [];

  const newContent = content.replace(HARDCODED_TIMEOUT_PATTERN, (_, ms) => {
    const timeout = parseInt(ms);
    if (ALLOWED_TIMEOUTS.includes(timeout)) {
      remaining.push(timeout);
      return _; // 保留允许的兜底
    }
    replaced++;
    // 替换为建议的等待模式（需人工审查后取消注释）
    // return `// TODO: replace with explicit wait - was waitForTimeout(${ms})`;
    return `await page.waitForLoadState('domcontentloaded'); // was ${ms}ms`;
  });

  fs.writeFileSync(filePath, newContent);
  return { replaced, remaining };
}

export function scanAllTestFiles(dir: string): Record<string, { replaced: number; remaining: number[] }> {
  const results: Record<string, { replaced: number; remaining: number[] }> = {};
  const files = execSync(`find ${dir} -name "*.spec.ts" -o -name "*.test.ts"`)
    .trim().split('\n').filter(Boolean);

  files.forEach(file => {
    const result = migrateWaitForTimeout(file);
    results[file] = result;
  });

  return results;
}
```

**执行步骤**:
1. 扫描所有 `waitForTimeout` 调用
2. 分类：可替换 vs 需保留
3. 逐文件重构（保留 git 历史）
4. 验证测试仍能通过

### S5.2 — flowId E2E 测试

#### F5.2: flowId 真实场景覆盖

**问题描述**: 当前 E2E 测试缺少 flowId 相关的端到端场景覆盖。

**测试用例**:
```typescript
// apps/frontend/playwright/tests/flow-id.spec.ts
import { test, expect } from '@playwright/test';

test.describe('flowId E2E', () => {
  test('creates new flow and generates flowId', async ({ page }) => {
    await page.goto('/canvas');
    await page.click('[data-testid="new-flow"]');
    await page.waitForURL(/\/canvas\/flow\/[a-zA-Z0-9-_]+/);
    const flowId = extractFlowId(page.url());
    expect(flowId).toMatch(/^flow_[a-zA-Z0-9]{8,}$/);
  });

  test('flowId persists across page reload', async ({ page }) => {
    await page.goto('/canvas/flow/flow_test_001');
    await page.reload();
    expect(page.url()).toContain('flow_test_001');
  });

  test('flowId is included in API requests', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/chat')) {
        const body = req.postData();
        if (body) {
          const parsed = JSON.parse(body);
          requests.push(parsed.flowId);
        }
      }
    });

    await page.goto('/canvas/flow/flow_e2e_001');
    await page.fill('[data-testid="chat-input"]', 'Hello');
    await page.click('[data-testid="send-button"]');
    await page.waitForTimeout(2000);

    expect(requests.length).toBeGreaterThan(0);
    requests.forEach(id => {
      expect(id).toBe('flow_e2e_001');
    });
  });

  test('invalid flowId shows error state', async ({ page }) => {
    await page.goto('/canvas/flow/invalid-id');
    await expect(page.locator('.error-state')).toBeVisible();
  });

  test('flowId is displayed in canvas header', async ({ page }) => {
    await page.goto('/canvas/flow/flow_header_001');
    const header = page.locator('[data-testid="flow-header-id"]');
    await expect(header).toContainText('flow_header_001');
  });
});
```

### S5.3 — JsonTreeModal 单元测试

#### F5.3: JsonTreeModal 测试覆盖率 >80%

**当前覆盖率**: 不足 40%（需要补充关键路径测试）

**补充测试用例**:
```typescript
// packages/components/__tests__/JsonTreeModal.test.tsx
describe('JsonTreeModal', () => {
  describe('rendering', () => {
    it('renders empty tree with empty data', () => {
      render(<JsonTreeModal data={{}} open={true} onClose={jest.fn()} />);
      expect(screen.getByText('空数据')).toBeInTheDocument();
    });

    it('renders nested object tree correctly', () => {
      const data = {
        user: { name: 'test', roles: ['admin', 'user'] },
        metadata: { created: '2026-04-01' },
      };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('name')).toBeInTheDocument();
      expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('renders arrays with index keys', () => {
      const data = { items: [{ id: 1 }, { id: 2 }] };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      expect(screen.getByText('items')).toBeInTheDocument();
      expect(screen.getAllByText('id').length).toBeGreaterThanOrEqual(2);
    });

    it('renders boolean and null values', () => {
      const data = { active: true, deleted: null };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      expect(screen.getByText('active')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });

    it('calls onClose when modal is closed', () => {
      const onClose = jest.fn();
      render(<JsonTreeModal data={{}} open={true} onClose={onClose} />);
      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not render when open is false', () => {
      const { container } = render(<JsonTreeModal data={{ key: 'val' }} open={false} onClose={jest.fn()} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('tree expansion', () => {
    it('collapses deeply nested nodes by default', () => {
      const data = { level1: { level2: { level3: 'deep value' } } };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      expect(screen.queryByText('deep value')).not.toBeInTheDocument();
    });

    it('expands node on click', () => {
      const data = { level1: { level2: 'value' } };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      const level1 = screen.getByText('level1');
      fireEvent.click(level1);
      expect(screen.getByText('level2')).toBeInTheDocument();
    });
  });

  describe('copy functionality', () => {
    it('copy button copies JSON to clipboard', async () => {
      Object.assign(navigator, { clipboard: { writeText: jest.fn() } });
      const data = { test: 'value' };
      render(<JsonTreeModal data={data} open={true} onClose={jest.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /copy/i }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(JSON.stringify(data, null, 2));
    });
  });

  describe('coverage verification', () => {
    it('achieves >80% line coverage', () => {
      const result = execSync(
        'npx nyc --reporter=text npm test -- --testPathPattern="JsonTreeModal" 2>&1',
        { cwd: '/root/.openclaw/vibex', encoding: 'utf-8' }
      );
      const coverageMatch = result.match(/All files[^>]*>\s*(\d+\.?\d*)%/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
      expect(coverage).toBeGreaterThan(80);
    });
  });
});
```

---

## API/接口

本 Epic 不涉及 API 接口变更，纯测试代码重构。

---

## 实现步骤

### Phase 1: waitForTimeout 重构（4h）— Sprint 2

1. **扫描统计**
   ```bash
   grep -rn "waitForTimeout" apps/frontend/playwright --include="*.ts" | wc -l
   ```

2. **分类处理**
   - 快速审查每处使用场景
   - 标记：替换 / 保留

3. **批量替换**
   - 使用迁移脚本
   - 人工审查生成的待替换代码

4. **回归测试**
   - 全量 E2E 测试通过验证

### Phase 2: flowId E2E（2h）— Sprint 2

1. **创建 flow-id.spec.ts**
2. **实现 5 个测试用例**
3. **在 CI 中启用 flowId E2E 测试**

### Phase 3: JsonTreeModal UT（1h）— Sprint 2

1. **补充 10+ 单元测试用例**
2. **运行覆盖率检查**
3. **补充至 >80%**

---

## 验收测试

### AC5.1 — waitForTimeout 重构

```typescript
//验收测试: waitForTimeout从87处减少到≤10处
describe('waitForTimeout Refactor (AC5.1)', () => {
  it('waitForTimeout count reduced to ≤ 10', () => {
    const result = execSync(
      'grep -rn "waitForTimeout" apps/frontend/playwright --include="*.ts" | wc -l',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    const count = parseInt(result.trim());
    expect(count).toBeLessThanOrEqual(10);
  });

  it('remaining waitForTimeout are only allowed values (≤ 500ms)', () => {
    const result = execSync(
      'grep -rn "waitForTimeout" apps/frontend/playwright --include="*.ts" -h',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    );
    const lines = result.trim().split('\n').filter(Boolean);
    lines.forEach(line => {
      const match = line.match(/waitForTimeout\((\d+)\)/);
      if (match) {
        const ms = parseInt(match[1]);
        expect(ms).toBeLessThanOrEqual(500);
      }
    });
  });

  it('replaced waits use explicit conditions', () => {
    const specFiles = execSync(
      'find apps/frontend/playwright -name "*.spec.ts"',
      { encoding: 'utf-8', cwd: '/root/.openclaw/vibex' }
    ).trim().split('\n').filter(Boolean);

    specFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      // 使用显式等待的文件应该有 waitForLoadState / expect / waitForFunction
      const hasWaitForTimeout = /waitForTimeout/.test(content);
      const hasExplicitWait = /waitForLoadState|waitForFunction|expect\(.*\).*toBe/.test(content);
      if (hasWaitForTimeout) {
        expect(hasExplicitWait).toBe(true);
      }
    });
  });
});
```

### AC5.2 — flowId E2E 测试

```typescript
//验收测试: flowId E2E测试全通过
describe('flowId E2E Tests (AC5.2)', () => {
  it('flow-id.spec.ts exists', () => {
    const path = '/root/.openclaw/vibex/apps/frontend/playwright/tests/flow-id.spec.ts';
    expect(fs.existsSync(path)).toBe(true);
  });

  it('flow-id.spec.ts has at least 5 test cases', () => {
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/apps/frontend/playwright/tests/flow-id.spec.ts',
      'utf-8'
    );
    const testCount = (content.match(/test\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(5);
  });

  it('flowId E2E tests pass', () => {
    const result = execSync(
      'npx playwright test tests/flow-id.spec.ts --reporter=line 2>&1',
      {
        encoding: 'utf-8',
        cwd: '/root/.openclaw/vibex/apps/frontend',
        timeout: 60000,
      }
    );
    const failedMatch = result.match(/(\d+) failed/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
    expect(failedCount).toBe(0);
  });

  it('all E2E tests pass in CI', () => {
    const result = execSync(
      'npx playwright test --reporter=dot 2>&1',
      {
        encoding: 'utf-8',
        cwd: '/root/.openclaw/vibex/apps/frontend',
        timeout: 300000,
        env: { ...process.env, CI: 'true' },
      }
    );
    const failedMatch = result.match(/(\d+) failed/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
    expect(failedCount).toBe(0);
  });
});
```

### AC5.3 — JsonTreeModal UT

```typescript
//验收测试: JsonTreeModal单元测试覆盖率>80%
describe('JsonTreeModal Unit Tests (AC5.3)', () => {
  it('JsonTreeModal test file exists', () => {
    const path = '/root/.openclaw/vibex/packages/components/__tests__/JsonTreeModal.test.tsx';
    expect(fs.existsSync(path)).toBe(true);
  });

  it('JsonTreeModal has at least 10 test cases', () => {
    const content = fs.readFileSync(
      '/root/.openclaw/vibex/packages/components/__tests__/JsonTreeModal.test.tsx',
      'utf-8'
    );
    const itCount = (content.match(/\bit\(/g) || []).length;
    expect(itCount).toBeGreaterThanOrEqual(10);
  });

  it('JsonTreeModal coverage exceeds 80%', () => {
    const result = execSync(
      'npx nyc --reporter=text npm test -- --testPathPattern="JsonTreeModal" 2>&1',
      {
        encoding: 'utf-8',
        cwd: '/root/.openclaw/vibex',
        timeout: 60000,
      }
    );
    // 从 Istanbul 输出中提取总覆盖率
    const coverageMatch = result.match(/All files\s+\|\s+[\d.]+\s+\|[\s\d]+\|\s+(\d+\.?\d*)%/);
    const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0;
    expect(coverage).toBeGreaterThan(80);
  });

  it('all JsonTreeModal unit tests pass', () => {
    const result = execSync(
      'npm test -- --testPathPattern="JsonTreeModal" 2>&1',
      {
        encoding: 'utf-8',
        cwd: '/root/.openclaw/vibex',
        timeout: 60000,
      }
    );
    const failedMatch = result.match(/(\d+) failed/);
    const failedCount = failedMatch ? parseInt(failedMatch[1]) : 0;
    expect(failedCount).toBe(0);
  });
});
```

---

## 风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 替换 waitForTimeout 后测试不稳定 | 中 | 高 | 每步替换后运行完整 E2E，验证稳定性 |
| E2E 测试需要真实 backend 环境 | 中 | 中 | 使用 MSW 模拟 API，或确保 dev 环境可用 |
| JsonTreeModal 覆盖率难达 80% | 低 | 中 | 补充边界用例（空值、深嵌套、大数据） |
