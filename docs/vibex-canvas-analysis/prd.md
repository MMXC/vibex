# PRD: VibeX 画布到创建项目流程修复

**Project**: vibex-canvas-analysis  
**Agent**: PM  
**Date**: 2026-03-27  
**Status**: Draft → Ready for Architecture Review  
**Workspace**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 背景
VibeX 新画布（/canvas）存在多个阻断性 UX 问题：用户无法通过"导入示例"体验完整流程，"创建项目"按钮始终禁用。这些问题导致用户无法完成从需求录入到项目创建的闭环。

### 目标
修复画布核心交互流程，确保示例数据可正常加载，"创建项目"按钮在数据就绪后可用，同时改善未登录引导和 onboarding 体验。

### 成功指标

| 指标 | 目标值 | 验证方式 |
|------|--------|----------|
| 导入示例后三树节点数 | ≥ 1 个/树 | gstack snapshot 计数 |
| "创建项目"按钮状态 | enabled（示例数据加载后）| `is enabled` 断言 |
| 未登录提示显示率 | 100%（点击开始使用时）| gstack dialog check |
| Onboarding 遮挡修复率 | 100%（跳过 intro 后）| gstack click 验证 |
| 步骤进度条引导覆盖率 | 100%（禁用步骤有 tooltip）| gstack hover check |
| 三树确认状态可见性 | 显示 X/Y 已确认 | gstack text check |

---

## 2. 功能需求

### Epic 1: 示例数据导入流程修复（P0）

**目标**: 修复"导入示例"按钮不加载数据的根因，确保"创建项目"按钮在示例数据就绪后可用。

#### F1.1 示例数据文件创建
- **描述**: 创建本地 JSON 示例数据文件，预设三树节点（context/flow/component），所有节点预设 `confirmed=true`
- **文件路径**: `public/data/sample-canvas.json`
- **验收标准**:
  - `expect(require('../public/data/sample-canvas.json')).toHaveProperty('contexts')`
  - `expect(sample.contexts.length).toBeGreaterThan(0)`
  - `expect(sample.flows.length).toBeGreaterThan(0)`
  - `expect(sample.components.length).toBeGreaterThan(0)`
- **DoD**: JSON 文件符合 `types.ts` 接口定义，所有节点 `confirmed=true`
- **依赖**: 无
- **页面集成**: 无

#### F1.2 "导入示例"按钮逻辑修复
- **描述**: 修改"导入示例"按钮 onClick，从只切换 phase 改为完整加载示例数据到 store
- **文件**: `src/pages/CanvasPage.tsx`
- **验收标准**:
  - `expect(fireEvent.click(screen.getByText(/导入示例/))).toChangeTreeState()`
  - `expect(getContextNodes().length).toBeGreaterThan(0)`
  - `expect(getFlowNodes().length).toBeGreaterThan(0)`
  - `expect(getComponentNodes().length).toBeGreaterThan(0)`
- **DoD**: 点击后三树均有节点，且节点 `confirmed=true`
- **依赖**: F1.1
- **页面集成**: ✅ 【需页面集成】`/canvas` 页面

#### F1.3 "创建项目"按钮状态联动
- **描述**: 当三树节点数 > 0 且 `areAllConfirmed()` 返回 true 时，按钮变为 enabled
- **文件**: `src/components/ProjectBar.tsx`
- **验收标准**:
  - `expect(sampleDataLoaded && allConfirmed).toBe(true) → button.disabled === false`
  - `expect(sampleDataLoaded && !allConfirmed).toBe(true) → button.disabled === true`
- **DoD**: 示例数据加载后按钮可用，禁用时显示原因 tooltip
- **依赖**: F1.2
- **页面集成**: ✅ 【需页面集成】ProjectBar 组件

---

### Epic 2: 登录引导与 Onboarding 优化（P1）

**目标**: 未登录用户点击"开始使用"时有明确提示，跳过 intro 后按钮可正常点击。

#### F2.1 未登录拦截提示
- **描述**: 未登录用户点击"开始使用"时，显示 toast 或 modal 提示"请先登录"
- **文件**: `src/pages/IndexPage.tsx`
- **验收标准**:
  - `expect(unauthenticatedClick('开始使用')).toShowDialog(/登录|login/i)`
  - `expect(page.url).not.toMatch(/\/canvas/)`
- **DoD**: 提示文案明确，不自动跳转
- **依赖**: 无
- **页面集成**: ✅ 【需页面集成】首页

#### F2.2 OnboardingProgressBar 遮挡修复
- **描述**: 跳过 intro 后，确保 OnboardingProgressBar 不再拦截"开始使用"按钮的点击事件
- **文件**: `src/components/OnboardingProgressBar.tsx`
- **验收标准**:
  - `expect(clickSkipIntro()).toEnableClick('开始使用')`
  - `expect(fireEvent.click(getByText('开始使用'))).not.toThrow()`
- **DoD**: 跳过 intro 后按钮点击无 JS 错误
- **依赖**: 无
- **页面集成**: ✅ 【需页面集成】首页

---

### Epic 3: 步骤进度条引导增强（P2）

**目标**: 禁用步骤显示前置条件 tooltip，首个可点击步骤有视觉引导。

#### F3.1 禁用步骤前置条件提示
- **描述**: 步骤 2-5 禁用时，悬停显示 tooltip 说明前置条件（如"请先完成需求录入"）
- **文件**: `src/components/StepProgressBar.tsx`
- **验收标准**:
  - `expect(hoverDisabledStep(2)).toShowTooltip(/需求录入/)`
  - `expect(hoverDisabledStep(3)).toShowTooltip(/需求澄清/)`
- **DoD**: 每个禁用步骤的 tooltip 说明正确的顺序前置条件
- **依赖**: 无
- **页面集成**: ✅ 【需页面集成】StepProgressBar 组件

#### F3.2 首个步骤视觉引导
- **描述**: 首个可点击步骤（需求录入）有脉冲动画或高亮边框
- **验收标准**:
  - `expect(getByTestId('step-1')).toHaveClass(/pulse|highlight|active/)`
- **DoD**: 视觉引导在页面加载后 1 秒内出现
- **依赖**: 无
- **页面集成**: ✅ 【需页面集成】StepProgressBar 组件

---

### Epic 4: 三树状态可视性增强（P2）

**目标**: 三树面板显示确认进度，"创建项目"按钮禁用原因明确。

#### F4.1 三树确认进度显示
- **描述**: 三树面板底部显示"X/Y 已确认"状态，让用户直观感知进度
- **文件**: `src/components/TreePanel.tsx`
- **验收标准**:
  - `expect(getByText(/已确认 \d+\/\d+/)).toBeInTheDocument()`
  - `expect(afterConfirmNode).toUpdateText(/已确认 \d+\/\d+/)`
- **DoD**: 确认节点后，计数实时更新
- **依赖**: 无
- **页面集成**: ✅ 【需页面集成】TreePanel 组件

#### F4.2 按钮禁用原因 tooltip
- **描述**: "创建项目"按钮 disabled 时，悬停显示具体原因（哪个树为空 / 未确认节点数量）
- **文件**: `src/components/ProjectBar.tsx`
- **验收标准**:
  - `expect(hoverDisabledButton()).toShowTitle(/业务流程.*空|未确认 \d+/)`
  - `expect(tooltip).toMatch(/请先|未确认/)`
- **DoD**: tooltip 显示具体缺失项，而非泛泛的"请先确认所有三树节点"
- **依赖**: F1.3
- **页面集成**: ✅ 【需页面集成】ProjectBar 组件

---

## 3. UI/UX 流程

```
用户进入首页 (/)
    │
    ├─ [未登录] 点击"开始使用"
    │       └─ → 显示 toast/modal "请先登录" (Epic 2)
    │
    ├─ [已登录] 点击"开始使用"
    │       └─ → 跳转到 /canvas (Phase: input)
    │
    └─ [Onboarding 存在] 进度条遮挡
            └─ [跳过 intro] → 按钮可点击 (Epic 2)

用户进入画布页面 (/canvas)
    │
    ├─ [输入需求 + 生成] 正常流程
    │
    ├─ [点击"导入示例"] → 加载 sample-canvas.json → 三树显示数据
    │       └─ [确认节点后] "创建项目"按钮 enabled
    │
    └─ [未导入示例] → 三树为空 → 按钮禁用 + tooltip 说明原因
            └─ [导入后] → 按钮 enabled

三树节点确认 → 进度显示 X/Y 已确认 → 按钮 enabled → 创建项目
```

---

## 4. Epic 优先级矩阵

| Epic | 优先级 | 工作量 | 风险 | 决策 |
|------|--------|--------|------|------|
| Epic 1: 示例数据导入修复 | P0 | 中 | 低 | 立即执行 |
| Epic 2: 登录引导与 Onboarding | P1 | 低 | 低 | 下个迭代 |
| Epic 3: 步骤进度条引导 | P2 | 低 | 低 | 规划中 |
| Epic 4: 三树状态可视性 | P2 | 低 | 低 | 规划中 |

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **兼容性** | 示例数据 JSON 与 `types.ts` 接口严格对齐 |
| **可测试性** | 每个功能点有 Playwright/gstack 测试覆盖 |
| **回归保护** | 现有正常流程（手动输入 + AI 生成）不受影响 |
| **无障碍** | 按钮 disabled 状态需提供 aria-disabled 和 tooltip |
| **性能** | 示例数据加载 < 100ms，不触发额外 AI 调用 |

---

## 6. 验收标准总览

### P0 — 必须交付
- [ ] `expect(fireEvent.click(getByText('导入示例'))).toLoadNodes(contexts ≥ 1, flows ≥ 1, components ≥ 1)`
- [ ] `expect(allConfirmed && nodesExist).toBe(true) → projectButton.disabled === false`
- [ ] gstack snapshot 验证三树均有节点

### P1 — 下个迭代
- [ ] 未登录点击"开始使用"显示 toast/modal
- [ ] 跳过 intro 后"开始使用"可正常点击

### P2 — 规划中
- [ ] 禁用步骤显示前置条件 tooltip
- [ ] 三树面板显示"X/Y 已确认"计数
- [ ] 按钮 disabled 时 tooltip 说明具体原因

---

## 7. 依赖项

| 上游产物 | 状态 |
|----------|------|
| analysis.md | ✅ 已完成（6 issues: 2 P0, 2 P1, 2 P2） |

| 下游等待 | 状态 |
|----------|------|
| architecture.md | ⏳ 待 architect |
| IMPLEMENTATION_PLAN.md | ⏳ 待 architect |

---

*本 PRD 由 PM Agent 基于 analyst 的 analysis.md 自动生成*
*验收标准支持 expect() 断言格式，可直接用于 Playwright 测试*
