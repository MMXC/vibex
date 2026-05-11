# VibeX Sprint 36 — AGENTS.md (Development Constraints)

**Agent**: architect
**Date**: 2026-05-11
**Version**: v1.0

---

## 1. Code Standards

### 1.1 TypeScript

| Rule | 要求 | 示例 |
|------|------|------|
| 类型声明 | 所有新增函数/组件必须有完整类型签名 | `function undo(): void` — 不允许 `function undo()` |
| 接口命名 | 实体接口使用 PascalCase | `interface RemoteCursorProps` |
| 可选字段 | 用 `?` 标记可选字段，不用 `undefined` | `userId?: string` |
| 枚举 | 使用联合类型字符串，不使用 enum | `industry: 'saas' \| 'mobile' \| 'ecommerce'` |

### 1.2 Component & Hook Naming

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| React Component | PascalCase | `DDSToolbar.tsx` → `export function DDSToolbar()` |
| Hook | camelCase，use 前缀 | `useRealtimeSync.ts` → `export function useRealtimeSync()` |
| Store | camelCase | `canvasHistoryStore.ts` |
| 测试文件 | `{ComponentName}.spec.ts` 或 `{feature}.spec.ts` | `presence-mvp.spec.ts` |

### 1.3 data-testid Naming Rules

**命名格式**: `{feature}-{descriptor}`

| Epic | data-testid | 元素描述 |
|------|-------------|----------|
| E1 | `remote-cursor` | 远程用户光标 DOM 节点 |
| E1 | `presence-avatars` | 在线用户头像列表 |
| E2 | `template-card` | 模板卡片容器 |
| E4 | `undo-btn` | 撤销按钮 |
| E4 | `redo-btn` | 重做按钮 |
| E5 | `compliance-score` | 合规评分卡 |
| E5 | `a11y-issues-list` | 无障碍问题列表 |
| E5 | `reuse-score` | 可复用评分卡 |
| E5 | `reuse-suggestions` | 可复用建议列表 |

### 1.4 E2E Test Structure

```typescript
import { test, expect } from '@playwright/test';

// File: {feature}-{scenario}.spec.ts
// Group related tests in test.describe()

test.describe('Feature description', () => {
  test('TC1: expected behavior', async ({ page }) => {
    // Arrange: setup mock / navigate
    // Act: user action
    // Assert: expected outcome
  });
});
```

### 1.5 ESLint & Prettier

- 所有新增/修改文件通过 ESLint（无 error，warning ≤ 5）
- 使用项目已有 Prettier 配置（`.prettierrc`）
- commit 前运行 `pnpm lint` / `pnpm format`

---

## 2. File Organization

```
vibex-fronted/src/
├── components/
│   ├── dds/
│   │   ├── DDSCanvasPage.tsx        ← 修改 (E1: RemoteCursor mount)
│   │   └── toolbar/
│   │       └── DDSToolbar.tsx      ← 修改 (E4: Undo/Redo buttons)
│   └── presence/
│       └── RemoteCursor.tsx        ← 已有，不修改 (E1: already exists)
├── hooks/
│   └── useRealtimeSync.ts          ← 已有，不修改 (E1: already exists)
├── stores/
│   └── dds/
│       └── canvasHistoryStore.ts   ← 已有，不修改 (E4: already connected)
└── app/dashboard/templates/
    └── page.tsx                    ← 修改 (E2: industry filter)

vibex-backend/src/app/api/
├── templates/
│   ├── route.ts                    ← 已有，不修改
│   └── marketplace/
│       └── route.ts                ← 新增 (E2)
vibex-backend/public/data/
└── marketplace-templates.json      ← 新增 (E2)

.github/workflows/
└── test.yml                        ← 修改 (E3: add generate-tool-index job)

vibex-fronted/tests/e2e/
├── presence-mvp.spec.ts            ← 新增 (E1-S1.3)
├── templates-market.spec.ts        ← 新增 (E2-S2.2)
├── design-review-degradation.spec.ts ← 新增 (E5-S5.1)
└── design-review-tabs.spec.ts       ← 新增 (E5-S5.2)
```

---

## 3. Git Commit Format

**格式**: `{type}({epic}): {description}`

| type | 使用场景 |
|------|----------|
| `feat` | 新功能实现 |
| `fix` | Bug 修复 |
| `refactor` | 重构（不影响功能）|
| `test` | 新增/修改测试文件 |
| `chore` | CI 配置、工具脚本 |
| `docs` | 文档更新 |

**示例**:
```bash
git commit -m "feat(E1): mount RemoteCursor in DDSCanvasPage"
git commit -m "feat(E2): add marketplace API route with static JSON"
git commit -m "feat(E4): add Undo/Redo buttons to DDSToolbar"
git commit -m "test(E5): add degradation E2E test for MCP 503"
git commit -m "chore(E3): add generate-tool-index CI job"
```

**禁止 commit 的内容**:
- `console.log` / `console.error` 残留
- `TODO` / `FIXME` 未解决（需先解决或移至 backlog）
- 临时调试代码

---

## 4. Testing Requirements

### 4.1 Unit Test (Vitest)

| 文件 | 测试要求 |
|------|----------|
| `canvasHistoryStore.ts` | `undo()/redo()/canUndo()/canRedo()` 逻辑 |
| `useRealtimeSync.ts` | 订阅/写入逻辑（已有）|
| `DDSToolbar.tsx` | Undo/Redo 按钮 disabled 状态 |

**覆盖率要求**: 关键路径 100%（undo/redo command execution）

### 4.2 E2E Test (Playwright)

| Epic | 测试文件 | 必须通过的断言 |
|------|----------|----------------|
| E1 | `presence-mvp.spec.ts` | RemoteCursor 可见 + PresenceAvatars 包含用户名 |
| E2 | `templates-market.spec.ts` | API 200 + ≥3 模板 + tab 可切换 |
| E5 | `design-review-degradation.spec.ts` | MCP 503 → 降级文案 + canvas 可操作 |
| E5 | `design-review-tabs.spec.ts` | 3 tab 可切换 + 无页面刷新 |

**Mock 规范**:
- E2E 测试使用 `page.route()` mock 外部依赖（MCP server, Firebase）
- Mock 响应格式必须与生产 API 一致
- 每个 test 文件独立 mock setup（不共享全局 mock）

### 4.3 TypeScript Check

```bash
# PR 通过前必须通过
pnpm exec tsc --noEmit
```

---

## 5. PR Review Checklist

### E1: 多人协作 MVP
- [ ] `DDSCanvasPage.tsx` 中 `<RemoteCursor />` JSX 存在
- [ ] RemoteCursor 有 `isFirebaseConfigured()` 条件守卫
- [ ] `useRealtimeSync` 在 DDSCanvasPage 中被调用（import + 调用）
- [ ] `presence-mvp.spec.ts` 存在且 2 个测试通过
- [ ] TypeScript 编译通过

### E2: 模板市场 MVP
- [ ] `/api/templates/marketplace` route 返回 200 且 body 含 ≥3 模板
- [ ] 静态 JSON 文件字段完整（id/industry/icon 等）
- [ ] `/dashboard/templates` 页面包含 3 个 industry tab（saas/mobile/ecommerce）
- [ ] Tab 切换正确过滤模板（`template-card` 数量变化）
- [ ] `templates-market.spec.ts` 存在且测试通过

### E3: MCP DoD CI Gate
- [ ] `.github/workflows/test.yml` 包含 `generate-tool-index` job
- [ ] job trigger paths 包含 `packages/mcp-server/src/tools/**/*.ts`
- [ ] `git diff --exit-code docs/mcp-tools/INDEX.md` 作为 CI step

### E4: 撤销重做 Toolbar
- [ ] `DDSToolbar.tsx` 包含 `data-testid="undo-btn"` button
- [ ] `DDSToolbar.tsx` 包含 `data-testid="redo-btn"` button
- [ ] undo 按钮 `disabled={!canUndo}`，redo 按钮 `disabled={!canRedo}`
- [ ] Toolbar 上线后 `Ctrl+Z` / `Ctrl+Shift+Z` 仍正常

### E5: Design Review E2E
- [ ] `design-review-degradation.spec.ts` 存在且 2 个测试通过
- [ ] MCP 503 时页面显示「AI 评审暂时不可用」（非白屏）
- [ ] `design-review-tabs.spec.ts` 存在且 4 个测试通过
- [ ] 3 个 tab 可切换，Tab 切换无页面刷新

---

## 6. CI Checks

PR 合并前必须通过的 CI 检查：

| Check | Command | 失败处理 |
|-------|---------|----------|
| ESLint | `pnpm lint` | 修复 lint errors，再提交 |
| TypeScript | `pnpm exec tsc --noEmit` | 修复类型错误，再提交 |
| E2E Tests (CI) | `pnpm exec playwright test --project=ci` | 修复失败的测试，再提交 |
| Tool Index | CI `generate-tool-index` job | 运行 `node scripts/generate-tool-index.ts`，commit 生成的 INDEX.md |

**CI 触发范围**：
- E1/E2/E4/E5: `vibex-fronted/src/**`, `vibex-fronted/tests/**`
- E3: `packages/mcp-server/src/tools/**/*.ts`, `scripts/generate-tool-index.ts`

---

## 7. Data Constraints

### 7.1 Marketplace Template Schema

**文件**: `vibex-backend/public/data/marketplace-templates.json`

```typescript
interface MarketplaceTemplate {
  id: string;           // 格式: "tpl_mkt_{3-digit}", e.g., "tpl_mkt_001"
  name: string;         // 非空，≤ 100 chars
  industry: 'saas' | 'mobile' | 'ecommerce';  // 枚举限制
  description: string;  // 非空，≤ 500 chars
  tags: string[];       // 至少 1 个 tag
  icon: string;        // 必须是 emoji，非空，length > 0
  previewUrl: string;   // 静态路径，如 "/images/templates/xxx.png"
  usageCount: number;   // 非负整数
  createdAt: string;    // ISO date, e.g., "2026-03-01"
}
```

**约束规则**:
- `id` 全局唯一
- `industry` 只能是枚举值之一
- `icon` 必须是单个 emoji 字符（`/[\p{Emoji}]/u`）
- `tags` 数组至少包含 1 个元素

### 7.2 DesignReviewReport Schema

```typescript
interface DesignReviewReport {
  compliance: {
    score: number;      // 0-100
    issues: string[];  // 可为空数组
  };
  accessibility: {
    score: number;
    issues: string[];
  };
  reuse: {
    score: number;
    suggestions: string[];
  };
}
```

**约束规则**:
- `score` 范围 0-100，超出范围按 0/100 处理
- `issues` / `suggestions` 数组可为空（表示无问题）

---

## 8. Collaboration Rules

### 8.1 Branch Strategy

```bash
# 每个 Epic 一个 feature branch
git checkout -b feature/E1-realtime-collab
git checkout -b feature/E2-template-market
git checkout -b feature/E3-mcp-ci-gate
git checkout -b feature/E4-toolbar-undo-redo
git checkout -b feature/E5-design-review-e2e

# PR 合并到 main
git checkout main
git merge feature/E1-realtime-collab
```

### 8.2 Review Requirements

- 每个 PR 至少 1 人 review
- review 必须检查：
  1. TypeScript 类型正确性
  2. E2E 测试断言覆盖 DoD
  3. 无 console.log / TODO 残留
  4. data-testid 命名正确

### 8.3 DoD Gate

所有 Story 合并前必须满足：
- [ ] 代码已合并到 main 分支
- [ ] 所有新增/修改文件通过 ESLint（无 error）
- [ ] 单元测试新增用例通过
- [ ] E2E 测试通过（Playwright CI）
- [ ] `git diff` 不包含 console.log / TODO / FIXME 残留
- [ ] TypeScript 类型检查通过（`tsc --noEmit`）

---

*本文档由 architect agent 编写，作为 Sprint 36 开发约束指南。*
*生成时间: 2026-05-11 20:10 GMT+8*