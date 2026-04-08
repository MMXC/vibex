# dddApi → canvasSseApi 迁移文档

**Epic**: Epic 3: dddApi 废弃路径
**Date**: 2026-04-08
**Status**: 进行中

---

## 背景

`dddApi.ts` 是 DDD AI SSE 客户端的旧版本，已被 `canvasSseApi.ts` 替代。`canvasSseApi.ts` 是 Canvas API 标准化 Epic 2 的产物，提供了统一的 SSE 流式处理能力。

本迁移文档记录所有从 `dddApi.ts` 迁移到 `canvasSseApi.ts` 的步骤。

---

## API 对照表

### 函数

| dddApi（废弃） | canvasSseApi（目标） | 说明 |
|---|---|---|
| `analyzeRequirement` | `canvasSseAnalyze` | SSE 流式 AI 分析（重命名，行为相同） |

### 类型

| dddApi（废弃） | canvasSseApi（目标） | 说明 |
|---|---|---|
| `ThinkingEvent` | `ThinkingEvent` | 同名 |
| `StepContextEvent` | `StepContextEvent` | 同名 |
| `StepModelEvent` | `StepModelEvent` | 同名 |
| `StepFlowEvent` | `StepFlowEvent` | 同名 |
| `StepComponentsEvent` | `StepComponentsEvent` | 同名 |
| `DoneEvent` | `DoneEvent` | 同名 |
| `ErrorEvent` | `ErrorEvent` | 同名 |
| `SSEEvent` | `SSEEvent` | 同名 |
| `BoundedContext` | `BoundedContext` | 同名 |
| `DDDApiCallbacks` | `CanvasSseCallbacks` | 重命名，接口兼容 |
| `DDDApiOptions` | `CanvasSseOptions` | 重命名，接口兼容 |

---

## 迁移步骤

### 1. services/api/modules/ddd.ts

这是后端 REST API 封装，提供 `generateBoundedContext`、`generateDomainModel`、`generateBusinessFlow` 三个方法。

**迁移策略**：此模块使用 HTTP REST 调用后端，与 `canvasSseApi.ts`（SSE 流式）功能不完全重叠。当前保留不动，未来统一为 SSE 方案时再迁移。

如需迁移，替换方案：
```typescript
// 旧
import { dddApi } from '@/services/api';
await dddApi.generateBoundedContext(requirementText);

// 新（SSE 方案）
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
await canvasSseAnalyze(requirementText, {
  onStepContext: (content, mermaid, confidence, contexts) => { ... },
  onDone: (projectId, summary) => { ... },
  onError: (message) => { ... },
});
```

### 2. services/api/index.ts

此文件 re-export `dddApi` 和 `createDddApi` 来自 `modules/ddd`。

**迁移策略**：将 `dddApi` 导出标记为 `@deprecated`，提示使用 `canvasSseApi`。

### 3. components/homepage/hooks/useHomeGeneration.ts

此 Hook 使用 `dddApi.generateBoundedContext`。

```typescript
// 旧
import { dddApi, projectApi } from '@/services/api';
const response = await dddApi.generateBoundedContext(requirement);

// 新（SSE 方案）
import { canvasSseAnalyze } from '@/lib/canvas/api/canvasSseApi';
import { projectApi } from '@/services/api';
await canvasSseAnalyze(requirement, {
  onStepContext: (content, mermaid, confidence, boundedContexts) => {
    if (boundedContexts) {
      const contexts: BoundedContext[] = boundedContexts.map(ctx => ({
        id: ctx.id,
        name: ctx.name,
        description: ctx.description || '',
        type: 'core' as const,
        relationships: [],
      }));
      onContextsGenerated?.(contexts);
    }
  },
  onDone: () => { ... },
  onError: (message) => { ... },
});
```

---

## 已废弃标记

所有 `dddApi.ts` 的导出均已添加 `@deprecated` 注解，指向 `canvasSseApi.ts` 作为迁移目标。

---

## CI 规则

ESLint 已配置 `no-restricted-imports` 规则，禁止在非测试文件中从 `@/lib/canvas/api/dddApi` 导入。

测试文件（`*.test.*`、`__tests__/**`）豁免，以便在迁移过程中保持向后兼容。

---

## 回滚计划

如需回滚：
1. 移除 `dddApi.ts` 中的 `@deprecated` 注解
2. 移除 ESLint 配置中的 `no-restricted-imports` 规则
3. 删除本迁移文档

---

## 迁移进度

- [x] F-3.1: dddApi.ts 每个 export 添加 @deprecated 注解
- [x] F-3.2: 本迁移文档
- [x] F-3.3: CI lint 规则禁止新增 dddApi 引用（生产代码）
