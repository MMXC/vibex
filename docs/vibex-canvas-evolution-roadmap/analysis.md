# Analysis: VibeX Canvas Phase1 — 样式统一 + 导航修复

> **任务**: 重新生成 Phase1 分析文档，修正 artifacts  
> **分析日期**: 2026-03-29  
> **分析师**: Analyst Agent  
> **项目**: vibex-canvas-evolution-roadmap  
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 1.1 重新分析背景

本次重新分析基于对 VibeX Canvas 代码库的实地审计，修正此前文档中的路径错误和实现状态偏差。关键发现：

- 5 个 ADR 描述的功能中，部分已部分实现，但 CSS 变量/推导函数未建立
- `ComponentSelectionStep`（位于 `flow-components/`）仍含 emoji 字符
- `BoundedContextTree` 的领域分组已有基础 DOM 结构，缺 CSS 变量和虚线框
- 导入导航已有降级逻辑（toast 提示），但 `example-canvas.json` 无 `previewUrl`
- Panel expand 已有三面板独立 expand，缺 `expand-both` 模式

### 1.2 问题严重度分级

| 严重度 | 问题 | 影响 |
|--------|------|------|
| 🔴 P0 | ComponentSelectionStep 含 emoji checkbox | 无障碍合规、跨平台一致性 |
| 🔴 P0 | example-canvas.json 无 previewUrl | 导入示例后节点点击只显示 toast，无法预览 |
| 🟠 P1 | 领域分组缺 CSS 变量系统 | 4 色分组视觉不一致，深色模式缺失 |
| 🟠 P1 | domainType/deriveStepType 推导函数不存在 | 向后兼容方案未实现 |
| 🟡 P2 | Panel expand 缺 expand-both 模式 | 无法实现三栏展开的核心交互 |
| 🟡 P2 | 流程步骤类型字段存在但无推导函数 | 历史数据 step.type = undefined 时无默认值 |

---

## 2. 实地审计结果

### 2.1 Emoji Checkbox 使用情况

| 组件 | 路径 | Emoji 行号 | 状态 |
|------|------|-----------|------|
| ComponentSelectionStep | `components/flow-components/` | L92 `✓○`, L202 `✓`, L244 `×` | ❌ 未修复 |
| NodeSelector | `components/ui/` | 无 | ✅ 已使用 CheckboxIcon |
| BoundedContextTree | `components/canvas/` | 无 | ✅ 已使用 CheckboxIcon |
| BusinessFlowTree | `components/canvas/` | 无 | ✅ 已使用 CheckboxIcon |

**结论**: 仅 `ComponentSelectionStep` 一处需要修复。

### 2.2 领域分组虚线框审计

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| `data-type` 属性 | BoundedContextTree 节点渲染 | ✅ L129 已有 `data-type={node.type}` | ✅ 基础完成 |
| CSS 变量定义 | `--domain-core/supporting/generic/external` | ❌ canvas.module.css 中不存在 | ❌ 未完成 |
| 分组虚线框 | `BoundedGroupOverlay` 组件 | ✅ 已存在 `components/canvas/groups/BoundedGroupOverlay.tsx` | ✅ DOM 结构完成 |
| 深色模式 | 使用 `--canvas-bg` 变量 | ❌ CSS 变量不存在 | ❌ 未完成 |

**结论**: DOM 结构和属性已到位，缺 CSS 变量系统和虚线框样式。

### 2.3 流程卡片样式审计

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| 卡片边框 | `border: 2px dashed` | ✅ `canvas.module.css` L1204 已有 `border: 2px dashed var(--color-border)` | ✅ 已完成 |
| FlowStep.type | 类型定义存在 | ✅ `types.ts` 有 `type?: 'normal' \| 'branch' \| 'loop'` | ✅ 类型定义存在 |
| 步骤类型推导 | `deriveStepType()` 函数 | ❌ 不存在 | ❌ 未完成 |
| example-canvas.json | steps 含 type 字段 | ❌ 所有 step 无 type 字段 | ❌ 历史数据兼容缺失 |

**结论**: 边框样式已完成，缺推导函数和历史数据兼容。

### 2.4 导入导航审计

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| example-canvas.json previewUrl | 组件节点含 previewUrl | ❌ 所有节点 previewUrl = undefined | ❌ 未完成 |
| handleNodeClick | 有 previewUrl 时跳转，无时降级 | ✅ L286 有 `window.open(node.previewUrl)`, L289 有 toast 降级 | ✅ 降级逻辑存在 |
| /preview 页面 | 支持 ?component= query param | ✅ L289 已有降级提示逻辑 | ✅ 降级提示存在 |

**结论**: 降级逻辑已就位，缺 `example-canvas.json` 的 previewUrl 数据填充。

### 2.5 Panel Expand 审计

| 检查项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| 三面板独立 expand | left/center/right 独立状态 | ✅ `canvasStore.ts` L104-106 有 `leftExpand/centerExpand/rightExpand` | ✅ 已完成 |
| expand-both 模式 | centerExpand 时两侧面板隐藏 | ❌ 未实现 | ❌ 未完成 |
| expandDirection 状态 | 统一的状态管理 | ✅ 三面板独立 expand 已实现 | ✅ 基础完成 |
| CSS Grid 动态布局 | 3fr expand-both | ❌ 未实现 | ❌ 未完成 |

**结论**: 三面板独立 expand 已完成，缺 `expand-both` 聚合模式。

---

## 3. 功能 Gap 分析

### 3.1 Phase1 功能 Gap 矩阵

| ID | 功能点 | 优先级 | 当前状态 | Gap 描述 | 预估工时 |
|----|--------|--------|----------|---------|---------|
| F1 | ComponentSelectionStep Emoji → CSS Checkbox | P0 | ❌ 未完成 | `flow-components/ComponentSelectionStep.tsx` L92/L202/L244 含 emoji，需替换为 CheckboxIcon | 1.5h |
| F2 | example-canvas.json 补充 previewUrl | P0 | ❌ 未完成 | 所有 componentNodes 的 previewUrl 为 undefined，需按组件 ID 生成预览 URL | 1h |
| F3 | 领域分组 CSS 变量系统 | P1 | 🟡 部分完成 | `canvas.module.css` 缺 `--domain-core/supporting/generic/external` 变量；`BoundedGroupOverlay` 缺虚线框样式 | 3h |
| F4 | domainType 推导函数 | P1 | ❌ 未完成 | `lib/canvas/` 缺 `deriveDomainType()` 函数，现有 `node.type` 直接使用无推导 | 1.5h |
| F5 | deriveStepType 推导函数 | P1 | ❌ 未完成 | `lib/canvas/` 缺 `deriveStepType()` 函数，`step.type` 为 undefined 时无默认值 | 1.5h |
| F6 | expand-both 模式 | P2 | ❌ 未完成 | `canvasStore` 缺 `expandToBoth` action，`CanvasLayout` 缺 `expand-both` CSS Grid 样式 | 4h |
| F7 | 统一 CSS 变量文件 | P1 | ❌ 未完成 | 建议建立 `canvas.variables.css` 统一管理，不散落在 canvas.module.css | 1h |

### 3.2 实现优先级排序

```
P0 (立即修复):
  F1 → F2

P1 (本周完成):
  F3 → F4 → F5 → F7

P2 (下阶段):
  F6
```

---

## 4. 技术债务分析

### 4.1 类型安全债务

| 债务项 | 现状 | 风险 |
|--------|------|------|
| `FlowStep.type` 可能为 undefined | 历史数据无 type 字段 | 分支/循环图标不显示，UI 不一致 |
| `BoundedContextNode.type` 直接使用 | node.type 即为领域类型，无推导 | 如果 type 为空字符串，无法分组 |

### 4.2 样式债务

| 债务项 | 现状 | 风险 |
|--------|------|------|
| CSS 变量散落 | 变量定义在 canvas.module.css 中 | 深色模式适配困难，后续维护成本高 |
| 无统一变量文件 | `canvas.variables.css` 不存在 | 新组件无法引用统一变量 |

### 4.3 测试债务

| 测试项 | 状态 | 说明 |
|--------|------|------|
| deriveDomainType 覆盖率 | ❌ 不存在 | 函数不存在，无法测试 |
| deriveStepType 覆盖率 | ❌ 不存在 | 函数不存在，无法测试 |
| ComponentSelectionStep 交互测试 | ❌ 缺失 | 无 Vitest 测试用例 |
| 导入导航 E2E | ❌ 缺失 | Playwright E2E 未覆盖 |

---

## 5. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 历史数据无 type 字段导致 UI 不一致 | 高 | 中 | 实现 deriveDomainType/deriveStepType 自动推导 |
| CSS 变量冲突 | 低 | 中 | 建立 canvas.variables.css 统一管理 |
| expand-both 破坏现有布局 | 中 | 高 | Playwright E2E 覆盖 + 截图对比 |
| ComponentSelectionStep 改动影响其他流程 | 低 | 高 | 确认无其他组件依赖该 emoji 样式 |

---

## 6. 验收标准

### Phase1 最终验收

| ID | 验收标准 | 验证方式 | 状态 |
|----|---------|---------|------|
| V1.1 | ComponentSelectionStep 无 emoji 字符 | `grep -rn '[✓○×]' components/flow-components/ComponentSelectionStep.tsx` → 0 | ❌ |
| V1.2 | example-canvas.json 所有组件节点含 previewUrl | `jq '.componentNodes[].previewUrl' example-canvas.json` → 无 null | ❌ |
| V1.3 | 4 种领域类型有对应 CSS 变量 | `grep -c 'domain-core\|domain-supporting\|domain-generic\|domain-external' canvas.variables.css` → 4 | ❌ |
| V1.4 | domainType 推导函数测试覆盖率 > 90% | `pnpm coverage` for deriveDomainType | ❌ |
| V1.5 | deriveStepType 函数测试覆盖率 > 90% | `pnpm coverage` for deriveStepType | ❌ |
| V1.6 | expand-both 时 canvas 占 3fr | Playwright E2E + CSS snapshot | ❌ |
| V1.7 | 深色模式领域分组颜色正确 | Playwright 深色模式截图 | ❌ |
| V1.8 | axe-core 无障碍扫描 0 violations | `pnpm axe:run` | ❌ |

---

## 7. 结论

### 7.1 关键发现

1. **已有较好基础**: `CheckboxIcon` 已统一在 canvas 组件中使用，`BoundedGroupOverlay` DOM 结构已完成，`PanelExpand` 三面板独立状态已实现
2. **核心 Gap**: `ComponentSelectionStep` emoji 未修复、`example-canvas.json` 无 previewUrl、缺统一 CSS 变量系统
3. **向后兼容**: 所有历史数据兼容方案（推导函数）均未实现

### 7.2 建议

1. **优先修复 F1 + F2**：这两个 P0 问题直接影响用户体验，应在 2.5h 内完成
2. **建立 CSS 变量系统（F3+F7）**：作为 Phase1 的基础设施，确保后续样式一致
3. **实施向后兼容推导函数（F4+F5）**：确保已有数据平滑过渡

---

*本分析文档由 Analyst Agent 生成，基于实地代码审计。*
