# Vibex Canvas CSS 聚合架构 — 技术设计

**任务**: vibex-css-architecture/design-architecture
**阶段**: Phase 1 — Technical Design
**产出时间**: 2026-04-12
**产出人**: Architect

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 2026-04-12

---

## 1. 背景与问题帧

### 1.1 核心问题

2026-04-11 下午，canvas.module.css 从单文件拆分为 10 个子模块，用了 `@use` 而非 `@forward`，导致类名导出丢失。当晚 70ed0a1a 修复 `@forward`，但遗留问题未彻底解决：

**根因 A（已修复）**: `@use` 不导出类名到聚合层 → 已通过 `@forward` 修复。

**根因 B（待解决）**: 组件层 `PrototypeQueuePanel.tsx:56` 用 `styles['queueItem_queued']`（snake_case）动态访问，但 CSS 定义为 `.queueItemQueued`（camelCase）。运行时类名为 `undefined`，队列项四态样式全部丢失。

**根因 C（系统性风险）**: 项目无 CSS Modules TypeScript 类型声明，`tsc --noEmit` 无法检测类名引用与定义不匹配，只能运行时才发现。

### 1.2 受影响范围

| 组件 | 文件 | 问题 | 状态 |
|------|------|------|------|
| PrototypeQueuePanel | `panels/PrototypeQueuePanel.tsx:56` | `styles['queueItem_${statusVariant}']` → undefined | ❌ 需修复 |
| ExportMenu | `features/ExportMenu.tsx:263` | 独立 ExportMenu.module.css | ✅ 不受影响 |
| 其他 canvas 组件 | — | 各有独立 CSS 文件 | ✅ 不受影响 |

---

## 2. 技术栈

| 技术 | 版本/选择 | 理由 |
|------|----------|------|
| CSS Modules | 原生（Vite 内置） | 项目已有，无新增依赖 |
| TypeScript | strict: true | tsconfig.json 已配置，不降低严格度 |
| Vitest | ^4.1.2 | 项目已有测试框架 |
| Playwright | ^1.59.0 | 项目已有 E2E 框架 |
| @hey-api/openapi-ts | latest | 已有代码生成依赖 |

**无新增外部依赖**。所有方案基于现有工具链。

---

## 3. 系统架构

### 3.1 CSS 聚合架构（现状）

```
canvas.module.css (@forward 聚合层)
  ├── canvas.variables.css    (CSS 变量，@import，全局无命名冲突)
  ├── canvas.base.module.css  (canvasContainer, phase_*, tabBarWrapper)
  ├── canvas.toolbar.module.css (expandControls, maximizeButton, canvasToolbar)
  ├── canvas.trees.module.css (treePanel, treePanelHeader, treePanelBody...)
  ├── canvas.context.module.css (boundedContextTree, contextNodeList, nodeCard...)
  ├── canvas.flow.module.css  (flowTreePanel, flowCard, nodeTypeMarker, iconBtn...)
  ├── canvas.components.module.css (component tree 类名)
  ├── canvas.panels.module.css (leftDrawer, rightDrawer, drawerContent...)
  ├── canvas.thinking.module.css (thinkingBubble, thinkingIndicator...)
  ├── canvas.export.module.css (queueItem, queueItemQueued, queueItemGenerating...)
  └── canvas.misc.module.css  (boundedContextGroup, shortcutHintPanel...)
```

**@forward 聚合正确**，类名按定义原样导出到 canvas.module.css。无需改动 CSS 聚合层结构。

### 3.2 命名风格规范

| 层级 | 风格 | 示例 |
|------|------|------|
| canvas 子模块聚合（canvas.*.module.css） | **camelCase** | `.queueItemQueued`, `.nodeTypeMarker`, `.iconBtn` |
| canvas 子模块内 CSS 变量选择器 | **kebab-case（BEM）** | `.phase_completed`, `.phase_active`（已定义在 canvas.base.module.css） |
| canvas 子模块内 BEM 块 | **kebab-case（BEM）** | `.flowCard`, `.nodeCard`, `.treePanel` |
| 独立组件 CSS（各自独立 .module.css） | **kebab-case（BEM）** | `.exportStatus`, `.exportStatus_success` |

**现状**: canvas 子模块内混用 camelCase 和 kebab-case（BEM）——这是历史遗留，非本任务范围。本任务确立规范防止未来恶化。

### 3.3 类名引用方式规范

```typescript
// ✅ 静态访问：使用点语法（IDE/TS 可推断）
import styles from './canvas.export.module.css';
const className = styles.queueItemQueued; // string

// ✅ 动态访问（需要验证）：使用 bracket notation
const variant = 'Queued';
const key = `queueItem${variant}`; // camelCase 首字母大写
const className = styles[key]; // string | undefined（TS 类型推断）

// ❌ 错误示例（已造成 bug）
const key = `queueItem_${statusVariant}`; // snake_case 与 CSS 定义不符
```

---

## 4. 模块划分与数据流

### 4.1 受影响模块

| 模块 | 职责 | 文件 | 修改类型 |
|------|------|------|---------|
| PrototypeQueuePanel | 渲染原型队列项状态 | `src/components/canvas/panels/PrototypeQueuePanel.tsx` | 修改 |
| CSS 类型声明（全局） | 为所有 *.module.css 提供类型 | `src/types/css-modules.d.ts` | 新建 |
| CSS 类型声明（canvas） | 枚举 canvas 子模块全部类名 | `src/components/canvas/canvas.module.css.d.ts` | 新建 |
| CI 扫描脚本 | 构建时检测类名不匹配 | `scripts/scan-tsx-css-refs.ts` | 新建（独立脚本，不修改同名现有脚本） |
| 命名规范文档 | 确立命名风格 | `docs/vibex-css-architecture/NAMING_CONVENTION.md` | 新建 |

### 4.2 数据流

```
CSS 定义 (canvas.export.module.css)
  .queueItemQueued { background: ... }
  ↓ @forward 导出
canvas.module.css
  ↓ import styles from './canvas.module.css'
PrototypeQueuePanel.tsx
  ↓ styles['queueItemQueued'] (修复后)
  → className="queueItemQueued" (运行时)
  → DOM classList 正确 → 样式生效
```

---

## 5. 接口设计

### 5.1 CSS Modules 类型声明（全局）

```typescript
// src/types/css-modules.d.ts
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

**效果**：
- `import styles from './Foo.module.css'` → `styles` 类型为 `{ [key: string]: string }`
- `const x: string = styles.anyKey` → TS 推断为 `string`（非 `string | undefined`）

### 5.2 CSS Modules 类型声明（canvas 枚举）

```typescript
// src/components/canvas/canvas.module.css.d.ts
declare module './canvas.base.module.css' {
  const classes: {
    canvasContainer: string;
    tabBarWrapper: string;
    phaseProgressBar: string;
    phase_completed: string;
    phase_active: string;
    phase_pending: string;
    // ...
  };
  export = classes;
}

declare module './canvas.export.module.css' {
  const classes: {
    queueItem: string;
    queueItemQueued: string;
    queueItemGenerating: string;
    queueItemDone: string;
    queueItemError: string;
    queueItemInfo: string;
    queueItemName: string;
    queueItemMeta: string;
    queueItemProgress: string;
    queueItemProgressFill: string;
    queueItemProgressLabel: string;
    queueItemRetry: string;
    queueItemErrorMsg: string;
    queueItemActions: string;
    prototypeQueuePanel: string;
    queuePanelHeader: string;
    queuePanelTitle: string;
    pollingIndicator: string;
    queueUnlockSection: string;
    queueUnlockHint: string;
    createProjectButton: string;
    queueStats: string;
    queueStatItem: string;
    queueList: string;
    queueItem: string;
    // ...
  };
  export = classes;
}
```

### 5.3 CI 扫描脚本接口

```typescript
// scripts/scan-css-conflicts.ts
interface ScanResult {
  file: string;
  line: number;
  undefinedClass: string;
  definedClasses: string[];
}

function scanFile(tsxContent: string, cssContent: string, tsxPath: string): ScanResult[];
function run(): { exitCode: number; results: ScanResult[] };
```

---

## 6. 技术选型

| 组件 | 选择 | 替代方案 | 弃用理由 |
|------|------|---------|---------|
| CSS Modules 类型生成 | 手动枚举（canvas.module.css.d.ts） | `vite-plugin-css-modules-types` / `typed-css-modules` | 自动化工具误报率高，canvas 子模块结构特殊 |
| 动态类名验证 | CI 扫描脚本（新增 scan-css-conflicts.ts） | TypeScript 插件（ts-plugin-css-modules） | 插件生态不成熟，侵入性高 |
| 动态类名处理 | 首字母大写辅助函数 | 模板字符串字面量 | 防止 snake_case 回流 |

---

## 7. 性能影响评估

| 方面 | 影响 | 评估 |
|------|------|------|
| 构建时间 | 无新增 | 纯类型声明文件，无运行时开销 |
| 包体积 | 无变化 | 类型声明仅供编译时使用 |
| 运行时性能 | 无变化 | CSS 聚合结构未变 |
| CI 时间 | +3~5s | scan-css-conflicts.ts 扫描 ~20 个 TSX 文件 |
| TypeScript 编译 | +0.5s | 加载额外 .d.ts 文件 |

**总体：无性能风险。CI 扫描实测预计 +10~15s（首轮全量扫描），后续增量扫描 +3~5s。**

---

## 8. 风险评估

| 风险 | 影响 | 概率 | 缓解 |
|------|------|------|------|
| 动态类名验证误报（scan-css-conflicts.ts） | 中 | 中 | 脚本仅扫描 `styles[...]` 字面量模式，过滤 `styles['icon--${variant}']` 等已知 BEM 变体 |
| canvas.module.css.d.ts 与实际 CSS 不同步 | 中 | 低 | 枚举所有子模块类名后，在 PR checklist 要求同步更新 |
| CSS 命名规范无法强制执行 | 低 | 高 | CI 扫描 + code review 把关，不做硬性 ESLint 规则（避免误伤） |
| 其他组件也存在 snake_case 问题 | 低 | 低 | analysis.md 已验证，仅 PrototypeQueuePanel 一处 |

---

## 9. 技术审查清单

- [ ] PRD 验收标准逐条对照（见 prd.md §3）
- [ ] 所有 Epic/Story 接口签名与 spec 文件一致
- [ ] 动态类名处理遵循首字母大写规范（无 snake_case）
- [ ] canvas.module.css.d.ts 枚举覆盖全部 10 个子模块
- [ ] scan-css-conflicts.ts 对 `styles['不存在的类名']` 报错退出码 1
- [ ] Vitest 测试覆盖 4 个状态变体
- [ ] 性能影响：构建 +10~15s（CI 全量扫描），后续 +3~5s，运行时无变化
- [ ] 兼容现有架构：canvas 子模块 @forward 聚合结构不变

---

## 10. 产出物清单

| 文件 | 路径 | 状态 |
|------|------|------|
| 架构文档 | `docs/vibex-css-architecture/architecture.md` | ✅ |
| 实施计划 | `docs/vibex-css-architecture/IMPLEMENTATION_PLAN.md` | ✅ |
| 开发约束 | `docs/vibex-css-architecture/AGENTS.md` | ✅ |
| 命名规范 | `docs/vibex-css-architecture/NAMING_CONVENTION.md` | ✅（随 architecture.md 产出） |
