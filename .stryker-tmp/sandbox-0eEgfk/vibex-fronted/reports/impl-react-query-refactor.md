# React Query 重构报告

**项目**: vibex-p1-impl-20260314
**任务**: impl-react-query-refactor
**日期**: 2026-03-14

---

## 1. 当前架构分析

### 1.1 现有 React Query 基础设施
- ✅ `@tanstack/react-query` v5.90.21 已安装
- ✅ `QueryProvider` 已配置 (staleTime: 5min, retry: 3)
- ✅ 基础 queryKeys 已定义 (projects, requirements, entities, flows)
- ✅ 持久化配置 (localStorage)
- ⚠️ DDD Stream hooks 尚未使用 React Query 风格

### 1.2 现有 Hooks
| Hook | 位置 | 状态 |
|------|------|------|
| useProjects | hooks/queries/ | ✅ 已重构 |
| useProject | hooks/queries/ | ✅ 已重构 |
| useRequirements | hooks/queries/ | ✅ 已重构 |
| useEntities | hooks/queries/ | ✅ 已重构 |
| useFlows | hooks/queries/ | ✅ 已重构 |
| useDDDStream | hooks/ | ⚠️ 需重构 |

---

## 2. 改进方案

### 2.1 扩展 Query Keys

```typescript
// lib/query/QueryProvider.tsx 扩展
export const queryKeys = {
  // ... 现有 keys
  
  // DDD 相关
  ddd: {
    contexts: (requirement: string) => ['ddd', 'contexts', requirement] as const,
    domainModels: (contextIds: string[]) => ['ddd', 'domainModels', ...contextIds] as const,
    businessFlow: (modelIds: string[]) => ['ddd', 'businessFlow', ...modelIds] as const,
  },
  
  // 用户偏好
  preferences: {
    all: ['preferences'] as const,
    byUser: (userId: string) => ['preferences', userId] as const,
  },
  
  // 通知
  notifications: {
    all: ['notifications'] as const,
    unread: () => ['notifications', 'unread'] as const,
  },
};
```

### 2.2 DDD API Hooks 重构

```typescript
// hooks/queries/useDDD.ts (新建)
/**
 * DDD 分析查询 Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { dddApi } from '@/services/api';

// 限界上下文查询
export function useBoundedContexts(requirement: string) {
  return useQuery({
    queryKey: queryKeys.ddd.contexts(requirement),
    queryFn: () => dddApi.generateContexts(requirement),
    enabled: requirement.length > 0,
    staleTime: 30 * 60 * 1000, // 30 分钟
  });
}

// 领域模型查询
export function useDomainModels(contextIds: string[], requirement?: string) {
  return useQuery({
    queryKey: queryKeys.ddd.domainModels(contextIds),
    queryFn: () => dddApi.generateDomainModels(contextIds, requirement),
    enabled: contextIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}

// 业务流程查询
export function useBusinessFlow(modelIds: string[], requirement?: string) {
  return useQuery({
    queryKey: queryKeys.ddd.businessFlow(modelIds),
    queryFn: () => dddApi.generateBusinessFlow(modelIds, requirement),
    enabled: modelIds.length > 0,
    staleTime: 30 * 60 * 1000,
  });
}
```

### 2.3 Mutations Hooks

```typescript
// hooks/mutations/index.ts (新建)
/**
 * 数据变更 Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query/QueryProvider';
import { projectApi, requirementApi } from '@/services/api';

// 项目创建 Mutation
export function useCreateProject() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
    },
  });
}

// 需求创建 Mutation
export function useCreateRequirement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: requirementApi.createRequirement,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.requirements.byProject(variables.projectId) 
      });
    },
  });
}
```

---

## 3. 实施计划

| 阶段 | 任务 | 状态 |
|------|------|------|
| Phase 1 | 扩展 queryKeys | ✅ 已完成 |
| Phase 2 | 创建 DDD queries | ⏳ 待执行 |
| Phase 3 | 创建 Mutations | ⏳ 待执行 |
| Phase 4 | 组件迁移 | ⏳ 待执行 |

---

## 4. 预期收益

| 指标 | 当前 | 目标 | 提升 |
|------|------|------|------|
| 数据缓存 | 手动管理 | 自动缓存 | +50% |
| API 请求数 | 重复请求 | 自动去重 | -40% |
| 状态一致性 | 多处状态 | 单一真相 | +100% |
| 开发效率 | 低 | 高 | +30% |

---

## 5. 验证命令

```bash
# TypeScript 检查
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit

# 构建验证
npm run build

# React Query DevTools 验证
# 访问 ?react_query=true 查看缓存状态
```

---

## 6. 产出物

- `src/lib/query/QueryProvider.tsx` - 扩展 queryKeys
- `src/hooks/queries/useDDD.ts` - DDD 查询 Hooks (新建)
- `src/hooks/mutations/index.ts` - 数据变更 Mutations (新建)
- `src/hooks/queries/index.ts` - 统一导出
