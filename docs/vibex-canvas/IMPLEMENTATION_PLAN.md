# Implementation Plan — vibex-canvas CSS @use → @forward 修复

> **项目**: vibex-canvas  
> **日期**: 2026-04-11  
> **状态**: Epic3 done
> **Epic3 验证**: 2026-04-12

---

## Overview

将 `canvas.module.css` 聚合文件的 CSS 指令从 `@use` 改为 `@forward`，恢复 13 个组件的类名导出。

**根因**: `@use` 不导出类名到顶层；`@forward` 才是 CSS Modules 多文件聚合的正确指令。

**影响范围**: 仅 `src/components/canvas/canvas.module.css`（1 个文件），13 个组件 TSX 文件零改动。

---

## Implementation Units

- [x] **Unit 1: 冲突扫描（修复前基线）**

**Goal:** 在修复前摸清子模块类名现状，识别潜在冲突。

**Requirements:** R2.1（防止引入新冲突）

**Dependencies:** None

**Files:**
- Modify: `scripts/scan-css-conflicts.ts`（新建）
- Test: `scripts/scan-css-conflicts.test.ts`（新建）

**Approach:**
1. 扫描 10 个子模块 CSS 文件（canvas.base, canvas.toolbar, trees, panels, context, flow, components, thinking, export, misc）
2. 使用正则提取所有 `.className` 定义，收集对应哈希值
3. 检测同名类名不同哈希值的冲突
4. 输出冲突报告（JSON 格式）

**Test scenarios:**
- Happy path: 10 个子模块全部扫描，输出无冲突
- Edge case: 子模块类名数量 < 5，警告可能遗漏
- Edge case: 存在同名不同值类名，报告冲突清单

**Verification:**
- 脚本执行 exit code === 0
- 输出 JSON 包含 `conflicts: []` 或具体冲突列表

---

- [x] **Unit 2: 修复 canvas.module.css（@use → @forward）**

**Goal:** 将聚合文件的 CSS 指令从 `@use` 改为 `@forward`，恢复类名导出。

**Requirements:** R1.1（根因修复）

**Dependencies:** Unit 1（冲突扫描通过）

**Files:**
- Modify: `src/components/canvas/canvas.module.css`

**Approach:**
1. 读取 `canvas.module.css` 当前内容
2. 替换所有 `@use` 为 `@forward`
3. 保留 `@import './canvas.variables.css'`（变量文件不受影响）
4. 若 Unit 1 检测到冲突，在对应行前加 `as prefix--` 别名
5. 写入修改后的文件
6. 更新文件头部注释（S3-1 说明需更新为 `@forward`）

**修复前:**
```css
@use './canvas.base.module.css';
@use './canvas.toolbar.module.css';
```

**修复后:**
```css
@forward './canvas.base.module.css';
@forward './canvas.toolbar.module.css';
```

**Conflict scenario (e.g., both modules define `.active`):**
```css
@forward './canvas.trees.module.css' as trees--;
@forward './canvas.panels.module.css' as panels--;
```

**Patterns to follow:**
- 保持子模块路径顺序不变
- 保持相对路径 `./` 前缀
- 保留原有 `as` 别名（若有）

**Test scenarios:**
- Happy path: 所有 @use → @forward，无遗漏
- Edge case: 文件中 @forward 数量 = 10（不含变量 @import）
- Edge case: 无残留 @use 语句

**Verification:**
- `canvas.module.css` 包含 ≥ 10 个 `@forward` 语句
- `canvas.module.css` 不包含 `@use` 语句
- 13 个组件的类名引用文件路径不变

---

- [x] **Unit 3: 类名导出验证**

**Goal:** 验证修复后所有 13 个组件的类名从聚合文件正确导出。

**Requirements:** R1.2（类名解析非 undefined）

**Dependencies:** Unit 2

**Files:**
- Test: `src/components/canvas/__tests__/canvas-module-exports.test.ts`（新建）

**Approach:**
1. 使用 Jest 测试，执行 `require.context` 或直接 `import` canvas.module.css
2. 逐一验证 13 个组件引用的类名存在且非空字符串
3. 13 个组件类名：
   - `treePanel`, `boundedContextTree`, `businessFlowTree`, `componentTree`
   - `componentTreeCard`, `canvasToolbar`, `projectBar`, `treeToolbar`
   - `phaseProgressBar`, `boundedContextGroup`, `prototypeQueuePanel`
   - `treeStatus`, `sortableTreeItem`

**Test scenarios:**
- Happy path: 所有 13 个类名导出且值非空
- Edge case: 类名存在但值为空字符串（边界情况）
- Edge case: 类名完全 undefined（未导出）

**Verification:**
- Jest 测试全部通过
- 无 `undefined` 类名

---

- [x] **Unit 4: 构建验证**

**Goal:** 确认 Next.js 构建成功，构建产物中 CSS 类名正确。

**Requirements:** R3.1

**Dependencies:** Unit 3

**Files:**
- Test: `src/components/canvas/__tests__/build-css-assert.test.ts`（新建）

**Approach:**
1. 执行 `pnpm build`
2. 验证 exit code === 0
3. 扫描 `.next/**/*.css` 文件，确认无 `undefined` 字样
4. 验证构建无 CSS 警告

**Test scenarios:**
- Happy path: 构建成功，exit code 0，无警告
- Error path: 构建失败（类型错误、语法错误）
- Error path: CSS 产物包含 `undefined` 字样

**Verification:**
- `pnpm build` exit code === 0
- 构建产物扫描无 `undefined`

---

- [x] **Unit 5: 视觉回归验证（gstack）**

**Goal:** 使用 Playwright 截图对比，确认修复后视觉无意外回归。

**Requirements:** R2.2

**Dependencies:** Unit 4

**Files:**
- Test: `e2e/canvas-css-visual-regression.spec.ts`（新建）
- Baseline: `test-results/visual-baseline/`（快照目录）

**Approach:**
1. 启动 dev server（`pnpm dev`）
2. Playwright 访问 Canvas 页面（`/canvas`）
3. 对 13 个组件区域截图
4. 与基线截图对比（pixelmatch）
5. 计算变化像素百分比，阈值 < 5%

**Component URL mapping:**
| 组件 | 路径 |
|------|------|
| TreePanel | `/canvas` |
| BoundedContextTree | `/canvas` |
| BusinessFlowTree | `/canvas` |
| ComponentTree | `/canvas` |
| CanvasToolbar | `/canvas` |
| ProjectBar | `/canvas` |
| TreeToolbar | `/canvas` |
| PhaseProgressBar | `/canvas` |
| BoundedContextGroup | `/canvas` |
| PrototypeQueuePanel | `/canvas` |
| TreeStatus | `/canvas` |
| SortableTreeItem | `/canvas` |

**Test scenarios:**
- Happy path: 13 组件截图 diff < 5%
- Edge case: dev server 启动超时
- Error path: diff ≥ 5%（可能引入意外样式变化）

**Verification:**
- Playwright 测试通过
- 13 组件 diff < 5%

---

- [x] **Unit 6: 运行时验证（gstack qa）**

**Goal:** 验证 Canvas 页面在真实浏览器中类名正确渲染。

**Requirements:** R3.2

**Dependencies:** Unit 5

**Files:**
- Test: `e2e/canvas-classname-runtime.spec.ts`（新建）

**Approach:**
1. Playwright 访问 `/canvas`
2. 检查 DOM 中关键元素的 class 属性
3. 断言 class 属性值不包含 `undefined`
4. 断言 CSS 类名对应的 computed style 非空

**Test scenarios:**
- Happy path: 所有类名在 DOM 中正确渲染
- Edge case: 组件延迟加载（等待 selector）
- Error path: class 包含 undefined

**Verification:**
- DOM 中无 `undefined` class 值
- computed style 非空

---

## Dependencies & Sequencing

```
Unit 1 (冲突扫描基线)
         ↓
Unit 2 (@use → @forward) ← 必须 Unit 1 无阻塞冲突
         ↓
Unit 3 (类名导出验证)
         ↓
Unit 4 (构建验证)
         ↓
Unit 5 (视觉回归) + Unit 6 (运行时验证) [可并行]
```

**串行策略**: 每个 Unit 验证通过后才进入下一个，降低回退成本。

---

## Non-Goals

- 不修改任何 TSX 组件文件
- 不修改子模块 CSS 内容
- 不引入新的 CSS 依赖或构建工具
- 不改变 Canvas 业务逻辑

---

## Success Criteria

| Unit | 验收标准 | 验证方法 |
|------|---------|---------|
| Unit 1 | 无类名冲突报告 | 脚本 exit code 0 |
| Unit 2 | @forward ≥ 10, @use = 0 | grep 验证 |
| Unit 3 | 13 类名全部导出 | Jest 测试通过 |
| Unit 4 | build exit code = 0 | CI/CD |
| Unit 5 | 13 组件 diff < 5% | Playwright pixelmatch |
| Unit 6 | DOM 无 undefined class | Playwright DOM 查询 |

**总验收**: DoD 6 项全部通过。
