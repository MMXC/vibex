# VibeX 构建修复提案

**文档路径**: `docs/vibex-dev-proposals-vibex-build-fixes-20260411/proposal.md`  
**生成时间**: 2026-04-11  
**提案状态**: 待评审  
**影响范围**: 前端构建 + 后端构建

---

## 问题1: 前端构建失败 — 孤立 Story 文件引用不存在的组件

### 问题描述

- **文件**: `vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx`
- **症状**: TypeScript 编译失败，`CanvasHeader` 组件不存在但被 import
- **根因时间线**:
  1. `de829cd5` — 引入 `CanvasHeader` 组件 + Story
  2. `d0557ab0` — 在 `feat/e2-code-cleanup` 分支删除 `CanvasHeader` 组件（`CanvasHeader.tsx` 移除）
  3. `79ebe010` — 将 `CanvasHeader.stories.tsx` revert 回来（但组件本身从未合并回 main）
- **结果**: Story 文件引用了不存在的组件，构建卡死

### 技术修复方案

删除孤立的 Story 文件 `CanvasHeader.stories.tsx`，与被删除的组件保持一致。

**代码改动**:
```bash
# 删除孤立 Story 文件
rm vibex-fronted/src/components/canvas/stories/CanvasHeader.stories.tsx
```

### 实施步骤

1. 确认 `CanvasHeader` 组件（`CanvasHeader.tsx`）在 main 分支中不存在
2. 删除 `CanvasHeader.stories.tsx`
3. 验证前端构建通过（`npm run build` 或 `pnpm build`）

### 验收标准

- `CanvasHeader.stories.tsx` 已从文件系统删除
- `CanvasHeader` 组件不存在于 `vibex-fronted/src/components/canvas/` 目录
- 前端构建（`pnpm build`）无错误退出

---

## 问题2: 后端构建失败 — Unicode 弯引号导致语法错误

### 问题描述

- **文件**: 以下 3 个文件存在相同问题:
  - `vibex-backend/src/app/api/agents/route.ts`
  - `vibex-backend/src/app/api/pages/route.ts`
  - `vibex-backend/src/app/api/prototype-snapshots/route.ts`
- **症状**: TypeScript 编译失败，`'''` 为无效语法
- **根因**: 认证失败响应中使用了 Unicode 弯引号（`'` U+2018 和 `'` U+2019）而非标准 ASCII 单引号（`'` U+0027）
- **当前状态**: 工作区已修复（git diff 显示弯引号已替换为标准引号），但未 commit

### 技术修复方案

将 3 个文件中的 Unicode 弯引号 `'''` 替换为标准 ASCII 单引号 `'`，保持 JSON 字符串语义不变。

**代码改动**（3 个文件一致，以 `agents/route.ts` 为例）:

```diff
- return NextResponse.json({ error: '''Unauthorized''' }, { status: 401 });
+ return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

完整涉及文件:
| 文件 | 行号 | 改动 |
|------|------|------|
| `vibex-backend/src/app/api/agents/route.ts` | ~47 | `'''Unauthorized'''` → `'Unauthorized'` |
| `vibex-backend/src/app/api/pages/route.ts` | ~47 | `'''Unauthorized'''` → `'Unauthorized'` |
| `vibex-backend/src/app/api/prototype-snapshots/route.ts` | ~44 | `'''Unauthorized'''` → `'Unauthorized'` |

### 实施步骤

1. 对每个文件执行 `sed` 或手动替换弯引号为标准引号
2. 确认 3 个文件的 auth check 分支均使用标准单引号
3. 验证后端构建通过（`pnpm build`）
4. git commit + push

### 验收标准

- 3 个文件的 `error: 'Unauthorized'` 使用标准 ASCII 单引号
- 后端构建（`pnpm build`）无错误退出
- git diff 确认 3 个文件各有 1 行改动

---

## 综合实施计划

| 步骤 | 操作 | 涉及文件 | 预计工时 |
|------|------|----------|----------|
| 1 | 删除孤立 Story 文件 | `CanvasHeader.stories.tsx` | 1 min |
| 2 | 替换弯引号（3 文件） | `agents/route.ts`, `pages/route.ts`, `prototype-snapshots/route.ts` | 2 min |
| 3 | 前端构建验证 | vibex-fronted | 3 min |
| 4 | 后端构建验证 | vibex-backend | 3 min |
| 5 | git commit + push | 全量 | 1 min |

**总工期**: ~10 分钟（纯修复，无新功能）

---

## 风险评估

| 风险 | 可能性 | 影响 | 缓解 |
|------|--------|------|------|
| 删除 Story 文件导致其他 Story 引用断裂 | 低 | 低 | 确认无其他文件 import CanvasHeader |
| 弯引号替换遗漏其他文件 | 低 | 中 | 全局 `grep -r "'''"` 确认无遗漏 |
| 构建缓存导致验证不准确 | 中 | 低 | 清除 `.next` / `.turbo` 后重新构建 |

---

## 评审结论

**推荐执行**

- 两个问题均为孤立、局部的代码腐化，无业务逻辑变更
- 修复明确、工期极短、风险可控
- 工作区已有弯引号修复 diff，可直接 commit

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-build-fixes
- **执行日期**: 2026-04-11

---

## 问题3: Next.js 构建 OOM 导致 CI/CD 失败

### 问题描述

- **症状**: `pnpm build` 时 Next.js 编译器被 OOM Kill（exit code 137）
- **根因**: Next.js build 在 CI 环境内存不足，tsc 类型检查 + SWC 编译消耗大量内存
- **影响**: 无法通过 CI 构建验证，所有 PR 均被阻断

### 技术修复方案

**方案A — 调整 Node 内存限制（快速）**
```bash
# 在 package.json 中设置 NODE_OPTIONS
NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**方案B — 分离类型检查与构建（推荐）**
```yaml
# .github/workflows/ci.yml
jobs:
  type-check:
    run: pnpm tsc --noEmit
  build:
    needs: type-check
    run: NODE_OPTIONS="--max-old-space-size=4096" pnpm build
```

**方案C — 增量构建优化**
```bash
# 使用 turbopack incremental build
next build --turbo
```

### 验收标准
- `pnpm build` 在 CI 环境完成无 OOM
- CI 构建时间 < 10 分钟

---

## 问题4: TODO 注释未追踪，积压技术债

### 问题描述

项目中有大量 `TODO` 注释，但未接入 issue 系统，存在静默技术债。

**已识别 TODO 位置**:
| 文件 | 行数 | 说明 |
|------|------|------|
| `app/projects/new/page.tsx` | 60 | 模板数据填充 |
| `app/project-settings/page.tsx` | 88,181,211,227,246 | 后端 API 替换 |
| `app/domain/DomainPageContent.tsx` | 282 | 简单匹配标记 |
| `stores/projectTemplateStore.ts` | 109 | API 调用替换 |
| `stores/deliveryStore.ts` | 250 | API 调用替换 |
| `components/delivery/ComponentTab.tsx` | 85 | 接口成员 |

### 技术修复方案

1. 将所有 TODO 转为 GitHub Issue
2. 优先级分类:
   - P0: API 替换（project-settings 页面无法保存）
   - P1: 模板数据（新建项目无内容）
   - P2: UI 增强

### 验收标准
- 所有 TODO 有对应 GitHub Issue
- project-settings page.tsx API 调用完成

---

## 问题5: BoundedContextTree 批量删除仍有 Snapshot 优化空间

### 问题描述

`BoundedContextTree.tsx` 中批量删除选中和删除全部都调用了 `recordSnapshot`，但存在多次操作时的重复 Snapshot 风险。

**当前代码**:
```typescript
// 删除选中 — 每次操作记录一次 Snapshot
getHistoryStore().recordSnapshot('context', contextNodes);
deleteSelectedNodes('context');

// 删除全部 — 同样独立 Snapshot
deleteAllNodes(); // 内部已调用 recordSnapshot
```

### 技术修复方案

统一入口：所有删除操作统一经过 `deleteSelectedNodes` / `deleteAllNodes`，内部自动 Snapshot。移除组件层的手动 Snapshot 调用。

### 验收标准
- BoundedContextTree 中手动 recordSnapshot 调用 ≤ 1
- 批量删除后 Ctrl+Z 正常工作

---

## 问题6: confirmDialogStore API 不一致风险

### 问题描述

`confirmDialogStore` 采用了 callback-based API（`open({ onConfirm, onCancel })`），但 store 本身也暴露了 `confirm` / `cancel` 方法，存在 API 混淆。

**当前 API 混乱**:
```typescript
// 方式1: callback-based (当前使用)
useConfirmDialogStore.getState().open({ title, message, onConfirm: fn });

// 方式2: Promise-based (store 有这个方法但未使用)
useConfirmDialogStore.getState().confirm({ title, message });
```

### 技术修复方案

**统一为 callback-based API**，删除未使用的 `confirm`/`cancel` 方法，保持 API 简洁。

```typescript
// 删除以下未使用的方法
confirm: () => void;  // 未使用
cancel: () => void;  // 未使用
```

### 验收标准
- `confirmDialogStore` 仅有 `open/close` 两个核心方法
- 所有调用方统一使用 callback-based API

---

## 综合优先级

| 优先级 | 问题 | 预计工时 | 风险 |
|--------|------|----------|------|
| P0 | Build OOM | 15min | 低 |
| P1 | TODO → Issue | 30min | 低 |
| P2 | Snapshot 优化 | 20min | 中 |
| P3 | confirmDialogStore API 清理 | 10min | 低 |

---

## 评审结论

**推荐执行**: P0（Build OOM）和 P3（confirmDialogStore API 清理）可立即执行，P1 和 P2 可在下一 Sprint 排期。
