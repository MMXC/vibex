# dev-E1-S3: 消除散落 axios 调用

**项目**: vibex-third
**阶段**: dev
**日期**: 2026-04-09
**Epic**: E1 TanStack Query 统一 API Client
**依赖**: E1-S1 完成

---

## 产出

`docs/vibex-third/dev-E1-S3.md` — 本文档

---

## 目标

消除 stores 目录中散落的裸 `fetch` / `axios` 调用，统一通过 TanStack Query Hooks 访问 API。

---

## 检查结果

```bash
grep -rn "axios\|fetch(" src/stores --include="*.ts" --include="*.tsx"
# 无输出 — stores 中无裸 axios/fetch 调用
```

所有 store 均通过以下方式访问 API：
- `src/hooks/queries/*` — TanStack Query hooks（查询）
- `src/hooks/mutations/*` — TanStack Query mutations（变更）

---

## E1-S3 验收

- [x] stores 中无裸 axios/fetch 调用
- [x] 所有 API 访问通过 TanStack Query 层

---

## 关联

- E1-S1: TanStack Query API Client — `src/lib/api/client.ts`
- E1-S2: TanStack Query Hooks — `src/hooks/queries/`
- E1-S3: 消除散落 axios — stores 已合规
