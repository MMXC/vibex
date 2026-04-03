# PRD: 首页 AI 思考过程进度条与 Mermaid 渲染修复

**项目**: vibex-mermaid-progress-bug
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

首页生成限界上下文后，AI 思考过程进度条停留在 67%，且 Mermaid 图表未渲染。

### 目标

修复进度条计算逻辑和 Mermaid 渲染条件。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 进度条完成率 | 100% |
| Mermaid 渲染成功率 | ≥ 95% |

---

## 2. 问题陈述

### 2.1 用户痛点

- 生成完成后进度条显示 67%，用户误以为未完成
- Mermaid 图表不显示，用户无法查看结果

### 2.2 根因

| 问题 | 根因 |
|------|------|
| 进度条 67% | `totalSteps` 硬编码为 3，后端可能只发送 2 个事件 |
| Mermaid 未渲染 | 空值检查过严，或 hook 未返回 mermaidCode |

---

## 3. 功能需求

### F1: 进度条修复

**描述**: 进度条在 SSE 完成时显示 100%

**验收标准**:
- AC1.1: `status === 'done'` 时进度条显示 100%
- AC1.2: SSE 过程中进度基于实际 steps 计算
- AC1.3: 错误时进度条重置为 0%

### F2: Mermaid 渲染修复

**描述**: 放宽空值检查，确保 hook 返回 mermaidCode

**验收标准**:
- AC2.1: `streamStatus === 'done'` 时设置 mermaidCode
- AC2.2: 空 AI 结果时显示友好提示
- AC2.3: 所有 hooks 的 done 事件都设置 mermaidCode

---

## 4. Epic 拆分

### Epic 1: 进度条逻辑修复

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 修改进度计算依赖 status | expect(progress).toBe(100).when(status === 'done') |
| S1.2 | 处理错误状态进度重置 | expect(progress).toBe(0).when(status === 'error') |

---

### Epic 2: Mermaid 渲染修复

**负责人**: Dev | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 放宽空值检查条件 | expect(mermaidCode).toBeSet().when(streamStatus === 'done') |
| S2.2 | 确保 hooks 返回 mermaidCode | expect(hookReturn).toHaveProperty('mermaidCode') |
| S2.3 | 添加空结果友好提示 | expect(emptyState).toShowMessage() |

---

## 5. 实施计划

| 阶段 | 任务 | 预估 |
|------|------|------|
| Phase 1 | 进度条修复 | 1h |
| Phase 2 | Mermaid 渲染修复 | 1h |
| Phase 3 | 测试验证 | 0.5h |

**总计**: 2.5h

---

## 6. 验收 CheckList

- [ ] AC1.1: 完成时进度 100%
- [ ] AC1.2: 过程中进度动态计算
- [ ] AC1.3: 错误时进度重置
- [ ] AC2.1: done 时设置 mermaidCode
- [ ] AC2.2: hooks 返回 mermaidCode
- [ ] AC2.3: 空结果友好提示

---

**DoD**:
1. 代码合并
2. 手动测试通过
3. 无回归问题