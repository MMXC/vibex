# AGENTS.md — Vibex Canvas CSS 聚合架构

**任务**: vibex-css-architecture/design-architecture
**版本**: 2026-04-12

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: 待分配
- **执行日期**: 2026-04-12

---

## 1. 开发约束

### 1.1 CSS 类名引用规范

#### 静态访问（推荐优先）

```tsx
import styles from './canvas.export.module.css';
// ✅ 使用点语法，TS 可推断类型
<div className={styles.queueItemQueued}>
```

#### 动态访问（需要首字母大写）

```tsx
// ✅ 正确：首字母大写
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const className = styles[`queueItem${capitalize(statusVariant)}`];

// ❌ 禁止：snake_case
const className = styles[`queueItem_${statusVariant}`]; // ← 这是 bug 根源
```

**规则**：
- canvas 子模块（`canvas.*.module.css`）的动态类名必须使用首字母大写 camelCase
- 禁止在 CSS Modules 动态访问中使用 `snake_case`
- 独立组件 CSS（各自 `*.module.css`）使用 kebab-case（BEM）

#### 辅助函数

```typescript
// ✅ 放在组件文件顶部或 utils 文件中
const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
```

### 1.2 CSS Modules 类型声明

- 所有新增 `.module.css` 文件无需手动添加类型声明（全局 `src/types/css-modules.d.ts` 兜底）
- canvas 子模块已有枚举类型声明（`canvas.*.module.css.d.ts`），修改 CSS 时同步更新
- 新增 canvas 子模块类名时，同步更新对应的 `.d.ts` 文件

### 1.3 CSS 聚合层

- **不要**在 `canvas.module.css` 中使用 `@use` 导入子模块——使用 `@forward`
- 不要在 `canvas.module.css` 中 `@import` 非变量文件（变量文件除外）
- 子模块间共享变量用 `canvas.variables.css` + CSS 自定义属性

### 1.4 CI 扫描

- 新增 `scripts/scan-tsx-css-refs.ts`（检测 `styles[...]` 引用与 CSS 定义匹配），在 `pre-submit-check.sh` 中调用
- **注意**：`scan-css-conflicts.ts` 是检测同名冲突的现有脚本，两者共存，不混淆
- 白名单（BEM 变体，直接拼接模式）：`iconBtn--*`, `nodeTypeMarker--*`, `statBadge--*`
- ⚠️ CI 扫描实现前，禁止事项 1~3 为软约束，依赖 code review 把关

### 1.5 测试覆盖

- 修改 `PrototypeQueuePanel.tsx` 必须同步更新 `__tests__/PrototypeQueuePanel.test.tsx`
- 4 个状态变体（queued/generating/done/error）必须有明确的类名断言

---

## 2. 代码审查检查单

修改 canvas CSS 相关文件时，Reviewer 检查：

- [ ] 动态类名引用使用首字母大写 camelCase，无 snake_case
- [ ] CSS 定义与组件引用命名风格一致（对照 NAMING_CONVENTION.md）
- [ ] 修改 canvas 子模块后，同步更新 `.d.ts` 文件
- [ ] Vitest 单元测试覆盖新增的类名引用路径
- [ ] `npm run build` 成功
- [ ] `npx tsc --noEmit` 无新增 CSS 相关错误
- [ ] `scripts/scan-tsx-css-refs.ts` exit code 0（E2-S3a 完成后）

---

## 3. 禁止事项

| 禁止 | 理由 |
|------|------|
| 在 canvas 子模块动态访问中使用 `snake_case` | 已造成队列项样式全部丢失 |
| 在 `canvas.module.css` 使用 `@use` 而非 `@forward` | `@use` 不导出类名到聚合层 |
| 绕过 `scan-tsx-css-refs.ts` CI 检查 | 构建时发现问题比运行时便宜 10x |
| 修改 CSS 不更新 `.d.ts` | TS 类型与实际不同步会误导开发者 |

---

## 4. 相关文档

| 文档 | 路径 |
|------|------|
| 架构设计 | `docs/vibex-css-architecture/architecture.md` |
| 实施计划 | `docs/vibex-css-architecture/IMPLEMENTATION_PLAN.md` |
| PRD | `docs/vibex-css-architecture/prd.md` |
| 需求分析 | `docs/vibex-css-architecture/analysis.md` |
| 命名规范 | `docs/vibex-css-architecture/NAMING_CONVENTION.md` |
| Spec（E1-S1） | `docs/vibex-css-architecture/specs/spec-E1-S1.md` |
| Spec（E2-S1） | `docs/vibex-css-architecture/specs/spec-E2-S1.md` |
| Spec（E2-S2） | `docs/vibex-css-architecture/specs/spec-E2-S2.md` |
| Spec（E2-S3） | `docs/vibex-css-architecture/specs/spec-E2-S3.md` |
| Spec（E3-S1） | `docs/vibex-css-architecture/specs/spec-E3-S1.md` |
| Spec（E4-S1） | `docs/vibex-css-architecture/specs/spec-E4-S1.md` |
| Spec（E4-S2） | `docs/vibex-css-architecture/specs/spec-E4-S2.md` |
