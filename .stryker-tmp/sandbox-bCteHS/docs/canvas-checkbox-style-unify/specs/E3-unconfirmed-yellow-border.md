# Spec: E3 - 未确认节点黄色边框移除

## 1. 概述

**文件名**: `canvas.module.css`
**行数**: 629-632（需修改）
**工时**: 0.25h

## 2. 当前状态

```css
/* line 629-632 */
.nodeUnconfirmed {
  border-color: var(--color-warning);  /* 黄色边框 */
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.2);
}
```

**问题**: 当节点 `status === 'pending'` 时，`nodeUnconfirmed` 额外加黄色边框 + 阴影，与 type badge 颜色区分冲突，视觉冗余。

## 3. 修改方案

### 3.1 移除黄色边框

删除 `border-color: var(--color-warning)` 和 `box-shadow`，仅保留基础边框：
```css
.nodeUnconfirmed {
  /* 移除黄色边框和阴影，仅保留边框 */
  border: 2px solid var(--color-border);
}
```

### 3.2 保留节点区分

未确认节点的区分依赖：
- `nodeTypeBadge` 颜色（core=橙色/supporting=蓝色/generic=灰色）
- 确认反馈图标（绿色 ✓ vs 无图标）

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E3-AC1 | 渲染 pending 节点 | 有 `nodeUnconfirmed` class | `border-color` 不是 `var(--color-warning)` |
| E3-AC2 | 渲染 pending 节点 | 有 `nodeUnconfirmed` class | 无 `box-shadow` 橙色 |
| E3-AC3 | 渲染已确认节点 | `status === 'confirmed'` | 无 `nodeUnconfirmed` class |
| E3-AC4 | 视觉回归 | 对比修改前后 | pending 节点无黄色描边 |

## 5. 依赖

- 无外部依赖
- 内部依赖：`canvas.module.css` 的 `.nodeUnconfirmed` 样式
