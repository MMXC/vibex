# IMPLEMENTATION_PLAN: proposals-20260401-3 — Sprint 3

**Agent**: Architect  
**日期**: 2026-04-01  
**版本**: v1.0  
**项目**: vibex  
**Sprint**: Sprint 3  
**总工时**: 20h（单 Sprint，并行 5 Epic）  

---

## 1. Sprint 总览

| 属性 | 值 |
|------|-----|
| 总 Epic 数 | 5 |
| 总工时 | 20h |
| 并行度 | E1/E2/E4/E5 完全并行；E3 可并行（ShortcutBar 已存在） |
| Sprint 周期 | 约 1 周（5 人天） |
| 验收方式 | CI + Playwright E2E + Jest |

### Sprint 依赖图

```
E1 ────────────────────────┐
E2 ────────────────────────┼──→ Sprint 3
E3 ────────────────────────┤
E4 ────────────────────────┤
E5 ────────────────────────┘
```

> **注**: E3 依赖 ShortcutBar（`components/ShortcutBar.tsx`），已在 Sprint 1 E4 完成，可立即并行执行。

---

## 2. 任务详细分解

### 2.1 Epic 1: proposal-dedup + ErrorBoundary（4h, P0）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E1-T1 | NotificationDedup 生产修复 | 1.5h | `scripts/notification-dedup.ts`, `cli/commands/notify.ts` | `expect(dupCount).toBe(0)` |
| E1-T2 | AppErrorBoundary 统一组件 | 2h | `components/common/AppErrorBoundary.tsx`, `components/common/AppErrorBoundary.test.tsx` | `expect(isDefaultExport(AppErrorBoundary)).toBe(true)` |
| E1-T3 | 页面 ErrorBoundary 替换 | 0.5h | 修改 `pages/canvas/index.tsx`, `pages/export/index.tsx` | `expect(errorBoundaryCount).toBe(1)` |

**DoD**:
- [x] 相同 task_id 5min 内不产生重复通知
- [x] AppErrorBoundary 组件统一导出且默认导出
- [x] 画布/导出页面 ErrorBoundary 替换完成（全项目仅 1 个 ErrorBoundary）

**E1-T1 详细步骤**:
1. 审查现有 `scripts/` 下通知相关文件，找到 `notify` CLI 入口
2. 实现 `NotificationDedup` 类：`Map<task_id, timestamp>`，滑动窗口 5min
3. 在 `openclaw notify` CLI 中集成 dedup 检查（已在内存中则 skip）
4. 添加 `--check-existing <task_id>` flag，读取队列状态，无变化则 exit 0 + "SKIP"
5. 编写 Jest 测试覆盖：`same task_id within 5min → false`，`different task_ids → true`
6. 生产环境验证：`openclaw notify --check-existing <task-id>`

**E1-T2 详细步骤**:
1. 创建 `components/common/AppErrorBoundary.tsx`（React.Component + getDerivedStateFromError）
2. Fallback UI：友好错误提示（非白屏）+ `[data-testid="error-fallback"]` + 重试按钮 + 错误日志 ID
3. 导出为 default export
4. 编写 Playwright 测试：canvas 页面 trigger error → 验证 fallback 可见

**E1-T3 详细步骤**:
1. `grep -r "ErrorBoundary" components/ --include='*.tsx'` 找到现有 ErrorBoundary
2. `grep -r "ErrorBoundary" pages/ --include='*.tsx'` 找到页面级 ErrorBoundary
3. 替换为 `import AppErrorBoundary from 'components/common/AppErrorBoundary'`
4. 验证：全项目仅 AppErrorBoundary 一个 ErrorBoundary

---

### 2.2 Epic 2: heartbeat + changelog 自动化（4h, P1）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E2-T1 | 幽灵任务检测 | 1.5h | `scripts/heartbeat-scanner.ts` | `expect(ghostTaskCount).toBe(0)` |
| E2-T2 | 虚假完成检测 | 0.5h | `scripts/heartbeat-scanner.ts`（扩展 T1） | `expect(fakeDoneCount).toBe(0)` |
| E2-T3 | changelog-gen CLI | 1.5h | `scripts/changelog-gen.ts` | `expect(cliExitCode).toBe(0)` |
| E2-T4 | commit-msg hook | 0.5h | `.git/hooks/commit-msg`, `package.json` (simple-git-hooks) | `expect(hookInstallSuccess).toBe(true)` |

**DoD**:
- [x] Heartbeat 扫描无幽灵任务（activeMinutes > 60 但已完成）
- [x] `changelog-gen --from=HEAD --to=v1.0` 生成有效 CHANGELOG
- [x] commit-msg hook 正确安装并校验 Angular format

> **E2 完成**: 2026-04-01 11:37 GMT+8
> - `scripts/heartbeat-scanner.ts`: Ghost task detection (E2-T1) + Fake done detection (E2-T2)
> - `scripts/changelog-gen.ts`: Automated changelog generation (E2-T3)
> - `.githooks/commit-msg`: Conventional commits validator (E2-T4)
> - Commit: `bbb361aa`

**E2-T1 详细步骤**:
1. 在 `scripts/heartbeat-scanner.ts` 添加 `detectGhostTasks(tasks[])` 函数
2. 判断逻辑：`startedAt 有值 && completedAt 为 null && (now - startedAt) > 60min`
3. 修复：对幽灵任务执行 `task_manager.py update <project> <stage> done`（补偿式完成）
4. 编写 Jest 测试覆盖边界条件

**E2-T2 详细步骤**:
1. 在 heartbeat 扫描中，对所有 `status === 'done'` 的任务执行 `checkOutputExists(task, outputDir)`
2. `outputDir` 从任务 JSON 读取 `output` 字段，若文件不存在则标记 `fake-done`
3. 修复：更新状态 + 通知 coordinator

**E2-T3 详细步骤**:
1. 创建 `scripts/changelog-gen.ts` CLI
2. 解析 `git log --format='%s'` 获取所有 commit message
3. 按 Angular format 正则分组：`feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
4. 输出 Markdown 到 `CHANGELOG.md`
5. CLI 参数：`--from=<tag>`（默认 v1.0），`--to=HEAD`（默认）
6. 验证：生成内容包含 `## Features` 等 section 标题

**E2-T4 详细步骤**:
1. 安装 `simple-git-hooks`：`npm i -D simple-git-hooks`
2. 创建 `.git/hooks/commit-msg` 脚本：读取 `$1`（commit message 文件），校验每行是否符合 Angular format
3. Angular format 正则：`/^(\w+)(\([\w-]+\))?: .+/`
4. 在 `package.json` 添加 `"simple-git-hooks": { "commit-msg": ".git/hooks/commit-msg" }`
5. 运行安装：`npx simple-git-hooks add-commit-msg .git/hooks/commit-msg`

---

### 2.3 Epic 3: Undo/Redo 完整实现（5h, P1）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E3-T1 | HistoryStack 类 | 2h | `stores/historySlice.ts` | `expect(stackLength).toBeLessThanOrEqual(50)` |
| E3-T2 | Ctrl+Z/Y 快捷键 | 2h | `pages/canvas/index.tsx`（添加 useEffect） | `expect(undoSteps >= 1).toBe(true)` |
| E3-T3 | UndoBar UI | 0.5h | `components/ShortcutBar.tsx`（扩展） | `expect(isVisible(undoBar)).toBe(true)` |
| E3-T4 | E2E 测试 | 0.5h | `tests/e2e/undo-redo.spec.ts` | Playwright test pass |

**依赖确认**: ShortcutBar 组件（`components/ShortcutBar.tsx`）已在 Sprint 1 E4 完成，E3 无阻塞。

**DoD**:
- [x] Ctrl+Z 撤销最近一次节点操作（添加/删除/编辑）
- [x] Ctrl+Y 重做被撤销的操作
- [x] UndoBar 显示当前可撤销步数
- [x] 50 步历史栈，超出自动截断
- [x] Playwright E2E 覆盖撤销/重做场景

> **E3 完成**: 2026-04-01 12:10 GMT+8
> - `src/stores/canvasHistoryStore.ts`: Bridge store exposing historySlice via @/stores (E3-T1)
> - `src/lib/canvas/historySlice.ts`: Already implemented (three-tree undo/redo, MAX_HISTORY=50)
> - `src/hooks/useKeyboardShortcuts.ts`: Already implemented (Ctrl+Z/Y/Shift+Z)
> - `src/components/undo-bar/UndoBar.tsx`: Floating undo/redo toolbar (E3-T3)
> - `src/components/undo-bar/UndoBar.module.css`: UndoBar styles
> - `tests/e2e/undo-redo.spec.ts`: E2E tests for undo/redo (E3-T4)
> - Commit: `de776230`

**E3-T1 详细步骤**:
1. 在 `stores/historySlice.ts` 定义 `HistoryStack` 类：
   ```typescript
   class HistoryStack<T> {
     items: T[] = [];
     maxLength: number;
     constructor(maxLength = 50) { this.maxLength = maxLength; }
     push(item: T): void;
     pop(): T | undefined;
     get length(): number;
   }
   ```
2. historySlice 增加：`undoStack: HistoryStack<CanvasSnapshot>`, `redoStack: HistoryStack<CanvasSnapshot>`
3. slice actions：`pushHistory`, `undo`, `redo`, `clearRedo`
4. reducer：新操作（pushHistory）自动调用 `clearRedo`
5. 验证：单元测试 push 60 次 → length === 50

**E3-T2 详细步骤**:
1. 在 `pages/canvas/index.tsx` 添加 `useEffect`：
   ```typescript
   useEffect(() => {
     const handler = (e: KeyboardEvent) => {
       if ((e.ctrlKey || e.metaKey) && e.key === 'z') { dispatch(undo()); }
       if ((e.ctrlKey || e.metaKey) && e.key === 'y') { dispatch(redo()); }
     };
     window.addEventListener('keydown', handler);
     return () => window.removeEventListener('keydown', handler);
   }, [dispatch]);
   ```
2. 测试 Ctrl+Z 撤销添加节点、Ctrl+Y 重做被撤销节点

**E3-T3 详细步骤**:
1. 读取现有 `components/ShortcutBar.tsx` 代码
2. 在 ShortcutBar 右侧添加 UndoBar：`[data-testid="undo-bar"]`
3. 按钮：`↶ Undo` `[data-testid="undo-btn"]` + `↷ Redo` `[data-testid="redo-btn"]` + Badge `[data-testid="undo-badge"]`
4. 连接 Redux：`undoStack.length` → badge 显示步数
5. 无历史时按钮 disabled

**E3-T4 详细步骤**:
1. 创建 `tests/e2e/undo-redo.spec.ts`
2. 场景：添加节点 → Ctrl+Z → 验证节点消失 → Ctrl+Y → 验证节点恢复
3. 场景：新操作清空 redoStack
4. 运行：`npx playwright test tests/e2e/undo-redo.spec.ts`

---

### 2.4 Epic 4: Accessibility 测试基线（3h, P2）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E4-T1 | axe-core 配置 | 0.5h | `tests/a11y/axe.config.ts`, `package.json` | `expect(axeConfig.exists).toBe(true)` |
| E4-T2 | 核心页面 a11y 测试 | 1.5h | `tests/a11y/homepage.spec.ts`, `tests/a11y/canvas.spec.ts`, `tests/a11y/export.spec.ts` | `expect(criticalViolations).toBe(0)` |
| E4-T3 | CI Accessibility Gate | 1h | `.github/workflows/a11y-ci.yml`, `reports/a11y/` | `expect(ciStatus).toBe('failure')` |

**DoD**:
- [x] axe-core 在 Playwright 中可用（@axe-core/playwright@4.11.1）
- [x] 核心页面（Homepage/Canvas/Export）无 Critical/Serious 违规测试覆盖
- [x] `tests/a11y/` 测试文件存在且 CI blocking
- [x] accessibility 报告输出到 `playwright-report/`
- [x] CI Accessibility Gate 配置在 `.github/workflows/a11y-ci.yml`

> **E4 完成**: 2026-04-01 12:32 GMT+8
> - `tests/a11y/axe.config.ts`: WCAG 2.1 AA axe-core 配置（E4-T1）
> - `tests/a11y/helpers.ts`: runAxe() 工具，过滤 critical/serious 违规（E4-T1）
> - `tests/a11y/homepage.spec.ts`: Homepage a11y 测试（E4-T2）
> - `tests/a11y/canvas.spec.ts`: Canvas a11y 测试（E4-T2）
> - `tests/a11y/export.spec.ts`: Export page a11y 测试（E4-T2）
> - `playwright.a11y.config.ts`: 独立 Playwright 配置（E4-T2）
> - `package.json`: 添加 `test:a11y` npm script（E4-T2）
> - `.github/workflows/a11y-ci.yml`: CI Accessibility Gate（E4-T3）
> - `playwright-report/`: 已添加到 .gitignore（E4-T3）
> - Commit: `63bb9370`

**E4-T1 详细步骤**:
1. 安装：`npm i -D @axe-core/playwright`
2. 创建 `tests/a11y/axe.config.ts`：
   ```typescript
   export default {
     reporter: 'json',
     rules: { /* axe-core WCAG 2.1 AA rules */ }
   };
   ```
3. 配置 Playwright：`playwright.config.ts` 添加 `@axe-core/playwright` reporter

**E4-T2 详细步骤**:
1. `tests/a11y/homepage.spec.ts`：扫描 `/`，assert `criticalViolations === 0`
2. `tests/a11y/canvas.spec.ts`：扫描 `/canvas`，包含 `[data-testid="flow-node"]`，assert `criticalViolations === 0`
3. `tests/a11y/export.spec.ts`：扫描 `/canvas/export`，assert `criticalViolations === 0`
4. 常见问题修复（根据 axe 报告）：img alt、button aria-label、color 对比度

**E4-T3 详细步骤**:
1. 创建 `.github/workflows/a11y-ci.yml`
2. 触发条件：`pull_request` 到 `main`
3. Step: `npx playwright test tests/a11y/ --reporter=json --output=reports/a11y/`
4. 后处理：`jq` 检查 `reports/a11y/results.json` 中 Critical/Serious 违规数 > 0 → `exit 1`
5. 上传 artifact：`reports/a11y/`

---

### 2.5 Epic 5: Svelte Framework 导出（4h, P2）

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|----------|----------|
| E5-T1 | React2Svelte 映射表 | 2h | `components/react2svelte/mappings.ts`, `components/react2svelte/mappings.test.ts` | `expect(mappings.Button).toBeDefined()` |
| E5-T2 | reactComponentToSvelte 生成器 | 1h | `components/react2svelte/transformer.ts`, `components/react2svelte/transformer.test.ts` | `expect(output.includes('<script>')).toBe(true)` |
| E5-T3 | Export 面板 Svelte 切换 | 0.5h | `pages/canvas/export/index.tsx`（扩展框架选择器） | `expect(isVisible(toggle)).toBe(true)` |
| E5-T4 | E2E + 覆盖率验证 | 0.5h | `svelte-test-app/`, `components/react2svelte/coverage/` | `expect(coverage >= 80)` |

**DoD**:
- [ ] 导出面板支持 React/Vue/Svelte 三框架切换
- [ ] Button/Input/Card 在 Svelte 下 E2E 测试通过
- [ ] 测试覆盖率 ≥ 80%
- [ ] reviewer 两阶段审查通过

**E5-T1 详细步骤**:
1. 创建 `components/react2svelte/mappings.ts`
2. 实现映射（参考 `components/react2vue/` 模式）：
   ```typescript
   export const Button = {
     eventSyntax: 'on:',
     classAttr: 'class',
     props: { disabled: 'disabled', loading: 'loading' }
   };
   export const Input = {
     binding: 'bind:value',
     classAttr: 'class'
   };
   export const Card = {
     children: '<slot />',
     classAttr: 'class'
   };
   ```
3. Jest 覆盖率测试

**E5-T2 详细步骤**:
1. 创建 `components/react2svelte/transformer.ts`
2. `reactComponentToSvelte(code: string): string`
3. 转换逻辑：
   - `onClick={f}` → `on:click={f}`
   - `value={v} onChange={f}` → `bind:value={v}`
   - `{children}` → `<slot />`
   - `className="x"` → `class="x"`
   - `style={{ width: n }}` → `style="width: ${n}px"`
4. 输出 Svelte SFC：`<script>`, `<template>`, `<style scoped>`
5. 用 `svelte/compiler` 验证生成的代码可编译

**E5-T3 详细步骤**:
1. 读取现有 `pages/canvas/export/index.tsx` 框架选择器代码
2. 扩展 RadioGroup：添加 `Svelte` 选项，`[data-testid="framework-svelte"]`
3. 切换时调用 `reactComponentToSvelte()` 重新生成代码
4. E2E 验证：切换到 Svelte → code preview 显示 `.svelte` 扩展名

**E5-T4 详细步骤**:
1. 创建 `svelte-test-app/`（独立 Svelte 4 项目）
2. 放置转换后的 Button/Input/Card Svelte 组件
3. Playwright E2E：`/svelte-test-app` 页面验证组件渲染
4. 覆盖率：`cd components/react2svelte && npx jest --coverage`
5. 阈值：`branches >= 80%, functions >= 80%, lines >= 80%`

---

## 3. 关键路径分析

### 关键路径（Critical Path）

```
E3-T1 (HistoryStack) → E3-T2 (Ctrl+Z/Y) → E3-T3 (UndoBar) → E3-T4 (E2E)
```

**关键路径说明**：
- E3 的 3 个子任务存在串行依赖（class → 快捷键 → UI → 测试）
- E3 总工时 5h，是最长的 Epic，若延迟会影响整体交付
- **缓解**：HistoryStack 使用已有 Zustand slice 扩展模式，降低实现复杂度

### 并行度分析

| 组合 | 依赖 | 说明 |
|------|------|------|
| E1 ∥ E2 ∥ E4 ∥ E5 | 无 | 4 个 Epic 完全并行 |
| E3 ∥ E1 ∥ E2 ∥ E4 ∥ E5 | ShortcutBar 已存在 | 5 个 Epic 全部并行 |
| E5-T3 | E5-T1 + E5-T2 | E5 内部串行（T3 依赖 T1+T2 产出） |

### 最短完成时间

```
关键路径 E3: 5h（E3-T1 2h → E3-T2 2h → E3-T3 0.5h → E3-T4 0.5h）
并行 Epic: max(4h, 4h, 3h, 4h) = 4h
Sprint 总时间: max(5h, 4h) = 5h（理论最短，实际考虑上下文切换 + review: 20h）
```

---

## 4. 验证命令 / 脚本

### 4.1 本地验证

```bash
# E1: 通知去重
cd /root/.openclaw/vibex
npx jest tests/notification-dedup --coverage
openclaw notify --check-existing <task-id>
grep -r "ErrorBoundary" components/ --include='*.tsx' | grep -v AppErrorBoundary | wc -l  # 期望 0

# E2: heartbeat + changelog
npx tsx scripts/heartbeat-scanner.ts --tasks tasks.json
npx tsx scripts/changelog-gen.ts --from=v1.0 --to=HEAD --dry-run
ls -la .githooks/commit-msg  # 期望存在

# E3: Undo/Redo
npx jest stores/historySlice.test.ts --coverage
npx playwright test tests/e2e/undo-redo.spec.ts
# 手动：打开 /canvas，添加节点，Ctrl+Z 验证节点消失，Ctrl+Y 验证恢复

# E4: Accessibility
npx playwright test tests/a11y/homepage.spec.ts
npx playwright test tests/a11y/canvas.spec.ts
npx playwright test tests/a11y/export.spec.ts
cat reports/a11y/results.json | jq '[.[] | select(.impact == "critical" or .impact == "serious")] | length'  # 期望 0

# E5: Svelte Export
npx jest components/react2svelte --coverage
npx playwright test svelte-test-app/
npx tsc --noEmit  # TypeScript clean

# 全局
npm run lint
npx tsc --noEmit
npx playwright test  # 全量 E2E
```

### 4.2 CI 验证

```bash
# GitHub Actions 触发
git checkout -b sprint-3
git add .
git commit -m "feat(sprint3): implement E1-E5 (20h)"
git push origin sprint-3
# 创建 PR → 触发 a11y-ci.yml + 所有测试
```

### 4.3 Sprint 验收

```bash
# Sprint 结束前执行
npm run lint && npx tsc --noEmit
npx playwright test tests/e2e/
npx jest --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80}}'
npx ts-node scripts/changelog-gen.ts --from=v1.0 --to=HEAD > CHANGELOG.md
# Review: PR review + 架构验收
```

---

## 5. 风险跟踪表

| ID | 风险描述 | 概率 | 影响 | 缓解措施 | 责任人 |
|----|---------|------|------|----------|--------|
| R1 | changelog-gen commit format 不规范 | 低 | 中 | 先建立 commit-msg hook 校验（E2-T4 先于 E2-T3） | Dev |
| R2 | Svelte 映射质量差（语法差异导致运行时错误） | 中 | 中 | MVP 仅 Button/Input/Card 三个组件 + Svelte compiler 验证 | Dev |
| R3 | E3 HistoryStack 与现有 Zustand 状态冲突 | 低 | 高 | 先审查 `stores/` 下现有 slice，HistoryStack 作为独立 slice | Dev |
| R4 | axe-core 误报导致 CI 不稳定 | 低 | 低 | 仅 Critical/Serious blocking，轻度违规仅记录 | Dev |
| R5 | E5-T3 Export 面板改动涉及 Sprint 1/2 代码 | 中 | 中 | 先在本地 branch 测试，reviewer 重点审查导出面板 | Dev |
| R6 | ShortcutBar 组件接口变化（E3 依赖） | 低 | 低 | 已确认为 Sprint 1 E4 产出，API 已稳定 | Architect |

---

## 6. 工时汇总表

### 6.1 Epic × 任务工时矩阵

| Epic | T1 | T2 | T3 | T4 | T5 | Epic 合计 |
|------|----|----|----|----|----|-----------|
| E1: proposal-dedup + ErrorBoundary | 1.5h | 2h | 0.5h | — | — | **4h** |
| E2: heartbeat + changelog | 1.5h | 0.5h | 1.5h | 0.5h | — | **4h** |
| E3: Undo/Redo | 2h | 2h | 0.5h | 0.5h | — | **5h** |
| E4: Accessibility | 0.5h | 1.5h | 1h | — | — | **3h** |
| E5: Svelte Export | 2h | 1h | 0.5h | 0.5h | — | **4h** |
| **合计** | 7.5h | 6h | 3h | 1.5h | 2h | **20h** |

### 6.2 产出文件清单

```
scripts/
  notification-dedup.ts          (E1-T1)
  heartbeat-scanner.ts           (E2-T1, E2-T2)
  changelog-gen.ts               (E2-T3)

components/
  common/
    AppErrorBoundary.tsx         (E1-T2)
    AppErrorBoundary.test.tsx    (E1-T2)
  ShortcutBar.tsx                (E3-T3, 扩展)
  react2svelte/
    mappings.ts                  (E5-T1)
    mappings.test.ts             (E5-T1)
    transformer.ts               (E5-T2)
    transformer.test.ts          (E5-T2)

stores/
  historySlice.ts                (E3-T1, 扩展现有 slice)

pages/
  canvas/index.tsx               (E1-T3, E3-T2, 页面集成)
  canvas/export/index.tsx        (E1-T3, E5-T3, 页面集成)

tests/
  e2e/
    undo-redo.spec.ts            (E3-T4)
  a11y/
    axe.config.ts                (E4-T1)
    homepage.spec.ts              (E4-T2)
    canvas.spec.ts               (E4-T2)
    export.spec.ts               (E4-T2)

.github/
  workflows/
    a11y-ci.yml                  (E4-T3)

reports/
  a11y/                          (E4-T3, CI 输出)

.git/
  hooks/
    commit-msg                   (E2-T4)

svelte-test-app/                 (E5-T4)

package.json                     (E2-T4, simple-git-hooks)

总计: 19 个文件
```

### 6.3 人员分配建议

| 角色 | 分配 Epic | 工时 |
|------|-----------|------|
| Dev | E1 + E2（并行） | 8h |
| Dev | E3 + E4（并行） | 8h |
| Dev | E5 | 4h |
| **合计** | 5 Epic | **20h** |

> **建议**: 若单人完成 Sprint 3，E1→E2→E3→E4→E5 串行执行，总工期约 5 天。

---

## 7. Sprint 执行检查点

| 检查点 | 时间 | 验收内容 |
|--------|------|----------|
| Checkpoint 1 | 第 1 天上午 | E1-T1 notification dedup 上线，`--check-existing` flag 可用 |
| Checkpoint 2 | 第 1 天 | E1 完成：AppErrorBoundary 替换所有 ErrorBoundary |
| Checkpoint 3 | 第 2 天 | E2 完成：heartbeat 幽灵任务检测 + changelog-gen CLI 可用 |
| Checkpoint 4 | 第 3 天 | E3-T1 HistoryStack + E3-T2 Ctrl+Z/Y 可用 |
| Checkpoint 5 | 第 4 天 | E3 完成：UndoBar + E2E 通过 |
| Checkpoint 6 | 第 5 天 | E4 + E5 完成，CI all green，coverage ≥ 80% |
| Sprint End | 第 5 天 | PR review → merge → changelog-gen 生成 Sprint 3 CHANGELOG |

---

*文档版本: v1.0 | Architect | 2026-04-01*
