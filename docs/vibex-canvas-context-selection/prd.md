# PRD: VibeX Canvas Context Selection Bug 修复

> **项目**: vibex-canvas-context-selection  
> **目标**: 修复"继续到组件树"未发送选中上下文的问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
用户勾选上下文后点击"继续到组件树"，`BusinessFlowTree.tsx` 发送 ALL `contextNodes` 而非选中的 `selectedNodeIds`，导致上下文选择功能失效。

### 目标
- P0: 修复 `handleContinueToComponents` 读取 `selectedNodeIds`，发送选中上下文
- P1: 未选中时 fallback 发送全部上下文
- P1: 无上下文时显示错误提示

### 成功指标
- AC1: 选中上下文后继续 → API 发送选中的 contexts
- AC2: 未选中时 fallback → API 发送全部 contexts
- AC3: 无上下文时 → 显示 toast 错误提示

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联问题 |
|------|------|--------|------|----------|
| E1 | selectedNodeIds 读取修复 | P0 | 0.5h | 未读取选中状态 |
| E2 | 错误提示增强 | P1 | 0.5h | 无上下文时无反馈 |
| **合计** | | | **1h** | |

---

### Epic 1: selectedNodeIds 读取修复

**问题根因**: `BusinessFlowTree.tsx` 直接发送 `contextNodes.map()` 而非读取 `selectedNodeIds`。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | selectedNodeIds 读取 | 0.5h | 见下方 AC |

**S1.1 验收标准**:
- `expect(contextsToSend).toEqual(expect.arrayContaining(selected))` ✓
- `expect(contextsToSend.length).toBe(selectedContextSet.size)` when selected ✓
- fallback: 无选中时发送全部 `contextNodes` ✓

**DoD**:
- [ ] `BusinessFlowTree.tsx` 引入 `useContextStore` 的 `selectedNodeIds`
- [ ] `handleContinueToComponents` 使用 `selectedNodeIds.context` 过滤
- [ ] 与 `CanvasPage.tsx` 行为一致
- [ ] jest 或手动测试验证

---

### Epic 2: 错误提示增强

**问题根因**: 无上下文时点击继续无反馈，用户困惑。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Toast 错误提示 | 0.5h | 见下方 AC |

**S2.1 验收标准**:
- `expect(toastShown).toBe(true)` when contexts empty ✓
- toast 消息包含"请先生成上下文" ✓
- 点击继续后 `setComponentGenerating(false)` ✓

**DoD**:
- [ ] 添加空上下文检查
- [ ] 无上下文时显示 toast 错误
- [ ] 测试覆盖空上下文场景

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | selectedNodeIds 读取 | 发送选中的上下文 | E1 | expect(contextsToSend).toEqual(selected) | 【需页面集成】 |
| F1.2 | Fallback 全部 | 无选中时发送全部 | E1 | expect(contextsToSend.length).toBe(contextNodes.length) | 【需页面集成】 |
| F2.1 | Toast 错误提示 | 无上下文时提示 | E2 | expect(toastShown).toBe(true) | 【需页面集成】 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 选中 2 个上下文 | 点击"继续到组件树" | API bodies 包含 2 个选中 contexts |
| AC2 | 未选中任何上下文 | 点击"继续到组件树" | API bodies 包含全部 contexts |
| AC3 | 无上下文（contextNodes 空）| 点击"继续到组件树" | 显示 toast 错误，`setComponentGenerating(false)` |
| AC4 | 与 CanvasPage 行为一致 | 两个入口对比 | API bodies 相同 |

---

## 5. DoD (Definition of Done)

### Epic 1: selectedNodeIds 读取修复
- [ ] `BusinessFlowTree.tsx` 引入 `useContextStore`
- [ ] `handleContinueToComponents` 使用 `selectedNodeIds.context` 过滤
- [ ] fallback 逻辑：无选中时发送全部
- [ ] 与 `CanvasPage.tsx` 行为对齐

### Epic 2: 错误提示增强
- [ ] 空上下文检查
- [ ] `toast.showToast('请先生成上下文树', 'error')`
- [ ] `setComponentGenerating(false)` 防止 loading 状态

---

## 6. 实施计划

### Sprint 1 (1h)

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | E1: selectedNodeIds 修复 | 0.5h | BusinessFlowTree.tsx |
| Phase 2 | E2: Toast 错误提示 | 0.5h | 错误反馈 |

### 依赖关系
- E2 依赖 E1

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 兼容性 | 不破坏现有 CanvasPage 行为 |
| 用户体验 | 错误时明确提示，不静默失败 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| fallback 导致意外发送全部 | 最小修复后测试三种场景 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
