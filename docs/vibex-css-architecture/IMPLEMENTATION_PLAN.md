# Vibex Canvas CSS 聚合架构 — 实施计划

**任务**: vibex-css-architecture/design-architecture
**阶段**: Phase 1 — Technical Design
**产出时间**: 2026-04-12
**基于**: PRD (prd.md) + Architecture (architecture.md)

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 2026-04-12

---

## 1. 问题帧

- **根因 A**: `PrototypeQueuePanel.tsx:56` 用 `styles['queueItem_queued']`（snake_case），CSS 定义为 `.queueItemQueued`（camelCase），运行时 undefined
- **根因 B**: 无 CSS Modules TypeScript 类型声明，TS 无法静态检测类名不匹配
- **根因 C**: 无 CI 扫描在构建时发现类名不匹配，只有运行时才发现
- **总工期**: 7h（P1: 1h / P2: 2.5h / P3: 3.5h）

---

## 2. 实施阶段

### Phase 1: 快速止血（1h） ✅

#### Unit 1: E1-S1 — 修复 PrototypeQueuePanel 队列项类名引用 ✅
#### Unit 2: E2-S1 — CSS Modules 全局类型声明 ✅
#### Unit 3: E3-S1 — CSS 命名规范文档 ✅
#### Unit 4: E4-S1 — Status variant 单元测试 ✅

**Commit**: 978b25d8 — 4 files changed

**Goal**: 修复 `styles['queueItem_${statusVariant}']` → `styles['queueItem${Capitalize(statusVariant)}']`

**Files**:
- Modify: `vibex-fronted/src/components/canvas/panels/PrototypeQueuePanel.tsx` (line 56)
- Modify: `vibex-fronted/src/components/canvas/panels/__tests__/PrototypeQueuePanel.test.tsx`（如已有）

**Approach**:
```tsx
// 修改前 (line 56)
<li className={`${styles.queueItem} ${styles[`queueItem_${statusVariant}`]}`}>

// 修改后：首字母大写辅助函数
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
<li className={`${styles.queueItem} ${styles[`queueItem${capitalize(statusVariant)}]}`}>
```

**Test scenarios**:
- Happy path: `queued` → `queueItemQueued` class applied
- Happy path: `generating` → `queueItemGenerating` class applied
- Happy path: `done` → `queueItemDone` class applied
- Happy path: `error` → `queueItemError` class applied
- Edge case: `capitalize('queued')` → `'Queued'` (首字母大写)
- Edge case: `capitalize('error')` → `'Error'`

**Verification**: Vitest 通过 + Playwright E2E 验证 DOM 无 undefined 类名

---

#### Unit 2: E2-S1 — 创建 CSS Modules 全局类型声明

**Goal**: 为所有 `*.module.css` 提供基础类型，消除 TS `cannot find module` 错误

**Files**:
- Create: `vibex-fronted/src/types/css-modules.d.ts`

**Approach**:
```typescript
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
  export = classes;
}
```

**Test scenarios**:
- `import styles from './Any.module.css'` → tsc 不报 `cannot find module`
- `const x: string = styles.anyKey` → TS 推断为 `string`（非 `string | undefined`）

**Verification**: `tsc --noEmit` 对所有现有 CSS Modules imports 无报错

---

### Phase 2: 类型安全体系（2.5h） ✅

#### Unit 3: E2-S2 — 创建 canvas.module.css.d.ts 枚举声明

**Goal**: 枚举 10 个子模块全部类名，提供精确类型检查

**Files**:
- Create: `vibex-fronted/src/components/canvas/canvas.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.base.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.export.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.flow.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.context.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.toolbar.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.trees.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.components.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.panels.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.thinking.module.css.d.ts`
- Create: `vibex-fronted/src/components/canvas/canvas.misc.module.css.d.ts`

**Approach**: 从现有 CSS 文件提取所有 `.className` 定义，逐一声明。优先级按 canvas.export > canvas.flow > canvas.context > 其余。

**Test scenarios**:
- `styles.queueItemQueued` → TS 推断为 `string`
- `styles['nodeTypeMarker--start']` → TS 推断为 `string`
- `styles['不存在的类名']` → 触发 TS 错误（或由 scan-css-conflicts.ts 检测）

**Verification**: `tsc --noEmit` 对 canvas 组件无 CSS 相关 TS 错误

---

#### Unit 4: E3-S1 — 编写 CSS 类名命名规范文档

**Goal**: 确立 canvas 模块 camelCase / 独立组件 BEM 风格规范

**Files**:
- Create: `docs/vibex-css-architecture/NAMING_CONVENTION.md`

**Content**:
```markdown
# Canvas CSS 类名命名规范

## canvas 子模块（canvas.*.module.css）
- 动态类名：camelCase，首字母大写（用于 bracket notation）
  - ✅ `queueItem${capitalize(status)}` → `queueItemQueued`
  - ❌ `queueItem_${status}` → `queueItem_queued`
- 静态类名：camelCase 或 kebab-case（BEM）均可，遵循历史约定

## 独立组件（各自 *.module.css）
- 全部使用 kebab-case（BEM）
  - ✅ `.export-status`, `.export-status_success`
  - ❌ `.exportStatus`

## 动态类名辅助函数
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
```

**Verification**: 文档创建后纳入 AGENTS.md 开发约束

---

### Phase 3: CI + 测试（3.5h）

#### Unit 5a: E2-S3a — 静态字面量检测脚本

**Goal**: 检测 `styles['xxx']` 字面量中 `xxx` 与 CSS 定义不匹配

**Files**:
- Create: `scripts/scan-tsx-css-refs.ts`（**注意**：不使用现有 scan-css-conflicts.ts，避免同名歧义）

**Approach**:
```
输入：所有 .tsx 文件 + 所有 .module.css 文件
处理：
1. 建立 import 映射：哪个 TSX 文件导入了哪个 CSS 模块
2. 扫描 TSX 中所有 styles['xxx'] 字面量访问
3. 提取 CSS 中实际定义的类名集合（排除注释行）
4. 对每个 styles['xxx']，查询对应 CSS 模块是否有定义
5. 报告不在 CSS 中的类名引用
6. 已知 BEM 白名单：
   - iconBtn--edit, iconBtn--delete, iconBtn--add
   - nodeTypeMarker--start, nodeTypeMarker--end
   - statBadge--info, statBadge--success, statBadge--error
输出：exit code 1（如发现问题）+ 详细报告
```

**Test scenarios**:
- `styles['queueItem_queued']` → 报错："queueItem_queued not defined"
- `styles['queueItemQueued']` → 通过
- `styles['iconBtn--edit']` → 通过（白名单）
- `styles['statBadgeInfo']` → 通过（BEM 直接拼接，保留）

**Verification**: 运行脚本，本地复现 `queueItem_queued` 报错

**Scope**：只检测静态字面量 `styles['xxx']`。模板变量检测（E2-S3b）作为后续优化，不在本项目范围内。

---

#### Unit 6: E4-S1 — Vitest 单元测试覆盖

**Goal**: 为 4 个状态变体编写单元测试

**Files**:
- Modify/Create: `vibex-fronted/src/components/canvas/panels/__tests__/PrototypeQueuePanel.test.tsx`

**Test scenarios**:
- `queued` 状态 → `queueItemQueued` class applied
- `generating` 状态 → `queueItemGenerating` class applied
- `done` 状态 → `queueItemDone` class applied
- `error` 状态 → `queueItemError` class applied
- `capitalize` 函数边界：`''` → `''`, `'a'` → `'A'`

**Verification**: `npm run test -- --run` 通过

---

#### Unit 7: E4-S2 — E2E 测试验证

**Goal**: Playwright 验证队列项状态样式正确渲染

**Files**:
- Create: `vibex-fronted/tests/e2e/canvas-queue-styles.spec.ts`

**Test scenarios**:
- 进入 canvas 页面，队列项 `.queueItemQueued` 样式渲染正确（background 非 transparent）
- `.queueItemGenerating` 动画状态可见
- `.queueItemDone` 绿色样式可见
- `.queueItemError` 红色样式可见
- Console 无 undefined className 警告

**Verification**: `npx playwright test canvas-queue-styles.spec.ts` 通过

---

## 3. 依赖关系

```
E1-S1 (PrototypeQueuePanel 修复)
  └─ E4-S1 (Vitest) 依赖 E1-S1 修复完成
E2-S1 (全局类型声明)
  └─ E2-S2 (canvas 枚举) 依赖 E2-S1 存在
E2-S2 (canvas 类型枚举)
  └─ E2-S3a (CI 扫描) 可并行
E3-S1 (命名规范) 可并行
E4-S2 (E2E 测试) 依赖 E1-S1 + E2-S3
```

---

## 4. 验收标准汇总

| Epic | Story | 验收标准 | DoD |
|------|-------|---------|-----|
| E1 | E1-S1 | `queueItemQueued/Generating/Done/Error` 四态样式正确显示 | Vitest + Playwright 通过 |
| E2 | E2-S1 | `tsc --noEmit` 无 CSS Modules 报错 | tsc 0 错误 |
| E2 | E2-S2 | `styles['queueItemQueued']` TS 推断为 `string` | tsc 通过 |
| E2 | E2-S3a | `scan-tsx-css-refs.ts` 检测 `queueItem_queued` 报错 | 脚本 exit code 1 |
| E3 | E3-S1 | NAMING_CONVENTION.md 创建 | 文件存在 |
| E4 | E4-S1 | 4 个状态变体 Vitest 断言通过 | `npm run test` 通过 |
| E4 | E4-S2 | Playwright E2E 验证样式渲染正确 | `playwright test` 通过 |

---

## 5. 风险与回滚

| 风险 | 缓解 | 回滚 |
|------|------|------|
| canvas.module.css.d.ts 枚举不完整 | 实施时先用脚本提取所有未注释类名，再枚举 | 删除 .d.ts 文件降级到全局声明 |
| scan-tsx-css-refs.ts 误报 | 维护白名单（已知 BEM 变体），补充 `.statBadgeInfo` 等直接拼接模式 | 注释掉 exit code 1 行，改为 warn-only |
| 注释掉的 CSS 类名被枚举 | 扫描 CSS 时过滤 `/*...*/` 注释块 | 手动剔除注释掉的类名 |
| 路径不一致（vibex-fronted/src/ vs ./src/） | 统一使用 `./src/...`（相对于 vibex-fronted/ 根目录） | — |
