# 需求分析: 首页问题修复 (20260317)

**项目**: vibex-homepage-issues-20260317
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 概述

本分析与 `vibex-bounded-context-rendering-issues` 任务分析相同，具体问题如下：

### 问题清单

| ID | 问题 | 详细分析 |
|----|------|----------|
| P0-1 | 限界上下文请求完成后图没有渲染 | 见 `vibex-bounded-context-rendering-issues/analysis.md` |
| P0-2 | 流程分析按钮无变化 | 见下方修复方案 |
| P0-3 | AI思考过程不是渐进式 | 见下方修复方案 |

---

## 修复方案摘要

### P0-2: 流程按钮修复

```typescript
// HomePage.tsx - handleGenerate 函数
const handleGenerate = useCallback(() => {
  switch (currentStep) {
    case 1: generateContexts(requirementText); break;
    case 2: generateDomainModels(requirementText, boundedContexts); break;
    case 3: generateBusinessFlow(domainModels); break;
  }
}, [currentStep, boundedContexts, domainModels, ...]);
```

### P0-3: 渐进式思考修复

1. 收集 thinkingMessages:
```typescript
// useHomePage.ts
const [thinkingMessages, setThinkingMessages] = useState<ThinkingStep[]>([]);

useEffect(() => {
  if (_ctxMessages) {
    setThinkingMessages(_ctxMessages);
  }
}, [_ctxMessages]);
```

2. 传递给 ThinkingPanel:
```typescript
<ThinkingPanel
  thinkingMessages={thinkingMessages}
  status={streamStatus}
/>
```

---

## 验收标准

| ID | 验收标准 |
|----|----------|
| AC1 | 限界上下文生成完成后图表正确显示 |
| AC2 | 按钮根据步骤调用不同的生成API |
| AC3 | 思考过程渐进式显示 |

---

## 产出物

详细分析见: `docs/vibex-bounded-context-rendering-issues/analysis.md`