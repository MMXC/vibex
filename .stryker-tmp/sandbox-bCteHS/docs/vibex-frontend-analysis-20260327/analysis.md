# Analysis: VibeX 新画布到创建项目流程分析

**Agent**: Analyst  
**Date**: 2026-03-27  
**Project**: vibex-canvas-analysis  
**目标**: 分析 VibeX 新画布到创建项目流程的前端页面问题及优化建议

---

## 1. 业务场景分析

### 用户流程
```
首页 (/) 
  → "开始使用" (→ 需登录)
  → 需求录入页面 (/ 或 /canvas?phase=input)
  → 输入需求或导入示例
  → AI 生成三树 (限界上下文 / 业务流程 / 组件树)
  → 用户确认节点
  → 创建项目
  → 原型生成
```

### 目标用户
- 产品经理：快速建模，生成原型
- 创业者：低成本验证产品概念
- 开发团队：DDD 建模与前端原型联动

### 核心价值
- **零门槛启动**：输入需求即可获得 DDD 模型
- **所见即所得**：三树可视化 + 原型生成闭环
- **协作式设计**：用户深度参与每一步确认

---

## 2. 问题发现（gstack 实际测试）

> 测试环境: vibex-app.pages.dev，headless browser (gstack browse)  
> 测试时间: 2026-03-27

### P0 — 阻断性问题

#### Q1: "导入示例"按钮不加载数据
**位置**: `/canvas` 页面 → "导入示例" 按钮  
**现象**: 点击后页面跳转到 context phase，但三个树均为 0/0 节点，"创建项目" 按钮持续禁用。

**根因定位** (`CanvasPage.tsx`):
```tsx
// "导入示例" 按钮的 onClick:
onClick={() => setPhase('context')}  // 只切换 phase，不加载数据！
```

**对比**: "启动画布 →" 按钮有完整的数据加载逻辑:
```tsx
onClick={() => {
  setRequirementText(requirementInput);
  generateContexts(requirementInput);  // 实际调用 AI 生成
}}
```

**影响**: 用户无法通过示例数据体验完整流程，"创建项目" 永远禁用。

**验收标准**:
- [ ] 点击"导入示例"后，三个树面板均有 ≥1 个节点
- [ ] "创建项目" 按钮在示例数据加载后变为可用状态

---

#### Q2: "创建项目"按钮始终禁用
**位置**: Canvas 顶部 ProjectBar  
**现象**: 无论三树是否有数据，"🚀 创建项目" 按钮始终灰色禁用，title 提示"请先确认所有三树节点"。

**根因定位** (`ProjectBar.tsx`):
```tsx
const allConfirmed = areAllConfirmed(contextNodes) && areAllConfirmed(flowNodes) && areAllConfirmed(componentNodes)
  && contextNodes.length > 0 && flowNodes.length > 0 && componentNodes.length > 0;
// allConfirmed 为 false → 按钮 disabled
```

**与 Q1 的关系**: Q1 导致三树为空 → `allConfirmed` 恒为 false → 按钮禁用。

**验收标准**:
- [ ] 导入有效示例数据后，"创建项目" 按钮变为 enabled
- [ ] 按钮禁用时，鼠标悬停显示具体缺失项（如"业务流程树为空，请先生成流程"）

---

### P1 — 重要问题

#### Q3: "开始使用"需要登录但无提示
**位置**: 首页 "开始使用" 按钮  
**现象**: 未登录用户点击后页面跳转到 `/`（登录页），但没有任何提示说明需要登录。

**验收标准**:
- [ ] 未登录用户点击"开始使用"时，显示 toast 或 modal 提示"请先登录"
- [ ] 或者提供游客模式（只读体验）

---

#### Q4: OnboardingProgressBar 遮挡"开始使用"按钮
**位置**: 首页顶部进度条  
**现象**: 当 intro overlay 存在时，`OnboardingProgressBar` 组件拦截了"开始使用"按钮的点击事件，导致用户无法点击。

**Playwright 日志**:
```
<div class="OnboardingProgressBar-module__OHN9aW__container">…</div> intercepts pointer events
```

**验收标准**:
- [ ] 跳过 intro 后（点击"跳过介绍"），"开始使用"按钮可正常点击

---

### P2 — 体验问题

#### Q5: 步骤进度条缺少引导
**现象**: 5 个步骤按钮（需求录入/需求澄清/业务流程/组件图/原型生成）中，步骤 2-5 始终禁用显示为灰色，用户不知道需要按顺序完成。

**验收标准**:
- [ ] 禁用步骤显示 tooltip 说明前置条件（如"请先完成需求录入"）
- [ ] 首个可点击步骤有视觉高亮或脉冲动画

---

#### Q6: "创建项目"按钮禁用原因不明确
**现象**: 用户导入示例后发现按钮仍禁用，但不知道具体原因（节点数？未确认？）。

**验收标准**:
- [ ] 按钮 disabled 时，悬停显示具体原因（哪个树为空 / 未确认节点数量）
- [ ] 三树面板显示当前状态（0/3 已确认）让用户直观感知进度

---

## 3. 方案对比

### Q1+Q2 联合方案

#### 方案 A: 修复"导入示例" + 示例数据文件（推荐）
**思路**: 为"导入示例"添加完整的数据加载逻辑，使用本地 JSON 示例数据。

| 行动 | 工作量 | 风险 |
|------|--------|------|
| A1. 创建示例数据 JSON 文件 | 1h | 低 |
| A2. 修改"导入示例"按钮逻辑，加载示例数据到 store | 2h | 低 |
| A3. 确保示例数据满足 `allConfirmed` 检查（预设 confirmed=true）| 1h | 低 |
| A4. 验收测试 | 1h | 低 |

**预计工时**: ~5h  
**优点**: 修复彻底，用户体验流畅  
**缺点**: 示例数据需要维护

#### 方案 B: 临时 hack — "导入示例" 预设 confirmed=true 节点
**思路**: 在 `setPhase('context')` 后，用 `setContextNodes` 等方法直接写入预设节点。

**预计工时**: ~2h  
**优点**: 快速见效  
**缺点**: 违反组件设计原则（直接在按钮里操作 store），难以维护

#### 方案 C: 移除"导入示例"按钮，改为使用真实 AI 生成示例
**思路**: 点击"导入示例"时，调用 `generateContexts` 传入预设需求文本。

**预计工时**: ~3h  
**优点**: 复用现有 AI 生成逻辑  
**缺点**: 需要 AI API 支持，可能有延迟

---

### Q3 方案

#### 方案: 未登录拦截 + 游客模式
**预计工时**: 3h  
**优点**: 体验完整  
**缺点**: 游客模式需要额外实现

---

## 4. 推荐方案

**Q1+Q2**: 选择方案 A（修复导入示例 + 示例数据文件）

**Q3**: 提供登录提示 toast，暂时不实现游客模式（工作量较大）

**Q4**: 属于偶发问题，跳过 intro 后正常。确认点击"跳过介绍"后按钮可点击即可。

---

## 5. 验收标准

| ID | 验收条件 | 优先级 | 测试方式 |
|----|----------|--------|----------|
| V1 | 点击"导入示例"后，三树面板均有 ≥1 个节点 | P0 | gstack snapshot |
| V2 | 示例数据加载后，"创建项目"按钮变为 enabled | P0 | `is enabled @eN` |
| V3 | 未登录点击"开始使用"显示 toast 提示 | P1 | gstack click + dialog check |
| V4 | 跳过 intro 后"开始使用"可正常点击 | P1 | gstack click + no error |
| V5 | 三树面板显示"X/Y 已确认"状态 | P2 | gstack text check |
| V6 | "创建项目"按钮 disabled 时悬停显示具体原因 | P2 | gstack hover + title check |

---

## 6. 技术风险

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 示例数据与实际数据模型不匹配 | 低 | 高 | 对齐 `types.ts` 接口定义 |
| `areAllConfirmed` 逻辑变更影响验收 | 中 | 高 | 添加集成测试 |
| AI API 不可用时示例流程中断 | 低 | 中 | 示例模式绕过 AI 调用 |

---

## 7. 执行记录

- [x] 09:22 — 领取任务 `vibex-canvas-analysis/analyze-requirements`
- [x] 09:24 — gstack browse 测试首页 → 发现登录拦截、OnboardingProgressBar 遮挡
- [x] 09:26 — gstack browse 测试 /canvas → 发现"导入示例"不加载数据
- [x] 09:30 — 代码审查 `CanvasPage.tsx` + `ProjectBar.tsx` → 定位根因
- [x] 09:35 — 撰写 analysis.md
- [ ] — 通知 coord
