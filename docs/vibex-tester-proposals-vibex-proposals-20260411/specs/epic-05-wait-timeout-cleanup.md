# Epic 5: waitForTimeout 清理

**Epic ID**: E5
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**优先级**: P1
**工时**: 4h
**关联 Features**: F7
**关联 T-P1-3**: waitForTimeout 87 处残留

---

## 1. 概述

当前 E2E 测试中存在 87 处 `waitForTimeout` 调用，导致测试不稳定（flaky）和执行缓慢。本次 Epic 系统性清理所有 `waitForTimeout`，替换为网络感知的等待策略。

### 当前残留分布

| 文件 | 数量 | 替换策略 |
|------|------|---------|
| `conflict-resolution.spec.ts` | 8 | `waitForResponse()` + `waitForSelector()` |
| `conflict-dialog.spec.ts` | 6 | `waitForResponse()` + `waitForSelector()` |
| `auto-save.spec.ts` | 5 | `waitForResponse(/\/api\/.*snapshot/)` |
| `login-state-fix.spec.ts` | ~10 | `waitForLoadState('networkidle')` |
| 其他文件（~58处） | ~58 | 按实际情况选择网络等待策略 |
| **合计** | **~87** | |

---

## 2. 替换策略总览

### 策略 1: waitForResponse（推荐，用于等待 API 响应）

```ts
// 修改前:
await page.waitForTimeout(2000);

// 修改后:
await page.waitForResponse(/\/api\/.*endpoint/, { timeout: 5000 });
```

适用场景：已知触发 API 调用的操作（如点击按钮、填写表单）。

### 策略 2: waitForSelector（推荐，用于等待 DOM 元素）

```ts
// 修改前:
await page.waitForTimeout(1000);
await page.click('.modal');

// 修改后:
await page.waitForSelector('.modal', { state: 'visible', timeout: 5000 });
await page.click('.modal');
```

适用场景：等待 UI 状态变化（对话框、通知、加载完成）。

### 策略 3: waitForLoadState（推荐，用于等待页面加载）

```ts
// 修改前:
await page.waitForTimeout(3000);

// 修改后:
await page.waitForLoadState('networkidle', { timeout: 10000 });
```

适用场景：页面整体加载、路由跳转后等待。

### 策略 4: expect(locator).toBeVisible（用于断言等待）

```ts
// 修改前:
await page.waitForTimeout(500);
const btn = await page.$('.submit-btn');

// 修改后:
await expect(page.locator('.submit-btn')).toBeVisible({ timeout: 5000 });
```

### 策略 5: waitForURL（用于等待路由变化）

```ts
// 修改前:
await page.waitForTimeout(1000);
expect(page.url()).toContain('/dashboard');

// 修改后:
await page.waitForURL('**/dashboard', { timeout: 5000 });
```

---

## 3. E5-S1: conflict-resolution.spec.ts（8 处）

### 典型替换模式

```ts
// 文件: vibex-fronted/tests/e2e/conflict-resolution.spec.ts

// 替换 1: waitForTimeout(2000) → waitForResponse
// 修改前:
await page.click('[data-testid="save-button"]');
await page.waitForTimeout(2000);

// 修改后:
await Promise.all([
  page.waitForResponse(/\/api\/.*save/),
  page.click('[data-testid="save-button"]'),
]);

// 替换 2: waitForTimeout(1000) → waitForSelector
// 修改前:
await page.click('[data-testid="resolve-conflict"]');
await page.waitForTimeout(1000);
await page.click('[data-testid="conflict-option"]');

// 修改后:
await Promise.all([
  page.waitForResponse(/\/api\/.*conflict/),
  page.click('[data-testid="resolve-conflict"]'),
]);
await page.waitForSelector('[data-testid="conflict-option"]', { timeout: 5000 });
await page.click('[data-testid="conflict-option"]');
```

### 验收标准

```bash
# 验证无 waitForTimeout 残留
grep -n "waitForTimeout" vibex-fronted/tests/e2e/conflict-resolution.spec.ts
# 应无输出

# 验证测试仍能通过
npx playwright test conflict-resolution.spec.ts --reporter=line
# 应全部 passed
```

---

## 4. E5-S2: auto-save.spec.ts（5 处）

### 典型替换模式

```ts
// 文件: vibex-fronted/tests/e2e/auto-save.spec.ts

// 替换: waitForTimeout(2500) → waitForResponse(snapshot)
// 修改前:
await page.click('[data-testid="canvas-area"]');
await page.waitForTimeout(2500); // 等待自动保存
const snapshotCall = await page.evaluate(() => mockApiCalls.length);

// 修改后:
await Promise.all([
  page.waitForResponse(/\/api\/.*snapshot/, { timeout: 5000 }),
  page.click('[data-testid="canvas-area"]'),
]);
const snapshotCall = await page.evaluate(() => mockApiCalls.length);

// 替换: waitForTimeout(1000) → waitForLoadState
// 修改前:
await page.fill('[data-testid="element-input"]', 'text');
await page.waitForTimeout(1000); // 等待 auto-save 触发

// 修改后:
await page.fill('[data-testid="element-input"]', 'text');
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

---

## 5. E5-S3: login-state-fix.spec.ts（~10 处）

### 典型替换模式

```ts
// 文件: vibex-fronted/tests/e2e/login-state-fix.spec.ts

// 替换: waitForTimeout(2000) → waitForLoadState
// 修改前:
await page.fill('[data-testid="email"]', 'test@example.com');
await page.fill('[data-testid="password"]', 'password');
await page.click('[data-testid="login-submit"]');
await page.waitForTimeout(2000);

// 修改后:
await page.fill('[data-testid="email"]', 'test@example.com');
await page.fill('[data-testid="password"]', 'password');
await Promise.all([
  page.waitForResponse(/\/api\/.*login/),
  page.click('[data-testid="login-submit"]'),
]);
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

---

## 6. E5-S4: 其他文件（~58 处）

按文件逐个清理，优先处理测试不稳定（flaky）的文件。

### 清理优先级

1. **高优先级**（测试频繁失败）: `stability.spec.ts` 报告的 FAIL 文件
2. **中优先级**（测试偶尔失败）: `conflict-resolution.spec.ts`, `canvas-quality-ci.spec.ts`
3. **低优先级**（测试较稳定但仍用 waitForTimeout）: 其他文件

### 批量验证脚本

```bash
#!/bin/bash
# 清理完成后运行此脚本验证

echo "=== waitForTimeout 残留检查 ==="
RESIDUAL=$(grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.ts" | grep -v "stability.spec.ts" | grep -v "# comment" | grep -v "// FIXME" | grep -v "flaky" | wc -l)
echo "残留数量: $RESIDUAL"

if [ "$RESIDUAL" -gt "0" ]; then
  echo "❌ 仍有 $RESIDUAL 处残留"
  grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.ts" | grep -v "stability.spec.ts"
  exit 1
else
  echo "✅ 所有 waitForTimeout 已清理"
  exit 0
fi
```

---

## 7. 验收标准

```ts
// 验收 1: 无残留（不含 stability.spec.ts 自身）
const residual = execSync(
  'grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ --include="*.ts" | grep -v "stability.spec.ts" | grep -v "# comment" | grep -v "// FIXME" | grep -v "flaky" | wc -l'
).toString().trim();
expect(Number(residual)).toBe(0);

// 验收 2: stability.spec.ts 能检测到 > 0 条（自身检测代码中）
const stabilityResult = execSync(
  'npx playwright test stability.spec.ts 2>&1',
  { cwd: 'vibex-fronted' }
).toString();
expect(stabilityResult).toContain('waitForTimeout');
const match = stabilityResult.match(/found\s+(\d+)/);
expect(Number(match?.[1] || 0)).toBeGreaterThan(0);

// 验收 3: 清理后的测试仍能通过
const testResult = execSync(
  'npx playwright test --reporter=line 2>&1 | tail -5',
  { cwd: 'vibex-fronted', timeout: 300000 }
).toString();
expect(testResult).toContain('passed');
expect(testResult).not.toContain('failed');
```

---

## 8. 注意事项

- **不要删除 stability.spec.ts 自身**中的 waitForTimeout 用法（那是检测逻辑的一部分）
- **注释中的 waitForTimeout 可保留**（如 `// TODO: replace waitForTimeout`）
- **FIXME/flaky 标记的 waitForTimeout 暂时保留**，在后续 sprint 处理
- **每次清理一个文件后立即运行测试**，确保不引入新失败
- **如果找不到合适的网络等待目标**，可使用 `page.waitForFunction` 或 `page.waitForTimeout` 作为 fallback（需在 spec 顶部加 `@flaky` 注释）
