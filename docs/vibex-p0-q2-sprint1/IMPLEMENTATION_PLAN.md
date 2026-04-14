# Implementation Plan: VibeX Q2 Sprint 1

> **项目**: vibex-p0-q2-sprint1  
> **日期**: 2026-04-14  
> **总工时**: 27h

---

## Overview

6 个 Epic，按依赖关系分 Sprint。

---

## Implementation Units

- [x] **Unit 1: E1 Auth CSS 审计 + 迁移** ✅ DONE

**Goal:** 完成 auth 页面所有内联样式迁移，保留 validateReturnTo。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/app/auth/page.tsx`
- Modify: `vibex-fronted/src/app/auth/auth.module.css`
- Test: `vibex-fronted/src/app/auth/page.test.tsx`

**Approach:**
- 步骤1: grep 列出所有 `style={{` 内联样式
- 步骤2: 迁移到 auth.module.css，使用 design-tokens.css 变量
- 步骤3: validateReturnTo 函数保留（安全逻辑）

**Verification:**
- `grep -rn "style={{" app/auth/ --include="*.tsx" | grep -v validateReturnTo` 无结果 ✅
- commit: `0cae1330` refactor(auth): Epic1 — migrate auth page to CSS Module

---

- [x] **Unit 2: E4 apiError() (✅ DONE — f459a3c6) 工具函数**

**Goal:** 实现统一 API 错误处理函数。

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/lib/api-error.ts`
- Test: `vibex-backend/src/__tests__/api-error.test.ts`

**Approach:**
- 实现 `apiError()` 函数，含 STATUS_MAP 枚举
- 提供 TypeScript 类型
- 测试所有错误码映射

**Verification:**
- apiError() 导出可用，所有错误码正确映射

---

- [ ] **Unit 3: E4 路由统一错误替换**

**Goal:** 替换全部 61 个后端路由的错误返回。

**Dependencies:** Unit 2

**Files:**
- Modify: `vibex-backend/src/routes/` (全部 61 个文件)

**Approach:**
- 步骤1: grep 找出所有裸字符串错误
- 步骤2: 逐一替换为 `apiError()`
- 步骤3: grep 验证无遗漏

```bash
# 验证无裸字符串错误残留
grep -rn "new Response.*'" routes/ | grep -v "apiError"
```

**Verification:**
- 所有路由错误格式一致

---

- [ ] **Unit 4: E2 Dashboard Fuzzy Search**

**Goal:** 搜索组件，debounce 300ms。

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/components/dashboard/SearchBar.tsx`
- Create: `vibex-fronted/src/components/dashboard/SearchBar.module.css`
- Modify: `vibex-fronted/src/app/dashboard/page.tsx`
- Modify: `vibex-backend/src/routes/projects.ts`

**Approach:**
- SearchBar: debounce 300ms，输入 ≥ 2 字符触发
- 后端: 先查询所有 projects，内存过滤（避免 D1 LIKE 复杂度）

**Verification:**
- 搜索正常工作
- debounce 行为正确

---

- [ ] **Unit 5: E3 TabBar Phase 对齐**

**Goal:** TabBar 行为与 PhaseNavigator 对称。

**Dependencies:** None

**Files:**
- Modify: `vibex-fronted/src/components/canvas/TabBar.tsx`
- Modify: `vibex-fronted/src/components/canvas/PhaseNavigator.tsx`

**Verification:**
- TabBar Phase1 仅显示相关 tabs
- TabBar 和 PhaseNavigator 双向同步

---

- [ ] **Unit 6: E5 ClarificationCard 组件**

**Goal:** 从 ClarificationDialog 提取 ClarificationCard，支持对话流内嵌。

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/components/ui/ClarificationCard.tsx`
- Create: `vibex-fronted/src/components/ui/ClarificationCard.module.css`
- Create: `vibex-fronted/src/components/ui/ClarificationCard.test.tsx`
- Modify: `vibex-fronted/src/components/homepage/steps/ClarificationStep.tsx`

**Approach:**
- 步骤1: 从 ClarificationDialog 提取卡片 UI
- 步骤2: ClarificationCard 通过 variant prop 支持 'inline' 和 'modal'
- 步骤3: ClarificationStep 替换为 ClarificationCard

**Verification:**
- snapshot 测试通过
- 组件独立渲染正常

---

- [ ] **Unit 7: E5 ClarificationState + Prompt**

**Goal:** 实现多轮澄清状态管理和追问 Prompt。

**Dependencies:** Unit 6

**Files:**
- Create: `vibex-fronted/src/stores/clarificationStore.ts`
- Modify: `vibex-backend/src/services/llm.ts` (或 ai-service.ts)

**Approach:**
- ClarificationState: 存储追问轮次、已选答案、跳过状态
- Prompt: 结构化 JSON 输出 `{ questions: [], skip: boolean }`

**Verification:**
- 多轮追问流程正常
- 跳过进入生成流程

---

- [ ] **Unit 8: E6 Bundle Audit 工具**

**Goal:** 生成 bundle 分析报告。

**Dependencies:** None

**Files:**
- Create: `scripts/bundle-audit.js`
- Modify: `vibex-fronted/package.json`

**Approach:**
- 使用 `npx @next/bundle-analyzer` 或 `source-map-explorer`
- 生成 HTML 报告，识别 > 50KB 的模块
- 重点关注: MermaidRenderer × 3, TemplateSelector × 3

**Verification:**
- `pnpm bundle:audit` 生成报告
- 报告列出 top 10 largest modules

---

- [ ] **Unit 9: E6 Dynamic Import 脚手架**

**Goal:** 为重组件建立 dynamic import 框架。

**Dependencies:** Unit 8

**Files:**
- Create: `vibex-fronted/src/lib/lazy-components.ts`
- Modify: `vibex-fronted/next.config.js`

**Approach:**
- 步骤1: 选择最大的 3 个重复组件作为候选
- 步骤2: 创建 `.lazy.ts` 包装器
- 步骤3: next.config.js 配置（暂不替换引用，仅建立框架）

**Verification:**
- lazy 包装器导出可用
- bundle 大小监控已就位

---

- [ ] **Unit 10: E4 前端错误处理**

**Goal:** 前端统一 API 错误处理。

**Dependencies:** Unit 2

**Files:**
- Create: `vibex-fronted/src/lib/api-error-handler.ts`
- Modify: `vibex-fronted/src/app/providers/` (QueryProvider)

**Approach:**
- QueryProvider 全局错误拦截
- 统一 toast 错误展示

**Verification:**
- API 错误显示 toast
- 错误格式正确解析

---

## Dependencies

```
Unit 2 (apiError) ─→ Unit 3 (路由替换) ─→ Unit 10 (前端)
Unit 6 (ClarificationCard) ─→ Unit 7 (ClarificationState)
Unit 8 (Bundle Audit) ─→ Unit 9 (Dynamic Import)

Unit 1, 4, 5 ─ 并行
```

---

## Verification Criteria

| Epic | 验收标准 |
|------|---------|
| E1 | auth 页面无内联 style (validateReturnTo 除外) |
| E2 | 搜索功能正常，debounce 300ms |
| E3 | TabBar ↔ PhaseNavigator 双向同步 |
| E4 | 所有 API 错误格式一致 |
| E5 | ClarificationCard 多轮追问正常 |
| E6 | bundle audit 报告生成 |

---

## Risks

| Risk | Mitigation |
|------|------------|
| E4 61 路由替换遗漏 | grep 验证无裸字符串残留 |
| E5 追问 Prompt LLM 不稳定 | 第一版用规则判断，第二版再升级 |
| E6 dynamic import 影响 SSR | ssr: false，仅对客户端组件使用 |

---

*Implementation Plan | Architect Agent | 2026-04-14*
