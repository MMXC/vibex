# IMPLEMENTATION_PLAN: VibeX Tester Quality 2026-04-10

> **项目**: vibex-tester-quality-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 AM | E1: Playwright 配置统一 | 1.5h |
| Sprint 2 | Day 1 PM | E2: stability.spec.ts 路径修复 | 1h |
| Sprint 3 | Day 2 AM | E3: @ci-blocking grepInvert 移除 | 1.5h |
| Sprint 4 | Day 2 PM | E4: Vitest 统一 | 2.5h |
| Sprint 5 | Day 3 | E5: waitForTimeout 清理 | 2.5h |

**总工时**: 9h | **团队**: 1 Dev

---

## 2. Sprint 1: Playwright 配置统一（1.5h）

### Task S1.1: 删除双重配置（0.5h）

```bash
# 删除 tests/e2e/playwright.config.ts
rm -f tests/e2e/playwright.config.ts

# 验证
find . -name "playwright.config.ts" | wc -l
# 应输出: 1
```

### Task S1.2: 迁移配置到根配置（0.5h）

```typescript
// playwright.config.ts
// 确保根配置包含所有必要项
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  expect: { timeout: 30000 },  // 统一 30s
  // 移除 grepInvert 配置
});
```

### Task S1.3: 验证 CI 使用根配置（0.5h）

```bash
# 验证配置
npx playwright test --list 2>&1 | head -20

# 检查 CI workflow
grep -A5 "playwright" .github/workflows/ci.yml
```

---

## 3. Sprint 2: stability.spec.ts 修复（1h）

### Task S2.1: 修复路径（0.5h）

```typescript
// tests/e2e/stability.spec.ts
// 修复前
if (!fs.existsSync('./e2e/')) { throw; }

// 修复后
import * as path from 'path';
const TEST_DIR = path.resolve(__dirname);
if (!fs.existsSync(path.join(TEST_DIR, '..'))) { throw; }
```

### Task S2.2: 添加目录存在性断言（0.5h）

```typescript
test('E2E directory structure valid', () => {
  const e2eDir = path.resolve(__dirname, '..');
  expect(fs.existsSync(e2eDir)).toBe(true);
  
  const specFiles = fs.readdirSync(e2eDir)
    .filter(f => f.endsWith('.spec.ts'));
  expect(specFiles.length).toBeGreaterThan(0);
});
```

---

## 4. Sprint 3: @ci-blocking grepInvert 移除（1.5h）

### Task S3.1: 移除 grepInvert（0.5h）

```bash
# 找到 grepInvert 配置
grep -rn "grepInvert" tests/e2e/ . --include="*.ts" --include="*.js" --include="*.json"

# 移除所有 grepInvert 配置
```

### Task S3.2: 审计 @ci-blocking 测试（1h）

```bash
# 统计 @ci-blocking 测试数量
grep -rn "@ci-blocking" tests/e2e/ --include="*.spec.ts" | wc -l
# 输出: 35+

# 审计并分类
grep -rn "@ci-blocking" tests/e2e/ --include="*.spec.ts" > ci-blocking-audit.md
```

---

## 5. Sprint 4: Vitest 统一（2.5h）

### Task S4.1: 迁移 useAIController 测试（1h）

```bash
# 迁移前（Jest 语法）
import { render, screen } from '@testing-library/react';
import { useAIController } from './useAIController';

// 迁移后（Vitest 语法）
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { useAIController } from './useAIController';

vi.mock('./api', () => ({
  fetchAIResponse: vi.fn(),
}));
```

### Task S4.2: 修复 mock 问题（1h）

```typescript
// 修复 mock 导入
import { vi } from 'vitest';

// Jest mock
// const mockFn = jest.fn();

// Vitest mock
const mockFn = vi.fn();
```

### Task S4.3: 清理 Jest 配置（0.5h）

```bash
# 删除或标记废弃
rm -f jest.config.js
# 或添加废弃注释
echo "// @deprecated Use vitest.config.ts instead" > jest.config.js
```

---

## 6. Sprint 5: waitForTimeout 清理（2.5h）

### Task S5.1: conflict-resolution.spec.ts（1h）

```bash
# 统计 waitForTimeout
grep -n "waitForTimeout" tests/e2e/conflict-resolution.spec.ts
# 输出: 8 处
```

```typescript
// 修复策略
// 修复前
await page.waitForTimeout(3000);

// 修复后（根据上下文选择）
// 1. 有元素出现
await expect(page.locator('.conflict-modal')).toBeVisible({ timeout: 5000 });

// 2. 有 API 调用
const responsePromise = page.waitForResponse(res => 
  res.url().includes('/api/sync')
);
await page.click('[data-testid="resolve-button"]');
await responsePromise;

// 3. 有状态变化
await page.waitForFunction(() => {
  const el = document.querySelector('.sync-status');
  return el?.textContent === 'synced';
});
```

### Task S5.2: conflict-dialog.spec.ts（1h）

```typescript
// 类似 S5.1，按上下文选择替换策略
```

### Task S5.3: auto-save.spec.ts（0.5h）

```typescript
// 修复前
await page.waitForTimeout(2000);
await page.fill('textarea', 'content');

// 修复后
await page.fill('textarea', 'content');
await expect(page.locator('.save-indicator')).toBeVisible({ timeout: 5000 });
```

---

## 7. 验收命令

```bash
# Playwright 配置检查
echo "=== Playwright 配置 ===" && find . -name "playwright.config.ts" | wc -l
echo "=== grepInvert ===" && grep -rn "grepInvert" playwright.config.ts | wc -l
echo "=== expect timeout ===" && grep "timeout.*30000" playwright.config.ts | wc -l

# stability.spec.ts
echo "=== stability.spec 路径 ===" && grep -n "./e2e/" tests/e2e/stability.spec.ts | wc -l

# waitForTimeout
echo "=== waitForTimeout 残留 ===" && grep -rn "waitForTimeout" tests/e2e/ --include="*.spec.ts" | wc -l

# Vitest
echo "=== Vitest ===" && pnpm vitest run --reporter=verbose 2>&1 | tail -20
```

---

## 8. 回滚计划

| Sprint | 回滚步骤 | 时间 |
|--------|---------|------|
| Sprint 1 | `git checkout HEAD -- playwright.config.ts` | <2 min |
| Sprint 2 | `git checkout HEAD -- tests/e2e/stability.spec.ts` | <2 min |
| Sprint 3 | `git checkout HEAD -- playwright.config.ts` | <2 min |
| Sprint 4 | `git checkout HEAD -- src/**/*.test.ts` | <5 min |
| Sprint 5 | `git checkout HEAD -- tests/e2e/*.spec.ts` | <5 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
