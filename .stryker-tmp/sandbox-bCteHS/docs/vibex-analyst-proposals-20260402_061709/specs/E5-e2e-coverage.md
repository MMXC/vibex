# Spec: E5 - 测试覆盖率提升

## 1. 概述

**工时**: 8-10h | **优先级**: P2
**依赖**: D-002 (Jest 稳定)

## 2. E2E 测试套件

### 2.1 journey-create-context.spec.ts

```typescript
test('创建上下文 → 填写名称 → 确认节点', async ({ page }) => {
  await page.goto('/canvas');
  // 1. 创建上下文
  await page.click('[data-testid="add-context"]');
  await page.fill('[data-testid="context-name"]', '测试上下文');
  // 2. 确认节点
  const checkbox = page.locator('[data-testid="context-node"] input[type="checkbox"]').first();
  await checkbox.check();
  // 3. 验证
  await expect(checkbox).toBeChecked();
  await expect(page.locator('[class*="confirmedBadge"]')).toBeVisible();
});
```

### 2.2 journey-generate-flow.spec.ts

```typescript
test('选择上下文 → 生成流程 → 确认流程节点', async ({ page }) => {
  await page.goto('/canvas');
  // 1. 选择上下文
  await page.click('[data-testid="context-node"]');
  // 2. 生成流程
  await page.click('[data-testid="generate-flow"]');
  await page.waitForSelector('[data-testid="flow-node"]');
  // 3. 确认
  await page.locator('[data-testid="flow-node"] input[type="checkbox"]').first().check();
  await expect(page.locator('[class*="confirmedBadge"]')).toBeVisible();
});
```

### 2.3 journey-multi-select.spec.ts

```typescript
test('多选节点 → 批量确认', async ({ page }) => {
  await page.goto('/canvas');
  // 1. 多选（Ctrl+Click）
  await page.click('[data-testid="context-node"]:nth-child(1)', { modifiers: ['Control'] });
  await page.click('[data-testid="context-node"]:nth-child(2)', { modifiers: ['Control'] });
  // 2. 批量确认
  await page.click('[data-testid="batch-confirm"]');
  // 3. 验证
  const badges = page.locator('[class*="confirmedBadge"]');
  await expect(badges).toHaveCount(2);
});
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E5-AC1 | 运行 spec | journey-create-context | passRate ≥ 95% |
| E5-AC2 | 运行 spec | journey-generate-flow | passRate ≥ 95% |
| E5-AC3 | 运行 spec | journey-multi-select | passRate ≥ 95% |

## 4. DoD

- [ ] journey-create-context.spec.ts 通过
- [ ] journey-generate-flow.spec.ts 通过
- [ ] journey-multi-select.spec.ts 通过
- [ ] CI 通过率 ≥ 95%
