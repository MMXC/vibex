# dev-E1-S2: TanStack Query Hooks 迁移

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E1 TanStack Query 统一 API Client
**依赖**: E1-S1 完成

---

## 产出

`docs/vibex-third/dev-E1-S2.md` — 本文档

---

## 现有实现

TanStack Query hooks 已在 `src/hooks/queries/` 下实现：

| Hook | 文件 | 说明 |
|------|------|------|
| useProjects | `useProjects.ts` | 项目列表/详情查询 |
| useEntities | `useEntities.ts` | 领域实体查询 |
| useFlows | `useFlows.ts` | 流程查询 |
| useRequirements | `useRequirements.ts` | 需求查询 |
| useDDD | `useDDD.ts` | DDD 状态查询 |

所有 Hook 均使用 `@tanstack/react-query` 的 `useQuery` / `useMutation`。

---

## 迁移状态

- [x] `useProjects` — 已迁移（useQuery + useMutation）
- [x] `useEntities` — 已迁移
- [x] `useFlows` — 已迁移
- [x] `useRequirements` — 已迁移
- [x] `useDDD` — 已迁移

---

## E1-S2 验收

- [x] `src/hooks/queries/` 目录存在
- [x] 所有 Hook 使用 `useQuery` 或 `useMutation`
- [x] 与 `src/lib/api/client.ts`（E1-S1）集成

---

## 关联

- E1-S1: TanStack Query API Client — `src/lib/api/client.ts`
- E1-S2: TanStack Query Hooks — `src/hooks/queries/`
