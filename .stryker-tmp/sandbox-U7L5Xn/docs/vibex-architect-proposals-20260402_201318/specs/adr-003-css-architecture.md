# Spec: ADR-003 CSS 架构规范

**ADR**: ADR-003  
**状态**: 待实施  
**Sprint**: Sprint 0（伴随 D-E1/E2 实施）

---

## 1. 背景

**问题**: CSS Modules 分散，`.nodeTypeBadge`、`.confirmedBadge` 等废弃样式未清理，命名不规范。

---

## 2. 废弃样式清理

### 阶段 1: 删除废弃样式

| 废弃样式 | 替代方案 | 状态 |
|---------|---------|------|
| `.nodeTypeBadge` | border 颜色 | 待删除 |
| `.confirmedBadge` | border 颜色 | 待删除 |
| `.selectionCheckbox` | 绝对定位替代方案 | 待评估 |

### 2.1 清理步骤

```bash
# 全局搜索确认无引用
grep -r "\.nodeTypeBadge" --include="*.tsx" --include="*.ts" --include="*.css" src/
grep -r "\.confirmedBadge" --include="*.tsx" --include="*.ts" --include="*.css" src/
grep -r "\.selectionCheckbox" --include="*.tsx" --include="*.ts" --include="*.css" src/

# 确认无引用后删除对应 CSS Modules 文件
```

---

## 3. CSS 命名规范

### 规范: `{component}-{element}-{state}`

| 示例 | 说明 |
|------|------|
| `.boundedContext-nodeCard--unconfirmed` | BoundedContext 组件，nodeCard 元素，unconfirmed 状态 |
| `.boundedContext-nodeCard--confirmed` | BoundedContext 组件，nodeCard 元素，confirmed 状态 |
| `.boundedContext-checkbox--checked` | BoundedContext 组件，checkbox 元素，checked 状态 |
| `.flowTree-panel--collapsed` | FlowTree 组件，panel 元素，collapsed 状态 |
| `.contextPanel-treeNode--selected` | ContextPanel 组件，treeNode 元素，selected 状态 |

### 3.1 命名规则

- **组件前缀**: 使用 PascalCase 组件名（如 `BoundedContext`, `FlowTree`）
- **元素**: camelCase（如 `nodeCard`, `checkbox`）
- **状态**: kebab-case 修饰符（如 `unconfirmed`, `checked`）

### 3.2 CSS Modules 示例

```tsx
// BoundedContextCard.module.css
.boundedContext-nodeCard {
  border: 2px solid transparent;
  transition: border-color 0.2s;
}

.boundedContext-nodeCard--unconfirmed {
  border-color: var(--color-warning);
}

.boundedContext-nodeCard--confirmed {
  border-color: var(--color-success);
}

.boundedContext-checkbox {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.boundedContext-checkbox--checked {
  background-color: var(--color-primary);
}
```

---

## 4. 组件状态映射

| 组件 | 状态枚举 | 视觉表现 |
|------|---------|---------|
| BoundedContext | `unconfirmed` / `confirmed` / `generating` | border 颜色 |
| FlowNode | `idle` / `selected` / `generating` | 背景色 + checkbox |
| ComponentNode | `idle` / `selected` | 背景色 + checkbox |
| Panel | `expanded` / `collapsed` | 宽度 0 / 正常 |

---

## 5. 验收标准

- [ ] 废弃样式（`.nodeTypeBadge`、`.confirmedBadge`）已删除
- [ ] `.selectionCheckbox` 评估后决定保留或删除
- [ ] 新样式符合命名规范 `{component}-{element}-{state}`
- [ ] CSS Modules 文件结构清晰（一个组件一个 .module.css）
- [ ] 全局搜索确认无废弃样式残留

---

## 6. 实施计划

| 阶段 | 内容 | Sprint |
|------|------|--------|
| 阶段1 | 删除废弃样式（.nodeTypeBadge, .confirmedBadge） | Sprint 0 |
| 阶段2 | 评估 .selectionCheckbox 决定去留 | Sprint 0 |
| 阶段3 | 新样式采用命名规范 | Sprint 0 伴随 D-E1/E2 |
| 阶段4 | 审核其他组件 CSS，逐步迁移 | Sprint 1+ |
