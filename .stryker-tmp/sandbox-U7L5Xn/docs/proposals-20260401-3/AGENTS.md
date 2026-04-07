# AGENTS.md — proposals-20260401-3 开发约束

**项目**: vibex | **Sprint**: 3 | **Epic 数**: 5 | **总工时**: 20h
**生成日期**: 2026-04-01 | **状态**: 约束已锁定，违反则 reject

---

## 1. 全局代码标准

### 1.1 TypeScript 严格模式

所有新代码必须满足：

```json
// tsconfig.json（必须继承）
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- `npx tsc --noEmit` 必须 0 error
- 禁止 `as any`（若必须使用，需加 `// SAFETY: <reason>` 注释）
- 禁止 `@ts-ignore`
- 接口优于类型别名（除非涉及联合/交叉类型）

### 1.2 Commit 规范（Angular 格式）

**所有 commit message 必须符合以下格式，否则 git hook 拒绝提交：**

```
<type>(<scope>): <subject>

<body>

<footer>
```

| type | 使用场景 |
|------|----------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 格式/空格（不影响功能） |
| `refactor` | 重构（不修复bug不加功能） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

**示例：**

```bash
# ✅ 正确
git commit -m "feat(canvas): add undo/redo keyboard shortcuts"
git commit -m "fix(dedup): correct TTL window calculation"
git commit -m "docs(changelog): update v1.2.0 entry"

# ❌ 错误（hook 拒绝）
git commit -m "fix bug"                    # 缺 scope
git commit -m "Updated the button"         # 缺 type/scope
git commit -m "WIP"                        # 无意义
```

**Scope 范围（项目内）：**

| scope | 含义 |
|-------|------|
| `canvas` | 画布/节点相关 |
| `export` | 导出功能 |
| `heartbeat` | 心跳/changelog 相关 |
| `a11y` | 无障碍相关 |
| `dedup` | 通知去重 |
| `eb` | ErrorBoundary |
| `undo` | Undo/Redo |
| `svelte` | Svelte 导出 |
| `ui` | UI 组件 |
| `cli` | CLI 工具 |
| `core` | 核心/共享 |

### 1.3 文件路径约定

| 类别 | 路径格式 | 示例 |
|------|----------|------|
| React 组件 | `components/{category}/{Name}.tsx` | `components/common/AppErrorBoundary.tsx` |
| Svelte 组件 | `components/{category}/{Name}.svelte` | `components/svelte/Button.svelte` |
| 测试文件 | `__tests__/{feature}.test.ts` | `__tests__/dedup.test.ts` |
| E2E 测试 | `tests/e2e/{feature}.spec.ts` | `tests/e2e/undo-redo.spec.ts` |
| a11y 测试 | `tests/a11y/{page}.spec.ts` | `tests/a11y/canvas.spec.ts` |
| Store slice | `store/{slice}.ts` | `store/historySlice.ts` |
| CLI 工具 | `cli/{tool}.ts` | `cli/changelog-gen.ts` |
| 配置文件 | `config/{name}.ts` | `config/axe.config.ts` |

---

## 2. Epic 专属约束

---

### Epic 1 (E1): proposal-dedup + ErrorBoundary

**工时**: 4h | **P0** | **依赖**: 无 | **并行**: ✅

#### 核心约束

| 约束 ID | 描述 | 强制等级 |
|---------|------|----------|
| E1-C1 | `NotificationDedup` 去重键必须为 `task_id`，禁止使用 message content | MUST |
| E1-C2 | TTL 窗口固定为 **5 分钟（300000ms）**，禁止通过参数/配置覆盖 | MUST |
| E1-C3 | `AppErrorBoundary` 必须为 `components/common/AppErrorBoundary.tsx` 唯一的 default export | MUST |
| E1-C4 | 项目中**只允许存在 1 个 ErrorBoundary**：`AppErrorBoundary`；禁止导入其他 ErrorBoundary | MUST |
| E1-C5 | Error fallback UI 必须友好（非白屏、非 raw error），必须包含 `data-testid="error-retry"` 重试按钮 | MUST |
| E1-C6 | `notify --check-existing` CLI flag 实现 | MUST |

#### 实现规范

```typescript
// ✅ 正确：task_id 去重键
class NotificationDedup {
  private ttl = 300000; // 5min, hardcoded — DO NOT make configurable
  private map = new Map<string, number>();

  mark(taskId: string): void {
    this.map.set(taskId, Date.now());
  }

  shouldSend(taskId: string): boolean {
    const ts = this.map.get(taskId);
    if (!ts) return true;
    return Date.now() - ts > this.ttl;
  }
}

// ❌ 错误：使用 message content 去重
shouldSend(taskId: string, message: string): boolean { ... }
```

```tsx
// ✅ 正确：fallback UI 包含 retry 按钮
<ErrorBoundary fallbackRender={({ error, resetErrorBoundary }) => (
  <div data-testid="error-fallback">
    <p>Something went wrong. Please try again.</p>
    <button data-testid="error-retry" onClick={resetErrorBoundary}>Retry</button>
  </div>
)}>
  <App />
</ErrorBoundary>

// ❌ 错误：白屏或无重试按钮
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

#### 禁止的模式

```
❌ grep -r "ErrorBoundary" components/ 返回 AppErrorBoundary 以外的任何结果
❌ NotificationDedup 使用 message content 作为 dedup key
❌ TTL 窗口值不等于 300000
❌ fallback UI 为空或显示原始错误信息
```

#### Dev 完成 E1 后自检

```markdown
## E1 自检清单

### 功能验证
- [ ] `NotificationDedup` 使用 `task_id` 作为去重键
- [ ] TTL 窗口值 = 300000ms（检查源码确认 hardcoded）
- [ ] `AppErrorBoundary` 为 `components/common/AppErrorBoundary.tsx` 唯一 default export
- [ ] `grep -r "ErrorBoundary" components/ --include='*.tsx'` 仅返回 AppErrorBoundary
- [ ] Fallback UI 包含 `data-testid="error-retry"` 按钮
- [ ] Fallback UI 无白屏、无原始错误信息

### 测试通过
- [ ] `npm run dedup:test` 或对应测试套件 100% 通过
- [ ] E2E: Canvas 页面 error 触发后 fallback 可见，重试按钮可点击
- [ ] `npx tsc --noEmit` 0 error
- [ ] `npm run lint` 0 error

### 产物检查
- [ ] `components/common/AppErrorBoundary.tsx` 存在且为 default export
- [ ] CLI `notify --check-existing` flag 存在
- [ ] 去重单元测试覆盖 TTL 边界（5min 内/外）
```

---

### Epic 2 (E2): heartbeat + changelog 自动化

**工时**: 4h | **P1** | **依赖**: 无 | **并行**: ✅

#### 核心约束

| 约束 ID | 描述 | 强制等级 |
|---------|------|----------|
| E2-C1 | **所有 commit message 必须符合 Angular 格式**（见 1.2），git hook 拒绝不合格提交 | MUST |
| E2-C2 | `changelog-gen` 必须按 type 分组：Features / Bug Fixes / Docs / etc. | MUST |
| E2-C3 | **幽灵任务检测**：满足 `activeMinutes > 60` AND `completedAt === null` → 标记 ghost | MUST |
| E2-C4 | **虚假完成检测**：满足 `status === 'done'` AND output file 不存在 → 标记 fake done | MUST |
| E2-C5 | git hooks **必须使用 `simple-git-hooks` 安装**，禁止使用 husky | MUST |
| E2-C6 | changelog-gen CLI: `changelog-gen --from=v1.0 --to=HEAD` 生成有效 CHANGELOG.md | MUST |

#### 实现规范

```typescript
// ✅ 正确：幽灵任务检测逻辑
function detectGhostTasks(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.startedAt != null &&
    t.completedAt === null &&
    (Date.now() - new Date(t.startedAt).getTime()) > 60 * 60 * 1000
  );
}

// ✅ 正确：虚假完成检测
function detectFakeDone(tasks: Task[]): Task[] {
  return tasks.filter(t =>
    t.status === 'done' &&
    t.output &&
    !fs.existsSync(t.output)
  );
}

// ✅ 正确：Angular commit 解析
function parseCommit(msg: string): Commit | null {
  const match = msg.match(/^(\w+)(?:\(([^)]+)\))?: (.+)/);
  if (!match) return null;
  return { type: match[1], scope: match[2] || '', subject: match[3] };
}

// ✅ 正确：按 type 分组 changelog
function generateChangelog(commits: Commit[]): string {
  const groups = groupBy(commits, 'type');
  const sections = ['Features', 'Bug Fixes', 'Docs', 'Refactor', 'Perf', 'Test', 'Chore'];
  return sections
    .filter(s => groups[s.toLowerCase()]?.length)
    .map(s => `## ${s}\n${groups[s.toLowerCase()].map(c => `- ${c.subject}`).join('\n')}`)
    .join('\n\n');
}
```

#### git hooks 安装

```bash
# ✅ 正确：使用 simple-git-hooks
npm install --save-dev simple-git-hooks
npx simple-git-hooks add -s commit-msg -c "npx commitlint --edit $1"
npx simple-git-hooks add -s pre-commit -c "npm run lint-staged"

# ❌ 错误：使用 husky
npx husky install   # 禁止
```

#### 禁止的模式

```
❌ commit message 不符合 Angular 格式 → git hook 拒绝
❌ changelog 未按 type 分组
❌ 幽灵任务检测逻辑缺失 activeMinutes > 60 AND completedAt === null 任一条件
❌ 虚假完成检测缺失 status === 'done' AND file not exists 任一条件
❌ 使用 husky 而非 simple-git-hooks
```

#### Dev 完成 E2 后自检

```markdown
## E2 自检清单

### 功能验证
- [ ] 幽灵任务检测：满足 activeMinutes > 60 AND completedAt === null 的任务被正确标记
- [ ] 虚假完成检测：满足 status === 'done' AND output file 不存在的任务被正确标记
- [ ] `changelog-gen --from=v1.0 --to=HEAD` 成功生成 CHANGELOG.md
- [ ] CHANGELOG.md 按 Features / Bug Fixes / Docs 等 type 分组
- [ ] `simple-git-hooks` 已安装（非 husky）
- [ ] `grep -r "husky" package.json` 返回空（husky 未安装）

### Hook 验证
- [ ] commit message 不符合 Angular 格式时，commit 被拒绝
- [ ] commit message 符合格式时，commit 成功
- [ ] `npx simple-git-hooks list` 显示 commit-msg hook 已注册

### 测试通过
- [ ] 幽灵任务/虚假完成检测单元测试 100% 通过
- [ ] changelog-gen CLI 测试通过
- [ ] commit message 格式校验测试通过

### 产物检查
- [ ] `cli/changelog-gen.ts` 存在且可执行
- [ ] `config/commitlint.config.ts` 存在
- [ ] `.git/hooks/commit-msg` 使用 simple-git-hooks
```

---

### Epic 3 (E3): Undo/Redo 完整实现

**工时**: 5h | **P1** | **依赖**: Sprint 1 E4 ShortcutBar | **并行**: ❌

#### 核心约束

| 约束 ID | 描述 | 强制等级 |
|---------|------|----------|
| E3-C1 | `HistoryStack` 的 `maxLength` 必须为 **50**（硬编码，禁止配置） | MUST |
| E3-C2 | 新操作（push）**必须清空 redoStack** | MUST |
| E3-C3 | Undo/Redo 操作必须是**纯状态转换**（无 side effects：无 API call、无 mutation、无状态持久化） | MUST |
| E3-C4 | `historySlice` 必须与其他 store slice **完全分离**（单一职责） | MUST |
| E3-C5 | **Ctrl+Z 和 Ctrl+Y** 必须同时支持 Windows/Linux (`Ctrl`) 和 Mac (`Cmd`) | MUST |

#### 实现规范

```typescript
// ✅ 正确：historySlice.ts — 独立 slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface HistoryEntry { id: string; snapshot: CanvasSnapshot; timestamp: number; }
interface HistoryState {
  stack: HistoryEntry[];
  redoStack: HistoryEntry[];
  maxLength: 50; // hardcoded — DO NOT make configurable
}

const initialState: HistoryState = {
  stack: [],
  redoStack: [],
  maxLength: 50, // hardcoded
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    push(state, action: PayloadAction<HistoryEntry>) {
      // 新操作清空 redoStack
      state.redoStack = [];
      state.stack.push(action.payload);
      if (state.stack.length > 50) {
        state.stack.shift();
      }
    },
    undo(state) {
      // 纯状态转换 — 无 API call、无 mutation
      const entry = state.stack.pop();
      if (entry) {
        state.redoStack.push(entry);
      }
    },
    redo(state) {
      const entry = state.redoStack.pop();
      if (entry) {
        state.stack.push(entry);
      }
    },
    // ⚠️ 禁止在此 slice 中调用任何 API
  },
});
```

```typescript
// ✅ 正确：键盘快捷键 — 支持 Ctrl 和 Cmd
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (modifier && e.key === 'z') {
      e.preventDefault();
      dispatch(undo());
    }
    if (modifier && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      dispatch(redo());
    }
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dispatch]);
```

#### 禁止的模式

```typescript
// ❌ 错误：undo/redo 中有 side effects
undo(state) {
  const entry = state.stack.pop();
  fetch('/api/save', { ... });     // 禁止 API call
  state.dirty = true;               // 禁止状态持久化
}

// ❌ 错误：maxLength 可配置
const maxLength = config.historyMaxLength; // 禁止

// ❌ 错误：history 逻辑散落在其他 slice
// ❌ historySlice 中混入 canvasSlice 逻辑

// ❌ 错误：仅支持 Ctrl，忽略 Mac
if (e.ctrlKey && e.key === 'z') { ... } // Mac 用户无法使用
```

#### Dev 完成 E3 后自检

```markdown
## E3 自检清单

### 功能验证
- [ ] `historySlice.maxLength` = 50（检查源码确认 hardcoded）
- [ ] 新操作后 `redoStack` 被清空（length === 0）
- [ ] Undo/Redo 操作无 side effects（无 API call、无 mutation）
- [ ] `historySlice` 独立文件，未混入其他 slice
- [ ] Ctrl+Z 在 Windows/Linux 可用
- [ ] Cmd+Z 在 Mac 可用
- [ ] Ctrl+Y 在 Windows/Linux 可用
- [ ] Cmd+Y 在 Mac 可用

### 行为验证
- [ ] 添加节点后，按 Undo，节点被移除
- [ ] 按 Redo，节点被恢复
- [ ] 执行 Undo 后进行新操作，redoStack 被清空
- [ ] 50 步后继续添加，第 1 步被移除（栈维持 50）

### E2E 测试
- [ ] Playwright: Ctrl+Z 撤销操作场景通过
- [ ] Playwright: Ctrl+Y 重做操作场景通过
- [ ] Playwright: 新操作清空 redoStack 场景通过
- [ ] Playwright: 栈限制 50 步场景通过

### 产物检查
- [ ] `store/historySlice.ts` 存在且独立
- [ ] `components/ShortcutBar.tsx` 包含 UndoBar UI
- [ ] `data-testid="undo-bar"`, `"undo-btn"`, `"redo-btn"`, `"undo-badge"` 存在
- [ ] `npm run lint` 0 error
```

---

### Epic 4 (E4): Accessibility 测试基线

**工时**: 3h | **P2** | **依赖**: 无 | **并行**: ✅

#### 核心约束

| 约束 ID | 描述 | 强制等级 |
|---------|------|----------|
| E4-C1 | axe-core **仅对 Critical/Serious 违规 blocking CI**，Warning/Inconsequential 必须 pass | MUST |
| E4-C2 | 所有 `flow-node` 元素**必须包含 `aria-label` 属性** | MUST |
| E4-C3 | 所有 `<img>` 元素**必须包含 `alt` 属性**（axe 自动 enforcement） | MUST |
| E4-C4 | **禁止 `outline: none`**（无障碍 focus indicator 必须保留） | MUST |
| E4-C5 | 颜色对比度必须满足 **WCAG AA（4.5:1 文本）** | MUST |
| E4-C6 | CI 流程：axe 扫描 Critical/Serious → CI failure，报告输出到 `reports/a11y/` | MUST |

#### 实现规范

```typescript
// ✅ 正确：axe-core 配置 — 仅 Critical/Serious blocking
import { configure } from '@axe-core/playwright';

const axeConfig = configure({
  reporter: 'json',
  rules: {
    'color-contrast': { enabled: true, impact: 'serious' },
    'image-alt': { enabled: true, impact: 'critical' },
    // 明确哪些规则启用
  },
  // 仅返回 Critical/Serious
});

// ✅ 正确：CI 检查脚本
// .github/workflows/a11y-ci.yml
const criticalSerious = violations.filter(v =>
  v.impact === 'critical' || v.impact === 'serious'
);
if (criticalSerious.length > 0) {
  console.error(`Found ${criticalSerious.length} Critical/Serious violations`);
  process.exit(1); // CI failure
}
```

```tsx
// ✅ 正确：flow-node 带 aria-label
<div data-testid="flow-node" aria-label={`Node: ${node.name}`}>

// ✅ 正确：img 带 alt
<img src={src} alt={description} />

// ✅ 正确：focus indicator 保留（使用自定义样式替代 outline: none）
button:focus-visible {
  outline: 2px solid var(--color-primary);  // ✅ 保留可见性
  outline-offset: 2px;
}
// ❌ 禁止
button { outline: none; }  // 禁止
button:focus { outline: none; }  // 禁止
```

```css
/* ✅ 正确：可访问的 focus indicator */
*:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

/* ❌ 禁止 */
* { outline: none; }
button:focus { outline: none; }
```

#### 禁止的模式

```
❌ outline: none 或 outline: 0（除非有 :focus-visible 替代方案）
❌ <img> 无 alt 属性
❌ <div data-testid="flow-node"> 无 aria-label
❌ axe-core 配置中 Critical/Serious 不 blocking
❌ WCAG AA 颜色对比度不达标（4.5:1 以下）
```

#### Dev 完成 E4 后自检

```markdown
## E4 自检清单

### 配置验证
- [ ] `@axe-core/playwright` 已安装
- [ ] `tests/a11y/axe.config.ts` 存在
- [ ] axe 配置仅 Critical/Serious blocking（Warning/Inconsequential pass）
- [ ] `.github/workflows/a11y-ci.yml` 存在且配置正确

### 页面验证（E2E axe 扫描）
- [ ] Homepage `/` Critical/Serious violations = 0
- [ ] Canvas `/canvas` Critical/Serious violations = 0
- [ ] Export `/canvas/export` Critical/Serious violations = 0

### 元素验证
- [ ] 所有 `<img>` 有 `alt` 属性
- [ ] 所有 `data-testid="flow-node"` 元素有 `aria-label`
- [ ] CSS 中无 `outline: none`（使用 grep 确认）

### 颜色对比度
- [ ] 文本颜色对比度 ≥ 4.5:1（使用 axe 或对比度检查工具验证）

### CI 验证
- [ ] PR 到 main 触发 a11y-ci workflow
- [ ] Critical/Serious 违规时 CI 失败
- [ ] `reports/a11y/` 目录有 JSON 报告输出

### 产物检查
- [ ] `tests/a11y/homepage.spec.ts` 存在
- [ ] `tests/a11y/canvas.spec.ts` 存在
- [ ] `tests/a11y/export.spec.ts` 存在
```

---

### Epic 5 (E5): Svelte Framework 导出

**工时**: 4h | **P2** | **依赖**: 无 | **并行**: ✅

#### 核心约束

| 约束 ID | 描述 | 强制等级 |
|---------|------|----------|
| E5-C1 | React2Svelte 映射表**必须覆盖**：`Button`, `Input`, `Card`, `Container`, `Text`（最少 5 个） | MUST |
| E5-C2 | 事件处理映射：`onClick` → `on:click`，`onChange` → `bind:value` | MUST |
| E5-C3 | 生成的 `.svelte` 文件必须为 **Svelte 4 兼容**（禁止 Svelte 5 runes：`$state`、`$derived`、`$effect`） | MUST |
| E5-C4 | React `children` prop → Svelte `<slot />` 元素 | MUST |
| E5-C5 | 生成代码中**禁止包含 React 运行时依赖**（无 `import React from 'react'` 等） | MUST |

#### 映射表规范

```typescript
// ✅ 正确：components/react2svelte/mappings.ts
export const react2svelteMappings = {
  Button: {
    eventSyntax: 'on:',
    onClick: 'on:click',
    className: 'class',
  },
  Input: {
    binding: 'bind:value',
    onChange: 'bind:value',  // React onChange → Svelte bind:value
  },
  Card: {
    children: '<slot />',   // React children → Svelte slot
  },
  Container: {
    children: '<slot />',
  },
  Text: {
    children: 'inline',      // 直接内嵌文本
  },
  // className → class
  // style={{ x: 1 }} → style="x: 1px"
  // onKeyDown → on:keydown
} as const;

// ✅ 正确：生成 Svelte 4 代码
function reactToSvelte(code: string): string {
  let svelte = code;
  svelte = svelte.replace(/onClick=/g, 'on:click=');
  svelte = svelte.replace(/onChange=/g, 'on:input=');
  svelte = svelte.replace(/className=/g, 'class=');
  svelte = svelte.replace(/style={{([^}]+)}}/g, 'style="$1"');
  // children → slot
  svelte = svelte.replace(/children={<Slot\s*\/>/g, '<slot />');
  svelte = svelte.replace(/children=\{([^}]+)\}/g, '<slot>$1</slot>');
  // 移除 React imports
  svelte = svelte.replace(/import\s+React.*?;/g, '');
  return svelte;
}

// ❌ 禁止：Svelte 5 runes
// $state, $derived, $effect, $props, $bindable 等 rune 语法
// ❌ 禁止：React 运行时
// import React from 'react';   // 禁止
// useState, useEffect          // 禁止
```

```svelte
<!-- ✅ 正确：生成的 Button.svelte（Svelte 4） -->
<script>
  export let label = '';
  export let onClick = () => {};
</script>

<button class="vibex-btn" on:click={onClick}>
  {label}
</button>

<style scoped>
  .vibex-btn {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
</style>

<!-- ❌ 错误：Svelte 5 runes -->
<script>
  let count = $state(0);           // 禁止
  const doubled = $derived(count * 2); // 禁止
</script>
```

#### 禁止的模式

```
❌ React runtime import in generated .svelte files
❌ Svelte 5 rune syntax in generated code ($state, $derived, etc.)
❌ 未映射的组件（Button/Input/Card 必须映射）
❌ React children 未转换为 <slot />
```

#### Dev 完成 E5 后自检

```markdown
## E5 自检清单

### 映射表验证
- [ ] `components/react2svelte/mappings.ts` 存在
- [ ] 映射覆盖：Button、Input、Card、Container、Text（至少 5 个）
- [ ] `onClick` → `on:click` 映射正确
- [ ] `onChange` → `bind:value` 映射正确
- [ ] `className` → `class` 映射正确
- [ ] React `children` → `<slot />` 映射正确

### 生成代码验证
- [ ] 生成代码无 React runtime import
- [ ] 生成代码无 Svelte 5 rune 语法
- [ ] Svelte 编译器可解析生成的代码（`svelte/compiler` 无报错）
- [ ] 生成的 .svelte 文件包含 `<script>`, `<template>`/HTML, `<style scoped>`

### E2E 验证
- [ ] 导出面板 RadioGroup 显示 React/Vue/Svelte 选项
- [ ] 点击 Svelte 切换，生成 .svelte 代码
- [ ] Button/Input/Card 在 Svelte test app 中正确渲染
- [ ] bind:value 在 Input 中正常工作

### 测试覆盖率
- [ ] `components/react2svelte/` 测试覆盖率 ≥ 80%

### 产物检查
- [ ] `components/react2svelte/mappings.ts` 存在
- [ ] `components/react2svelte/reactToSvelte.ts` 存在
- [ ] `tests/e2e/svelte-export.spec.ts` 存在
```

---

## 3. 测试要求总览

| Epic | 单元测试 | E2E 测试 | 覆盖率要求 | CI Blocking |
|------|---------|---------|-----------|--------------|
| E1 | ✅ dedup TTL/边界 | ✅ Canvas error fallback | 核心路径 100% | ✅ |
| E2 | ✅ ghost/fake done 检测 | ❌ CLI E2E | 核心路径 100% | ✅ changelog-gen |
| E3 | ✅ historyStack 50 步限制 | ✅ Ctrl+Z/Y 快捷键 | 核心路径 100% | ❌ |
| E4 | ❌ | ✅ axe-core 3 页面 | 0 | ✅ Critical/Serious |
| E5 | ✅ 映射表 | ✅ Svelte 组件渲染 | ≥ 80% | ❌ |

---

## 4. 禁止模式清单（违反则 REJECT）

> 任何违反以下约束的 PR/代码必须被 reviewer 拒绝，要求 Dev 修复后重新提交。

| # | 模式 | 约束来源 | 违规处置 |
|---|------|----------|----------|
| **P1** | 项目中存在多个 ErrorBoundary（AppErrorBoundary 以外） | E1-C4 | **REJECT** — 立即移除非 AppErrorBoundary |
| **P2** | commit message 不符合 Angular 格式 | E2-C1 | **REJECT** — git hook 拒绝，Dev 重新 commit |
| **P3** | Error fallback UI 为白屏或显示原始错误 | E1-C5 | **REJECT** — 必须实现友好 fallback |
| **P4** | CSS 中存在 `outline: none`（无 focus-visible 替代） | E4-C4 | **REJECT** — 使用 `:focus-visible` 替代 |
| **P5** | 生成的 .svelte 文件包含 React runtime import | E5-C5 | **REJECT** — 移除所有 React import |
| **P6** | Undo/Redo 操作中有 side effects（API call、mutation） | E3-C3 | **REJECT** — 重构为纯状态转换 |
| **P7** | historySlice maxLength 小于 50 | E3-C1 | **REJECT** — 必须硬编码为 50 |
| **P8** | 生成的 .svelte 使用 Svelte 5 runes | E5-C3 | **REJECT** — 重写为 Svelte 4 语法 |
| **P9** | NotificationDedup 使用 message content 作为 dedup key | E1-C1 | **REJECT** — 必须使用 task_id |
| **P10** | TTL 窗口不等于 300000ms | E1-C2 | **REJECT** — 必须硬编码为 300000 |

---

## 5. 审查流程

### 5.1 两阶段审查机制

```
Dev 完成代码
    ↓
Reviewer Stage 1: 快速扫描（Prohibited Patterns 检查）
    ↓ (PASS)
Reviewer Stage 2: 深度审查（架构/逻辑/测试覆盖）
    ↓ (PASS)
PR 合并
    ↓ (FAIL on any stage)
返回 Dev 修复
```

### 5.2 Reviewer 检查点

**Stage 1（5 分钟内）：**
- [ ] grep 检查 Prohibited Patterns（P1-P10）
- [ ] `npx tsc --noEmit` 0 error
- [ ] `npm run lint` 0 error
- [ ] 对应 Epic 自检清单完成度 100%

**Stage 2（按 Epic）：**
- [ ] E1: ErrorBoundary 唯一性 + dedup 逻辑正确性
- [ ] E2: commit format + changelog-gen 分组 + ghost/fake done 检测
- [ ] E3: historySlice 纯函数 + maxLength = 50 + 跨平台快捷键
- [ ] E4: axe 配置 + CSS outline + 颜色对比度
- [ ] E5: 映射表完整 + Svelte 4 兼容 + 无 React runtime

---

## 6. 快速参考卡

### 5 分钟理解约束

```
E1 → 去重用 task_id，TTL=300000，ErrorBoundary 只一个，fallback 有 retry 按钮
E2 → commit 必须 Angular 格式，changelog 按 type 分，ghost/fake done 检测，simple-git-hooks
E3 → maxLength=50，新操作清 redo，纯状态，无 side effects，Ctrl+Z/Y 跨平台
E4 → axe Critical/Serious blocking，aria-label，alt，outline:none 禁止，对比度 4.5:1
E5 → 5 组件映射，on:click / bind:value，slot，禁用 Svelte 5 runes，无 React runtime
```

### Prohibited Patterns 一句话总结

```
P1: 只用 AppErrorBoundary
P2: commit 格式 Angular
P3: fallback 不能白屏
P4: outline:none 禁止
P5: .svelte 无 React
P6: undo/redo 纯函数
P7: maxLength=50
P8: 禁止 Svelte 5 runes
P9: dedup 用 task_id
P10: TTL=300000
```

---

*AGENTS.md — proposals-20260401-3 | 最后更新: 2026-04-01 | Architect Agent*
