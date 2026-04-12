# Spec: E3-S1 — 编写 CSS 类名命名规范文档

## 文件

- **新建**: `docs/vibex-css-architecture/css-naming-convention.md`

## 目的

建立统一的 CSS 类名命名规范，防止未来命名不一致问题重复出现。

## 规范内容

### 规则 1：Canvas 聚合模块（@forward 聚合）

通过 `canvas.module.css` 的 `@forward` 聚合的子模块，**统一使用 camelCase**。

✅ 正确：
```css
/* canvas.export.module.css */
.queueItemQueued { }
.queueItemGenerating { }
```

❌ 错误：
```css
/* canvas.export.module.css */
.queueItem_queued { }  /* 禁止 snake_case */
```

### 规则 2：独立组件 CSS 文件

拥有独立 `.module.css` 文件的组件（如 ExportMenu、SearchDialog），推荐使用 BEM 风格。

✅ 正确：
```css
/* ExportMenu.module.css */
.exportStatus { }
.exportStatus--success { }
```

❌ 错误：
```css
/* ExportMenu.module.css */
.exportStatusSuccess { }  /* 与聚合模块风格不一致 */
```

### 规则 3：TypeScript 访问规范

禁止硬编码类名字符串，必须通过 `styles['className']` 访问（支持 IDE 补全和重构）。

✅ 正确：
```tsx
styles['queueItemQueued']
const cls = 'queueItemQueued';
styles[cls];
```

❌ 错误：
```tsx
className="queueItemQueued"  // 硬编码，IDE 无法追踪
```

### 规则 4：新增类名同步更新 .d.ts

新增 CSS 类名后，同步更新对应的 `.module.css.d.ts` 文件。

## DoD 检查单

- [ ] 文档存在
- [ ] 包含至少 3 个正确/错误对比示例
- [ ] 示例覆盖 camelCase 和 BEM 两种场景
- [ ] PR reviewer 可引用此文档要求不符合规范的修改
