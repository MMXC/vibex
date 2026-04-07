# Analysis: 提案收集 — 为下一轮开发做准备

> **任务**: proposal-collection-20260330/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: proposal-collection-20260330
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

汇总今日（2026-03-30）分析任务中发现的问题和改进机会，提出下一轮开发的优先提案。

---

## 2. 今日分析总结

### 2.1 已完成分析（6个任务）

| 项目 | 问题 | 推荐方案 | 优先级 |
|------|------|---------|--------|
| `vibex-canvas-checkbox-dedup` | 卡片双重 checkbox 混乱 | 移除 selection checkbox，保留确认状态 | P1 |
| `vibex-component-tree-page-classification` | AI 生成组件 flowId 不匹配 → "未知页面" | 修复 AI 生成阶段 flowId 填充 | P1 |
| `vibex-component-tree-grouping` | 所有组件归入"通用组件"（flowId='common'） | 同上，AI 生成阶段修复 | P1 |
| `vibex-bc-canvas-edge-render` | BC 树连线全部堆叠在垂直线上 | CSS 改为水平/网格布局 | P1 |
| `vibex-bounded-edge-rendering` | 同上（同一根因） | 同上 | P1 |
| `task-manager-curl-integration` | task_manager 无实时通知机制 | 内置 curl Slack 通知 | P2 |

### 2.2 进行中项目遗留（来自 vibex-canvas-continu）

| Bug | 描述 | 状态 |
|-----|------|------|
| B1 | `disabled={allConfirmed}` 阻塞 `handleConfirmAll()` | Dev 任务待领取 |
| B2.1 | `OverlapHighlightLayer` 存在但未导入 | Dev 任务待领取 |
| B2.2 | 起止节点标记代码不存在 | Dev 任务待领取 |

### 2.3 长期路线图（来自 canvas-phase2）

| Phase | 内容 | 工时 |
|-------|------|------|
| Phase2a | 全屏展开（expand-both + maximize）+ 交集高亮 | ~8h |
| Phase2b | 完整关系可视化（relationship visualization） | ~16h |

---

## 3. 下一轮开发提案

### 提案 1：Canvas Bug 修复 Sprint（建议优先）

**包含**：
- B1: `disabled={allConfirmed}` 逻辑修复
- B2.1: `OverlapHighlightLayer` 集成
- B2.2: 起止节点标记实现
- Checkbox 去重（vibex-canvas-checkbox-dedup）
- BC 树连线布局修复（vibex-bc-canvas-edge-render）
- 组件树分类修复（vibex-component-tree-*）

**理由**：均为 P1 问题，影响核心用户流程；工时集中（预计 15-20h），适合作为一个 sprint 集中完成。

**验收标准**：
- [ ] B1 按钮在所有节点确认后可点击，点击后跳转流程树
- [ ] B2.1 交集高亮层在组件树渲染
- [ ] B2.2 起止节点有特殊视觉标记
- [ ] 卡片无双重 checkbox
- [ ] BC 树连线不堆叠成单条线
- [ ] 组件树无"未知页面"/"通用组件"错误分类

---

### 提案 2：Task Manager 通知基础设施

**内容**：`task_manager.py` 内置 curl Slack 通知
**工时**：7h
**价值**：提升团队协作实时性，减少对心跳的依赖

**验收标准**：
- [ ] phase1/phase2 执行后自动通知首个 agent
- [ ] update done 后自动通知下一 agent
- [ ] update pending \<reason\> 后自动发送驳回通知

---

### 提案 3：Canvas Phase2 全屏展开

**内容**：Phase2a 全屏展开模式
**工时**：8h
**F1 约束**：全屏 = 可编辑画布模式（非只读）

**验收标准**：
- [ ] `expand-both` 模式下三栏同时展开
- [ ] `maximize` 模式工具栏隐藏、全屏
- [ ] F11/ESC 快捷键正常
- [ ] 状态持久化到 localStorage

---

## 4. 快速验收单（提案 1 必检）

以下问题需要在 sprint 开始前确认已修复：

- [ ] B1: `grep -n "disabled={allConfirmed}" BoundedContextTree.tsx` → 已移除或修改
- [ ] B2.1: `grep -n "OverlapHighlightLayer" CardTreeRenderer.tsx` → 有导入
- [ ] Checkbox: `grep -n "selectionCheckbox" BoundedContextTree.tsx` → 无 selectionCheckbox
- [ ] BC Edge: `grep -n "flex-direction.*column" canvas.module.css` → 无垂直布局
- [ ] Component: `grep -rn "未知页面" ComponentTree.tsx` → 仅 fallback 路径

---

## 5. 总结

| 提案 | 优先级 | 工时 | 依赖 |
|------|--------|------|------|
| Canvas Bug Sprint | ★★★ P0 | ~15-20h | 无 |
| Task Manager 通知 | ★★ P1 | 7h | 无 |
| Canvas Phase2 全屏 | ★★ P1 | 8h | Phase1 完成 |

**建议**：先完成提案 1（Bug Sprint），消除 product-blocking 问题，再推进提案 2/3。

---

## Coord-Decision 补充记录

**补充时间**: 2026-03-30 03:22
**问题**: 原 coord-decision 未明确决策就关闭了项目

### 决策内容

| 提案 | 决策 | 原因 |
|------|------|------|
| 卡片双重 checkbox 去重 | ✅ **已执行** → `vibex-canvas-checkbox-dedup` | P1，用户痛点 |
| 组件 flowId 修复 | ✅ **已执行** → `vibex-component-tree-page-classification` | P1，AI 生成依赖 |
| 组件树分组问题 | ✅ **已执行** → `vibex-component-tree-grouping` | P1，显示异常 |
| BC 连线堆叠 | ✅ **已执行** → `vibex-bc-canvas-edge-render` | P1，同根因 |
| task-manager curl 通知 | ✅ **已执行** → `task-manager-curl-integration` | P2，效率提升 |

### 结论

**决策：开启全部提案的开发**（除了已进行的项目自动继承外，新发现的 bug 均已创建 phase1 任务链）。原项目 coord-decision 实际上是 **"同意执行"**，只是没有明确记录。

### 教训

1. coord-decision 必须明确写 "开" 或 "不开 + 理由"
2. 不能只收集就关，必须有 action item 或明确的 no-action 决策
3. 后续 phase1 的 coord-decision 要强制要求：决策后不立即 close，而是根据决策创建后续任务或明确标记 terminated with reason
