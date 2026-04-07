# Spec: E4 - CSS 清理

## 1. 概述

**工时**: 0.5h | **优先级**: P0
**依赖**: E1 + E2

## 2. 修改文件

`canvas.module.css`

## 3. 清理内容

### 3.1 删除或废弃

```css
/* 删除 */
.nodeTypeBadge { ... }
.confirmedBadge { ... }
.selectionCheckbox { ... }  /* 如果不再使用 */
/* 或标记 @deprecated */
.nodeTypeBadge {
  /* @deprecated: type 信息通过 border 颜色表达 */
}
```

### 3.2 保留

```css
.nodeCheckbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E4-AC1 | 搜索 CSS | .nodeTypeBadge | = 0 或 @deprecated |
| E4-AC2 | 搜索 CSS | .confirmedBadge | = 0 或 @deprecated |
| E4-AC3 | 页面渲染 | 三树卡片 | 样式正常 |

## 5. DoD

- [ ] .nodeTypeBadge 已删除或 @deprecated
- [ ] .confirmedBadge 已删除或 @deprecated
- [ ] 页面样式无 regression
