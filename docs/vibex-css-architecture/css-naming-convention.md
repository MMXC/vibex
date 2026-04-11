# CSS 类名命名规范

> 适用于 Canvas 聚合模块及独立组件 CSS Module 文件。

---

## 规则 1：Canvas 聚合模块统一使用 camelCase

通过 `canvas.module.css` 的 `@forward` 聚合的子模块，**统一使用 camelCase**。

✅ 正确：
```css
/* canvas.export.module.css */
.queueItemQueued { }
.queueItemGenerating { }
.exportStatusSuccess { }
```

❌ 错误：
```css
/* canvas.export.module.css */
.queueItem_queued { }     /* 禁止 snake_case */
.export_status_success { } /* 禁止 kebab-case */
```

---

## 规则 2：独立组件 CSS 文件推荐 BEM 风格

拥有独立 `.module.css` 文件的组件（如 ExportMenu、SearchDialog），推荐使用 BEM 风格。

✅ 正确：
```css
/* ExportMenu.module.css */
.exportStatus { }
.exportStatus--success { }
.exportStatus--error { }
.exportStatus__icon { }
```

❌ 错误：
```css
/* ExportMenu.module.css */
.exportStatusSuccess { } /* 与聚合模块风格不一致 */
.export-status { }
```

---

## 规则 3：TypeScript 访问必须通过 `styles['className']`

禁止硬编码类名字符串，必须通过 CSS Module 访问对象访问。

✅ 正确：
```tsx
styles['queueItemQueued']
const cls = 'queueItemQueued';
styles[cls]
```

❌ 错误：
```tsx
className="queueItemQueued"           // 硬编码，IDE 无法追踪
className={styles.queueItemQueued}    // 编译时静态属性，不支持动态键
```

---

## 规则 4：新增类名同步更新 .d.ts

新增 CSS 类名后，同步更新对应的 `.module.css.d.ts` 文件或确保全局类型声明覆盖。

---

## 规则 5：状态变体命名模式

Canvas 聚合模块中，状态变体统一采用 `前缀 + PascalCase状态名` 模式：

| 状态 | 类名 | 说明 |
|------|------|------|
| 等待中 | `queueItemQueued` | 状态名首字母大写 |
| 生成中 | `queueItemGenerating` | 同上 |
| 完成 | `queueItemDone` | 同上 |
| 失败 | `queueItemError` | 同上 |

TSX 中动态拼接：`styles[\`queueItem${capitalize(statusVariant)}\`]`

---

## 违反此规范的影响

- snake_case 类名 → CSS Module 访问返回 `undefined` → 样式丢失
- 硬编码字符串 → 无法通过 IDE / TypeScript 追踪引用
- 风格不统一 → 代码审查摩擦增加

---

## 参考

- [CSS Modules 官方文档](https://github.com/css-modules/css-modules)
- Vitest 测试示例：`src/components/canvas/__tests__/PrototypeQueuePanel.test.tsx`
