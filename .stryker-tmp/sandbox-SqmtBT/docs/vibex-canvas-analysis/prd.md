# PRD: VibeX 新画布到创建项目流程优化

**Agent**: PM  
**Date**: 2026-03-27  
**Project**: vibex-canvas-analysis  
**Based on**: `analysis.md` (analyze-requirements 产物)  
**Status**: Draft → Ready for Architect Review

---

## 1. 产品概述

### 1.1 背景
VibeX 新画布（`/canvas`）是用户从需求输入到项目创建的核心流程通道。当前流程存在**阻断性问题**：用户点击"导入示例"后，三树为空导致"创建项目"按钮永久禁用，使完整体验路径断裂。

### 1.2 目标
修复阻断性问题（P0），优化交互体验（P1-P2），确保用户能顺畅完成"输入需求 → 三树生成 → 确认节点 → 创建项目"的完整闭环。

### 1.3 范围
- **包含**: `/canvas` 页面流程优化、首页"开始使用"引导优化
- **不包含**: AI 生成逻辑修改、游客模式完整实现、DDD 数据模型变更

### 1.4 非功能目标
- 页面加载性能: 首屏 < 2s
- 示例数据加载: < 500ms
- 无阻断性 console error

---

## 2. 功能 Epic 与 Story 拆分

> **ID 格式**: `F-{EpicNum}.{StoryNum}`  
> **示例**: `F-1.1` = Epic 1, Story 1  
> **页面标注**: `[Homepage]` = 首页, `[Canvas]` = /canvas 画布页

---

### Epic 1: 修复"导入示例"流程阻断 (P0)

> **目标**: 用户点击"导入示例"能正确加载示例数据到三树，"创建项目"按钮在数据就绪后可用

#### F-1.1 创建示例数据文件
**页面**: [Canvas]  
**描述**: 创建本地 JSON 文件存储示例需求及对应的三树结构（context/flow/component nodes），预设 `confirmed=true`。

**验收标准**:
```typescript
// expect 示例数据结构完整
expect(exampleData).toHaveProperty('requirement')
expect(exampleData).toHaveProperty('contextNodes')
expect(exampleData).toHaveProperty('flowNodes')
expect(exampleData).toHaveProperty('componentNodes')
expect(exampleData.contextNodes.length).toBeGreaterThan(0)
expect(exampleData.flowNodes.length).toBeGreaterThan(0)
expect(exampleData.componentNodes.length).toBeGreaterThan(0)
expect(exampleData.contextNodes.every(n => n.confirmed === true)).toBe(true)
expect(exampleData.flowNodes.every(n => n.confirmed === true)).toBe(true)
expect(exampleData.componentNodes.every(n => n.confirmed === true)).toBe(true)
```

---

#### F-1.2 修复"导入示例"按钮逻辑
**页面**: [Canvas] `CanvasPage.tsx`  
**描述**: 修改"导入示例"按钮的 onClick，从只切换 phase 改为完整加载示例数据到 store。

**验收标准**:
```typescript
// 点击导入示例后，三树均有节点
await canvasPage.clickImportExample()
await page.waitForSelector('[data-testid="context-tree"] .tree-node', { timeout: 3000 })
const contextNodeCount = await canvasPage.getContextNodeCount()
expect(contextNodeCount).toBeGreaterThan(0)

const flowNodeCount = await canvasPage.getFlowNodeCount()
expect(flowNodeCount).toBeGreaterThan(0)

const componentNodeCount = await canvasPage.getComponentNodeCount()
expect(componentNodeCount).toBeGreaterThan(0)

// 三树节点均已确认
expect(await canvasPage.areAllContextNodesConfirmed()).toBe(true)
expect(await canvasPage.areAllFlowNodesConfirmed()).toBe(true)
expect(await canvasPage.areAllComponentNodesConfirmed()).toBe(true)
```

---

#### F-1.3 "创建项目"按钮状态联动
**页面**: [Canvas] `ProjectBar.tsx`  
**描述**: 确保"创建项目"按钮在示例数据加载后变为 enabled。

**验收标准**:
```typescript
// 示例数据加载后，按钮 enabled
await canvasPage.clickImportExample()
await page.waitForTimeout(500)
const createProjectBtn = await page.$('[data-testid="create-project-btn"]')
expect(await createProjectBtn.isEnabled()).toBe(true)

// 无数据时，按钮 disabled
const emptyBtn = await page.$('[data-testid="create-project-btn"]')
expect(await emptyBtn.isDisabled()).toBe(true)
```

---

### Epic 2: 优化未登录用户引导 (P1)

#### F-2.1 未登录"开始使用"拦截提示
**页面**: [Homepage]  
**描述**: 未登录用户点击"开始使用"时，显示 toast 提示"请先登录"，而非静默跳转。

**验收标准**:
```typescript
// 未登录用户点击"开始使用"
await homepage.clickStartButton()
const toast = await page.waitForSelector('[data-testid="auth-toast"]', { timeout: 2000 })
expect(toast).toBeVisible()
expect(await toast.textContent()).toContain('请先登录')
```

---

#### F-2.2 跳过 intro 后"开始使用"可点击
**页面**: [Homepage]  
**描述**: 修复 OnboardingProgressBar 遮挡问题，跳过 intro 后按钮可正常点击。

**验收标准**:
```typescript
// 跳过 intro 后，按钮可点击（无 intercept 报错）
await homepage.clickSkipIntro()
await page.waitForTimeout(300)
await homepage.clickStartButton()
// 不应出现 "element intercepts pointer events" 错误
```

---

### Epic 3: 优化步骤引导与状态感知 (P2)

#### F-3.1 步骤进度条 tooltip 引导
**页面**: [Canvas]  
**描述**: 禁用步骤按钮显示 tooltip 说明前置条件。

**验收标准**:
```typescript
// 需求录入未完成时，步骤2禁用且有tooltip
const step2Btn = await page.$('[data-testid="step-2-btn"]')
expect(await step2Btn.getAttribute('disabled')).not.toBeNull()
expect(await step2Btn.getAttribute('title')).toMatch(/请先完成需求录入/)
```

---

#### F-3.2 三树状态进度展示
**页面**: [Canvas]  
**描述**: 三树面板显示"X/Y 已确认"状态，让用户直观感知进度。

**验收标准**:
```typescript
// 加载示例数据后，三树显示已确认数量
await canvasPage.clickImportExample()
const contextStatus = await page.textContent('[data-testid="context-tree-status"]')
expect(contextStatus).toMatch(/\d+\/\d+ 已确认/)

const flowStatus = await page.textContent('[data-testid="flow-tree-status"]')
expect(flowStatus).toMatch(/\d+\/\d+ 已确认/)

const componentStatus = await page.textContent('[data-testid="component-tree-status"]')
expect(componentStatus).toMatch(/\d+\/\d+ 已确认/)
```

---

#### F-3.3 "创建项目"按钮禁用原因说明
**页面**: [Canvas] `ProjectBar.tsx`  
**描述**: 按钮 disabled 时悬停显示具体原因（如"业务流程树为空，请先生成流程"）。

**验收标准**:
```typescript
// 按钮 disabled 时悬停显示原因
await page.$eval('[data-testid="create-project-btn"]', el => el.getAttribute('title'))
// 期望: 包含"请先确认所有三树节点"或具体缺失项
```

---

## 3. 优先级矩阵 (MoSCoW)

| ID | 功能 | MoSCoW | 理由 |
|----|------|--------|------|
| F-1.1 | 创建示例数据文件 | **Must** | 修复 Q1 的数据基础 |
| F-1.2 | 修复"导入示例"按钮逻辑 | **Must** | 修复 Q1 根因 |
| F-1.3 | "创建项目"按钮状态联动 | **Must** | 修复 Q2 根因 |
| F-2.1 | 未登录"开始使用"拦截提示 | **Should** | 修复 Q3 体验问题 |
| F-2.2 | 跳过 intro 后可点击 | **Should** | 修复 Q4 偶发问题 |
| F-3.1 | 步骤进度条 tooltip | **Could** | 改善引导体验 |
| F-3.2 | 三树状态进度展示 | **Could** | 提升状态感知 |
| F-3.3 | 按钮禁用原因说明 | **Could** | 减少用户困惑 |

---

## 4. 验收测试矩阵

| 功能 ID | 验收标准 | 测试工具 | 预期结果 |
|---------|----------|----------|----------|
| F-1.1 | 示例数据结构完整，confirmed=true | 单元测试 | 6 个断言全部通过 |
| F-1.2 | 导入示例后三树各有 ≥1 节点 | gstack browse | snapshot 有节点 |
| F-1.3 | 示例数据加载后按钮 enabled | gstack browse | `is enabled` |
| F-2.1 | 未登录点击显示 toast | gstack browse | toast 可见 |
| F-2.2 | 跳过 intro 后可点击 | gstack browse | 无 intercept 报错 |
| F-3.1 | 禁用步骤有 tooltip | gstack browse | title 属性非空 |
| F-3.2 | 三树显示已确认数量 | gstack browse | 文本匹配正则 |
| F-3.3 | 按钮 disabled 悬停有原因 | gstack browse | title 有内容 |

---

## 5. 页面集成标注

| 页面 | 路由 | 涉及文件 | 修改类型 |
|------|------|----------|----------|
| 首页 | `/` | `HomePage.tsx` | F-2.1, F-2.2 |
| 画布页 | `/canvas` | `CanvasPage.tsx` | F-1.2, F-3.1, F-3.2 |
| 项目栏 | `/canvas` | `ProjectBar.tsx` | F-1.3, F-3.3 |
| 状态栏 | `/canvas` | `TreeStatus.tsx` (新增) | F-3.2 |
| 示例数据 | 共享 | `data/example-canvas.json` (新增) | F-1.1 |

---

## 6. 推荐实现方案

### F-1.1 ~ F-1.3 (Epic 1): 方案 A — 示例数据文件 + 修复加载逻辑

| 步骤 | 行动 | 工时 |
|------|------|------|
| 1 | 创建 `data/example-canvas.json`，包含完整的三树结构，节点预设 `confirmed: true` | 1h |
| 2 | 修改 `CanvasPage.tsx` 的"导入示例"按钮，调用 store action 加载示例数据 | 2h |
| 3 | 验证 `ProjectBar.tsx` 的 `areAllConfirmed` 检查在示例数据下通过 | 1h |
| 4 | 使用 gstack browse 验收测试（snapshot + enabled check） | 1h |

**预计工时**: ~5h

### F-2.1 ~ F-2.2 (Epic 2): Toast 提示方案

| 步骤 | 行动 | 工时 |
|------|------|------|
| 1 | 在 `HomePage.tsx` 添加登录状态检查，未登录点击显示 toast | 2h |
| 2 | 验证 OnboardingProgressBar 遮挡问题修复 | 0.5h |
| 3 | gstack browse 验收测试 | 0.5h |

**预计工时**: ~3h

### F-3.1 ~ F-3.3 (Epic 3): 渐进增强

| 步骤 | 行动 | 工时 |
|------|------|------|
| 1 | 禁用步骤按钮添加 title 属性 | 1h |
| 2 | 创建 `TreeStatus` 组件显示"X/Y 已确认" | 2h |
| 3 | "创建项目"按钮 disabled 时设置 title | 1h |
| 4 | gstack browse 验收测试 | 1h |

**预计工时**: ~5h

---

## 7. 总工时估算

| Epic | 功能 | 工时 |
|------|------|------|
| Epic 1 | 修复导入示例流程 | 5h |
| Epic 2 | 优化未登录引导 | 3h |
| Epic 3 | 优化步骤引导 | 5h |
| **总计** | | **~13h** |

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 示例数据与实际 types 不匹配 | 低 | 高 | 对齐 `types.ts` 接口定义后创建 JSON |
| `areAllConfirmed` 逻辑变更影响验收 | 中 | 高 | 添加集成测试覆盖 |
| 后续 AI 生成覆盖示例数据 | 低 | 中 | 示例模式使用独立 store branch |
| 页面重构导致 data-testid 失效 | 中 | 中 | 使用稳定的选择器策略 |

---

## 9. 成功标准

### 必须达成 (Must)
- [ ] `F-1.2` 验收: 点击"导入示例"后三树各有 ≥1 节点
- [ ] `F-1.3` 验收: 示例数据加载后"创建项目"按钮 enabled

### 应该达成 (Should)
- [ ] `F-2.1` 验收: 未登录用户看到 toast 提示
- [ ] `F-2.2` 验收: 跳过 intro 后"开始使用"可点击

### 可以达成 (Could)
- [ ] `F-3.1` 验收: 禁用步骤有 tooltip
- [ ] `F-3.2` 验收: 三树显示进度
- [ ] `F-3.3` 验收: 按钮 disabled 有原因

---

## 10. 下一步

> **传递条件**: PRD 审核通过后 → Architect 进行架构设计  
> **产出物**: `architecture.md`（数据流图、组件改造计划、测试策略）
