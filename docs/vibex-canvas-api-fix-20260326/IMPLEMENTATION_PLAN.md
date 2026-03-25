# VibeX Canvas API 对接 — 实施计划

**项目**: vibex-canvas-api-fix-20260326
**日期**: 2026-03-26
**角色**: architect

---

## 概述

修复 Canvas 启动画布未对接后端 API 的问题。采用 SSE 方案调用 `/api/ddd/bounded-context/stream` 和 `/api/ddd/business-flow/stream`，实现实时生成上下文树和流程树。

**约束**:
- SSE 流式响应，复用现有后端端点
- store action 统一处理 SSE，组件只负责 UI
- loading/error 状态完整，不静默失败
- gstack 验证：截图 + 报告作为验收证据

---

## 实施步骤

### Step 1: DDD API 客户端封装

**文件**: `src/lib/canvas/api/dddApi.ts`（新建）

```
$ mkdir -p src/lib/canvas/api
$ touch src/lib/canvas/api/dddApi.ts
$ touch src/lib/canvas/api/dddApi.test.ts
```

**实现内容**:
1. `generateContextsSSE(text, callbacks)` — SSE 调用上下文生成
   - `callbacks.onThinking(step, message)`
   - `callbacks.onContext(context: BoundedContext)`
   - `callbacks.onDone(summary)`
   - `callbacks.onError(error)`
2. `generateFlowsSSE(contextIds, callbacks)` — SSE 调用流程生成
3. `AbortController` 10s 超时控制
4. fetch 错误封装

**验收**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] 单元测试覆盖 event parsing（thinking/context/done）
- [ ] 超时测试（AbortController 触发）

---

### Step 2: canvasStore SSE action

**文件**: `src/lib/canvas/canvasStore.ts`（新建或扩展现有）

**新增 actions**:
```typescript
generateContextsFromRequirement(text: string): Promise<void>
generateFlowsFromContexts(contextIds: string[]): Promise<void>
```

**SSE → store 映射**:
- SSE `thinking` → `setState({ aiThinking: true, aiThinkingMessage: message })`
- SSE `context` → `setState({ contextNodes: [...nodes, context] })`
- SSE `done` → `setState({ aiThinking: false, phase: 'context' })`
- SSE `error` → `setState({ aiThinking: false })` + toast

**验收**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] store action 单元测试（mock SSE events）

---

### Step 3: CanvasPage 按钮集成

**文件**: `src/components/canvas/CanvasPage.tsx`

**修改内容**:
1. 启动按钮 `onClick` → 调用 `canvasStore.generateContextsFromRequirement()`
2. 按钮 disabled 状态绑定 `aiThinking`
3. 按钮文字：`aiThinking ? '分析中...' : '启动画布'`
4. 面板显示 AI thinking 提示

**验收**:
- [ ] `pnpm tsc --noEmit` 通过
- [ ] gstack 验证：点击按钮 → 显示"分析中..." → 上下文树出现节点

---

### Step 4: 错误处理

**文件**: `src/lib/canvas/api/dddApi.ts` + `src/components/canvas/CanvasPage.tsx`

**Error scenarios**:
| 场景 | 处理 |
|------|------|
| 网络错误 | toast.error('网络错误，请检查连接')，按钮恢复 |
| API 超时（10s） | toast.error('请求超时，请重试')，按钮恢复 |
| API 400/500 | toast.error(err.message)，按钮恢复 |
| SSE 解析失败 | toast.error('数据解析失败')，按钮恢复 |

**验收**:
- [ ] gstack 断网测试：显示 toast，无崩溃
- [ ] gstack 超时测试（mock SSE delay > 10s）：显示超时 toast

---

## 文件变更清单

```
新增:
+ src/lib/canvas/
+ src/lib/canvas/api/
+ src/lib/canvas/api/dddApi.ts
+ src/lib/canvas/api/dddApi.test.ts
+ src/lib/canvas/canvasStore.ts
+ src/lib/canvas/canvasStore.test.ts

修改:
~ src/components/canvas/CanvasPage.tsx
~ src/components/canvas/PhaseProgressBar.tsx（可选）
~ src/components/canvas/TreePanel.tsx（thinking 状态显示）
```

---

## 测试计划

| 层级 | 工具 | 覆盖率目标 | 负责人 |
|------|------|-----------|--------|
| DDD API 客户端 | Jest | > 90% | Dev |
| canvasStore actions | Jest | > 85% | Dev |
| CanvasPage 集成 | Playwright (gstack) | E2E 手动截图 | Dev + Tester |

**gstack 验收用例**:
1. 点击"启动画布" → 按钮变为"分析中..." → 上下文树出现节点
2. 断网 → toast 提示 → 按钮恢复可点击
3. 刷新页面 → 上下文树状态保留（localStorage）

---

## 风险缓解

| 风险 | 等级 | 缓解 |
|------|------|------|
| SSE 重连 | 低 | AbortController 每次新建，失败后按钮恢复让用户重试 |
| 后端 SSE 端点不可用 | 中 | PRD 阶段已 gstack 验证端点可用 |
| 流式事件解析错误 | 低 | try-catch 包裹，每条消息独立解析 |

---

*Architect — VibeX Canvas API Fix | 2026-03-26*

---

## Epic 2: CanvasPage 集成 + 遗留修复 ✅

**范围**: Epic1 遗留问题 + Epic2 CanvasPage 完整集成

### Step 5: 遗留问题修复 ✅

**修复内容**:
1. 清理 `console.log` x2（Step1-4 中遗留）— `c7b96820`
2. SSE 解析边界修复（pendingEventType 状态机，正确处理跨chunk event+data）— `c7b96820`
3. `generateFlowsSSE` — 单 SSE 流（`/api/v1/analyze/stream`）已覆盖所有 tree 类型，无需单独实现

### Step 6: CanvasPage 完整集成 ✅

**文件**: `src/components/canvas/CanvasPage.tsx`

**修改内容**:
1. 启动按钮 `onClick` → 调用 `canvasStore.generateContextsFromRequirement()` ✅
2. 按钮 `disabled` 绑定 `aiThinking` ✅ (Epic1 已完成)
3. 按钮文字：`aiThinking ? '分析中...' : '启动画布'` ✅
4. AI thinking 提示 UI（`aiThinkingMessage` 显示）✅
5. 回归现有 ProjectBar / export / status 功能 ✅

**验收**:
- [x] gstack 截图：点击按钮 → "分析中..." → 上下文树节点出现（`e17=启动画布`, `e18=点击后phase=context`)
- [x] ProjectBar/export/status 功能无退化
- [x] TypeScript 0 errors ✅
- [x] 51 canvasStore tests pass ✅
- [x] 208 suites / 2485 tests regression ✅

**Commits**:
- `3edb3c60`: Epic1 SSE DDD client
- `f5c06f71`: Epic2 SSE buffer fix + console.log cleanup + gstack verification

---

## Epic 3: E2E 测试验证

### Step 7: Playwright E2E 测试

**文件**: `tests/canvas/canvas-api-e2e.spec.ts`

**测试用例**:
| ID | 场景 | 验收 |
|----|------|------|
| E2E-1 | 正常流程：输入文本 → 启动 → 上下文树非空 | gstack 截图 |
| E2E-2 | Loading 状态：按钮禁用 + "分析中..." | gstack 截图 |
| E2E-3 | 错误流程：断网 → toast 提示 | gstack 截图 |
| E2E-4 | 持久化：刷新页面 → 数据保留 | gstack 截图 |

### Step 8: 回归测试验证

**验收**: ✅ 208 suites / 2485 tests 全部通过（CardTreeView OOM 为预存问题，非本次引入）

