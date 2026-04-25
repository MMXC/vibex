# AGENTS.md — vibex-sprint2-qa / design-architecture

**项目**: vibex-sprint2-qa
**角色**: Architect（开发约束）
**日期**: 2026-04-25
**上游**: architecture.md + IMPLEMENTATION_PLAN.md
**状态**: ✅ 设计完成

---

## 1. 开发约束总览

### 1.1 语言与框架

- **语言**: TypeScript（严格模式）
- **前端框架**: Next.js 16 + React 19
- **测试框架**: Vitest（已有 143 tests）+ Playwright（UI 集成）
- **测试库**: @testing-library/react ^16.3.2 + @testing-library/user-event ^14.5.2

### 1.2 代码质量门槛

| 检查项 | 标准 | 命令 |
|--------|------|------|
| TypeScript 类型 | 0 errors | `pnpm exec tsc --noEmit` |
| ESLint | 0 warnings | `pnpm lint` |
| 现有 Vitest 测试 | 全部通过 | `pnpm test -- --run` |
| 测试覆盖率 | ≥ 80% | `pnpm test:unit:coverage` |
| Playwright E2E | 0 failures | `pnpm playwright test tests/e2e/sprint2-qa/` |

### 1.3 关键约束

**约束 1: E1 grep 验证使用 ripgrep，非 mock**
- `confirm()` 清理验证必须搜索源码，禁止用运行时 mock 绕过
- `window.prompt()` 清理验证同理

**约束 2: 禁止新建 Vitest 测试覆盖已有逻辑**
- Sprint2 已有 143 tests，QA 验证只确认这些测试通过
- 新增测试仅用于 E1 grep 类验证（Vitest 不适合的场景）

**约束 3: Playwright UI 验证需要真实页面**
- ConfirmDialog 四态 / DDSCanvas 横向滚动 / AI 生成按钮 必须在 Playwright E2E 中验证
- Vitest jsdom 无法完全模拟 CSS overflow 行为和 SVG 边渲染

**约束 4: E6 测试数量不一致不做强制修正**
- 143 vs 167 差异属历史记录，验证通过即可

---

## 2. 技术规范

### 2.1 测试文件命名

```
tests/unit/
  grep/
    e1-confirm-cleanup.test.ts       # E1-T1/T2
    e4-hardcode-cleanup.test.ts      # E4-T1

tests/e2e/sprint2-qa/
  E1-confirm-dialog.spec.ts           # E1 ConfirmDialog 四态
  E2-horizontal-scroll.spec.ts        # E2 横向滚动
  E3-ai-draft.spec.ts               # E3 AI 生成
  E4-cross-chapter.spec.ts           # E4 跨章节边
  E5-four-states.spec.ts             # E5 四态覆盖
```

---

## 3. 禁止事项

- ❌ 禁止用 `any` 类型绕过 TypeScript 检查
- ❌ 禁止在 grep 验证中使用 Vitest mock 替代源码搜索
- ❌ 禁止修改 Sprint2 已有测试文件（只读验证）
- ❌ 禁止在 Playwright 测试中使用 `fireEvent` 替代 `user-event`

---

## 4. 验收命令

```bash
# 1. 类型检查
pnpm exec tsc --noEmit

# 2. 静态代码验证
pnpm vitest run tests/unit/grep/

# 3. 现有测试执行
pnpm test -- --run

# 4. UI 集成验证
pnpm playwright test tests/e2e/sprint2-qa/
```

**全部通过后，更新 task status 为 done。**

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint2-qa
- **执行日期**: 2026-04-25

---

*约束文件时间: 2026-04-25 13:05 GMT+8*
