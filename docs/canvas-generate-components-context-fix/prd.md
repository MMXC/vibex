# PRD: Canvas Generate Components Context Fix

> **项目**: canvas-generate-components-context-fix  
> **目标**: 修复 BoundedContextTree checkbox 调用错误函数  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
BoundedContextTree checkbox 调用了 `toggleContextNode`（确认）而非 `onToggleSelect`（多选），导致上下文勾选无效。

### 关联项目
- 参考: `vibex-canvas-context-selection/analysis.md`（同一 Bug 的完整分析）

### 目标
- P0: 修复 BoundedContextTree checkbox 调用正确的选择函数

### 成功指标
- AC1: 点击 checkbox → `onToggleSelect` 被调用 → selectedNodeIds 更新
- AC2: 行为与 BusinessFlowTree checkbox 一致

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 |
|------|------|--------|------|
| E1 | BoundedContextTree checkbox 修复 | P0 | 0.3h |
| **合计** | | | **0.3h** |

---

### Epic 1: BoundedContextTree checkbox 修复

**问题根因**: `BoundedContextTree.tsx` 第 233 行 checkbox `onChange` 调用 `toggleContextNode` 而非 `onToggleSelect`。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | checkbox onChange 修复 | 0.3h | 见下方 AC |

**S1.1 验收标准**:
- `expect(onToggleSelect).toHaveBeenCalledWith(node.nodeId)` ✓
- 点击 checkbox → selectedNodeIds 包含 nodeId ✓
- `expect(toggleContextNode).not.toHaveBeenCalled()` （不再调用）✓

**DoD**:
- [ ] `BoundedContextTree.tsx` 第 233 行 `onChange` 改为 `onToggleSelect`
- [ ] 手动测试验证 checkbox 选择功能
- [ ] 与 BusinessFlowTree checkbox 行为一致

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | checkbox onChange 修复 | onChange 调用 onToggleSelect | E1 | expect(onToggleSelect).toHaveBeenCalled() | 【需页面集成】 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 点击 checkbox | BoundedContextTree | onToggleSelect(node.nodeId) 被调用 |
| AC2 | 点击 checkbox | BoundedContextTree | toggleContextNode 不被调用 |
| AC3 | 选择上下文 | 继续到组件树 | selectedNodeIds 包含选中的 nodeId |

---

## 5. DoD (Definition of Done)

### Epic 1: BoundedContextTree checkbox 修复
- [ ] `BoundedContextTree.tsx` checkbox `onChange` 改为 `onToggleSelect`
- [ ] 测试验证 checkbox 选择功能正常
- [ ] 与 BusinessFlowTree checkbox 行为一致

---

## 6. 实施计划

### Sprint 1 (0.3h)

| 阶段 | 内容 | 工时 |
|------|------|------|
| Phase 1 | E1: BoundedContextTree checkbox 修复 | 0.3h |

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 兼容性 | 不破坏 BoundedContextTree 其他功能 |
| 一致性 | 与 BusinessFlowTree checkbox 行为一致 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
