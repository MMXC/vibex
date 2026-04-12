# AGENTS.md — VibeX Canvas Implementation Fix

**Project**: vibex-canvas-implementation-fix
**Agent**: Architect
**Date**: 2026-04-11
**Code Baseline**: `79ebe010`
**Scope**: All 3 Epics (Sprint 0 / Sprint 1 / Sprint 2)

---

## 🎯 强制规则（违反即停，修复后再继续）

### R-1: 不新增依赖

> **规则**: 任何 Epic 的任何修改不得在 `package.json` 中新增依赖项。
>
> **理由**: 项目处于 BugFix + 轻量重构阶段，引入新依赖带来的维护成本 > 价值。
>
> **检查**:
> ```bash
> git diff package.json  # 必须无新增依赖
> ```

### R-2: 每个 Story 独立 Commit

> **规则**: 每个 Story（S1-1 ~ S1-9, S2-1, S3-1）修改完成后，必须独立 commit。
>
> **理由**: 独立 commit 确保可单独回滚，避免 BugFix + CSS 混在一起难以拆分。
>
> **格式**:
> ```bash
> git add <files>
> git commit -m "[Story-Id] <简短描述>
>
> 例如:
> git commit -m "[S1-1] fix: handleRegenerateContexts useCallback exhaustive-deps"
> git commit -m "[S1-5] fix: useAutoSave polling dependency [projectId only]"
> ```

### R-3: tsc --noEmit 零错误

> **规则**: 每次 Story 完成、每次 commit 前，必须运行 `tsc --noEmit`，退出码必须为 0。
>
> **理由**: TypeScript 类型安全是本项目的核心目标之一（P0-2）。
>
> **检查**:
> ```bash
> cd vibex-fronted && npx tsc --noEmit
> # 退出码 0 才能继续
> ```

### R-4: CSS 拆分每个子文件独立 Commit

> **规则**: Epic 3 的 CSS 拆分，每个子文件迁移完成后立即 commit。
>
> **理由**: CSS 拆分范围广，出问题需要能精确定位到哪个子文件出错。

### R-5: gstack 截图对比验证（Epic 3）

> **规则**: Epic 3 每迁移一个 CSS 子文件后，必须 gstack 截图对比对应组件区域，确认无视觉差异后才能继续下一个文件。
>
> **理由**: 视觉回归在 CSS 迁移中最难发现，必须逐文件验证。

### R-6: OQ 未澄清前不合并对应 Story

> **规则**:
> - S1-2 在 OQ-1（`isActive` 语义）未澄清前**不得合并**
> - S2-1 在 OQ-2（后端可用性）和 OQ-3（降级策略）未确认前**不得合并**
>
> **理由**: 错误的方向比不动更糟糕。

### R-7: Epic 2 不得在 Vitest 外新写任何 mock

> **规则**: SSE mock 必须在 Vitest 测试文件中实现，不得在 `__mocks__` 目录新增文件。
>
> **理由**: 保持 mock 靠近测试文件，降低遗忘维护风险。

### R-8: SSE 降级不超过单层

> **规则**: SSE 失败时降级调用 `canvasApi.generateContexts`，降级后不得再尝试 SSE。
>
> **理由**: 避免降级死循环。

---

## 🛡️ ESLint Rules（强制执行）

### 在项目根目录运行（Epic 1 涉及）

```json
// .eslintrc.json 或 flat config 中确认已启用
{
  "rules": {
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Epic 1 特殊处理

| Story | ESLint 处理 |
|-------|------------|
| S1-1 | **不添加** `eslint-disable`；依赖补全后 exhaustive-deps 警告自然消失 |
| S1-5 | 移除 `eslint-disable-line react-hooks/exhaustive-deps`（依赖数组修正后不再需要）|
| 其他 | 不得新增任何 ESLint disable 注释 |

### Epic 3 CSS

```bash
# CSS Modules 不需要 lint，但构建产物需要检查 tree-shaking
# 验证：未使用的 CSS 类不被打包
# （Vite 默认按需打包 CSS Modules，无需额外配置）
```

---

## ✅ 验证标准清单

### Sprint 0: Epic 1 — 每个 Story 完成时

| # | 检查项 | 命令 |
|---|--------|------|
| 1 | `tsc --noEmit` 退出码 0 | `cd vibex-fronted && npx tsc --noEmit` |
| 2 | 无新增 ESLint warning | `cd vibex-fronted && npx eslint src/.../ --max-warnings 0` |
| 3 | 对应 Story commit 已创建 | `git log --oneline -5` |
| 4 | 代码符合 IMPLEMENTATION_PLAN 中的替换方案 | diff review |
| 5 | Vitest 相关测试通过 | `cd vibex-fronted && npx vitest run` |

### Sprint 1: Epic 2 — S2-1 完成时

| # | 检查项 | 命令/方法 |
|---|--------|----------|
| 1 | `tsc --noEmit` 退出码 0 | 同上 |
| 2 | Thinking 面板 `data-testid="ai-thinking"` 可见 | gstack browse |
| 3 | SSE 事件流节点实时填充（60s 内）| gstack E2E |
| 4 | done/error 状态 UI 反馈正确 | gstack browse |
| 5 | SSE 失败自动降级（模拟网络错误）| gstack E2E + Vitest mock |
| 6 | 降级提示 "同步模式" 正确显示 | gstack browse |
| 7 | 所有 Canvas 按钮状态正确响应 | gstack E2E |

### Sprint 2: Epic 3 — S3-1 完成时

| # | 检查项 | 命令/方法 |
|---|--------|----------|
| 1 | `canvas.module.css` 行数 < 500 | `wc -l canvas.module.css` |
| 2 | 子文件数量 = 12（含主文件）| `ls canvas.*.module.css | wc -l` |
| 3 | gstack 逐组件截图对比无视觉差异 | `gstack screenshot` + diff |
| 4 | 构建产物 CSS 增幅 < 5% | CI 打包大小报告 |
| 5 | 交互功能正常（按钮、树、面板）| gstack E2E 回归 |

---

## ⚠️ 注意事项

### Canvas 目录结构（参考）

```
vibex-fronted/src/
├── components/canvas/
│   ├── CanvasPage.tsx           ← S1-1, S1-7 修改
│   ├── canvas.module.css        ← S3-1 拆分
│   └── features/
│       ├── CanvasToolbar.tsx
│       ├── VersionHistoryPanel.tsx
│       └── ...
├── hooks/canvas/
│   ├── useAIController.ts      ← S1-1, S2-1 修改
│   ├── useCanvasRenderer.ts     ← S1-2 修改
│   ├── useCanvasExport.ts       ← S1-3 修改
│   ├── useCanvasSearch.ts       ← S1-4 修改
│   ├── useAutoSave.ts           ← S1-5, S1-6 修改
│   ├── useCanvasPanels.ts       ← S1-8 修改
│   └── ...
└── lib/canvas/
    ├── api/
    │   ├── canvasApi.ts         ← S2-1 降级调用
    │   └── canvasSseApi.ts      ← S2-1 已就绪（勿修改）
    ├── stores/
    │   ├── contextStore.ts       ← S1-9 修改
    │   ├── flowStore.ts
    │   ├── uiStore.ts
    │   └── sessionStore.ts       ← S1-8 读取
    └── types.ts                  ← S1-2 类型定义
```

### React 版本注意事项

项目使用 **React 19.2.3**，hooks API 与 React 18 兼容，所有本项目中的 `useRef`/`useState`/`useCallback`/`useEffect` 行为不变。

### Vitest 配置

测试使用 **Vitest**（非 Jest），配置位于 `vitest.config.ts`：
- `@testing-library/react` 已集成
- Mock 路径别名 `@/` 已配置
- 运行: `npx vitest run`（单次）或 `npx vitest`（watch）

### gstack 使用方法

```bash
export CI=true
export BROWSE_SERVER_SCRIPT=/root/.openclaw/gstack/browse/src/server.ts
export PLAYWRIGHT_BROWSERS_PATH=~/.cache/ms-playwright
B="/root/.openclaw/workspace/skills/gstack-browse/bin/browse"

# 截图对比流程
$B goto "http://localhost:5173/canvas/new"
$B screenshot "canvas-baseline-fullpage.png"
# 修改后
$B screenshot "canvas-refactored-fullpage.png"
# 人工对比或使用像素差异工具
```

### 降级策略实现提示（Epic 2）

```typescript
// useAIController.ts 中的降级逻辑（参考实现）
const fallbackToSyncGenerate = async (requirement: string) => {
  setGeneratingState('fallback')
  setAiThinking('正在使用同步模式...')
  try {
    const result = await canvasApi.generateContexts({ requirement, projectId })
    // 复用 done 逻辑
    onDone?.()
  } catch (err) {
    setGeneratingState('error')
    toast.error('生成失败，请重试')
  }
}
```

### 不得修改的文件

以下文件**不在本次修改范围内**，除非 specs 明确指定：

- `canvasSseApi.ts`（已实现，S2-1 仅接入不修改实现）
- `canvasApi.ts`（Epic 2 降级时调用，但不修改 API 签名）
- `flowStore.ts`（S1-9 仅从 contextStore 引用，不修改自身）
- `src/app/**`（Next.js App Router 入口，非本次范围）

---

## 📋 Story → Commit 映射

| Story | Commit Message |
|-------|---------------|
| S1-1 | `[S1-1] fix: handleRegenerateContexts add exhaustive deps [aiThinking, isQuickGenerating, requirementText, toast]` |
| S1-2 | `[S1-2] fix: useCanvasRenderer type-safe fields (isActive/parentId/children) on BusinessFlowNode/ComponentNode` |
| S1-3 | `[S1-3] fix: useCanvasExport isExporting ref→useState for reactive disabled` |
| S1-4 | `[S1-4] fix: useCanvasSearch searchTimeMs ref→useState for reactive display` |
| S1-5 | `[S1-5] fix: useAutoSave polling dependency [projectId] only (remove saveStatus)` |
| S1-6 | `[S1-6] fix: useAutoSave lastSnapshotVersionRef module-level→useRef instance isolation` |
| S1-7 | `[S1-7] fix: CanvasPage renderContextTreeToolbar useCallback memoization` |
| S1-8 | `[S1-8] fix: useCanvasPanels projectName from sessionStore instead of hardcoded` |
| S1-9 | `[S1-9] fix: contextStore getFlowStore() lazy access to resolve circular dependency` |
| S2-1 | `[S2-1] feat: useAIController SSE streamGenerate integration with fallback` |
| S3-1-part-1~11 | `[S3-1-N] refactor: canvas.module.css split into canvas.{name}.module.css` |

---

## 🚫 禁止事项

1. **禁止**在 BugFix Epic 中引入新功能（feature freeze）
2. **禁止**在 `types.ts` 中删除或重命名已有字段
3. **禁止**在 CSS 拆分时修改任何 CSS 类名（避免破坏性改名）
4. **禁止**在 Epic 2 中改变 `canvasSseApi` 的事件类型（已定义，不改）
5. **禁止**绕过 `tsc --noEmit` 验证（类型安全是 P0 目标）
6. **禁止**在 Epic 1 中修改 `canvasSseApi.ts`（仅 Epic 2 接入）
