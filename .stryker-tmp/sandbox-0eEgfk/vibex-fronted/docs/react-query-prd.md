# PRD: React Query 状态管理重构

**项目**: vibex-react-query-refactor  
**版本**: 1.0  
**日期**: 2026-03-14  
**角色**: PM  

---

## 1. 执行摘要

**背景**: 项目未使用 React Query，API 调用分散在自定义 Hooks 和 axios client 中。

**目标**: 引入 React Query，统一缓存策略，性能提升 30%。

---

## 2. 功能需求

### F1: React Query 集成

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F1.1 | QueryClient 配置 | `expect(queryClient).toBeDefined()` | P0 |
| F1.2 | Provider 包装 | `expect(provider).toWrapApp()` | P0 |
| F1.3 | 基础 Hook 创建 | `expect(useQuery).toWork()` | P0 |

### F2: API 模块迁移

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F2.1 | DDD API 迁移 | `expect(useBoundedContexts).toWork()` | P0 |
| F2.2 | Design API 迁移 | `expect(useDesign).toWork()` | P0 |
| F2.3 | 旧 Hook 废弃 | `expect(oldHooks).toDeprecate()` | P1 |

### F3: 缓存策略

| ID | 功能点 | 验收标准 | 优先级 |
|----|--------|----------|--------|
| F3.1 | 全局配置 | `expect(config).toContain('staleTime')` | P0 |
| F3.2 | 缓存时间 | `expect(cacheTime).toBe(5 * 60 * 1000)` | P0 |
| F3.3 | 预获取 | `expect(prefetch).toWork()` | P1 |

---

## 3. Epic 拆分

### Epic 1: 基础集成

| Story | 验收 |
|-------|------|
| S1.1 配置 | `expect(config).toWork()` |
| S1.2 Provider | `expect(provider).toWrap()` |

### Epic 2: API 迁移

| Story | 验收 |
|-------|------|
| S2.1 DDD 迁移 | `expect(useDDD).toWork()` |
| S2.2 Design 迁移 | `expect(useDesign).toWork()` |

---

## 4. 验收标准

| ID | 标准 | 断言 |
|----|------|------|
| AC1 | QueryClient 运行 | `expect(client).toBeDefined()` |
| AC2 | API 调用正常 | `expect(query).toReturn()` |
| AC3 | 性能提升 | `expect(loadTime).toBeLessThan(baseline * 0.7)` |

---

## 5. 实施计划

| 阶段 | 任务 | 工时 |
|------|------|------|
| 1 | 基础集成 | 1d |
| 2 | API 迁移 | 2d |
| 3 | 优化测试 | 1d |

**总计**: 4d
