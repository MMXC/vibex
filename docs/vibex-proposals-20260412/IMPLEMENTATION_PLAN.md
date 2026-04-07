# Implementation Plan: VibeX 2026-04-12 Sprint (Revised)

**Project**: vibex-proposals-20260412
**Date**: 2026-04-07
**Status**: Revised — TS Epic 拆分

---

## Overview

| 属性 | 值 |
|------|-----|
| Sprint 0 修正 | TS 错误从 2h → 多 Epic 并行 |
| Auth Mock | 保持 3h（范围清晰） |
| 总工时 | 待 Dev 验证后确认 |

---

## Sprint 0 重大修正

### 原始 vs 实际

| 原始规划 | 实际发现 |
|----------|----------|
| TypeScript 修复 2h | 206 个 TS 错误，149 个文件，估算 2-3 周 |
| Auth Mock 3h | 范围清晰，保持不变 |

### 修正策略：TS Epic 拆分

| Epic | 聚焦 | 预估范围 | 优先级 |
|------|------|----------|--------|
| TS-E1 | Zod v4 API 迁移 | ~20 文件 | P0（影响 Auth Mock 依赖） |
| TS-E2 | Cloudflare 类型不兼容 | ~15 文件 | P1 |
| TS-E3 | `as any` / 类型守卫缺失 | ~30 文件 | P1 |
| TS-E4 | 模块导入错误（missing modules） | ~50 文件 | P2 |

**并行策略**: TS-E1 + Auth Mock 先并行（互相依赖最小），完成后解锁 TS-E3。

---

## Sprint 0 详细计划

### TS-E1: Zod v4 API 迁移 (P0, ~1 周)

```bash
# 扫描 Zod 相关错误
pnpm tsc --noEmit 2>&1 | grep -i "zod" | head -30

# Zod v4 常见破坏性变更:
# - z.object() → z.strictObject()
# - z.infer<> → z.output<>
# - z.union([]) → z.discriminatedUnion()
```

**验收**: `pnpm tsc --noEmit` Zod 相关错误归零

---

### TS-E2: Cloudflare 类型不兼容 (P1, ~0.5 周)

```bash
pnpm tsc --noEmit 2>&1 | grep -i "cloudflare\|wrangler" | head -20
```

**验收**: Cloudflare 类型错误归零

---

### TS-E3: `as any` / 类型守卫缺失 (P1, ~1 周)

```bash
# 找到所有 as any
grep -rn "as any" vibex-fronted/src/ vibex-backend/src/ --include="*.ts"

# 替换策略:
# 1. 显式类型接口
# 2. unknown + 类型守卫 (type predicate)
# 3. @ts-expect-error (需 Architect 评审)
```

**验收**: `as any` 实例减少到 10 个以内

---

### TS-E4: 模块导入错误 (P2, ~0.5 周)

```bash
# 按错误数排序，最少的先修
pnpm tsc --noEmit 2>&1 | grep "cannot find module" | \
  sed 's/ //g' | sort | uniq -c | sort -n
```

**验收**: `pnpm tsc --noEmit` 剩余错误数量最小化

---

### Auth Mock Factory (保持不变, P0, 3h)

```bash
cp -r src/__tests__ src/__tests__.bak
# 创建 auth.mock.ts
# 替换散落 mock
pnpm test
```

**验收**: `pnpm test` → 79 passed, 0 failed

---

## Sprint 1 & Sprint 2

等待 Sprint 0 完成后，根据剩余错误数量重新评估 Sprint 1/2 范围。

---

## 并行执行时间线

```
Week 1 (并行):
  TS-E1 (Zod v4) ─┐
  Auth Mock       ─┴─→ 完成解锁 TS-E3
Week 2:
  TS-E3 (as any) + TS-E2 (Cloudflare)
Week 3:
  TS-E4 (missing modules)
  Sprint 1 开始 (Token日志 / CI守卫 / ErrorBoundary)
```

---

## Rollback

| 问题 | 回滚方案 |
|------|----------|
| Epic 引入新错误 | `git checkout -- <epic-modified-files>` |
| 影响 Auth Mock | 优先回滚 TS-E1 |
