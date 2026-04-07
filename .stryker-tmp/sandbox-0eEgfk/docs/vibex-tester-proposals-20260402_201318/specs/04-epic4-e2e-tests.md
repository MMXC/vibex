# Epic 4 Spec: Canvas 核心交互 E2E 测试

**文件版本**: v1.0  
**日期**: 2026-04-02  
**Epic**: 测试流程改进 / Epic 4  
**负责人**: dev + tester

---

## 1. 功能规格

### S4.1 三树切换 E2E 测试

**输入**: Playwright 配置，`/canvas` 页面  
**测试用例**:
1. 打开 Canvas 页面
2. 验证默认显示 ContextTree
3. 点击 FlowTree 切换，断言 checkbox 数量（ContextTree 有 checkbox，切换后重新计数）
4. 点击 ComponentTree 切换，断言 checkbox 数量
5. 点击 ContextTree 返回，断言状态恢复

**代码位置**: `e2e/canvas-three-trees.spec.ts`

**期望断言**:
```typescript
await page.click('[data-testid="flow-tree-tab"]');
const flowCheckboxes = await page.locator('input[type="checkbox"]').count();
expect(flowCheckboxes).toBeGreaterThan(0);
```

---

### S4.2 节点选择 E2E 测试

**输入**: `/canvas` 页面，三树之一  
**测试用例**:
1. 选中任意节点（checkbox 或点击）
2. 断言右侧面板更新（节点详情可见）
3. 断言选中状态样式（高亮/边框）
4. 断言选中节点计数更新

**代码位置**: `e2e/canvas-node-selection.spec.ts`

---

### S4.3 确认反馈 E2E 测试

**输入**: `/canvas` 页面，已选中节点  
**测试用例**:
1. 选中一个或多个节点
2. 点击"确认"按钮
3. 断言确认反馈显示（toast / 提示条 / 状态变更）
4. 断言反馈内容包含选中节点信息

**代码位置**: `e2e/canvas-confirm-feedback.spec.ts`

---

### S4.4 E2E 测试稳定率验证

**处理**:
1. 连续运行 3 次完整 E2E 套件
2. 每次均需 All passed
3. flaky rate = 失败次数 / 总运行次数 < 5%

---

## 2. 验收标准清单

| ID | 标准 | 验证方式 |
|----|-----|---------|
| E1 | 三树切换 E2E 测试文件存在 | `ls e2e/canvas-three-trees.spec.ts` |
| E2 | 节点选择 E2E 测试文件存在 | `ls e2e/canvas-node-selection.spec.ts` |
| E3 | 确认反馈 E2E 测试文件存在 | `ls e2e/canvas-confirm-feedback.spec.ts` |
| E4 | 3 个 E2E 测试连续 3 次全通过 | `npx playwright test --reporter=list` × 3 |
| E5 | flaky rate < 5% | 3/3 通过 = 0% |
