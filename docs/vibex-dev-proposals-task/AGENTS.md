# VibeX 技术债清理 — Agent 执行规范

**项目**: vibex-dev-proposals-task
**状态**: Active
**日期**: 2026-04-11
**Author**: Architect Agent

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 ID（待创建后绑定）
- **执行日期**: 2026-04-14（计划启动）

---

## 1. 代码规范

### 1.1 内联样式强制规范

> **⚠️ 零容忍规则**：本项目中，**严禁在任何 `.tsx` 文件中使用字面量内联样式 `style={{}}`**

```bash
# 强制检测脚本（pre-commit hook 或 CI 必须包含）
grep -rn "style={{" src/app/auth/ --include="*.tsx" && echo "FAIL: auth has inline styles" && exit 1
grep -rn "style={{" src/app/preview/ --include="*.tsx" && echo "FAIL: preview has inline styles" && exit 1
```

**例外情况**（以下场景允许保留内联 style）：
1. **动态计算值**：`style={{ width: `${percentage}%` }}` — 值由 JS 计算得出，非字面量
2. **Canvas 交互反馈**：`style={{ transform: \`translate(\${x}px, \${y}px)\` }}` — 实时交互坐标
3. **动画帧值**：`style={{ top: currentFrame + 'px' }}` — 动画驱动

**例外标注规范**：每个保留的内联 style 必须附注释：
```tsx
// OK: 保留例外（动态计算）
<div style={{ width: `${percent}%` }}> {/* dynamic */}
```

### 1.2 文件行数约束

| 文件 | 上限 | 超出处理 |
|------|------|----------|
| `renderer.ts` | < 600 行 | 立即拆分，不允许继续增长 |
| `CanvasPage.tsx` | ≤ 150 行 | 立即拆分，不允许继续增长 |
| 任意子模块（`.ts`） | < 300 行 | 如超过，考虑进一步拆分 |
| 任意子组件（`.tsx`） | < 200 行 | 如超过，考虑拆分 |

**行数检测**：
```bash
# 检测 renderer.ts
RENDERER_LINES=$(wc -l < src/lib/prototypes/renderer.ts)
test $RENDERER_LINES -ge 600 && echo "FAIL: renderer.ts has $RENDERER_LINES lines" && exit 1

# 检测 CanvasPage.tsx
CANVAS_LINES=$(wc -l < src/components/canvas/CanvasPage.tsx)
test $CANVAS_LINES -gt 150 && echo "FAIL: CanvasPage.tsx has $CANVAS_LINES lines" && exit 1
```

### 1.3 CSS Modules 规范

**文件命名**：`{ComponentName}.module.css`（小写 + kebab-case）

**使用规范**：
```tsx
import styles from './AuthForm.module.css'

// 正确
<button className={styles.primaryButton}>

// 禁止：组合字符串 className
<button className={`${styles.base} ${styles.primary}`}>  // 避免，但可接受

// 禁止
<button className={isActive ? styles.active : styles.inactive}>  // 使用 cx() / clsx()
```

**推荐**：
```tsx
import clsx from 'clsx'
<button className={clsx(styles.btn, isActive && styles.active)}>
```

### 1.4 CSS 变量规范

**禁止硬编码颜色**（字面量十六进制/RGB）：
```css
/* 禁止 */
background-color: #fff;
color: #94a3b8;

/* 正确 */
background-color: var(--color-surface);
color: var(--color-text-secondary);
```

**CSS 变量定义层级**：
```
src/styles/variables.css     ← 全局变量（颜色、间距、字体）
*.module.css                  ← 局部变量（仅当前组件使用）
```

**必用变量场景**：
| 场景 | 必须使用变量 |
|------|-------------|
| 主色调 | `var(--color-primary)` |
| 文字颜色 | `var(--color-text-*)` |
| 背景色 | `var(--color-bg-*)` / `var(--color-surface)` |
| 错误状态 | `var(--color-error)` / `var(--color-error-bg)` |
| hover 效果 | `var(--color-primary-hover)` |

### 1.5 Store 规范

**命名规范**：
```typescript
// 文件命名
flowStore.ts
panelStore.ts
authStore.ts

// Store 内部命名（Zustand 风格）
export const useFlowStore = create<FlowState>()((set, get) => ({
  nodes: [],
  addNode: (node) => set(state => ({ nodes: [...state.nodes, node] })),
}))
```

**Store 放置规则**：
- **全局状态**（跨页面共享）→ `src/stores/`
- **页面级状态**（仅 Canvas 使用）→ `src/components/canvas/stores/`
- **禁止**：在 `src/stores/` 中放置仅 Canvas 使用的状态

**crossStoreSync 规范**：
```typescript
// 所有跨 store 同步逻辑必须经过 crossStoreSync.ts
// 禁止在组件中直接订阅其他 store 并手动同步
```

### 1.6 renderer 模块规范

**子模块导出规范**：
```typescript
// types.ts — 仅类型定义，禁止有运行时代码
export interface ComponentDef { ... }

// style-utils.ts — 纯函数，可测试
export function resolveCSSVar(name: string, fallback?: string): string { ... }

// component-renderers.ts — React 组件渲染器函数
export function renderHeading(props: HeadingProps): JSX.Element { ... }

// theme-resolver.ts — 主题解析，无副作用
export function resolveTheme(config: ThemeConfig): ResolvedTheme { ... }

// main-renderer.ts — 入口，协调调用
export function renderPrototype(defs: ComponentDef[], ctx: RenderContext): JSX.Element {
  const resolved = resolveTheme(ctx.theme)
  return (
    <div className="prototype-root">
      {defs.map(def => renderComponent(def, resolved))}
    </div>
  )
}
```

**禁止**：
- 在 `types.ts` 中引入其他子模块的类型
- 在子模块中 `import './renderer.ts'`（循环依赖）
- 在子模块中直接使用 React hooks（组件渲染器除外）

### 1.7 Canvas 子组件规范

**子组件命名**：
```
CanvasPage.tsx        ← 协调器（≤150行）
CanvasLayout.tsx      ← 布局容器
CanvasHeader.tsx      ← 工具栏
CanvasPanels.tsx      ← 侧边栏管理
```

**子组件样式**：
- 每个子组件对应 `*.module.css`
- 禁止在 `CanvasPage.module.css` 中放置子组件的样式

---

## 2. 变更范围约束

### 2.1 允许变更的区域

| 目录/文件 | 允许操作 | 说明 |
|-----------|----------|------|
| `src/app/auth/` | 重构、迁移 | Epic 1 |
| `src/app/preview/` | 重构、迁移 | Epic 2 |
| `src/lib/prototypes/renderer/` | 新建子模块 | Epic 3 |
| `src/components/canvas/` | 拆分、新建子组件 | Epic 4 |
| `src/stores/` | 文档化、清理 | Epic 5 |
| `src/components/canvas/stores/` | 文档化、清理 | Epic 5 |
| `src/styles/variables.css` | 补充 CSS 变量 | 跨 Epic |
| `docs/architecture/` | 新建文档 | Epic 5.1 |
| `ESLINT_EXEMPTIONS.md` | 新建 | Epic 6 |
| `README.md` | 修改 | Epic 6 |

### 2.2 禁止变更的区域（无评审禁止修改）

| 目录/文件 | 原因 |
|-----------|------|
| `src/app/(dashboard|layout)/` | 未纳入本次技术债清理范围 |
| `src/components/ui/` | 已有设计系统实现，修改需额外评审 |
| `src/lib/auth/` | Auth 逻辑核心，修改需安全 review |
| `package.json` | 禁止引入新的生产依赖 |
| `.env*` | 环境配置，不在清理范围内 |

### 2.3 功能冻结约束

> **🔒 功能冻结**：Sprint 1 和 Sprint 2 执行期间，以下功能**禁止新增**：
>
> 1. 新增 `style={{}}` 内联样式
> 2. 在 `renderer.ts` 中新增 > 50 行代码
> 3. 在 `CanvasPage.tsx` 中新增任何代码
> 4. 新增全局 store 或修改现有 store 的 state shape
> 5. 新增 ESLint 豁免（除非带 MEMO 注释且有充分理由）

---

## 3. 质量门槛

### 3.1 静态检测门槛

| 检测项 | 命令 | 门槛 |
|--------|------|------|
| Auth 内联样式 | `grep -rn "style={{" src/app/auth/` | 0 个 |
| Preview 内联样式 | `grep -rn "style={{" src/app/preview/` | 0 个 |
| Preview 硬编码颜色 | `grep "'#fff'\\|'#94a3b8'" src/app/preview/` | 0 个 |
| renderer.ts 行数 | `wc -l < src/lib/prototypes/renderer.ts` | < 600 行 |
| CanvasPage.tsx 行数 | `wc -l < src/components/canvas/CanvasPage.tsx` | ≤ 150 行 |
| ESLint 豁免数量 | `grep "// eslint-disable-next-line" -r src/` | ≤ 2 条 |

### 3.2 测试门槛

| 测试类型 | 覆盖率门槛 | 说明 |
|----------|-----------|------|
| Vitest 整体 | ≥ 70% | 所有 `.test.ts` / `.test.tsx` 文件 |
| renderer 子模块 | ≥ 70% | 每个子模块独立验收 |
| crossStoreSync | ≥ 80% | 同步逻辑重点覆盖 |
| Playwright E2E | Auth + Preview + Canvas 全覆盖 | 核心用户路径 |

### 3.3 构建门槛

```bash
# 必须全部通过才可合并
pnpm build          # 构建成功，无 TypeScript 错误
pnpm test           # Vitest 所有测试通过
pnpm lint           # ESLint 无 error（warning 可接受）
pnpm type-check     # tsc --noEmit 通过
```

### 3.4 代码质量门槛

| 指标 | 门槛 | 检测工具 |
|------|------|----------|
| TypeScript 类型覆盖率 | ≥ 90% | `typescript-strict` + `tstl` |
| 无 `any` 类型滥用 | 每文件 ≤ 2 个 | ESLint `no-explicit-any` |
| 无未使用的 import | 0 个 | ESLint `unused-imports` |
| 组件函数长度 | ≤ 80 行 | ESLint `max-lines-per-function` |

---

## 4. 提交流程

### 4.1 分支命名

```bash
# 格式：type/epic-description
git checkout -b refactor/epic1-auth-inline-styles
git checkout -b refactor/epic3-renderer-split
```

### 4.2 Commit 规范

```
<type>(<scope>): <subject>

Types:
  - refactor: 重构（不改变功能）
  - style: 样式迁移（内联 → CSS Module）
  - docs: 文档更新
  - test: 测试添加/修复
  - chore: 配置/工具类

Examples:
  refactor(auth): migrate inline styles to auth.module.css
  style(preview): replace hardcoded colors with CSS variables
  refactor(renderer): split into 5 submodules
  test(crossStoreSync): add unit tests for sync logic
```

### 4.3 PR 规范

**PR 标题**：`[Epic X] <改动描述>`

**PR 描述必须包含**：
1. **改动内容** — 简要描述做了什么
2. **验收证据** — 运行了哪些检测命令，结果如何
3. **截图对比**（如有视觉变更）— Before / After
4. **关联 Story** — 关联对应的 team-tasks Story ID

**PR 必须通过**：
- [ ] `pnpm build` ✓
- [ ] `pnpm test` ✓
- [ ] `pnpm lint` ✓（0 errors）
- [ ] 静态检测全部通过
- [ ] 至少 1 个 reviewer 批准

---

## 5. 团队角色与职责

| 角色 | 职责 | 涉及 Epic |
|------|------|-----------|
| **Developer** | 执行重构、编写测试 | 全部 |
| **Architect** | 架构设计、技术决策 | 全部 |
| **Reviewer** | Code Review、质量把关 | 全部 |
| **QA** | E2E 测试、视觉验证 | Epic 1, 2, 4 |
| **PM** | 验收标准确认、里程碑跟踪 | 全部 |

---

## 6. 紧急回滚策略

如果发现重构引入问题：

```bash
# 1. 立即回滚到上一个通过的 commit
git revert <bad-commit>
git push origin <branch>

# 2. renderer.ts 紧急回退
# Sprint 2 开始时，原 renderer.ts 保留为 backup
# 如有问题，删除 re-export，恢复原文件

# 3. Store 回退
# Store 清理采用"先加后删"策略，删错可从 git history 恢复
```

---

*本文档为 Agent 执行规范，所有参与者必须遵守*
*由 Architect Agent 生成*
