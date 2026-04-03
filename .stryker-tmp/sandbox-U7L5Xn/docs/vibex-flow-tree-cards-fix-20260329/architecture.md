# Vibex 流程树卡片显示 Bug 修复 — 架构设计

**项目**: vibex-flow-tree-cards-fix-20260329  
**文档类型**: 架构设计文档  
**日期**: 2026-03-29  
**状态**: ✅ 已实施 (commit `510ed216`)

---

## 1. 技术方案确认

### 1.1 修复内容

修改文件：`vibex-fronted/src/components/canvas/canvas.module.css`

| 变更项 | CSS 选择器 | 移除属性 | 原因 |
|--------|-----------|---------|------|
| ① | `.flowCard` | `overflow: hidden` | 允许卡片容器随展开内容自然扩展高度 |
| ② | `.stepsList` | `max-height: 300px` | 移除步骤列表的固定高度上限 |
| ③ | `.stepsList` | `overflow-y: auto` | 移除步骤列表内部滚动（与 ② 联动） |

**已实施 diff**（commit `510ed216`）：
```diff
- .flowCard { overflow: hidden; }
- .stepsList { max-height: 300px; overflow-y: auto; }
```

### 1.2 决策理由

**为什么移除 `overflow: hidden`（`.flowCard`）？**

`.flowCard` 的 `overflow: hidden` 截断了超出自身边界的任何内容。展开时，`stepsList` 试图撑开父容器高度，但 `overflow: hidden` 阻止了这一行为，导致步骤卡片被截断在虚线框高度之外，无法交互。

移除后，`flowCard` 高度由子元素（header + stepsList）自然决定，虚线框随内容扩展。

**为什么移除 `max-height`（`.stepsList`）？**

`.stepsList` 之前的 `max-height: 300px` 是一个硬性上限。当步骤数量超过 5-6 个时，内容被裁剪。即使父容器已经扩展，步骤列表本身也被限制在 300px 以内，需要内部滚动。

移除后，`.stepsList` 高度由步骤数量决定，不再有上限。滚动功能由外层 `.flowList` 的 `overflow-y: auto` 提供。

**为什么不单独依赖 `.flowList` 的滚动？**

```
.canvasContainer (overflow: hidden)
  └── .treePanelBody (overflow-y: auto)
        └── .flowList (overflow-y: auto)      ← 外层滚动容器
              └── .flowCard (expanded)
                    └── .stepsList (no limit) ← 内容自然展开
```

`.flowList` 作为滚动容器负责整个流程列表的滚动。当用户展开多个 `.flowCard` 时，`flowList` 会自动滚动，用户可以滚动查看所有流程卡片及其展开的步骤。

---

## 2. 影响评估

### 2.1 CSS 选择器作用域分析

| CSS 类 | 文件位置 | 使用范围 | 变更影响 |
|--------|---------|---------|---------|
| `.flowCard` | canvas.module.css:1180 | 仅 `BusinessFlowTree.tsx` 中的流程卡片根容器 | ✅ 局部影响，无跨组件污染 |
| `.flowCard.nodeConfirmed` | canvas.module.css:1197 | 确认状态变体 | ✅ 无影响，继承基础规则，仅覆盖 border/shadow |
| `.flowCard.nodeError` | canvas.module.css:1202 | 错误状态变体 | ✅ 无影响 |
| `.flowCard.nodePending` | canvas.module.css:1207 | 待处理状态变体 | ✅ 无影响 |
| `.flowCardHeader` | canvas.module.css:1212 | 卡片头部区域 | ✅ 无影响 |
| `.flowCardActions` | canvas.module.css:1238 | 操作按钮区 | ✅ 无影响 |
| `.stepsList` | canvas.module.css:1287 | 仅 `BusinessFlowTree.tsx` 中的步骤列表 | ✅ 局部影响，无跨组件污染 |
| `.flowList` | canvas.module.css:1171 | 流程列表滚动容器 | ✅ 无变更，保持 `overflow-y: auto` |

**结论**：`.flowCard` 和 `.stepsList` 均仅在 `BusinessFlowTree` 组件内使用，无其他消费方。变更影响范围完全局部化。

### 2.2 兄弟组件无需同步调整

搜索结果确认：`.flowCard` 和 `.stepsList` 仅存在于 `BusinessFlowTree.tsx` 和 `canvas.module.css` 中，无兄弟组件使用这些类名。

### 2.3 滚动策略变更

| 场景 | 变更前 | 变更后 |
|------|--------|--------|
| 步骤数量 ≤ 5 | `.stepsList` 内部滚动（max-height 300px） | 步骤列表完整展开，无滚动 |
| 步骤数量 > 5 | `.stepsList` 内部滚动（max-height 300px） | `.flowList` 整体滚动 |
| 多个 `.flowCard` 展开 | 每个卡片内部滚动 | `.flowList` 统一滚动 |

**用户收益**：滚动行为更符合直觉 — 在流程列表级别滚动，而非在每个卡片内部单独滚动。

---

## 3. 风险评估

### 3.1 已识别风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| **展开大量步骤时 `.flowList` 性能下降** | 低 | 中 | `.flowList` 已有 `overflow-y: auto`，现代浏览器对 flexbox 滚动优化良好；可通过 QA 验证 |
| **展开多个卡片导致页面布局跳动（CLS）** | 低 | 低 | `.flowList` 滚动容器吸收高度变化，`.flowCard` 展开动画不影响其他卡片位置 |
| **`.flowCard` 展开内容超出视口边缘** | 低 | 低 | 外层 `.treePanelBody` 和 `.canvasContainer` 均无溢出，`.flowList` 会处理滚动 |

### 3.2 不适用风险（分析后排除）

| 潜在担忧 | 结论 |
|---------|------|
| 移除 `overflow: hidden` 后内容溢出父容器？ | ❌ 不适用：`.flowList` 有 `overflow-y: auto`，多余内容进入滚动区 |
| `.flowCardHeader` 内的 `flowCardCheckbox` 定位问题？ | ❌ 不适用：`position: relative` 保留，checkbox 绝对定位不受影响 |
| 收起时动画抖动？ | ❌ 不适用：`.flowCard` 的 `transition` 仅作用于 `border-color`，高度变化无动画 |

---

## 4. 回归测试清单（8 项）

| # | 检查项 | 验证方式 | 通过标准 |
|---|--------|---------|---------|
| 1 | 流程树展开/收起功能正常 | 交互验证 | 点击展开按钮，`.stepsList` 显示；再次点击，隐藏 |
| 2 | 流程卡片虚线框样式正常 | 视觉验证 | border-radius 8px、border 2px dashed、背景色正常 |
| 3 | 展开含 3+ 步骤的卡片，虚线框高度自适应 | 截图验证 | 虚线框高度 = header 高度 + stepsList 高度，无截断 |
| 4 | 步骤拖拽排序功能正常 | 交互验证 | 拖拽步骤到新位置，顺序正确更新 |
| 5 | 添加步骤按钮功能正常 | 交互验证 | 点击"添加步骤"按钮，新步骤行出现在列表底部 |
| 6 | 收起流程卡片后，容器高度正常回缩 | 截图验证 | 收起后虚线框高度等于 header 高度，无多余空白 |
| 7 | 多流程卡片同时存在时布局正常 | 截图验证 | 多个 `.flowCard` 并列显示，无重叠、无溢出 |
| 8 | `.stepsList` 内部滚动（当步骤数量极多时由 `.flowList` 承接） | 交互验证 | 添加 20+ 步骤，滚动 `.flowList` 可查看全部内容 |

---

## 5. 实施记录

| 项目 | 值 |
|------|---|
| 修复提交 | `510ed216` |
| 修改文件 | `vibex-fronted/src/components/canvas/canvas.module.css` |
| 删除行数 | 3 行（`overflow: hidden` ×1，`max-height: 300px` ×1，`overflow-y: auto` ×1） |
| 变更性质 | 纯 CSS 修复，无逻辑变更 |
| 预计工时 | ~20 分钟（实际约 5 分钟完成） |

---

## 6. 后续建议

1. **性能监控**：在 QA 阶段关注大量步骤场景（20+ 步骤）的渲染性能
2. **边界测试**：验证展开/收起循环 10+ 次无内存泄漏
3. **移动端验证**：确认在较小视口下布局仍然正常
