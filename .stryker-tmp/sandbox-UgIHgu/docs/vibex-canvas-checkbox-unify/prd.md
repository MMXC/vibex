# PRD: VibeX Canvas 卡片 Checkbox 勾选逻辑统一

> **项目**: vibex-canvas-checkbox-unify
> **创建日期**: 2026-03-30
> **类型**: Bug 修复
> **状态**: Draft
> **负责人**: PM Agent

---

## 1. 执行摘要

### 背景
Canvas 页面存在 5 个 checkbox 相关问题，根因分为两类：**状态管理缺失**和**设计意图混淆**。

### 目标
- 修复 P0 问题（checkbox 无法取消勾选）
- 统一 checkbox 行为和视觉
- 澄清多选 vs 确认的语义

### 关键指标
| 指标 | 目标 |
|------|------|
| P0 问题解决率 | 100% |
| P1 问题解决率 | 100% |
| P2 问题解决率 | 0%（延期评估） |

---

## 2. Epic 拆分

### Epic 1: 上下文树 Checkbox Toggle 修复（P0）

**目标**: 修复 `confirmContextNode` 只支持确认、无法取消的问题

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F1.1 | Toggle 函数实现 | 将 `confirmContextNode` 改为 toggle 逻辑 | `expect(canvasStore.confirmContextNode(id).confirmed).toBe(false)` after second click | P0 |
| F1.2 | 状态联动 | 状态变更后，上下文树进度正确更新 | `expect(progress).toEqual(expectedConfirmedCount)` | P0 |
| F1.3 | 单元测试 | 覆盖 toggle 逻辑的边界情况 | `expect(tests).toPass()` | P1 |

**DoD for Epic 1**:
- [ ] 第一次点击 confirmed: true
- [ ] 第二次点击 confirmed: false
- [ ] 进度正确更新

---

### Epic 2: 流程卡片 Checkbox 语义澄清（P0）

**目标**: 澄清 FlowCard checkbox 的多选语义，添加工具提示

**故事点**: 1h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F2.1 | 工具提示 | FlowCard checkbox 点击时显示"用于批量选择，非确认操作" | `expect(tooltip).toContain('批量选择')` | P0 |
| F2.2 | 工具栏联动 | 选中多个 FlowCard 后，工具栏出现"删除所选"按钮 | `expect(deleteBtn).toBeVisible()` | P0 |
| F2.3 | 步骤确认分离 | 步骤确认由独立按钮操作，不受 FlowCard checkbox 影响 | `expect(stepConfirmed).not.toChangeWith(flowCardCheckbox)` | P0 |

**DoD for Epic 2**:
- [ ] 工具提示正确显示
- [ ] 多选后有批量操作入口
- [ ] 语义分离清晰

---

### Epic 3: 分组批量确认功能（P1）

**目标**: 在组件树分组中添加"确认全部"按钮

**故事点**: 2h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F3.1 | 确认全部按钮 | 每个分组标签旁显示"✓ 确认全部"按钮 | `expect(btn).toBeVisible()` | P1 |
| F3.2 | 批量确认逻辑 | 点击后组内所有 confirmed: false 变为 true | `expect(allConfirmed).toBe(true)` | P1 |
| F3.3 | 递归确认 | 组内有子分组时，递归确认所有子节点 | `expect(subGroupsConfirmed).toBe(true)` | P1 |

**DoD for Epic 3**:
- [ ] 按钮在分组标签旁
- [ ] 点击后全部确认
- [ ] 递归处理子分组

---

### Epic 4: Checkbox 组件统一（P1）

**目标**: 统一 CardTreeNode 的 checkbox 行为，实现状态更新

**故事点**: 3h

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F4.1 | 状态更新回调 | 实现 `handleCheckboxToggle` 实际更新父组件状态 | `expect(state).toUpdate()` on toggle | P1 |
| F4.2 | CheckboxIcon 统一 | 所有树中保持一致外观 | `expect(icon).toMatchStyle()` | P1 |
| F4.3 | Undo/Redo 支持 | 状态变更有 undo/redo 支持 | `expect(history).toContainStates()` | P2 |

**DoD for Epic 4**:
- [ ] CardTreeNode checkbox 可更新状态
- [ ] 视觉统一
- [ ] undo/redo 正常

---

### Epic 5: 自由拖动架构评估（P2）

**目标**: 评估水平拖动能力，给出独立 Epic 建议

**故事点**: 2h（评估）

| Story ID | 功能 | 描述 | 验收标准 | 优先级 |
|----------|------|------|----------|--------|
| F5.1 | 架构评估报告 | 评估当前 Flexbox/dnd-kit 限制 | `expect(report).toExist()` | P2 |
| F5.2 | 独立 Epic 建议 | 如需支持，估算工时并创建 backlog 项 | `expect(backlogItem).toBeCreated()` | P2 |

**DoD for Epic 5**:
- [ ] 评估报告完成
- [ ] backlog 项已创建（如需要）

---

## 3. UI/UX 流程

### Checkbox 交互流程（修复后）

```
用户点击 Checkbox
    ↓
判断组件类型
    ↓
ContextCard → toggle confirmed 状态
    ↓
FlowCard → 显示工具提示 → 添加到 selectedNodeIds
    ↓
ComponentCard → toggle confirmed 状态（组内全部）
    ↓
CardTreeNode → 调用 onCheckboxToggle 回调
    ↓
状态更新 → 进度刷新
```

---

## 4. 验收标准汇总

### P0
| ID | Given | When | Then |
|----|-------|------|------|
| AC1.1 | 上下文卡片 | 第一次点击 checkbox | confirmed: true，绿色 |
| AC1.2 | 上下文卡片 | 第二次点击 checkbox | confirmed: false，恢复原色 |
| AC2.1 | FlowCard checkbox | hover | 显示工具提示"用于批量选择" |
| AC2.2 | 选中多个 FlowCard | 查看工具栏 | 出现"删除所选"按钮 |
| AC2.3 | 步骤确认 | 点击 FlowCard checkbox | 步骤 confirmed 状态不变 |

### P1
| ID | Given | When | Then |
|----|-------|------|------|
| AC3.1 | 组件树分组 | 查看分组标签 | 有"✓ 确认全部"按钮 |
| AC3.2 | 点击确认全部 | - | 组内所有节点 confirmed: true |
| AC4.1 | CardTreeNode | 点击 checkbox | 状态实际更新 |
| AC4.2 | CheckboxIcon | 不同组件 | 视觉一致 |

### P2
| ID | Given | When | Then |
|----|-------|------|------|
| AC5.1 | 架构评估 | 完成评估 | 报告存在且完整 |
| AC5.2 | Backlog | 需要支持时 | Epic backlog 项存在 |

---

## 5. 明确排除项

| 排除项 | 原因 |
|--------|------|
| 自由拖动实现 | 属于独立 Epic，延期 |
| 响应式布局改动 | 不在本次范围 |

---

## 6. 非功能需求

| 需求 | 标准 |
|------|------|
| 性能 | 状态更新 < 16ms（60fps） |
| 测试覆盖 | toggle 逻辑 100% 覆盖 |
| 兼容性 | Chrome 90+, Edge 90+ |

---

## 7. 快速验收单

```bash
# 问题1: Toggle 逻辑
grep -n "confirmed: !n.confirmed" canvasStore.ts

# 问题2: 工具提示
grep -n "批量选择" BusinessFlowTree.tsx

# 问题3: 确认全部按钮
grep -n "确认全部" ComponentTree.tsx

# 问题5: 状态更新
grep -n "handleCheckboxToggle" CardTreeNode.tsx
```

---

## 8. 工作量估算

| Epic | 工时 |
|------|------|
| Epic 1: Toggle 修复 | 2h |
| Epic 2: 语义澄清 | 1h |
| Epic 3: 分组批量确认 | 2h |
| Epic 4: Checkbox 统一 | 3h |
| Epic 5: 架构评估 | 2h |
| **总计** | **10h（约 2 天）** |

---

**文档版本**: v1.0
**下次审查**: 2026-03-31
