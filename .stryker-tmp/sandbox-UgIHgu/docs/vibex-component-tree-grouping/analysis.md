# Analysis: VibeX Canvas 组件树分组异常 — 全部归入通用组件

> **任务**: vibex-component-tree-grouping/analyze-requirements
> **分析日期**: 2026-03-30
> **分析师**: Analyst Agent
> **项目**: vibex-component-tree-grouping
> **工作目录**: /root/.openclaw/vibex

---

## 1. 执行摘要

Canvas 组件树中，所有页面组件全部归入"🔧 通用组件"虚线框，未按页面类型分组。

**根因**：`inferIsCommon()` 函数（`ComponentTree.tsx L51-53`）将 `flowId ∈ COMMON_FLOW_IDS` 的组件判定为通用组件。AI 生成组件时，`flowId` 被设为 `'common'` 等通用值，导致全部组件进入通用组件分组。

---

## 2. 实地审计

### 2.1 分组函数分析

**ComponentTree.tsx L45-53**：
```tsx
const COMMON_FLOW_IDS = new Set(['mock', 'manual', 'common', '__ungrouped__', '']);

export function inferIsCommon(node: ComponentNode): boolean {
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) {
    return true;  // ← AI 生成组件时 flowId='common' → 触发此路径
  }
  // ...
}
```

**分组逻辑 L101-163**：
```tsx
// inferIsCommon = true → "通用组件" 置顶
if (inferIsCommon(node)) {
  commonNodes.push(node);  // 所有通用组件进入同一个虚线框
}
// inferIsCommon = false → 按 flowId 分组
const key = node.flowId || '__ungrouped__';
```

### 2.2 问题条件

**全部归入"通用组件"的条件**：
- AI 生成组件时，`flowId` 被设为 `'common'`
- `COMMON_FLOW_IDS.has('common')` = true
- `inferIsCommon()` 返回 true
- 所有组件进入同一个 "🔧 通用组件" 虚线框

### 2.3 与上一页任务的关联

| 项目 | 症状 | 根因 |
|------|------|------|
| `vibex-component-tree-page-classification` | 归入"未知页面" | `flowId` 有值但无法匹配 `flowNodes.nodeId` |
| `vibex-component-tree-grouping` | 全部归入"通用组件" | `flowId = 'common'`，触发 `COMMON_FLOW_IDS` |

**两个问题同根**：AI 生成阶段 `flowId` 填充不正确。

### 2.4 gstack 验证

**当前示例数据下行为正确**：
```
@e119 [group] "📄 创建订单流程"    ← 非通用组件
@e149 [group] "📄 用户认证流程"    ← 非通用组件
@e161 [group] "📄 商品管理流程"    ← 非通用组件
```

示例数据中 `flowId` 与 flow node 正确匹配。问题出现在 AI 生成新组件时。

---

## 3. 方案对比

### 方案 A：修复 AI 生成阶段的 flowId 填充（推荐）

**做法**：在 AI 生成组件时，确保每个组件的 `flowId` 填充为对应的 `BusinessFlowNode.nodeId`。

**需定位**：
1. AI component generation prompt（检查是否要求填充 `flowId`）
2. `generateComponents` / `cascadeComponentNodes` 相关代码（检查数据填充逻辑）

**优势**：从源头修复，保证数据正确性
**劣势**：涉及 AI prompt 改动

### 方案 B：修改 COMMON_FLOW_IDS 分组规则

**做法**：`flowId = 'common'` 不再被判定为通用组件。

```tsx
const COMMON_FLOW_IDS = new Set(['mock', 'manual', '__ungrouped__', '']);
// 移除 'common' — 它可能是有效的 flowId
```

**问题**：如果某些组件确实是通用组件（跨页面复用），此修改会破坏其分类。

### 方案 C：添加 pageType 字段独立分类

**做法**：在 `ComponentNode` 中新增 `pageType?: 'list'|'detail'|'form'|...` 字段，AI 生成时填充，分组逻辑优先用 `pageType`。

**优势**：解耦页面归属与流程归属
**劣势**：数据模型变更，影响范围大

---

## 4. 推荐方案

**推荐方案 A（修复 AI 生成阶段 flowId 填充）**

与 `vibex-component-tree-page-classification` 同根，建议合并修复：
1. 确保 AI 生成时正确填充 `flowId`（不为 'common'）
2. `flowId` 应指向对应的 `BusinessFlowNode.nodeId`

---

## 5. 验收标准

- [ ] AI 生成组件后，不存在"🔧 通用组件"以外的组件被归入"通用组件"虚线框
- [ ] 每个页面组件（列表页/详情页/表单等）显示在其对应 flow 的虚线框内
- [ ] gstack browse 截图验证：AI 生成组件后，组件树按 flow 正确分组
- [ ] `grep -rn "flowId.*common\|common.*flowId" ComponentTree.tsx` → 0（无 'common' 硬编码）

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| AI prompt 改动影响生成质量 | 中 | 高 | 修改后用 gstack 验证 |
| 误将真正的通用组件分类为页面组件 | 低 | 低 | 真正的通用组件应无 `flowId` |

---

## 7. 工时估算

与 `vibex-component-tree-page-classification` 合并修复，合计 **6h**。
