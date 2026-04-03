# 需求分析：vibex-flowtree-step-overflow

## 1. 问题概述

### 业务场景
用户在 Vibex 画布页展开业务流程卡片（FlowCard）时，内部的步骤列表（StepsList）被固定高度裁剪，只能显示约 2 张步骤卡片，即使实际有更多步骤。

### 根因定位

| 组件 | CSS 属性 | 影响 |
|------|---------|------|
| `.flowCard` | `overflow: hidden` | 虚线框容器截断所有溢出内容 |
| `.stepsList` | `max-height: 300px; overflow-y: auto` | 步骤列表最大高度 300px，超出部分隐藏 |

**计算**：每个 `SortableStepRow` 约 50-70px，300px ÷ 140px ≈ **2 个步骤卡片**，与问题描述吻合。

**代码位置**：`vibex-fronted/src/components/canvas/canvas.module.css`

```diff
// .flowCard (line ~1181)
- overflow: hidden;

// .stepsList (line ~1287-1293)
- max-height: 300px;
- overflow-y: auto;
```

---

## 2. 技术方案

### 方案 A：移除高度约束（已实施，推荐）

**修改文件**：`vibex-fronted/src/components/canvas/canvas.module.css`

```css
/* .flowCard */
.flowCard {
  /* 移除 overflow: hidden */
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  transition: border-color 0.2s ease;
  position: relative;
}

/* .stepsList */
.stepsList {
  border-top: 1px solid var(--color-border);
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  /* 移除 max-height 和 overflow-y */
}
```

**优点**：改动极小（3 行删除），无副作用，虚线框自然随内容扩展
**缺点**：步骤过多时可能拉长卡片，建议在步骤 > 10 时考虑虚拟滚动（后续优化）

### 方案 B：滚动容器隔离（备选）

将 `overflow-y: auto` 从 `.stepsList` 移到专门的滚动容器内层，`.flowCard` 仍保留 `overflow: hidden`：

```css
.flowCard {
  overflow: hidden;
}

.stepsList {
  max-height: 60vh;
  overflow-y: auto;
}
```

**缺点**：需改 JSX 结构（添加内层 wrapper），改动更大，本次不推荐。

---

## 3. 技术风险评估

| 风险 | 等级 | 说明 | 缓解 |
|------|------|------|------|
| 移除 `overflow:hidden` 导致布局溢出 | 🟡 低 | `.flowCard` 内其他元素原本依赖此约束 | 验证面板整体布局不受影响 |
| 步骤数量过多导致卡片过长 | 🟡 低 | 极端情况（> 20 步）可能出现，但属于少数场景 | 后续可加虚拟滚动 |

---

## 4. 验收标准

### 修复验证

| ID | 验收条件 | 验证方式 |
|----|---------|---------|
| AC-1 | FlowCard 展开后，虚线框高度随步骤数量自动扩展，无固定高度限制 | gstack browse 截图验证 |
| AC-2 | FlowCard 展开时，所有步骤卡片完整显示，无裁剪、无滚动条 | gstack browse 截图验证 |
| AC-3 | 修复后 `npm test` 通过，无回归 | exec `npm test` |
| AC-4 | 修复前后的 `git diff` 仅包含 3 行 CSS 删除 | exec `git diff` 验证 |

### 测试用例

```bash
# 1. 创建含 3+ 步骤的流程卡
# 2. 展开该卡片
# 3. 验证虚线框完整包裹所有步骤（无截断、无内部滚动条）
# 4. npm test 通过
npm test -- --testPathPattern="canvas"
```

---

## 5. 已实施修复

**⚠️ 警告**：此问题已被 dev agent 直接提交（commit `510ed216`），**跳过了 analyst → pm → architect → coord-decision 完整流程**，违反了 AGENTS.md 阶段一约束。

**已提交的修复**：
- 文件：`vibex-fronted/src/components/canvas/canvas.module.css`
- 删除 3 行 CSS
- Commit: `510ed216 fix: 流程树展开后虚线框高度自适应内容`

**后续行动**：
1. analyst 完成本分析文档 ✅
2. pm 补录 PRD（如需要）
3. reviewer 审查 commit `510ed216`
4. coord-decision 确认是否需要补充测试覆盖

---

## 6. 总结

- **问题类型**：Bug（CSS 布局问题）
- **影响范围**：Canvas 画布页 → 业务流程树 → FlowCard 展开
- **严重程度**：P1（功能可用性受损，但有临时 workaround）
- **预计修复工时**：5 分钟（已修复）
- **方案选择**：方案 A（已实施）
