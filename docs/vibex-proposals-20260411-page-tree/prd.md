# PRD: 组件树按页面组织 — 修复 flowId 匹配问题

**项目**: vibex-proposals-20260411-page-tree
**状态**: Draft
**PM**: PM
**日期**: 2026-04-11

---

## 1. 执行摘要

### 背景
Canvas 编辑器的组件树当前按 `flowId` 分组，但 AI 生成组件时 `flowId` 填充不正确，导致组件被错误归入"通用组件"或"未知页面"。此问题历史遗留（2026-03-30 两份分析文档均提及），长期影响用户体验。

### 目标
- 修复 AI 生成阶段 `flowId` 填充逻辑，使组件正确归属到各页面
- 增强 `matchFlowNode()` 模糊匹配兜底能力
- 确保通用组件（modal/button）仍正确归入"通用组件"

### 成功指标
- AI 生成组件后，flowId 与实际 BusinessFlowNode 正确匹配
- 组件树页面组件不再显示"未知页面"
- matchFlowNode() prefix/名称匹配正确工作

---

## 2. Planning — Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时 |
|----|--------|------|----------|------|
| F1.1 | AI prompt 强化 flowId 填充 | 在 AI 生成 prompt 中增加 `flowId = BusinessFlow nodeId` 指令 | AI 生成阶段 flowId 填充不正确 | 1h |
| F1.2 | matchFlowNode() prefix 匹配增强 | 扩展 L2 prefix 匹配逻辑，支持更多格式 | 现有 fallback 匹配不够 | 0.5h |
| F1.3 | matchFlowNode() 名称模糊匹配增强 | 扩展 L3 名称匹配，覆盖更多命名变体 | 名称匹配覆盖不足 | 0.5h |
| F1.4 | 组件树分组回归验证 | 通用组件仍正确归入"通用组件" | 防止改动破坏现有逻辑 | 0.5h |
| F1.5 | 单元测试覆盖 | matchFlowNode 模糊匹配逻辑单元测试 | 无测试保护 | 0.5h |

**总工时**: 3h

---

## 3. Epic 拆分

### Epic 1: flowId 匹配修复

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|----------|
| S1.1 | AI prompt 强化 flowId 填充 | 1h | AI response 中 flowId 为有效 nodeId |
| S1.2 | matchFlowNode 模糊匹配增强 | 1h | prefix/名称匹配正确工作 |
| S1.3 | 组件树分组回归验证 | 0.5h | 通用组件仍正确归类 |
| S1.4 | 单元测试覆盖 | 0.5h | matchFlowNode 覆盖 ≥ 80% |

---

## 4. 验收标准

### Story S1.1: AI prompt 强化

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC1.1 | AI 生成组件请求 | prompt 含 flowId 指令 | response 中 flowId 为有效 BusinessFlow nodeId | 检查 AI response JSON |
| AC1.2 | AI 生成后 | 组件保存到 store | 组件的 flowId 与生成时一致 | 断点验证 |
| AC1.3 | flowId 填充失败时 | AI 返回 'common' | 组件正确归入通用组件（不触发"未知页面"） | UI 验证 |

### Story S1.2: matchFlowNode 模糊匹配增强

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC2.1 | flowId='flow-abc-123' | matchFlowNode(flowId, flowNodes) | 匹配 nodeId='flow-abc-123' 的节点 | 单元测试 |
| AC2.2 | flowId='abc' | 多个 nodeId 含 'abc' | 匹配第一个 prefix 匹配的节点 | 单元测试 |
| AC2.3 | flowId='登录流程' | flowNode.name='登录流程' | 匹配成功 | 单元测试 |
| AC2.4 | flowId='login-flow' | nodeId='LOGIN_FLOW_ID'（名称相关） | 匹配成功（名称模糊） | 单元测试 |

### Story S1.3: 组件树分组回归验证

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC3.1 | 组件 type='modal' | 组件树渲染 | 归入"通用组件" | UI 验证 |
| AC3.2 | 组件 type='button' | 组件树渲染 | 归入"通用组件" | UI 验证 |
| AC3.3 | 组件 flowId='common' | 组件树渲染 | 归入"通用组件" | UI 验证 |

### Story S1.4: 单元测试覆盖

| ID | Given | When | Then | 验证方式 |
|----|-------|------|------|----------|
| AC4.1 | 各种 flowId 输入 | matchFlowNode 执行 | 覆盖 ≥ 80% 分支路径 | 测试覆盖率报告 |
| AC4.2 | 边界情况 | 无 flowNodes / 空 flowId | 不抛异常，返回 null | 单元测试 |

**功能点验收汇总：**

| ID | 功能点 | 验收标准 | 页面集成 |
|----|--------|----------|----------|
| F1.1 | AI prompt 强化 flowId 填充 | expect(AI response flowId ∈ valid nodeIds) | 【需页面集成】AI prompt 模板 |
| F1.2 | matchFlowNode prefix 匹配增强 | expect(matchFlowNode 覆盖 90% 场景) | 【需页面集成】ComponentTree.tsx |
| F1.3 | matchFlowNode 名称模糊匹配增强 | expect(matchFlowNode 名称匹配率提升) | 【需页面集成】ComponentTree.tsx |
| F1.4 | 组件树分组回归验证 | expect(modal/button → 通用组件) | 【需页面集成】ComponentTree.tsx |
| F1.5 | 单元测试覆盖 | expect(coverage ≥ 80%) | 无 |

---

## 5. DoD (Definition of Done)

- [ ] AI 生成 prompt 已增加 `flowId = BusinessFlow nodeId` 指令
- [ ] `matchFlowNode()` 支持 prefix 匹配（flowId 前缀 → nodeId 前缀）
- [ ] `matchFlowNode()` 支持名称模糊匹配（flowId 部分文字 → flowNode.name 包含）
- [ ] 通用组件（type ∈ {modal, button, ...}）仍正确归入"通用组件"
- [ ] `matchFlowNode` 单元测试覆盖率 ≥ 80%
- [ ] 手动测试：AI 生成组件后，组件树显示正确页面名称（非"未知页面"）
- [ ] 提交 commit，message 包含 `fix(ComponentTree): improve flowId matching and AI prompt`

---

## 6. 实施信息

| 项目 | 值 |
|------|-----|
| 影响文件 | `src/components/canvas/ComponentTree.tsx`、AI prompt 模板 |
| 修改类型 | AI prompt 强化 + matchFlowNode 增强 + 测试 |
| 预计工时 | 3h |
| 风险等级 | 低 |
| 回归测试 | 通用组件归类、多 flowId 场景 |

---

## 7. 历史关联

- `docs/vibex-component-tree-page-classification/analysis.md` (2026-03-30)
- `docs/vibex-component-tree-grouping/analysis.md` (2026-03-30)
