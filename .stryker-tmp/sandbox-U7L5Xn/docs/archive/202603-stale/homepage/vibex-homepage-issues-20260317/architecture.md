# 首页问题修复 (20260317) 架构设计

**项目**: vibex-homepage-issues-20260317  
**架构师**: Architect Agent  
**日期**: 2026-03-17  
**状态**: ✅ 设计完成

---

## 一、说明

本项目与 `vibex-bounded-context-rendering-issues` 项目解决的问题完全相同：

| ID | 问题 |
|----|------|
| P0-1 | 限界上下文请求完成后图没有渲染 |
| P0-2 | 流程分析按钮无变化 |
| P0-3 | AI思考过程不是渐进式出结果 |

**解决方案**: 详见 `vibex-bounded-context-rendering-issues` 项目的架构文档。

---

## 二、引用文档

| 文档 | 位置 |
|------|------|
| 分析文档 | `docs/vibex-bounded-context-rendering-issues/analysis.md` |
| PRD | `docs/vibex-bounded-context-rendering-issues/prd.md` |
| 架构文档 | `docs/vibex-bounded-context-rendering-issues/architecture.md` |

---

## 三、修复方案摘要

### 3.1 P0-1: 限界上下文渲染

**问题**: `streamMermaidCode` 未正确同步到预览区域

**修复**: 确保 `streamMermaidCode` 状态同步到 `contextMermaidCode`

### 3.2 P0-2: 流程按钮

**问题**: `handleRequirementSubmit` 始终调用 `generateContexts`

**修复**: 使用 `handleGenerate` 根据 `currentStep` 调用不同函数

```typescript
const handleGenerate = useCallback(() => {
  switch (currentStep) {
    case 1: generateContexts(requirementText); break;
    case 2: generateDomainModels(requirementText, boundedContexts); break;
    case 3: generateBusinessFlow(domainModels); break;
  }
}, [currentStep, ...]);
```

### 3.3 P0-3: 渐进式思考

**问题**: `thinkingMessages` 被解构为 `_ctxMessages`（未使用）

**修复**: 
1. 保留 `thinkingMessages` 状态
2. 传递给 `ThinkingPanel` 组件

---

## 四、实施建议

由于本项目与 `vibex-bounded-context-rendering-issues` 完全相同，建议：

1. **合并任务**: 两个项目只需实现一次修复
2. **代码复用**: 修复代码同时惠及两个场景

---

## 五、验收标准

| ID | 验收标准 | 验证方法 |
|----|----------|----------|
| ARCH-001 | 与 vibex-bounded-context-rendering-issues 相同 | 引用该文档 |

---

**完成时间**: 2026-03-17 21:39  
**架构师**: Architect Agent