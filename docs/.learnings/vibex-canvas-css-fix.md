# Learnings — vibex-canvas CSS 类名解析修复

**项目**: vibex-canvas  
**完成日期**: 2026-04-12  
**经验类型**: CSS 架构 / CSS Module / 子模块聚合

---

## 问题回顾

Canvas 页面 13 个组件样式全部失效，类名解析为 `undefined`。

### 根因

`src/styles/canvas.module.css` 使用 `@use` 指令聚合 11 个子模块：

```css
/* 错误：@use 使类名不可从父模块访问 */
@use './canvas.panels.module.css';
@use './canvas.trees.module.css';
```

组件 import 时引用子模块类名：

```tsx
import canvasStyles from '@/styles/canvas.module.css';
// canvasStyles.treePanel === undefined ❌
```

### 修复方案

```css
/* 正确：@forward 将子模块类名前向暴露 */
@forward './canvas.panels.module.css';
@forward './canvas.trees.module.css';
```

**影响范围**：11 个子模块、13 个组件

---

## 关键经验

### 1. CSS `@use` vs `@forward` 的本质差异

| 指令 | 行为 | 类名访问方式 |
|------|------|------------|
| `@use` | 命名空间导入，类似 ESM `import` | `as ns.$classname` |
| `@forward` | 前向暴露，保持原类名 | 直接 `.classname` |

**教训**：聚合文件（relay/barrel file）必须用 `@forward`，不能用 `@use`。混淆两者会导致灾难性的运行时样式丢失。

### 2. 类名冲突扫描的必要性

Epic2 发现子模块间存在同名类名（如 `header`、`title`），@forward 全部暴露后可能产生覆盖。

**经验**：子模块拆分时必须建立命名空间规范（如 `canvas-panel-header` vs `canvas-toolbar-header`），或在拆分前做类名冲突扫描。

### 3. dev commit 规范

每个 Epic 都需要独立的 dev commit，不能用 deploy/staging commit 代替：

- ✅ Epic1: `feat(canvas): CSS @use → @forward 恢复 13 组件类名导出`
- ✅ Epic2: `test(canvas): Epic2 F2.2/F2.3 E2E 验证测试`
- ✅ Epic3: `feat(canvas): Epic3 F3.1/F3.2 build & deploy verification`

### 4. 测试既有缺陷识别

npm test 有 1 个既有失败（ExportControls html2canvas mock 问题），非本次引入。新增测试均通过。

---

## 技术债务记录

- ExportControls 的 html2canvas mock 配置有问题，需要单独修复
- 子模块类名命名规范未建立，未来拆分需预防同名冲突

---

## 可复用的模式

1. **CSS Module 子模块聚合**：始终用 `@forward`，建立 `/styles/` 目录规范
2. **样式问题排查路径**：`HTML class="undefined"` → 检查 CSS Module 导入方式 → 检查聚合文件指令
3. **Epic 完成标准**：dev commit + npm test + changelog + 远程推送，缺一不可
