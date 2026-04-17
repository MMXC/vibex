# Spec: E2 - Sprint 1 用户体验统一

## 1. 概述

**工时**: 11-12h | **优先级**: P0
**依赖**: E1 (Sprint 0)

## 2. 修改范围

### 2.1 E2-S1: 三树 checkbox 位置统一

**文件**: 
- `BoundedContextTree.tsx`
- `ComponentTree.tsx`
- `BusinessFlowTree.tsx`

**方案**: 
- 删除 ContextTree 双 checkbox，合并为 1 个
- ComponentTree checkbox 前移到 type badge 前
- FlowTree 保持现状（已正确）

### 2.2 E2-S2: 确认状态绿色 ✓ 反馈

**文件**: `canvas.module.css`

```css
.confirmedBadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--color-success);
  font-size: 12px;
  font-weight: bold;
  margin-right: 4px;
}
```

### 2.3 E2-S3: 移除 nodeUnconfirmed 黄色边框

**文件**: `canvas.module.css`

```css
.nodeUnconfirmed {
  border: 2px solid var(--color-border);
  /* 删除: border-color: var(--color-warning) */
  /* 删除: box-shadow */
}
```

### 2.4 E2-S4: window.confirm 替换 toast

**搜索**: `packages/canvas/src/`
**替换**: toast 确认组件

### 2.5 E2-S5: UI 变更影响范围清单

**文件**: `CONTRIBUTING.md`

```markdown
## UI 变更检查清单

1. [ ] CSS 修改影响索引（grep 关键词）
2. [ ] 视觉回归测试截图对比
3. [ ] 三树组件一致性检查
4. [ ] E2E 测试覆盖（如涉及交互）
```

## 3. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E2-AC1 | 渲染 ContextTree | status = confirmed | 1 checkbox + 绿色 ✓ |
| E2-AC2 | 渲染 pending 节点 | nodeUnconfirmed | 无警告色边框 |
| E2-AC3 | grep window.confirm | canvas/src | = 0 |
| E2-AC4 | 检查 CONTRIBUTING | UI checklist | 存在且完整 |

## 4. DoD

- [ ] 三树 checkbox 均在 type badge 前
- [ ] 已确认节点显示绿色 ✓
- [ ] 无 nodeUnconfirmed 黄色边框
- [ ] window.confirm = 0
- [ ] UI 变更 checklist 存在
