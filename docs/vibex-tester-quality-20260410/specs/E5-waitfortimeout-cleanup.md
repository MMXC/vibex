# Spec: E5 - waitForTimeout 清理

**Epic**: E5
**来源**: T-P1-3
**工时**: 2.5h
**Status**: Draft

---

## 1. Overview

替换 E2E 测试中的所有 `waitForTimeout()` 硬编码等待为 Playwright 智能等待 API，提高测试稳定性。

## 2. Problem Statement

当前测试中残留 20+ 处 `waitForTimeout()` 硬编码等待，分布在：
- `conflict-resolution.spec.ts`: 8处
- `conflict-dialog.spec.ts`: 6处
- `auto-save.spec.ts`: 5处

硬编码等待导致：
- 测试运行慢（固定等待时间过长）
- 测试不稳定（等待时间不足时失败）

## 3. Technical Spec

### 3.1 替换策略

Playwright 智能等待 API 优先级：

| 场景 | 替代方案 |
|------|----------|
| 等待 API 响应 | `page.waitForResponse(urlOrPredicate)` |
| 等待 DOM 元素 | `page.waitForSelector(selector)` |
| 等待元素消失 | `page.waitForSelector(selector, { state: 'hidden' })` |
| 等待元素文本 | `page.waitForFunction(() => el.textContent === 'x')` |
| 等待网络空闲 | `page.waitForLoadState('networkidle')` |
| 等待条件 | `page.waitForFunction(predicate)` |

### 3.2 conflict-resolution.spec.ts 替换示例

**变更前**:
```typescript
await page.click('[data-testid="resolve-conflict-btn"]');
await page.waitForTimeout(1000); // ❌ 硬编码等待
await expect(page.locator('.conflict-banner')).not.toBeVisible();
```

**变更后**:
```typescript
await page.click('[data-testid="resolve-conflict-btn"]');
await page.waitForSelector('.conflict-banner', { state: 'hidden', timeout: 5000 }); // ✅ 智能等待
await expect(page.locator('.conflict-banner')).not.toBeVisible();
```

**变更前**:
```typescript
await page.evaluate(() => mockConflictData());
await page.waitForTimeout(500); // ❌ 等待 mock 数据加载
```

**变更后**:
```typescript
await page.evaluate(() => mockConflictData());
await page.waitForResponse(response => response.url().includes('/api/conflicts'), { timeout: 5000 }); // ✅
```

### 3.3 conflict-dialog.spec.ts 替换

对于对话框交互：
```typescript
// 变更前
await page.click('[data-testid="conflict-accept-btn"]');
await page.waitForTimeout(800);

// 变更后
await Promise.all([
  page.waitForResponse('**/api/**'),
  page.click('[data-testid="conflict-accept-btn"]'),
]);
```

### 3.4 auto-save.spec.ts 替换

对于自动保存：
```typescript
// 变更前
await page.fill('[data-testid="canvas-title"]', 'New Title');
await page.waitForTimeout(2000); // 等待自动保存

// 变更后
await page.fill('[data-testid="canvas-title"]', 'New Title');
await page.waitForResponse(
  response => response.url().includes('/api/canvas') && response.request().method() === 'PATCH',
  { timeout: 5000 }
);
```

## 4. Acceptance Criteria

### S5.1-S5.3: waitForTimeout 零残留
```bash
grep -rn "waitForTimeout" tests/e2e/conflict-resolution.spec.ts
# 期望: 无输出（退出码 1）

grep -rn "waitForTimeout" tests/e2e/conflict-dialog.spec.ts
# 期望: 无输出

grep -rn "waitForTimeout" tests/e2e/auto-save.spec.ts
# 期望: 无输出
```

### 全局验证
```bash
grep -rn "waitForTimeout" tests/e2e/
# 期望: 无输出
```

## 5. Out of Scope

- 其他文件中的 `waitForTimeout`（基于扫描结果再扩展）
- 非 E2E 测试中的 `setTimeout` 清理

## 6. Dependencies

- 无外部依赖
- 可并行于 E4 执行

## 7. Rollback Plan

每个文件的替换作为独立 commit，必要时可逐文件回退。
