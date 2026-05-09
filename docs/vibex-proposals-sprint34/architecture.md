# VibeX Sprint 34 — System Architecture

**Project**: vibex-proposals-sprint34
**Date**: 2026-05-09
**Status**: Technical Design — Architect Review
**Author**: architect

---

## 1. Tech Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| State management | Zustand | ^5.x | Lightweight, middleware support, existing in codebase |
| Undo/Redo | Command Pattern + canvasHistoryStore | — | Fine-grained rollback per operation |
| Bundle analysis | `@next/bundle-analyzer` | ^0.11.x | Already installed, only needs CI wiring |
| Performance CI | `@lhci/cli` | ^0.14.x | Lighthouse CI for Core Web Vitals trend |
| Shortcut system | shortcutStore + useKeyboardShortcuts | — | Both exist, need dynamic integration |
| Unit testing | Vitest | ^2.x | Vite-native, Jest-compatible |
| E2E testing | Playwright | ^1.x | Cross-browser E2E |
| CI/CD | GitHub Actions | — | bundle-report.yml, ai-review.yml |

**Key existing components referenced**:
- `vibex-fronted/src/stores/dds/DDSCanvasStore.ts` — existing canvas store (wrapping via middleware)
- `vibex-fronted/src/hooks/useKeyboardShortcuts.ts` — existing hook (~250 lines), hardcoded shortcuts
- `vibex-fronted/src/stores/shortcutStore.ts` — existing shortcut config store
- `vibex-fronted/src/pages/DDSCanvasPage.tsx` — line 375-380: `undoCallback`/`redoCallback` stubs

---

## 2. Architecture Diagram

```mermaid
graph TD
    subgraph "DDSCanvasPage"
        DCP[DDSCanvasPage.tsx<br/>undoCallback/redoCallback stubs → wired]
        SK[useKeyboardShortcuts<br/>P003: dynamic reading]
        HB[? help panel]
    end

    subgraph "History Layer (P001)"
        CHS[canvasHistoryStore<br/>双栈: past/future<br/>Command Pattern]
        MID[Zustand Middleware<br/>包装 DDSCanvasStore actions<br/>不修改现有签名]
        LS[localStorage<br/>持久化 (50步限制)]
    end

    subgraph "Shortcut Layer (P003)"
        SS[shortcutStore<br/>用户自定义快捷键配置]
        CD[conflictCheckResult<br/>冲突检测]
    end

    subgraph "Performance Layer (P002)"
        BR[Bundle Report CI<br/>ANALYZE=true build<br/>artifact upload + PR comment]
        LH[Lighthouse CI<br/>@lhci/cli<br/>Core Web Vitals 趋势]
        PB[performance-baseline.md<br/>文档化基线值]
    end

    subgraph "GitHub Actions"
        BWF[.github/workflows<br/>/bundle-report.yml]
        LWF[.github/workflows<br/>/lighthouse-ci.yml]
    end

    DCP --> SK
    SK -->|"undo/redo action →"| CHS
    SK -->|"读取动态快捷键"| SS
    SS --> CD
    CHS --> MID
    MID -->|"wrap actions"| DCP
    CHS --> LS
    BWF --> BR
    LWF --> LH
    LH --> PB
    BR --> PB

    style CHS fill:#e1f5fe
    style SS fill:#fff3e0
    style BR fill:#e8f5e9
```

**Data flow — P001 Undo/Redo**:

```
用户操作 (节点增删改/Group折叠)
  → DDSCanvasStore action (被 middleware 拦截)
  → middleware: 创建 Command { execute, rollback, id, timestamp }
  → canvasHistoryStore.execute(cmd) → past.push(cmd)
  → action 执行，DOM 更新
  → localStorage 同步 (JSON.stringify past)

Ctrl+Z 按下
  → useKeyboardShortcuts 检测
  → shortcutStore.shortcuts 中找到 undo action
  → 调用 undoCallback → canvasHistoryStore.undo()
  → past.pop() → cmd.rollback() → future.push(cmd)
  → DOM 回滚到上一步状态

Ctrl+Shift+Z 按下
  → canvasHistoryStore.redo()
  → future.pop() → cmd.execute() → past.push(cmd)
```

**Data flow — P003 Dynamic Shortcuts**:

```
shortcutStore.shortcuts 变更
  → 触发 Zustand subscribe
  → useKeyboardShortcuts 重新读取 getState().shortcuts
  → 注销旧 keydown 监听器
  → 注册新的动态快捷键监听器
  → 无需页面刷新，实时生效
```

---

## 3. API Definitions

### P001 — canvasHistoryStore

```typescript
// vibex-fronted/src/stores/dds/canvasHistoryStore.ts

/** 单个可撤销操作的命令对象 */
export interface Command {
  /** 唯一标识，UUID */
  id: string
  /** 执行操作 */
  execute: () => void
  /** 回滚操作（撤销时调用） */
  rollback: () => void
  /** 操作时间戳（ms） */
  timestamp: number
  /** 操作描述（可选，用于调试/UI展示） */
  description?: string
}

export interface CanvasHistoryStoreState {
  past: Command[]
  future: Command[]
  /** 当前是否正在执行 undo/redo（防止嵌套） */
  isPerforming: boolean
}

export interface CanvasHistoryStore extends CanvasHistoryStoreState {
  /** 执行新命令并入栈 */
  execute(cmd: Command): void
  /** 撤销最近命令 */
  undo(): void
  /** 重做被撤销的命令 */
  redo(): void
  /** 清空所有历史 */
  clear(): void
  /** 当前可撤销 */
  canUndo: boolean
  /** 当前可重做 */
  canRedo: boolean
}
```

**localStorage Key**: `vibex-dds-history-{canvasId}`
- 存储格式: `{ past: Command[], future: Command[] }`（Command.execute/rollback 无法序列化，存储时排除）
- 恢复策略: `past` 中的每个 Command 在 restore 后重新生成 `execute`/`rollback` 闭包

**约束**:
- `MAX_HISTORY = 50`，超过时 `past.shift()` 淘汰最旧记录
- `isPerforming = true` 时禁止嵌套 execute（防止死循环）

### P001 — Middleware Wrapper

```typescript
// vibex-fronted/src/stores/dds/canvasHistoryStore.ts (middleware 部分)

/** 包装 DDSCanvasStore action，注入 history tracking */
type HistoryWrappedAction = <K extends keyof DDSCanvasStoreState>(
  key: K,
  action: DDSCanvasStoreState[K],
  rollbackSnapshot: () => Partial<DDSCanvasStoreState>
) => void

/** 创建可撤销的命令（供 middleware 调用） */
function createCommand(
  description: string,
  execute: () => void,
  rollbackSnapshot: () => void
): Command
```

### P003 — Dynamic Shortcut Integration

```typescript
// vibex-fronted/src/hooks/useKeyboardShortcuts.ts (修改点)

/** 动态注册单个快捷键 */
function registerDynamicShortcut(config: {
  key: string        // e.g. 'ctrl+z', 'meta+k'
  action: () => void
  description?: string
}): () => void  // 返回注销函数

/** 监听 shortcutStore 变更，重新注册快捷键 */
shortcutStore.subscribe((state) => {
  // 1. 注销所有旧监听器
  // 2. 从 shortcutStore.shortcuts 读取配置
  // 3. 调用 registerDynamicShortcut 为每个快捷键注册
  // 4. 保留焦点保护逻辑（输入框内不触发，Esc 除外）
})

/** 硬编码快捷键 → 动态快捷键的映射表 */
const ACTION_TO_STORE_KEY = {
  'undo': 'canvas.undo',
  'redo': 'canvas.redo',
  'search': 'global.search',
  'zoom-in': 'canvas.zoomIn',
  'zoom-out': 'canvas.zoomOut',
  'reset-zoom': 'canvas.resetZoom',
  'delete': 'canvas.delete',
  'new-node': 'canvas.newNode',
} as const
```

### P002 — Bundle Report CI

```yaml
# .github/workflows/bundle-report.yml

name: Bundle Report

on:
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - name: Build with bundle analysis
        run: ANALYZE=true pnpm build
        env:
          ANALYZE: 'true'
      - name: Upload bundle report
        uses: actions/upload-artifact@v4
        with:
          name: bundle-report-${{ github.sha }}
          path: .next/analyze/
          retention-days: 7
      - name: Comment on PR
        uses: treyhunner/artifact-comment@v1
        with:
          message: |
            ## Bundle Report
            **Main bundle size**: ${{ env.BUNDLE_SIZE_KB }} KB
            **Change**: ${{ env.BUNDLE_CHANGE_PCT }}%
            [View full report](${{ steps.upload.outputs.artifact-url }})

# 注意: BUNDLE_SIZE_KB 和 BUNDLE_CHANGE_PCT 从 build 输出解析
```

### P002 — Lighthouse CI Config

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      // 需要 NEXT_OUTPUT_MODE=standalone + Cloudflare Pages 部署
      url: [process.env.DASHBOARD_URL],
      numberOfRuns: 3,
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 30000,
    },
    assert: {
      presets: ['lighthouse:recommended'],
      assertions: {
        // Core Web Vitals — warn 级别（不阻断 PR，仅警告）
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'first-input-delay': ['warn', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        // Bundle size budget
        'uses-optimized-images': 'warn',
        'unused-javascript': 'warn',
      },
    },
    upload: {
      target: 'lhci',
      serverBaseUrl: process.env.LHCI_SERVER_URL,
      token: process.env.LHCI_BUILD_TOKEN,
    },
  },
}
```

---

## 4. Data Model

### P001 — History State

```
localStorage: vibex-dds-history-{canvasId}
{
  past: Array<{
    id: string
    description: string
    timestamp: number
    // execute/rollback 在运行时重新构造，不存储
  }>,
  future: Array<{...}>
}
```

### P002 — Performance Baseline

```
docs/vibex-proposals-sprint34/performance-baseline.md
{
  bundle: {
    main: number (KB),
    timestamp: ISO8601,
    commit: string,
  },
  coreWebVitals: {
    lcp: number (ms),
    fid: number (ms),
    cls: number,
    url: string,
    timestamp: ISO8601,
  }
}
```

### P003 — Shortcut Config

`shortcutStore.ts` 现有模型不变（`shortcuts: Shortcut[]`）。`useKeyboardShortcuts` 增加动态读取逻辑。

```
Shortcut {
  id: string
  action: string      // 'canvas.undo' | 'canvas.redo' | ...
  key: string         // 'ctrl+z'
  currentKey: string
  defaultKey: string
  enabled: boolean
}
```

---

## 5. Testing Strategy

### P001 — Undo/Redo

**测试框架**: Vitest

**覆盖率目标**: `canvasHistoryStore` > 80%

**核心测试用例**:

```typescript
// canvasHistoryStore.test.ts

test('execute: 命令入栈 past.length 增加', () => {
  const cmd = createCommand('add node', () => {}, () => {})
  history.execute(cmd)
  expect(history.past.length).toBe(1)
})

test('undo: past 出栈，rollback 调用，future 入栈', () => {
  const rollback = vi.fn()
  const cmd = createCommand('add node', () => {}, rollback)
  history.execute(cmd)
  history.undo()
  expect(rollback).toHaveBeenCalledTimes(1)
  expect(history.future.length).toBe(1)
  expect(history.past.length).toBe(0)
})

test('redo: future 出栈，execute 调用，past 入栈', () => {
  const execute = vi.fn()
  const cmd = createCommand('add node', execute, () => {})
  history.execute(cmd)
  history.undo()
  history.redo()
  expect(execute).toHaveBeenCalledTimes(1)
  expect(history.past.length).toBe(1)
})

test('50步限制: 超过后 shift 淘汰最旧记录', () => {
  for (let i = 0; i < 55; i++) {
    history.execute(createCommand(`step ${i}`, () => {}, () => {}))
  }
  expect(history.past.length).toBe(50)
  expect(history.past[0].description).toBe('step 5')  // 前5条被淘汰
})

test('localStorage 持久化: 刷新后 history 可恢复', () => {
  history.execute(createCommand('test', () => {}, () => {}))
  const serialized = JSON.stringify({ past: history.past, future: [] })
  // 模拟刷新后恢复
  const restored = JSON.parse(serialized)
  expect(restored.past.length).toBe(1)
})

test('现有 53 个 Canvas 单元测试全部通过', () => {
  // 回归测试，确保 middleware 不破坏现有功能
})
```

**E2E 测试**:

```typescript
// tests/e2e/sprint34-p001.spec.ts

test('P001: 添加节点 → Ctrl+Z 撤销 → Ctrl+Shift+Z 重做', async ({ page }) => {
  await page.goto('/dds/canvas/test-canvas-id')
  const initialCount = await page.locator('[data-testid="node"]').count()
  await page.keyboard.press('n')  // 新建节点
  const afterAdd = await page.locator('[data-testid="node"]').count()
  expect(afterAdd).toBe(initialCount + 1)
  await page.keyboard.press('Control+z')
  const afterUndo = await page.locator('[data-testid="node"]').count()
  expect(afterUndo).toBe(initialCount)
  await page.keyboard.press('Control+Shift+z')
  const afterRedo = await page.locator('[data-testid="node"]').count()
  expect(afterRedo).toBe(initialCount + 1)
})
```

### P002 — Performance Baseline

**测试框架**: GitHub Actions CI（自动化），Playwright（E2E）

**核心验证**:

```yaml
# bundle-report.yml 验证点
- run: ANALYZE=true pnpm build  # exit 0
- uses: actions/upload-artifact@v4  # artifact 存在
- uses: treyhunner/artifact-comment@v1  # PR comment 成功

# lighthouserc.js 验证点
- lhci autorun  # exit 0
- assert: Core Web Vitals 在基线范围内
```

### P003 — Shortcut Integration

**测试框架**: Vitest + Playwright

**核心测试用例**:

```typescript
// useKeyboardShortcuts.test.ts

test('P003: shortcutStore 配置变更 → 快捷键行为实时更新', () => {
  // 初始: ctrl+z 绑定到 undo
  // shortcutStore 更新: ctrl+z → redo
  // 验证: ctrl+z 现在触发 redo 而非 undo
})

test('P003: 焦点在输入框 → 画布快捷键不触发（Esc 除外）', () => {
  // 键盘事件在 input 内部时，preventDefault 不应被调用
  // Esc 例外: 即使焦点在输入框，Esc 也应触发
})

test('P003: 冲突快捷键保存被阻止', () => {
  // shortcutStore 设置两个相同 key → conflictCheckResult 返回冲突
  // UI 应显示警告，保存被阻止
})
```

**E2E 测试**:

```typescript
// tests/e2e/sprint34-p003.spec.ts

test('P003: 按 ? 打开快捷键帮助面板', async ({ page }) => {
  await page.goto('/dds/canvas/test-canvas-id')
  await page.keyboard.press('?')
  await expect(page.locator('[data-testid="shortcut-help-panel"]')).toBeVisible()
})
```

---

## 6. Performance Impact Assessment

| 变更 | 性能影响 | 评估 |
|------|---------|------|
| canvasHistoryStore 新增 | JS bundle +5KB | 低 |
| Middleware 拦截每个 action | action 调用延迟 +0.1ms | 可忽略 |
| localStorage 持久化 history | 每次操作多一次序列化（50步上限）| 低 |
| shortcutStore subscribe | 极小（仅在 config 变更时触发）| 可忽略 |
| Bundle Report CI | build 时间 +30s | CI 环境中无感知 |
| Lighthouse CI | 额外 3x page load | CI 环境中约 +30s |

**总体评估**: 性能影响轻微，CI 环境无感知。

---

## 7. Integration Constraints

### P001 + P003 共享集成点

`DDSCanvasPage.tsx` 的 `undoCallback`/`redoCallback` 是 P001 和 P003 的共享连接点：

```
useKeyboardShortcuts (P003 修改)
  → undoCallback → canvasHistoryStore.undo() (P001)
  → redoCallback → canvasHistoryStore.redo() (P001)
```

**约束**: P001 和 P003 必须在同一 Sprint 内完成，共享连接点不可拆分。

### P001 Middleware 兼容性

middleware 必须满足：
- 不修改 `DDSCanvasStore` 任何现有 action 的签名
- 不修改任何现有组件的 import
- `isPerforming = true` 时跳过 middleware 拦截（防止 undo/redo 本身被记录）

### P002 前置条件

- `NEXT_OUTPUT_MODE=standalone` 已就绪（Cloudflare Pages 支持）
- `@next/bundle-analyzer` 已安装，仅需 CI 集成
- `@lhci/cli` 需要 `npm install -g @lhci/cli` 或 dev dependency

### P003 shortcutStore 冲突

`shortcutStore.shortcuts` 中的 `ctrl+z` 和 `useKeyboardShortcuts` 硬编码的 `ctrl+z` 可能重复监听。解决方案：`useKeyboardShortcuts` 从 `shortcutStore` 读取 `currentKey`，统一通过 `registerDynamicShortcut` 注册。

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint34
- **执行日期**: 2026-05-09

---

*本文档由 Architect Agent 基于 PRD + Analyst Review Report 生成。*
