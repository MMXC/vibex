# Vibex Canvas CSS 聚合架构 — PRD

**任务**: vibex-css-architecture/create-prd
**阶段**: Phase 1 — PRD 细化
**产出时间**: 2026-04-12
**产出人**: PM

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 待定
- **基于分析**: `docs/vibex-css-architecture/analysis.md`（Analyst，2026-04-12）
- **基于计划**: `docs/vibex-css-architecture/planning.md`（Planning，2026-04-12）
- **采用方案**: 方案 B（CSS Modules 类型安全体系 + 命名规范）

---

## 1. 执行摘要

### 背景

`canvas.module.css` 通过 `@forward` 聚合 10 个子模块（canvas.base/context/flow/export/.../misc.module.css）。2026-04-11 下午，拆分时误用 `@use` 指令导致类名导出丢失；当晚 @forward 修复正确，但核心问题未彻底解决——**组件层与 CSS 定义层命名风格不一致**。

### 核心问题

`PrototypeQueuePanel.tsx:56` 使用 snake_case 动态访问 `styles['queueItem_queued']` 等，但 CSS 中定义的是 camelCase `.queueItemQueued`、`.queueItemGenerating`、`.queueItemDone`、`.queueItemError`。运行时类名为 `undefined`，导致队列项状态样式完全丢失。

> **重要澄清**：分析报告提及"13 个组件引用类名全 undefined"，经 Planning 核实，ExportMenu / SearchDialog / PhaseProgressBar 均各自拥有独立 CSS 文件（ExportMenu.module.css、SearchDialog.module.css），不受 canvas 聚合层影响。真正受影响范围仅限 PrototypeQueuePanel 一处。

### 目标

1. 修复 PrototypeQueuePanel 队列项状态样式（止血）
2. 建立 CSS Modules TypeScript 类型安全体系，防止未来同类问题
3. 添加 CI 扫描 + 测试覆盖，确保不回归

### 成功指标

| 指标 | 目标 |
|------|------|
| 队列项状态样式 | queued/generating/done/error 四态样式正确显示 |
| TypeScript 类型检查 | `tsc --noEmit` 无 CSS Modules 相关错误 |
| CI 扫描 | `scan-css-conflicts.ts` 在构建时检测类名不匹配 |
| Vitest 覆盖 | 4 个状态变体样式类名断言全部通过 |
| Console 警告 | DOM 检查无 undefined 类名警告 |

### 工期估算

**7h（1 人天）**，分三批交付：
- **快速止血（P1）**: 1h — E1-S1 + E2-S1
- **类型体系（P2）**: 2.5h — E2-S2 + E4-S1
- **CI + 文档 + E2E（P3）**: 3.5h — E2-S3 + E3-S1 + E4-S2

---

## 2. Epic 拆分

### Epic E1 — 命名不一致修复

**根因**: 组件层使用 snake_case 引用 CSS 类名，CSS 定义层使用 camelCase

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E1-S1 | 修复 PrototypeQueuePanel 队列项类名引用 | 将 `styles[\`queueItem_\${statusVariant}\`]` 改为 `styles[\`queueItem\${capitalize(statusVariant)}\`]` | 0.5h | 见 spec-E1-S1 |

---

### Epic E2 — CSS Modules 类型安全体系

**根因**: CSS Modules 缺少 TypeScript 类型声明，运行时才发现类名 undefined

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E2-S1 | 创建 CSS Modules 全局类型声明 | 创建 `src/types/css-modules.d.ts`，声明 `*.module.css` 导出 `{ [key: string]: string }` | 0.5h | 见 spec-E2-S1 |
| E2-S2 | 创建 canvas.module.css.d.ts 类型声明文件 | 枚举 10 个子模块全部类名，提供精确类型检查 | 1.5h | 见 spec-E2-S2 |
| E2-S3 | 扩展 CI 扫描脚本检测类名不匹配 | 在 `scan-css-conflicts.ts` 中增加 `styles[...]` 动态访问验证，构建时失败 | 2h | 见 spec-E2-S3 |

---

### Epic E3 — 文档规范化

**根因**: 无 CSS 类名命名规范，新增组件容易混用风格导致不一致

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E3-S1 | 编写 CSS 类名命名规范文档 | 确立 canvas camelCase / 独立组件 BEM 风格规范 | 0.5h | 见 spec-E3-S1 |

---

### Epic E4 — 测试覆盖

**根因**: 无专项测试覆盖 CSS 类名，修复后无回归保护

| ID | Story | 描述 | 工时 | 验收标准 |
|----|-------|------|------|---------|
| E4-S1 | Vitest 测试覆盖 PrototypeQueuePanel 状态样式 | 为 4 个状态变体编写单元测试，断言类名存在 | 1h | 见 spec-E4-S1 |
| E4-S2 | E2E 测试验证队列项状态样式加载 | Playwright 检查 DOM 无 undefined 类名，computed style 正确 | 1h | 见 spec-E4-S2 |

---

## 3. 验收标准（每个 Story 可写 expect() 断言）

### E1-S1: 修复 PrototypeQueuePanel 队列项类名引用

**specs/spec-E1-S1.md** 中定义：

```
Given PrototypeQueuePanel renders with queue status 'queued'
When the component mounts
Then the <li> element className includes 'queueItemQueued' (not 'queueItem_queued')
And styles['queueItemQueued'] is not undefined

Given PrototypeQueuePanel renders with queue status 'generating'
When the component mounts
Then the <li> element className includes 'queueItemGenerating'
And styles['queueItemGenerating'] is not undefined

Given PrototypeQueuePanel renders with queue status 'done'
When the component mounts
Then the <li> element className includes 'queueItemDone'
And styles['queueItemDone'] is not undefined

Given PrototypeQueuePanel renders with queue status 'error'
When the component mounts
Then the <li> element className includes 'queueItemError'
And styles['queueItemError'] is not undefined (line 90 already correct, no change needed)
```

**Vitest 断言示例**：
```ts
expect(stylesMock.queueItemQueued).toBeDefined();
expect(stylesMock.queueItemGenerating).toBeDefined();
expect(stylesMock.queueItemDone).toBeDefined();
expect(stylesMock.queueItemError).toBeDefined();
```

**页面集成**: 【需页面集成】— 修复需在 canvas 页面验证

---

### E2-S1: 创建 CSS Modules 全局类型声明

**specs/spec-E2-S1.md** 中定义：

```
Given a TypeScript file imports a CSS module
When tsc --noEmit runs
Then no 'cannot find module' error for *.module.css files
And styles['anyKey'] has type string (not string | undefined)
```

**验收断言**：
```ts
// 无类型错误
const styles = require('./Foo.module.css');
const x: string = styles.anything; // 不报错
```

---

### E2-S2: 创建 canvas.module.css.d.ts 类型声明文件

**specs/spec-E2-S2.md** 中定义：

```
Given canvas.module.css.d.ts declares all 10 sub-module class names
When TypeScript compiles any canvas component
Then styles.queueItemQueued has type string
And styles['nodeTypeMarker--start'] has type string
And styles['iconBtn--edit'] has type string
And referencing a non-existent class name triggers TS error (or CI script detects it)
```

**覆盖子模块**（按 planning.md E2-S2）：
- canvas.base.module.css: `canvasContainer`, `phase_completed`, `phase_active`, `phase_pending`
- canvas.context.module.css: `boundedContextTree`, `contextNodeList`, `nodeCard`
- canvas.flow.module.css: `nodeTypeMarker`, `'nodeTypeMarker--start'`, `'nodeTypeMarker--end'`, `iconBtn`, `'iconBtn--edit'`, `'iconBtn--delete'`
- canvas.export.module.css: `queueItem`, `queueItemQueued`, `queueItemGenerating`, `queueItemDone`, `queueItemError`
- canvas.trees / components / panels / toolbar / thinking / misc.module.css 的类名

**页面集成**: 【需页面集成】— canvas 页面加载无 TS 错误

---

### E2-S3: 扩展 CI 扫描脚本检测类名不匹配

**specs/spec-E2-S3.md** 中定义：

```
Given scan-css-conflicts.ts runs against all .tsx files
When it finds styles['xxx'] where 'xxx' is not defined in the corresponding CSS module
Then it reports: "CSS class 'xxx' referenced but not defined in <module>.css"
And the script exits with code 1
```

**验收断言**：
```bash
node scripts/scan-css-conflicts.ts
# exit code 1 if any styles['undefinedClass'] found
# exit code 0 if all styles[...] references match CSS definitions
```

---

### E3-S1: 编写 CSS 类名命名规范文档

**specs/spec-E3-S1.md** 中定义：

```
Given a new canvas component is being added
When a developer references a CSS class name
Then the class name follows camelCase for @forward aggregated modules
And independent component files use BEM (block__element--modifier)
And new class names are added to the corresponding .d.ts file
```

---

### E4-S1: Vitest 测试覆盖 PrototypeQueuePanel 状态样式

**specs/spec-E4-S1.md** 中定义：

```
Given PrototypeQueuePanel test suite runs
When each status variant is rendered (queued/generating/done/error)
Then the mock styles object contains queueItemQueued / queueItemGenerating / queueItemDone / queueItemError keys
And each value is a non-empty string
And vitest run exit code = 0
```

**Vitest 断言**：
```ts
expect(stylesMock).toHaveProperty('queueItemQueued');
expect(stylesMock).toHaveProperty('queueItemGenerating');
expect(stylesMock).toHaveProperty('queueItemDone');
expect(stylesMock).toHaveProperty('queueItemError');
expect(stylesMock.queueItemQueued).toBeTruthy();
expect(stylesMock.queueItemGenerating).toBeTruthy();
expect(stylesMock.queueItemDone).toBeTruthy();
expect(stylesMock.queueItemError).toBeTruthy();
```

---

### E4-S2: E2E 测试验证队列项状态样式加载

**specs/spec-E4-S2.md** 中定义：

```
Given Playwright opens the canvas page with prototype queue
When prototype queue items render with queued/generating/done/error states
Then no element has 'undefined' in its className
And the DOM element with status icon '⏳' has class containing 'queueItemQueued'
And console has zero CSS class undefined warnings
And computed style for queue item status element is not empty
```

**Playwright 断言**：
```ts
await expect(page.locator('.queue-item-queued, [class*="queueItemQueued"]')).toBeVisible();
const undefinedInClass = await page.evaluate(() =>
  [...document.querySelectorAll('[class]')].some(el => el.className.includes('undefined'))
);
expect(undefinedInClass).toBe(false);
```

**页面集成**: 【需页面集成】— Playwright E2E 测试

---

## 4. DoD (Definition of Done)

每个 Story 的 DoD 必须全部满足才能标记完成：

### E1-S1 DoD
- [ ] `styles[\`queueItem\${capitalize(statusVariant)}\`]` 替代了 `styles[\`queueItem_\${statusVariant}\`]`
- [ ] 4 个状态变体（queued/generating/done/error）的 `<li>` className 使用 camelCase 类名
- [ ] `npm run build` 成功，无 TS 报错
- [ ] Vitest 测试通过

### E2-S1 DoD
- [ ] `src/types/css-modules.d.ts` 存在
- [ ] `tsc --noEmit` 对 `import styles from './Foo.module.css'` 不报找不到模块错误
- [ ] `styles['anyKey']` 推断类型为 `string`（非 `string | undefined`）

### E2-S2 DoD
- [ ] `canvas.module.css.d.ts` 存在
- [ ] 枚举了全部 10 个子模块的类名
- [ ] 包含 `queueItemQueued`、`queueItemGenerating`、`queueItemDone`、`queueItemError`
- [ ] 包含 `nodeTypeMarker--start`、`iconBtn--edit` 等含特殊字符的类名
- [ ] `tsc --noEmit` 无新增错误

### E2-S3 DoD
- [ ] `scan-css-conflicts.ts` 能检测 `styles['queueItem_queued']` 等不匹配引用
- [ ] CI 构建时运行脚本，检测到不匹配则构建失败
- [ ] 脚本输出格式清晰，包含文件路径和行号

### E3-S1 DoD
- [ ] `css-naming-convention.md` 存在
- [ ] 包含至少 3 个正确/错误示例对比
- [ ] 文档已被 PR reviewer 引用

### E4-S1 DoD
- [ ] `PrototypeQueuePanel.test.tsx` 存在
- [ ] 覆盖 4 个状态变体的类名断言
- [ ] `vitest run` 全部通过

### E4-S2 DoD
- [ ] E2E spec 文件存在于 `e2e/canvas-queue-styles.spec.ts`
- [ ] Playwright 测试全部通过
- [ ] Console 无 undefined 类名警告

---

## 5. 功能点总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 | 优先级 |
|----|--------|------|----------|----------|--------|
| F1 | 修复队列项类名命名不一致 | `queueItem_${statusVariant}` → `queueItem${capitalize(statusVariant)}` | `styles['queueItemQueued']` 等非 undefined | 【需页面集成】 | P1 |
| F2 | CSS Modules 全局类型声明 | `src/types/css-modules.d.ts` | `tsc --noEmit` 无 CSS 模块错误 | 否 | P1 |
| F3 | canvas.module.css.d.ts 类型文件 | 枚举 10 个子模块全部类名 | TS 对已知类名推断为 string | 【需页面集成】 | P2 |
| F4 | CI 扫描脚本扩展 | `scan-css-conflicts.ts` 增加动态访问检测 | 构建时检测到不匹配则 exit 1 | 否 | P3 |
| F5 | CSS 命名规范文档 | canvas camelCase / 独立组件 BEM | 文档存在且含示例 | 否 | P3 |
| F6 | Vitest 状态样式测试 | 4 个状态变体断言 | 4 个 expect 全部通过 | 否 | P2 |
| F7 | E2E 队列项样式验证 | Playwright DOM 检查 | 无 undefined 类名，console 无警告 | 【需页面集成】 | P3 |

---

*PRD 完成于 2026-04-12 01:50 (Asia/Shanghai)*
*PM Agent*
