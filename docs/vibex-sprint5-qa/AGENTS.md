# AGENTS.md — vibex-sprint5-qa / design-architecture

**项目**: vibex-sprint5-qa
**角色**: Architect（开发约束）
**日期**: 2026-04-25
**上游**: architecture.md + IMPLEMENTATION_PLAN.md
**状态**: ✅ 设计完成

---

## 1. 开发约束总览

### 1.1 语言与框架

- **语言**: TypeScript（严格模式）
- **前端框架**: Next.js 16 + React 19
- **测试框架**: Vitest（单元/集成）+ Playwright（UI 集成）
- **测试库**: @testing-library/react ^16.3.2 + @testing-library/user-event ^14.5.2
- **HTTP Mock**: MSW ^2.12.10（如 delivery/page.tsx 有 API 调用）

### 1.2 代码质量门槛

| 检查项 | 标准 | 命令 |
|--------|------|------|
| TypeScript 类型 | 0 errors | `pnpm exec tsc --noEmit` |
| ESLint | 0 warnings | `pnpm lint` |
| 单元测试 | 100% | `pnpm vitest run tests/unit/` |
| 测试覆盖率 | ≥ 85% | `pnpm test:unit:coverage` |
| Playwright E2E | 0 failures | `pnpm playwright test tests/e2e/sprint5-qa/` |

### 1.3 关键约束

**约束 1: E1 F1.1 必须用 grep 验证源码**
- `delivery/page.tsx` 中不得包含 `loadMockData` 字符串
- 禁止用 Vitest mock 替代源码 grep 验证

**约束 2: E1 F1.3 验证必须覆盖全部 5 个 Tab**
- Context / Flow / Component / PRD / DDL 每个 Tab 都要断言内容不含 "mock"
- 禁止只验证 1-2 个 Tab

**约束 3: E2 F2.2 依赖 prototypeStore 有数据**
- 测试执行顺序：先向 prototypeStore 注入 mock 数据，再调用 `loadFromStores()`
- 禁止在 prototypeStore 为空时验证 F2.2

**约束 4: E3 DDLGenerator 使用内联 mock 类型**
- 不依赖 Sprint4 代码库中的 `APIEndpointCard` 接口定义
- 使用 architecture.md §5 中定义的内联类型

---

## 2. 技术规范

### 2.1 测试文件命名

```
tests/unit/
  stores/
    deliveryStore.test.ts              # E2 F2.1/F2.2
  services/
    DDLGenerator.test.ts               # E3 F3.1/F3.2
  grep/
    e1-data-flow-cleanup.test.ts       # E1 F1.1

tests/e2e/sprint5-qa/
  E1-delivery-page.spec.ts             # E1 F1.1~F1.3
  E3-ddl-output.spec.ts                # E3 F3.2
```

---

## 3. 禁止事项

- ❌ 禁止用 `any` 类型绕过 TypeScript 检查
- ❌ 禁止在 E1 F1.1 验证中使用 Vitest mock 替代源码 grep
- ❌ 禁止只验证 5 个 Tab 中的 1-2 个
- ❌ 禁止在 prototypeStore 为空时执行 E2 F2.2 验证
- ❌ 禁止依赖 Sprint4 真实代码库验证 E3（必须内联 mock）

---

## 4. 验收命令

```bash
# 1. 类型检查
pnpm exec tsc --noEmit

# 2. grep 静态验证（E1 F1.1 最先执行）
pnpm vitest run tests/unit/grep/

# 3. store + service 逻辑验证
pnpm vitest run tests/unit/stores/deliveryStore.test.ts
pnpm vitest run tests/unit/services/DDLGenerator.test.ts

# 4. UI 数据流验证
pnpm playwright test tests/e2e/sprint5-qa/

# 5. 完整 QA
pnpm vitest run tests/unit/ && pnpm playwright test tests/e2e/sprint5-qa/
```

**全部通过后，更新 task status 为 done。**

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint5-qa
- **执行日期**: 2026-04-25

---

*约束文件时间: 2026-04-25 13:07 GMT+8*
