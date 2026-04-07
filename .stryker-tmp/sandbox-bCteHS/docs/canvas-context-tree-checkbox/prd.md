# PRD: canvas-context-tree-checkbox — 上下文树卡片 Checkbox 恢复

**Agent**: PM
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 已完成

---

## 1. 执行摘要

### 背景

BoundedContextTree 卡片 header 的 checkbox 在 Epic 3 中被移除（改用 Ctrl+Click 多选），但用户习惯 checkbox 操作，Ctrl+Click 对新用户不够直观。

### 目标

恢复 BoundedContextTree 卡片标题左侧 checkbox，与 BusinessFlowTree 行为保持一致。

### 成功指标

| 指标 | 目标 | 测量方式 |
|------|------|----------|
| checkbox 可见性 | 100% | E2E 截图验证 |
| 点击功能 | 正常选中/取消 | E2E 点击测试 |

---

## 2. Epic 拆分

### Epic 1: Checkbox 恢复

**工时**: 1h | **优先级**: P0 | **依赖**: 无

#### 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | Checkbox 渲染 | BoundedContextTree 卡片 header 恢复 checkbox | `expect(checkboxVisible).toBe(true)` | 【需页面集成】 |
| F1.2 | 点击选中/取消 | 点击 checkbox 切换选中状态 | `expect(selected).toBe(true\|false)` | 【需页面集成】 |
| F1.3 | Ctrl+Click 兼容 | Ctrl+Click body 仍可多选 | `expect(ctrlClickMultiSelect).toBe(true)` | 【需页面集成】 |
| F1.4 | 选中高亮 | 选中卡片显示 selected 样式 | `expect(selectedStyle).toBe(true)` | 【需页面集成】 |
| F1.5 | E2E 覆盖 | Playwright 测试 checkbox 交互 | `expect(testPassed).toBe(true)` | ❌ |

#### DoD

- [ ] BoundedContextTree 卡片 header 有 checkbox
- [ ] 点击 checkbox 切换选中状态
- [ ] Ctrl+Click body 仍可多选（兼容）
- [ ] Playwright E2E 覆盖 checkbox 场景

---

## 3. 验收标准（汇总）

| Story | expect() 断言 |
|-------|--------------|
| F1.1 | `expect(checkboxVisible).toBe(true)` |
| F1.2 | `expect(selected).toBe(true)` |
| F1.3 | `expect(ctrlClickMultiSelect).toBe(true)` |
| F1.4 | `expect(selectedStyle).toBe(true)` |

---

## 4. DoD

### 全局 DoD

1. **功能完整**: checkbox 可正常选中/取消
2. **向后兼容**: Ctrl+Click body 仍可用
3. **测试覆盖**: Playwright E2E 覆盖

### 专属 DoD

| Epic | 专属 DoD |
|------|----------|
| E1 | Checkbox 可见 + 点击可用 + Ctrl+Click 兼容 + E2E 通过 |

---

## 5. 技术方案

**方案 A（推荐）**：
```tsx
<div className={styles.nodeCardHeader}>
  {onToggleSelect && (
    <input
      type="checkbox"
      className={styles.nodeCardCheckbox}
      checked={selected ?? false}
      onChange={() => onToggleSelect(node.nodeId)}
      aria-label={`选择上下文 ${node.name}`}
      onClick={(e) => e.stopPropagation()}
    />
  )}
</div>
```

---

*PRD 版本: v1.0 | 生成时间: 2026-04-01 23:42 GMT+8*
