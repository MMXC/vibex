# Implementation Plan: VibeX 技术架构清理提案

> **项目**: vibex-architect-proposals-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 32h (E1 4h + E2 16h + E3 12h)

---

## Overview

3 个 Epic，4 个 Story。E1 快速止血，E2 建立规范，E3 提升测试可信度。

---

## Implementation Units

- [ ] **Unit 1: E1.S1 pagelist 样式重写**

**Goal:** `/pagelist` 页面背景色对齐 `var(--color-bg-primary)`。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/app/pagelist/page.tsx`
- Create/Modify: `vibex-fronted/src/app/pagelist/pagelist.module.css`

**Approach:**
- 审计现有 `.pagelist-page` 或根元素的 `style` 属性
- 替换为 CSS Module + design tokens
- 验证无浅色残留 (`#fff` / `rgb(255,255,255)` / 浅灰)

**Verification:**
```bash
grep -rn "background.*#fff\|background.*white\|#f5f5f5" app/pagelist/  # 无结果
```

---

- [x] **Unit 2: E2.S1 apiError() ✅ (f459a3c6, updated: STATUS_MAP)**

**Goal:** 实现统一 API 错误处理函数。

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/lib/api-error.ts`
- Test: `vibex-backend/src/__tests__/api-error.test.ts`

**Approach:**
- 实现 `apiError()` 函数，含 STATUS_MAP
- TypeScript 类型完整
- 测试所有错误码映射

**Verification:**
```typescript
expect(apiError('NOT_FOUND', 'Resource not found').status).toBe(404);
expect(apiError('INVALID_PARAMS', 'Missing id').status).toBe(400);
```

---

- [x] **Unit 3: E2.S1 路由统一错误替换** ❌ deferred Sprint 2

**Goal:** 61 个后端路由错误格式统一。

**Dependencies:** Unit 2

**Files:**
- Modify: `vibex-backend/src/routes/` (全部 61 个文件)

**Approach:**
- grep 找出所有裸字符串错误
- 逐一替换为 `apiError()`
- grep 验证无遗漏

```bash
grep -rn "new Response.*'" routes/ | grep -v "apiError"  # 无结果
```

**Verification:**
- 所有路由错误格式一致
- `apiError()` 测试通过

---

- [ ] **Unit 4: E2.S2 API 版本化**

**Goal:** 新增路由遵循 `/v{n}/` 前缀规范。

**Dependencies:** Unit 2

**Files:**
- Create: `vibex-backend/src/middleware/version.ts`
- Modify: `vibex-backend/src/handler.ts` (注册中间件)

**Approach:**
- 实现 `withVersion()` 中间件
- 更新 CI 检查：`routes/v{n}/` 目录必须有版本号
- 文档化版本化策略

**Verification:**
- 新增路由测试验证版本检测正确
- CI 版本化检查通过

---

- [ ] **Unit 5: E3.S1 Vitest 配置修复**

**Goal:** `vitest run` 退出码 0，无 node_modules 误报。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/vite.config.ts`

**Approach:**
- 更新 `test.exclude` 数组
- 运行 `vitest run --reporter=verbose` 确认无误报

**Verification:**
```bash
npx vitest run; echo $?  # 必须为 0
```

---

- [ ] **Unit 6: E3.S1 测试覆盖率提升**

**Goal:** 关键路径测试覆盖率 > 60%。

**Dependencies:** Unit 5

**Files:**
- Create: `vibex-fronted/src/**/*.test.ts` (关键模块)
- Modify: `vitest.config.ts` (覆盖率配置)

**Approach:**
- 识别关键路径：Auth 流程、Canvas CRUD、API 调用
- 优先补测高频使用的模块
- 覆盖率报告上传到 CI

**Verification:**
```bash
npx vitest run --coverage; echo $?  # 退出码 0
```

---

## Dependencies

```
Unit 2 (apiError) ─→ Unit 3 (路由替换)
                 ─→ Unit 4 (版本化)

Unit 1, 5 ─ 并行
Unit 5 ─→ Unit 6 (覆盖率)
```

---

## Verification Criteria

| Epic | 验收标准 |
|------|---------|
| E1 | pagelist 背景色为深色，截图对比 baseline |
| E2 | apiError() 可用，61 路由格式统一，版本化规范建立 |
| E3 | vitest run 0 退出码，覆盖率 > 60% |

---

*Implementation Plan | Architect Agent | 2026-04-14*
