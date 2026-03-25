# Implementation Plan: VibeX 画布启动 API 对接

**项目**: vibex-canvas-api-fix-20260326
**版本**: 1.0
**日期**: 2026-03-26

---

## 1. PR 批次划分

### PR #1: DDD API 客户端 + Store Action（Epic 1）
**范围**: `src/lib/canvas/api/dddApi.ts` + `src/lib/canvas/canvasStore.ts`
**工时**: ~2h
**验证**: gstack 截图

**改动文件**:
- `src/lib/canvas/api/dddApi.ts` — 新建，SSE 客户端
- `src/lib/canvas/canvasStore.ts` — 新增 `generateContextsFromRequirement` action
- `src/lib/canvas/types.ts` — 新增 SSEEvent 类型（可选）

**测试覆盖**:
- `__tests__/dddApi.test.ts` — fetch mock, timeout, error
- `__tests__/canvasStore.test.ts` — generateContextsFromRequirement action

### PR #2: CanvasPage 集成（Epic 2）
**范围**: `src/components/canvas/CanvasPage.tsx`
**工时**: ~1.5h
**验证**: gstack `/browse /canvas` + `/qa-only`

**改动文件**:
- `src/components/canvas/CanvasPage.tsx` — 启动按钮改为异步调用
- `src/components/canvas/CanvasPage.module.css` — 新增 loading/ai-thinking 样式

**测试覆盖**:
- 手动 gstack 截图：启动前 → loading → 结果
- Playwright E2E：V1-V3

### PR #3: E2E 测试（Epic 3）
**范围**: `__tests__/e2e/canvas-start.spec.ts`
**工时**: ~1.5h
**验证**: Playwright CI

---

## 2. 改动详情

### 新建文件

| 文件 | 描述 |
|------|------|
| `src/lib/canvas/api/dddApi.ts` | SSE 客户端封装 |

### 改动文件

| 文件 | 改动类型 | 改动量 |
|------|---------|--------|
| `src/lib/canvas/canvasStore.ts` | 新增 action | ~30 行 |
| `src/components/canvas/CanvasPage.tsx` | 按钮 onClick | ~10 行 |
| `src/components/canvas/CanvasPage.module.css` | 新增样式 | ~15 行 |

---

## 3. 风险与回滚

| 风险 | 缓解 | 回滚 |
|------|------|------|
| SSE 连接失败导致画布空白 | 10s timeout + error toast | Revert PR #1 |
| loading 状态导致按钮假死 | AbortController 确保清理 | Revert PR #2 |
| 破坏现有 ProjectBar 流程 | 回归测试覆盖 | Revert PR #2 |

---

*实施计划完成时间: 2026-03-26 00:10 UTC+8*
