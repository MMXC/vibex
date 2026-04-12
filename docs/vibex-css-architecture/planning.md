# Vibex Canvas CSS 架构 — Planning

**任务**: vibex-css-architecture/plan-features
**阶段**: Phase 2 — Planning
**计划时间**: 2026-04-12
**Planner**: Planning Agent（基于 analysis.md）

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 待定
- **基于分析**: `docs/vibex-css-architecture/analysis.md`（Analyst，2026-04-12）
- **采用方案**: 方案 B（CSS Modules 类型安全体系 + 命名规范）

---

## 1. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|
| F1 | 修复 PrototypeQueuePanel 队列项类名命名不一致 | 将 `styles['queueItem_queued']` 等 snake_case 引用改为 `styles['queueItemQueued']` 等 camelCase，与 `canvas.export.module.css` 中的 `.queueItemQueued` 等定义对齐 | 根因 A | 0.5h |
| F2 | 创建 CSS Modules 全局类型声明 | 在 `src/types/css-modules.d.ts` 声明 `*.module.css` 导出 `{ [key: string]: string }`，消除 TypeScript `noImplicitAny` 警告 | 根因 B | 0.5h |
| F3 | 创建 canvas.module.css.d.ts 类型声明文件 | 枚举所有 10 个子模块（base/context/flow/export/trees/components/panels/toolbar/thinking/misc）导出的类名，为 canvas 组件提供精确类型检查 | 根因 B | 1.5h |
| F4 | 扩展 CI 扫描脚本检测 CSS 类名不匹配 | 在 `scripts/scan-css-conflicts.ts` 基础上增加 `styles[...]` 动态访问验证，构建时失败而非运行时发现 | 根因 B + C | 2h |
| F5 | 编写 CSS 类名命名规范文档 | 确立 canvas 模块使用 camelCase、BEM 组件使用 kebab-case、禁止混用的规范，防止未来再发生命名不一致 | 根因 A | 0.5h |
| F6 | Vitest 测试覆盖 PrototypeQueuePanel 状态样式类名 | 为 `queued`/`generating`/`done`/`error` 四个状态变体编写单元测试，断言 `styles['queueItemQueued']` 等类名存在且为非空字符串 | 根因 A | 1h |
| F7 | E2E 测试验证队列项状态样式加载 | 使用 Playwright 打开 canvas 页面，检查 `.queueItem--queued` 等类名对应的 DOM 元素样式是否正确渲染（无 undefined 类名警告） | 根因 A + C | 1h |

**工时合计: 7h**（P1+P2 为快速止血 2h，P3~P5 为后续完善）

---

## 2. Epic / Story 拆分

### Epic E1: 命名不一致修复
**问题根因**: 组件层使用 snake_case 引用 CSS 类名，CSS 定义层使用 camelCase（根因 A）

---

**Story E1-S1: 修复 PrototypeQueuePanel.tsx 队列项类名引用**
- **文件**: `vibex-fronted/src/components/canvas/PrototypeQueuePanel.tsx`
- **问题行**: Line 56 — `styles['queueItem_queued']` / `styles['queueItem_generating']` / `styles['queueItem_done']` / `styles['queueItem_error']`
- **期望**: CSS 定义为 `.queueItemQueued`、`.queueItemGenerating`、`.queueItemDone`、`.queueItemError`（camelCase）
- **修改**: 将 `styles[\`queueItem_\${statusVariant}\`]` 改为 `styles[\`queueItem\${capitalize(statusVariant)}\`]`
- **验收标准**:
  - `expect(screen.queryByText('⏳').closest('li')).toHaveClass('queueItemQueued')`
  - `expect(screen.queryByText('⚙️').closest('li')).toHaveClass('queueItemGenerating')`
  - `expect(screen.getByText('✅').closest('li')).toHaveClass('queueItemDone')`
  - `expect(screen.getByText('❌').closest('li')).toHaveClass('queueItemError')`
  - Line 90 `styles.queueItemError` 保持不变（已是 camelCase，无需修改）
- **工时**: 0.5h
- **依赖**: 无
- **优先级**: P1

---

### Epic E2: CSS Modules 类型安全体系
**问题根因**: CSS Modules 缺少 TypeScript 类型声明，TypeScript 无法静态检查类名是否存在（根因 B）

---

**Story E2-S1: 创建 CSS Modules 全局类型声明**
- **文件**: `vibex-fronted/src/types/css-modules.d.ts`
- **内容**:
  ```typescript
  declare module '*.module.css' {
    const classes: { readonly [key: string]: string };
    export default classes;
    export = classes;
  }
  ```
- **验收标准**:
  - `tsc --noEmit` 对 `import styles from './Foo.module.css'` 不报 `cannot find module` 错误
  - `import styles from './bar.module.css'; const x: string = styles.anything` 推断为 `string`（非 `string | undefined`）
- **工时**: 0.5h
- **依赖**: 无
- **优先级**: P1

---

**Story E2-S2: 创建 canvas.module.css.d.ts 类型声明文件**
- **文件**: `vibex-fronted/src/components/canvas/canvas.module.css.d.ts`
- **内容**: 枚举全部 10 个子模块的类名，包括：
  - `canvas.base.module.css`: `canvasContainer`, `tabBarWrapper`, `phaseProgressBar`, `phase_completed`, `phase_active`, `phase_pending`
  - `canvas.context.module.css`: `boundedContextTree`, `contextNodeList`, `nodeCard`, `nodeEditForm`, `nodeEditInput`, `nodeEditTextarea`, `nodeEditActions`
  - `canvas.flow.module.css`: `nodeTypeMarker`, `'nodeTypeMarker--start'`, `'nodeTypeMarker--end'`, `flowStepTypeIcon`, `'flowStepTypeIcon--branch'`, `'flowStepTypeIcon--loop'`, `'flowStepTypeIcon--normal'`, `iconBtn`, `'iconBtn--edit'`, `'iconBtn--delete'`
  - `canvas.export.module.css`: `queueItem`, `queueItemQueued`, `queueItemGenerating`, `queueItemDone`, `queueItemError`, `queueItemInfo`, `queueItemName`, `queueItemMeta`, `queueItemProgress`, `queueItemRetry`, `queueItemErrorMsg`, `queueItemActions`
  - `canvas.trees.module.css`, `canvas.components.module.css`, `canvas.panels.module.css`, `canvas.toolbar.module.css`, `canvas.thinking.module.css`, `canvas.misc.module.css` 的类名
- **验收标准**:
  - TypeScript 对 `styles.queueItemQueued` 推断类型为 `string`
  - TypeScript 对 `styles['nodeTypeMarker--start']` 推断类型为 `string`
  - `styles['不存在的类名']` 触发 TS 错误（或通过 CI 脚本检测）
- **工时**: 1.5h
- **依赖**: E2-S1
- **优先级**: P2

---

**Story E2-S3: 扩展 CI 扫描脚本检测 CSS 类名不匹配**
- **文件**: `vibex-fronted/scripts/scan-css-conflicts.ts`（现有脚本扩展）
- **功能**:
  1. 扫描所有 `.tsx` 文件中的 `styles['xxx']` 和 `styles[\`xxx\`]` 动态访问
  2. 解析对应 CSS 模块文件中的类名定义（支持 @forward 聚合）
  3. 报告不在 CSS 中定义的 `styles[...]` 引用
- **验收标准**:
  - 脚本能检测到 `styles['queueItem_queued']`（CSS 中无此定义，camelCase 版本才存在）
  - 脚本在 CI 构建时运行，检测到不匹配时 exit code = 1
- **工时**: 2h
- **依赖**: E1-S1（修复完成后扫描结果干净）
- **优先级**: P3

---

### Epic E3: 文档规范化
**目标**: 建立规范，防止未来再次发生命名不一致问题

---

**Story E3-S1: 编写 CSS 类名命名规范文档**
- **文件**: `docs/vibex-css-architecture/css-naming-convention.md`
- **内容**:
  - Canvas 聚合模块（通过 @forward 聚合）：统一使用 camelCase（如 `queueItemQueued`）
  - 独立组件 CSS 文件：推荐 BEM 风格（`block__element--modifier`）
  - TypeScript 中禁止硬编码类名字符串，必须通过 `styles['className']` 访问
  - 新增 CSS 类名时同步更新 `.d.ts` 类型声明文件
- **验收标准**:
  - 文档包含至少 3 个示例（正确/错误对比）
  - PR reviewer 可引用此文档要求不符合规范的修改
- **工时**: 0.5h
- **依赖**: 无
- **优先级**: P3

---

### Epic E4: 测试覆盖
**目标**: 通过测试确保修复正确，并防止未来回归

---

**Story E4-S1: Vitest 测试覆盖 PrototypeQueuePanel 状态样式类名**
- **文件**: `vibex-fronted/src/components/canvas/__tests__/PrototypeQueuePanel.test.tsx`（新建或扩展）
- **覆盖**:
  - 队列状态 `queued` → `li` 元素 className 包含 `queueItemQueued`
  - 队列状态 `generating` → `li` 元素 className 包含 `queueItemGenerating`
  - 队列状态 `done` → `li` 元素 className 包含 `queueItemDone`
  - 队列状态 `error` → `li` 元素 className 包含 `queueItemError`（line 90 已正确）
- **验收标准**:
  - 4 个 expect 断言全部通过（mock styles 对象，验证传入的键名）
  - `vitest run` exit code = 0
- **工时**: 1h
- **依赖**: E1-S1（确保修复后再测试，测试为保护性而非发现性）
- **优先级**: P2

---

**Story E4-S2: E2E 测试验证队列项状态样式加载**
- **文件**: `vibex-frontend/e2e/canvas-queue-styles.spec.ts`（新建）
- **测试步骤**:
  1. 打开 canvas 页面
  2. 触发原型队列渲染（有 `queued`/`generating`/`done`/`error` 状态的队列项）
  3. 检查 DOM 中不存在 `undefined` 类名的元素
  4. 检查 `.queueItem--queued` 等类名对应的 CSS 规则实际生效（computed style 非空）
- **验收标准**:
  - Playwright test 全部通过
  - Console 无 `undefined` 类名警告
- **工时**: 1h
- **依赖**: E1-S1, E2-S2
- **优先级**: P3

---

## 3. 优先级矩阵

| ID | 功能名 | RICE 分（估算）| 优先级 | 所属 Epic |
|----|--------|--------------|-------|---------|
| E1-S1 | 修复 PrototypeQueuePanel 队列项类名引用 | 最高（止血） | P1 | E1 |
| E2-S1 | CSS Modules 全局类型声明 | 高 | P1 | E2 |
| E2-S2 | canvas.module.css.d.ts 类型声明 | 高 | P2 | E2 |
| E4-S1 | Vitest 测试覆盖队列项状态样式 | 中 | P2 | E4 |
| E2-S3 | CI 扫描脚本 | 中 | P3 | E2 |
| E3-S1 | CSS 命名规范文档 | 中 | P3 | E3 |
| E4-S2 | E2E 测试验证样式加载 | 低 | P3 | E4 |

---

## 4. 依赖关系图

```
E1-S1 (P1)  ──依赖──▶  E4-S1 (P2)
E2-S1 (P1)  ──依赖──▶  E2-S2 (P2)
E1-S1 (P1)  ──依赖──▶  E2-S3 (P3)
E1-S1 (P1)  ──依赖──▶  E4-S2 (P3)
E2-S1 (P1)  ──依赖──▶  E3-S1 (P3)
```

**说明**: E1-S1 和 E2-S1 可并行开发，无相互依赖。

---

## 5. 工期总览

| 阶段 | 范围 | 工时 |
|------|------|------|
| 快速止血（P1） | E1-S1 + E2-S1 | 1h |
| 类型体系搭建（P2） | E2-S2 + E4-S1 | 2.5h |
| CI + 文档 + E2E（P3） | E2-S3 + E3-S1 + E4-S2 | 3.5h |
| **合计** | | **7h** |

> 注：分析报告中估算 8h，差距 1h 来源于 E2-S2（canvas.module.css.d.ts）详细枚举工时与 CI 脚本扩展工时的估算差异。实践中可并行走 E2-S3（CI 脚本）与 E2-S2（类型声明）以压缩工期。

---

## 6. 验收标准总览

- [ ] `PrototypeQueuePanel` 队列项 4 个状态的 className 使用 camelCase（`queueItemQueued` 等）
- [ ] `src/types/css-modules.d.ts` 存在，TypeScript 编译无 CSS Modules 报错
- [ ] `canvas.module.css.d.ts` 枚举全部 10 个子模块类名，包含 `queueItemQueued` 等
- [ ] CI 扫描脚本能检测 `styles['queueItem_queued']` 与 CSS 定义不匹配
- [ ] CSS 命名规范文档已创建
- [ ] Vitest 测试覆盖全部 4 个状态变体，通过
- [ ] E2E 测试验证队列项样式正常加载，console 无 undefined 类名警告

---

*Planning 完成于 2026-04-12 01:45 (Asia/Shanghai)*
*Planning Agent*
