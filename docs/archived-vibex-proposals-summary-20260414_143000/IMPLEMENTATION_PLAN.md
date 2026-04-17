# Implementation Plan: VibeX Sprint 1 合并架构

> **项目**: vibex-proposals-summary-20260414_143000  
> **日期**: 2026-04-14  
> **总工时**: 14h (Sprint 1) + 跨项目协调 1h

---

## Overview

Sprint 1 整合 PM E1/E3/E4/E5 + Architect P0/P1 中 Sprint 1 范围条目。E2/E6/E7/E8 移到 Sprint 2+。

---

## Implementation Units

- [ ] **Unit 1: E5 apiError() 工具函数** ❌ NOT DONE

**Goal:** 实现统一 API 错误处理函数，供全部后端路由使用。

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/lib/api-error.ts`
- Test: `vibex-backend/src/__tests__/api-error.test.ts`

**Approach:**
- 实现 `apiError()` 函数，包含完整 ERROR_CODES 枚举
- 提供 TypeScript 类型支持

**Verification:**
- apiError() 导出可用
- ERROR_CODES 包含所有必要错误码

---

- [ ] **Unit 2: E5 路由统一错误替换** ❌ NOT DONE

**Goal:** 替换全部 61 个后端路由中的裸字符串错误返回。

**Dependencies:** Unit 1

**Files:**
- Modify: `vibex-backend/src/routes/` (全部 61 个文件)

**Approach:**
- 步骤1: grep 找出所有裸字符串错误
- 步骤2: 逐一替换为 `apiError()`
- 步骤3: grep 验证无遗漏

```bash
# 验证无裸字符串错误残留
grep -rn "new Response.*'" vibex-backend/src/routes/ | grep -v "apiError"
```

**Verification:**
- 所有路由错误返回格式一致: `{ error: { code, message } }`

---

- [ ] **Unit 3: E1 Auth CSS 迁移** ✅ DONE (commit 0cae1330)

**Goal:** 完成 auth 页面内联样式迁移。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/app/auth/page.tsx`
- Modify: `vibex-fronted/src/app/auth/auth.module.css`

**Verification:**
- `grep -rn "style={{" app/auth/page.tsx` 仅剩 validateReturnTo

---

- [ ] **Unit 4: E3 Dashboard Fuzzy Search** ✅ DONE (pm-proposals 子代理, commit 6ba18967)

**Goal:** 添加项目搜索，debounce 300ms。

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/components/dashboard/SearchBar.tsx`
- Modify: `vibex-fronted/src/app/dashboard/page.tsx`
- Modify: `vibex-backend/src/routes/projects.ts`

**Verification:**
- 搜索返回正确结果
- debounce 300ms 行为正确

---

- [ ] **Unit 5: E4 TabBar Phase 对齐** ❌ NOT DONE

**Goal:** TabBar 行为与 PhaseNavigator 对称。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/canvas/TabBar.tsx`
- Modify: `vibex-fronted/src/components/canvas/PhaseNavigator.tsx`

**Verification:**
- TabBar 和 PhaseNavigator 双向同步

---

- [ ] **Unit 6: Bundle Dynamic Import**

**Goal:** 重组件按需加载，减少初始 bundle size。

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/lib/lazy-components.ts`
- Modify: `vibex-fronted/src/next.config.js`

**Approach:**
- 识别重组件：MermaidRenderer × 3, TemplateSelector × 3
- 使用 Next.js `dynamic()` 按需加载
- 配置 next.config.js 重写规则

**Verification:**
- Lighthouse bundle 减少 > 15%
- 首屏渲染正常

---

## Dependencies

```
Unit 1 (apiError) ─→ Unit 2 (路由替换) ─→ Sprint 1 全部完成
Unit 3, 4, 5, 6 ─ 并行执行
```

---

*Implementation Plan | Architect Agent | 2026-04-14*
