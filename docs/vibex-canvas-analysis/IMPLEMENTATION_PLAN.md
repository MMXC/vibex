# Implementation Plan: vibex-canvas-analysis

**Project**: VibeX 新画布到创建项目流程优化
**Architect**: Architect Agent
**Date**: 2026-03-27
**Total Dev**: ~13h (Epic1 5h + Epic2 3h + Epic3 5h)

---

## Epic E1: 修复"导入示例"流程阻断 (P0)

**目标**: 用户点击"导入示例"能正确加载示例数据，"创建项目"按钮可用

### 任务清单

- [x] 创建 `src/data/example-canvas.json`（F-1.1）
  - [x] 三树结构完整（context/flow/component nodes）
  - [x] 所有节点 `confirmed: true`
  - [x] 对齐 `types.ts` 接口定义
- [x] 扩展 `canvasStore.ts` — `loadExampleData` action（F-1.2）
- [x] 修改 `CanvasPage.tsx` — ImportButton onClick 绑定（F-1.2）
- [x] 验证 `ProjectBar.tsx` — `areAllConfirmed` 在示例数据下通过（F-1.3）
- [x] `ProjectBar.tsx` — 按钮 disabled 时添加 title（F-1.3）
- [x] 单元测试：`exampleData.test.ts` (19 tests pass)

### 验收标准

```typescript
// F-1.2
await canvasPage.clickImportExample();
expect(contextNodes.length).toBeGreaterThan(0);
expect(flowNodes.length).toBeGreaterThan(0);
expect(componentNodes.length).toBeGreaterThan(0);

// F-1.3
expect(createProjectBtn).toBeEnabled(); // 示例加载后
expect(createProjectBtn).toBeDisabled(); // 无数据时
```

**预计工时**: 5h

---

## Epic E2: 优化未登录用户引导 (P1)

**目标**: 未登录用户看到友好提示，而非静默失败

### 任务清单

- [ ] 创建 `src/components/auth/AuthToast.tsx`（F-2.1）
- [ ] 修改 `HomePage.tsx` — handleStartClick 登录检查 + toast（F-2.1）
- [ ] 修复 `OnboardingProgressBar.tsx` 遮挡问题（F-2.2）
- [ ] E2E 测试：F-2.1 + F-2.2

### 验收标准

```typescript
// F-2.1
await homepage.clickStartButton(); // 未登录
expect(toast).toBeVisible();
expect(toast.textContent()).toContain('请先登录');

// F-2.2
await homepage.skipIntro();
await homepage.clickStartButton();
expect(navigation).toHaveNavigatedTo('/canvas'); // 无 intercept 报错
```

**预计工时**: 3h

---

## Epic E3: 优化步骤引导体验 (P2)

**目标**: 用户清楚了解当前状态和操作限制

### 任务清单

- [ ] 相关 Step 组件禁用时添加 title 属性（F-3.1）
- [ ] 创建 `src/components/canvas/TreeStatus.tsx` 显示进度（F-3.2）
- [ ] 将 `TreeStatus` 集成到 `CanvasPage.tsx`（F-3.2）
- [ ] E2E 测试：F-3.1 + F-3.2 + F-3.3

### 验收标准

```typescript
// F-3.1
const disabledBtn = page.locator('[data-testid="step-xxx"]');
expect(disabledBtn).toHaveAttribute('title', /.+/);

// F-3.2
const status = page.locator('[data-testid="tree-status"]');
expect(status.textContent()).toMatch(/上下文 \d+ 个节点/);

// F-3.3
const createBtn = page.locator('[data-testid="create-project-btn"]');
await createBtn.hover();
expect(createBtn).toHaveAttribute('title', /.+/);
```

**预计工时**: 5h

---

## 文件变更清单

```
src/data/example-canvas.json             [新增] F-1.1
src/lib/canvas/canvasStore.ts           [修改] F-1.2, F-1.3
src/components/canvas/CanvasPage.tsx     [修改] F-1.2, F-3.2
src/components/project/ProjectBar.tsx    [修改] F-1.3, F-3.3
src/components/auth/AuthToast.tsx       [新增] F-2.1
src/components/home/HomePage.tsx         [修改] F-2.1
src/components/home/OnboardingProgressBar.tsx [修改] F-2.2
src/components/canvas/TreeStatus.tsx     [新增] F-3.2
<step components>                        [修改] F-3.1
e2e/canvas-analysis.spec.ts              [新增] 全 Epic E2E
```

---

## 执行顺序

```
E1 (P0) → E2 (P1) → E3 (P2)
```

E1 为阻断项，必须先完成。E2/E3 可并行开发（不同文件）。
