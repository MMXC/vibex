# AGENTS.md — vibex-canvas CSS 开发约束

> **项目**: vibex-canvas  
> **日期**: 2026-04-11  
> **目的**: 防止 CSS @use/@forward 问题再次发生

---

## 1. CSS 聚合规则

### 1.1 聚合层必须使用 @forward

**规则**: `canvas.module.css` 作为 CSS 模块聚合层，**禁止使用 `@use`**。

**正确写法**:
```css
/* ✅ 正确 */
@forward './canvas.trees.module.css';
@forward './canvas.panels.module.css';
```

**错误写法**:
```css
/* ❌ 禁止 */
@use './canvas.trees.module.css';
```

**原因**: `@use` 导入的类名不在当前文件作用域内，无法通过父模块访问；`@forward` 才是 CSS Modules 多文件聚合的正确指令。

### 1.2 子模块独立使用 @use

子模块 CSS 文件（如 `canvas.trees.module.css`）内部可以使用 `@use` 导入其他 CSS 文件（变量、工具类等），不受此约束。

**正确写法**（子模块内）:
```css
/* canvas.trees.module.css */
@use './canvas.variables.css';

.nodeCard {
  color: var(--tree-color);
}
```

### 1.3 组件 CSS 导入路径

**规则**: Canvas 页面组件必须从聚合层导入样式，禁止直连子模块。

**正确写法**:
```tsx
// ✅ 正确
import styles from './canvas.module.css';
```

**禁止写法**:
```tsx
// ❌ 禁止
import panelStyles from './canvas.panels.module.css';
import treeStyles from './canvas.trees.module.css';
```

**原因**: 保持单一入口，便于后续 CSS 架构变更和类名管理。

**例外**: 独立组件（非 Canvas 页面内嵌）可独立使用 CSS Module，不受此约束。

---

## 2. 类名冲突处理

### 2.1 冲突检测

每次修改子模块 CSS 后，**必须**运行冲突扫描：

```bash
node scripts/scan-css-conflicts.ts
```

### 2.2 冲突解决

若检测到同名类名不同哈希值冲突，使用 `@forward` 别名前缀隔离：

```css
/* canvas.module.css */
@forward './canvas.trees.module.css' as trees--;
@forward './canvas.panels.module.css' as panels--;
```

组件中使用带前缀的类名：
```tsx
<div className={styles['trees--nodeCard']} />
```

**禁止使用** `@layer` 或 CSS 变量 hack 绕过类名冲突。

---

## 3. 新增子模块流程

在 `canvas.module.css` 中新增子模块时：

1. 在文件中添加 `@forward './canvas.{name}.module.css';`
2. 运行 `scripts/scan-css-conflicts.ts` 确认无冲突
3. 运行组件类名导出测试确认无回归
4. 更新本文件（AGENTS.md）路径列表

**路径列表**（当前已聚合的 10 个子模块）:
```
src/components/canvas/
├── canvas.module.css          ← 聚合层
├── canvas.base.module.css
├── canvas.toolbar.module.css
├── canvas.trees.module.css
├── canvas.panels.module.css
├── canvas.context.module.css
├── canvas.flow.module.css
├── canvas.components.module.css
├── canvas.thinking.module.css
├── canvas.export.module.css
└── canvas.misc.module.css
```

---

## 4. 验证检查清单

每次 CSS 修改后，执行以下检查：

- [ ] `grep "@use" canvas.module.css` 返回空（聚合层无 @use）
- [ ] `grep "@forward" canvas.module.css` 数量 ≥ 10
- [ ] `node scripts/scan-css-conflicts.ts` exit code === 0
- [ ] `pnpm build` 通过
- [ ] Canvas 页面类名无 undefined

---

## 5. 违规处理

| 违规类型 | 处理方式 |
|---------|---------|
| 聚合层使用 @use | PR Review 驳回，强制改为 @forward |
| 组件直连子模块 | PR Review 标记，要求重构到聚合层 |
| 新增子模块未更新 AGENTS.md | PR Review 标记，要求补充 |
| 冲突扫描失败未处理 | PR 阻塞，必须解决冲突 |

---

## 6. 参考文档

- **架构文档**: `docs/vibex-canvas/architecture.md`
- **实施计划**: `docs/vibex-canvas/IMPLEMENTATION_PLAN.md`
- **根因分析**: `docs/vibex-canvas/analysis.md`
- **历史教训**: `commit 8f2208e8` — CSS @use 问题引入 commit
- **历史教训**: `commit 7bb5ae5b` — CSS Module 选择器规则违规
