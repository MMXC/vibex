# VibeX Sprint 34 — 开发约束

**Agent**: ARCHITECT | **日期**: 2026-05-09 | **项目**: vibex-proposals-sprint34

---

## 1. 文件归属

| 文件 | Owner | 说明 |
|------|-------|------|
| `vibex-fronted/src/stores/dds/canvasHistoryStore.ts` | coder | P001 新建，Command Pattern + Zustand |
| `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` | coder | P001 middleware 包装，不修改现有 action 签名 |
| `vibex-fronted/src/pages/DDSCanvasPage.tsx` | coder | P001 undoCallback/redoCallback 连接，P003 依赖此连接 |
| `vibex-fronted/src/hooks/useKeyboardShortcuts.ts` | coder | P003 动态读取 shortcutStore |
| `vibex-fronted/src/stores/shortcutStore.ts` | coder | P003 已有，API 不变 |
| `.github/workflows/bundle-report.yml` | coder | P002 新建 |
| `lighthouserc.js` | coder | P002 新建 |
| `docs/vibex-proposals-sprint34/performance-baseline.md` | coder | P002 新建 |
| `vibex-fronted/tests/e2e/sprint34-p001.spec.ts` | coder | P001 E2E |
| `vibex-fronted/tests/e2e/sprint34-p003.spec.ts` | coder | P003 E2E |

---

## 2. 代码规范

### 2.1 TypeScript 约定

- `strict: true`，无 `any` 逃逸（已配置于 tsconfig.json）
- 导出所有公共接口：`export type` / `export interface`
- `'use client'` 标注所有客户端组件

### 2.2 P001 — canvasHistoryStore 规范

**Command 接口**：

```typescript
export interface Command {
  id: string
  execute: () => void
  rollback: () => void
  timestamp: number
  description?: string
}
```

**命名约定**：
- 每个 Command 对象命名为 `XxxCommand`（如 `AddNodeCommand`）
- `execute()` 闭包内使用箭头函数引用 `set`/`get`（保持 this 上下文）
- `rollback()` 必须精确恢复 `execute()` 前的状态

**History 栈限制**：
- `MAX_HISTORY = 50`（常量，禁止硬编码数字）
- 超过限制时 `past.shift()` 淘汰最旧记录
- `future` 栈在 `execute()` 时清空（`future = []`）

**localStorage Key**：`vibex-dds-history-{canvasId}`
- 读取: `JSON.parse(raw ?? 'null')` → `{ past: Command[], future: Command[] }`
- 写入: `JSON.stringify({ past, future })`（Command.execute/rollback 闭包不序列化）
- 错误处理: `try/catch`，读取失败返回 `null`

**isPerforming 标志**：
- `isPerforming = true` 时 `execute()` 直接 return（防止嵌套）
- `undo()`/`redo()` 开始时设为 `true`，结束时设为 `false`

### 2.3 P001 — Middleware 规范

**包装原则**：middleware 只拦截 `DDSCanvasStore` 的 action 调用，不修改 action 本身。

```typescript
// 示例：包装 setNodes action
const originalSetNodes = DDSCanvasStore.getState().setNodes
DDSCanvasStore.setState({
  setNodes: (...args: Parameters<typeof originalSetNodes>) => {
    // 1. 捕获 rollback snapshot
    const snapshot = { nodes: DDSCanvasStore.getState().nodes }
    // 2. 调用原 action
    const result = originalSetNodes(...args)
    // 3. 创建 Command 并入栈
    const cmd: Command = {
      id: crypto.randomUUID(),
      execute: () => originalSetNodes(...args),
      rollback: () => DDSCanvasStore.setState({ nodes: snapshot.nodes }),
      timestamp: Date.now(),
      description: 'setNodes',
    }
    canvasHistoryStore.getState().execute(cmd)
    return result
  },
})
```

**禁止行为**：
- ❌ 不要在 middleware 内修改 `DDSCanvasStore` 的 state shape
- ❌ 不要在 middleware 内直接调用其他 action（通过 `getState()` 获取最新状态）
- ❌ 不要在 `isPerforming = true` 时记录 undo/redo 操作本身

### 2.4 P002 — CI Workflow 规范

**bundle-report.yml**:
- `ANALYZE=true` 环境变量必须显式传递
- artifact retention-days ≤ 7（控制存储成本）
- PR 评论必须包含：主包大小（KB）、与基准的变化（%）
- `if: github.event_name == 'pull_request'`（确保只在 PR 触发）

**lighthouserc.js**:
- `assertions` 使用 `warn` 级别（非 `error`），避免网络波动阻断 PR
- `numberOfRuns: 3`（取中位数，减少波动）
- `startServerReadyPattern` 必须匹配实际输出（如 `Ready` 或 `listen on`）

### 2.5 P003 — Dynamic Shortcut 规范

**registerDynamicShortcut**：

```typescript
function registerDynamicShortcut(config: {
  key: string        // e.g. 'ctrl+z', 'meta+k', 'shift+/'
  action: () => void
  description?: string
}): () => void {
  const handler = (e: KeyboardEvent) => {
    // 跳过 input/textarea/select（Esc 除外）
    if (isInputFocused() && config.key !== 'escape') return
    // preventDefault + 执行
    e.preventDefault()
    config.action()
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}
```

**shortcutStore subscribe**：
- 在 `useKeyboardShortcuts` 的 `useEffect` 中订阅
- 每次 subscription 触发时，先 `unregisterAll()` 再重新注册
- 返回 `unsubscribe` 清理函数

---

## 3. 测试要求

### 3.1 单元测试（Vitest）

| Epic | 覆盖率目标 | 关键测试路径 |
|------|-----------|-------------|
| P001: canvasHistoryStore | > 80% | execute, undo, redo, 50步限制, localStorage |
| P001: Middleware 包装 | > 80% | 每个 action 的 Command 入栈验证 |
| P003: useKeyboardShortcuts | > 80% | 动态读取 shortcutStore, 焦点保护, conflict detection |

### 3.2 E2E 测试（Playwright）

```typescript
// sprint34-p001.spec.ts
test('P001: 添加节点 → Ctrl+Z 撤销 → Ctrl+Shift+Z 重做', async ({ page }) => { ... })
test('P001: 删除节点 → 撤销 → 重做', async ({ page }) => { ... })
test('P001: 50步后最旧记录被淘汰', async ({ page }) => { ... })
test('P001: 刷新页面后历史记录保留', async ({ page }) => { ... })

// sprint34-p003.spec.ts
test('P003: 按 ? 打开快捷键帮助面板', async ({ page }) => { ... })
test('P003: 焦点在输入框时画布快捷键不触发', async ({ page }) => { ... })
```

### 3.3 回归测试

- 53 个 Canvas 单元测试全部通过
- Sprint 33 E2E 测试全部通过（确保 P001 Middleware 不破坏现有功能）

---

## 4. 集成约束

### 4.1 P001 + P003 共享连接点

`DDSCanvasPage.tsx` 第 375-380 行：
```typescript
// 修改前（stub）:
const undoCallback = () => false
const redoCallback = () => false

// 修改后（由 P001 实现）:
const undoCallback = () => canvasHistoryStore.getState().undo()
const redoCallback = () => canvasHistoryStore.getState().redo()
```

此连接点同时服务于 `useKeyboardShortcuts`（P003）。

### 4.2 P001 Middleware 兼容性确认

middleware 包装后，以下现有功能必须不受影响：
- `DDSCanvasStore` 的所有现有 action 签名不变
- 所有现有组件的 import 不变
- 所有现有单元测试行为不变
- `getState()` 返回的 state shape 不变（`canvasHistoryStore` 是独立 store）

### 4.3 P002 前置确认

- `next.config.ts` 已使用 `withBundleAnalyzer`，无需修改
- `@next/bundle-analyzer` 已在 `package.json` 中
- `@lhci/cli` 需要作为 dev dependency 添加
- Cloudflare Pages 部署已支持 `NEXT_OUTPUT_MODE=standalone`

### 4.4 P003 shortcutStore 冲突处理

`shortcutStore` 中已存在 `conflictCheckResult`。在 `useKeyboardShortcuts` 动态注册时，复用已有检测逻辑，不重复实现。

---

## 5. CI/CD 约束

- TypeScript 类型检查: `pnpm run type-check`（exit 0, 0 errors）
- 单元测试: `pnpm run test:unit`（exit 0）
- Coverage gate: `pnpm run test:unit:coverage` ≥ 60%（当前基线），Epic 新增代码 ≥ 80%
- E2E: `pnpm exec playwright test`（exit 0）
- Bundle Report: PR 触发 `.github/workflows/bundle-report.yml`
- Lighthouse CI: PR 触发 `.github/workflows/lighthouse-ci.yml`

---

## 6. QA 验收检查单

| 检查项 | 验证方式 |
|--------|----------|
| P001: canvasHistoryStore 存在 | `ls src/stores/dds/canvasHistoryStore.ts` |
| P001: undoCallback 连接 | `grep 'canvasHistoryStore.getState().undo' DDSCanvasPage.tsx` |
| P001: 50步限制 | `grep 'MAX_HISTORY = 50' canvasHistoryStore.ts` |
| P001: localStorage Key | `grep 'vibex-dds-history-' canvasHistoryStore.ts` |
| P001: Middleware 不修改签名 | `grep 'DDSCanvasStoreState' canvasHistoryStore.ts` |
| P002: bundle-report.yml | `ls .github/workflows/bundle-report.yml` |
| P002: lighthouserc.js | `ls lighthouserc.js` |
| P002: performance-baseline.md | `ls docs/vibex-proposals-sprint34/performance-baseline.md` |
| P003: useKeyboardShortcuts 动态读取 | `grep 'shortcutStore.subscribe' useKeyboardShortcuts.ts` |
| P003: registerDynamicShortcut | `grep 'registerDynamicShortcut' useKeyboardShortcuts.ts` |
| P003: ? 面板测试 | `grep 'shortcut-help-panel' sprint34-p003.spec.ts` |
| 回归: 53 Canvas 测试通过 | `pnpm run test:unit -- --grep Canvas` |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint34
- **执行日期**: 2026-05-09
