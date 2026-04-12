# Vibex Canvas CSS 聚合架构深层问题分析

**任务**: vibex-css-architecture/analyze-requirements
**阶段**: Phase 1 — 需求分析
**分析时间**: 2026-04-12
**分析人**: Analyst

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 待定

---

## 1. 背景 Research（历史经验 + Git History）

### 1.1 历史经验检索

检索路径：`docs/learnings/`

| 文件 | 相关性 | 教训 |
|------|--------|------|
| `canvas-testing-strategy.md` | 中 | mockStore 过于简化导致测试通过但运行时出错 — **同一问题模式** |
| `react-hydration-fix.md` | 低 | React 水合问题，与 CSS 问题正交 |
| `vibex-e2e-test-fix.md` | 低 | E2E 测试修复，不涉及 CSS 架构 |

**历史教训（高相关）**：
> mockStore 测试通过但运行时失败 — 根因是"静态检查正常但运行时行为不符"。当前 CSS 问题完全符合此模式：构建通过、Vitest 通过，但运行时类名 undefined。

### 1.2 Git History 分析

```
70ed0a1a  feat(canvas): CSS @use → @forward 恢复 13 组件类名导出  ← 当前最新
8f2208e8  [S3-1-1~10] refactor: canvas.module.css split into 10 sub-modules  ← 引入 @use 错误
2675a813  feat(collaboration): ConflictBubble UI
0e1b409b  feat(collaboration): Firebase Presence
```

**时序复盘**：

```
时间线：
Apr 11 16:27  8f2208e8  canvas.module.css 拆分为 10 个子模块，但用了 @use（错误指令）
                @use 不导出类名到顶层 → canvas.module.css 导出 undefined
                13 个组件引用 → 运行时类名全 undefined

Apr 11 23:00  70ed0a1a  @use → @forward（正确修复）
                但 commit message 自述："DOM 检查: Console errors=0（@use/@forward 预存问题不变）"
                → 说明 @forward 修复后，核心问题仍未彻底解决
```

**根因定位**：@forward 修复了 CSS 聚合层，但 **组件层与 CSS 定义层的命名不一致** 问题仍存在。

---

## 2. 问题帧（Problem Frame）

### 2.1 核心症状

canvas 页面上多个组件引用的 CSS 类名在运行时为 `undefined`，导致样式完全不生效。

### 2.2 已确认的类名不匹配（运行时 undefined）

| # | 组件文件 | 引用的类名 | CSS 中的实际定义 | 状态 |
|---|---------|-----------|----------------|------|
| 1 | `PrototypeQueuePanel.tsx:56` | `queueItem_queued` | `.queueItemQueued` | ❌ 命名不一致 |
| 1 | `PrototypeQueuePanel.tsx:56` | `queueItem_generating` | `.queueItemGenerating` | ❌ 命名不一致 |
| 1 | `PrototypeQueuePanel.tsx:56` | `queueItem_done` | `.queueItemDone` | ❌ 命名不一致 |
| 1 | `PrototypeQueuePanel.tsx:56` | `queueItem_error` | `.queueItemError` | ❌ 命名不一致 |
| 2 | `ExportMenu.tsx:263` | `exportStatus` | `.exportStatus` | ✅ 已确认定义在独立模块 |
| 2 | `ExportMenu.tsx:263` | `exportStatus_success` | `.exportStatus_success` | ✅ 已确认定义 |
| 2 | `ExportMenu.tsx:263` | `exportStatus_error` | `.exportStatus_error` | ✅ 已确认定义 |
| 2 | `ExportMenu.tsx:263` | `exportStatus_info` | `.exportStatus_info` | ✅ 已确认定义 |

> **注**：ExportMenu 和 SaveIndicator 各自有独立的 `*.module.css` 文件（`ExportMenu.module.css`、`SaveIndicator.module.css`），不受 canvas 主模块影响。

### 2.3 架构层问题

**问题 A**：`canvas.variables.css` 被 `@import` 引入

```css
/* canvas.module.css */
@import './canvas.variables.css';  /* 全局导入，不生成命名导出 */
```

CSS 变量（`--color-*`）本身是全局的，不受此影响。但若后续组件尝试以 `styles.variableName` 方式引用，会得到 undefined。

**问题 B**：CSS Modules 缺少 TypeScript 类型声明

项目 `tsconfig.json` 中无 CSS Modules 类型插件配置，导致：
- TypeScript 无法静态检查 `styles['className']` 是否存在
- `strict: true` + `noImplicitAny` 环境下，`styles[variable]` 类型为 `string | undefined`
- 构建时无警告，运行时才发现 undefined

**问题 C**：10 个子模块通过 @forward 聚合，类名查找路径过长

```
组件 → canvas.module.css (@forward) → canvas.context.module.css
                             → canvas.flow.module.css
                             → canvas.misc.module.css
                             → ...
```

调试时难以追踪某个类名来自哪个子模块。

---

## 3. 业务场景分析

### 3.1 目标用户

- **Canvas 用户**：使用三树并行画布（限界上下文树、业务流程树、组件树）进行可视化建模
- **开发团队**：维护 canvas 组件的前端工程师

### 3.2 影响评估

| 维度 | 影响 |
|------|------|
| 用户可见性 | 高 — PrototypeQueuePanel 队列项状态样式丢失（queued/generating/done/error 无区分） |
| 功能完整性 | 中 — 状态样式丢失不影响交互逻辑，但用户体验下降 |
| 开发效率 | 高 — CSS 类名 undefined 导致 UI 调试困难 |
| 技术债务 | 高 — 架构层问题不修复，后续 CSS 改动风险大 |

---

## 4. 技术方案选项

### 方案 A：逐个修复命名不一致（最小改动）

**思路**：识别所有 TSX/CSS 类名不匹配，逐一修正 TSX 或 CSS，使两边一致。

**具体操作**：
1. `PrototypeQueuePanel.tsx`：将 `queueItem_${statusVariant}` 改为 `queueItem${capitalize(statusVariant)}`（驼峰）
   - 或者在 CSS 中将 `.queueItemQueued` 等改为 `.queueItem_queued`（下划线）
2. 扫描所有 `styles[...]` 动态访问，确认每个引用的类名在 CSS 中存在
3. 在 `vitest.config.ts` 中添加 CSS Modules 类型插件

**优点**：
- 改动最小，仅涉及命名对齐
- 风险低，不改变架构
- 可快速验证

**缺点**：
- 没有解决 TypeScript 类型缺失问题
- 没有改善 CSS 模块查找路径过长问题
- 未来新增组件仍会遇到同样问题

---

### 方案 B：建立 CSS Modules 类型安全体系 + 命名规范（推荐）

**思路**：在修复具体类名不匹配的同时，引入 TypeScript CSS Modules 类型生成 + 命名规范，防止未来再次发生。

**具体操作**：

#### B1. 添加 CSS Modules 类型声明

在 `vibex-fronted/src/` 下创建全局 CSS Modules 声明：

```typescript
// src/types/css-modules.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
  export = classes;
}
```

#### B2. 为 canvas CSS 模块生成精确类型

创建 `src/components/canvas/canvas.module.css.d.ts`：

```typescript
// 自动生成或手动维护
declare const styles: {
  // canvas.base.module.css
  canvasContainer: string;
  tabBarWrapper: string;
  phaseProgressBar: string;
  phaseItem: string;
  phase_completed: string;
  phase_active: string;
  phase_pending: string;
  // canvas.context.module.css
  boundedContextTree: string;
  contextNodeList: string;
  nodeCard: string;
  nodeEditForm: string;
  nodeEditInput: string;
  nodeEditTextarea: string;
  nodeEditActions: string;
  // canvas.flow.module.css
  nodeTypeMarker: string;
  'nodeTypeMarker--start': string;
  'nodeTypeMarker--end': string;
  flowStepTypeIcon: string;
  'flowStepTypeIcon--branch': string;
  'flowStepTypeIcon--loop': string;
  'flowStepTypeIcon--normal': string;
  iconBtn: string;
  'iconBtn--edit': string;
  'iconBtn--delete': string;
  // canvas.export.module.css
  queueItem: string;
  queueItemQueued: string;      // 修正：camelCase
  queueItemGenerating: string;   // 修正：camelCase
  queueItemDone: string;        // 修正：camelCase
  queueItemError: string;       // 修正：camelCase
  // canvas.misc.module.css
  sortableTreeItem: string;
  boundedContextGroup: string;
  treeStatus: string;
  treeStatusConfirmed: string;
  // ... 其余类名
};
export = styles;
```

#### B3. 修复 PrototypeQueuePanel 命名

将组件改为使用 camelCase：
```tsx
// PrototypeQueuePanel.tsx
className={`${styles.queueItem} ${styles[`queueItem${capitalize(statusVariant)}`]}`}
```

#### B4. 规范化 CSS 类名命名约定

确立项目级规范：
- **BEM 风格**：`block__element--modifier`（组件独立文件用此风格）
- **Canvas 聚合模块**：使用 camelCase（如 `queueItemQueued`）
- 禁止混用命名风格

#### B5. 添加 CI 检查

在 `scripts/scan-css-conflicts.ts` 基础上扩展：
- 验证所有 `styles[...]` 访问的类名在对应 CSS 文件中存在
- 构建时失败，而非运行时才发现

**优点**：
- 从根本上解决 TypeScript 类型安全问题
- 防止未来再次发生
- 规范化整个 CSS 体系

**缺点**：
- 需要维护类型声明文件（手动或自动生成）
- 初期工作量较大

---

### 方案 C：重新设计 CSS 聚合架构（激进）

**思路**：放弃单一 `canvas.module.css` 聚合所有子模块的做法，改为组件直接导入各自需要的 CSS 模块。

**具体操作**：
1. 各 canvas 组件直接 `import styles from './canvas.<sub>.module.css'`（按需导入）
2. `canvas.module.css` 仅保留全局布局类（如 `canvasContainer`），其余全部移除
3. 删除 `canvas.module.css` 的 @forward 聚合

**优点**：
- 完全消除聚合层带来的"类名来自哪里"困惑
- 构建时即发现缺失的类名
- 符合"tree-shaking 友好"原则

**缺点**：
- **高风险**：涉及大量组件的 CSS import 重构
- 改动面积极大，可能影响 20+ 组件文件
- 回归测试工作量大
- 违背了 @forward 修复的初衷（之前拆分就是为了聚合）

---

## 5. 可行性评估

| 维度 | 方案 A（最小改动） | 方案 B（类型安全体系） | 方案 C（激进重构） |
|------|------------------|---------------------|-----------------|
| 技术难度 | 🟢 低 | 🟡 中 | 🔴 高 |
| 工期估算 | 0.5 人天 | 2 人天 | 5+ 人天 |
| 风险等级 | 🟢 低 | 🟡 中 | 🔴 高 |
| 长期收益 | 🟡 中 | 🟢 高 | 🟢 高 |
| 破坏性 | 无 | 极小 | 极大 |
| **推荐** | 快速止血 | ✅ 推荐 | ❌ 不推荐 |

**方案 B 是最优解**：在不破坏现有架构的情况下，解决类型安全问题并防止未来同类问题。

---

## 6. 风险矩阵

| # | 风险描述 | 可能性 | 影响 | 等级 | 缓解措施 |
|---|---------|--------|------|------|---------|
| R1 | 方案 B 类型声明文件需要手动维护，容易与实际 CSS 脱节 | 高 | 中 | 🟡 中 | 使用 `cpx` 或自定义脚本从 CSS 文件自动生成 `.d.ts` |
| R2 | 修复 `queueItem_xxx` 命名时遗漏 `statusVariant` 的某些值 | 低 | 高 | 🟡 中 | 添加 Vitest 测试覆盖所有状态变体 |
| R3 | @forward 聚合在生产构建与开发构建中行为不一致 | 低 | 高 | 🟡 中 | 添加 E2E 测试验证 UI 样式加载 |
| R4 | canvas.variables.css 的 @import 在某些构建工具下不 work | 中 | 低 | 🟡 中 | 改用 CSS Variables 全局注册，移除 @import |
| R5 | 修复期间引入新的 CSS 类名不一致 | 中 | 中 | 🟡 中 | CI 添加 `styles[...]` 访问验证 |

---

## 7. 工期估算（Effort Estimate）

| 阶段 | 工作项 | 工期 |
|------|--------|------|
| P1 | 确认并修复 PrototypeQueuePanel 的 `queueItem_xxx` 命名不一致 | 0.5h |
| P2 | 创建 CSS Modules 全局类型声明 + canvas.module.css 类型文件 | 2h |
| P3 | 添加 CI 脚本：扫描 `styles[...]` 访问与 CSS 类名不匹配 | 2h |
| P4 | 修复 `canvas.variables.css` @import 问题（可选） | 1h |
| P5 | 规范化文档：CSS 类名命名规范 | 0.5h |
| P6 | 验证：Vitest + E2E 测试覆盖 | 2h |
| **合计** | | **8h（1 人天）** |

---

## 8. 依赖分析

| 依赖 | 类型 | 说明 |
|------|------|------|
| Vitest | 测试框架 | 现有，需扩展测试用例 |
| TypeScript | 类型系统 | 现有，需添加 CSS Modules 类型声明 |
| `scripts/scan-css-conflicts.ts` | 现有脚本 | 可扩展以支持 `styles[...]` 验证 |
| Canvas 组件 TSX 文件 | 源码 | PrototypeQueuePanel.tsx 需修改 |

**无外部依赖**，可独立完成。

---

## 9. 验收标准

### 9.1 功能验收

- [ ] `PrototypeQueuePanel` 队列项的 `queued`/`generating`/`done`/`error` 状态样式正确显示
- [ ] 所有 `canvas.module.css` 导入的组件，在开发环境 DOM 检查无 "undefined" 类名警告
- [ ] `styles['nodeTypeMarker--start']`、`styles['iconBtn--edit']` 等 BEM 类名正确解析
- [ ] TypeScript 编译无 CSS Modules 相关错误

### 9.2 技术验收

- [ ] 创建 `canvas.module.css.d.ts`，覆盖所有 10 个子模块的类名
- [ ] CI 构建时运行 CSS 类名一致性扫描，无新增不匹配
- [ ] Vitest 测试覆盖 PrototypeQueuePanel 所有 4 个状态变体的样式类名

### 9.3 非功能性验收

- [ ] 修复不影响现有 UI 布局
- [ ] 构建产物大小无显著增加

---

## 10. 驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| 需求模糊无法实现 | ✅ 通过 | 问题定位清晰（命名不一致 + 类型缺失） |
| 缺少验收标准 | ✅ 通过 | 包含具体可测试条目（9.1-9.3） |
| 未执行 Research | ✅ 通过 | 已完成 learnings 检索 + git history 分析 |

---

## 11. 评审结论

**推荐：有条件推荐（Conditional）**

`@forward` 语法修复是正确的，但只解决了聚合层问题。真正的问题是 **组件层与 CSS 定义层的命名不一致 + TypeScript CSS Modules 类型缺失**。

方案 B（类型安全体系 + 命名修复）在最小破坏性下彻底解决问题，是当前最优解。建议优先执行 P1+P2（快速止血 + 类型声明），P3 后续迭代。

### 阻塞项

- 无阻塞项，可立即开始 P1 修复

### 待确认

- [ ] `canvas.variables.css` @import 是否真的造成问题（需实际浏览器验证）
- [ ] 是否需要为所有 canvas 子模块创建 .d.ts，或仅 canvas.module.css 主入口

---

*分析完成于 2026-04-12 02:00 (Asia/Shanghai)*
*Analyst Agent*
