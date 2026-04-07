# Spec: E5 - Sprint 4 E2E + 性能

## 1. 概述

**工时**: 18-25h | **优先级**: P2
**依赖**: E2 + E3 (Sprint 1 + 2)

## 2. 修改范围

### 2.1 E5-S1: Playwright E2E 核心旅程

**文件**: `tests/e2e/journey-*.spec.ts`

```typescript
// journey-create-context.spec.ts
test('创建上下文 → 填写名称 → 确认节点', async ({ page }) => {
  await page.goto('/canvas');
  await page.click('[data-testid="add-context"]');
  await page.fill('[data-testid="context-name"]', '测试上下文');
  const checkbox = page.locator('[data-testid="context-node"] input[type="checkbox"]').first();
  await checkbox.check();
  await expect(checkbox).toBeChecked();
  await expect(page.locator('[class*="confirmedBadge"]')).toBeVisible();
});
```

### 2.2 E5-S2: Canvas 拖拽性能优化

**方案**:
- React.memo 优化节点组件
- requestAnimationFrame 节流拖拽
- 虚拟化列表（50+ 节点场景）

### 2.3 E5-S3: ReactFlow 交互验证

```typescript
test('ReactFlow 节点拖拽', async ({ page }) => {
  await page.goto('/canvas');
  const node = page.locator('[data-testid="flow-node"]').first();
  await node.dragTo(page.locator('[data-testid="canvas-area"]'));
  await expect(node).toBeVisible();
});
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E5-AC1 | 运行 E2E | journey-create-context | passRate ≥ 90% |
| E5-AC2 | 运行 E2E | journey-generate-flow | passRate ≥ 90% |
| E5-AC3 | 运行 E2E | journey-multi-select | passRate ≥ 90% |
| E5-AC4 | Performance | Chrome DevTools | dragFPS ≥ 55 |

## 4. DoD

- [ ] 3 个核心旅程 E2E 通过率 > 90%
- [ ] 拖拽帧率 ≥ 55fps
- [ ] ReactFlow 交互正常
