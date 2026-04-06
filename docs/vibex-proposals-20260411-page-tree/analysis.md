# Analysis: 组件树按页面组织 — 产品反馈分析

**项目**: vibex-proposals-20260411-page-tree
**分析人**: Analyst
**日期**: 2026-04-11

---

## 1. 执行摘要

**问题**: Canvas 编辑器的组件树目前按 `flowId` 分组，但 AI 生成组件时 `flowId` 填充不正确，导致组件被错误归入"通用组件"或"未知页面"。

**根因**: AI 生成阶段 `flowId` 未与实际的 BusinessFlowNode 正确关联。

**推荐方案**: 扩展 `matchFlowNode()` 的模糊匹配能力 + 在 AI 生成 prompt 中强化 `flowId` 填充指令，工作量 ~2h。

---

## 2. 现状分析

### 2.1 历史经验（Research）

通过检索 `docs/learnings/` 和历史分析文档，发现两组相关分析：

| 项目 | 日期 | 症状 | 根因 |
|------|------|------|------|
| `vibex-component-tree-page-classification` | 2026-03-30 | 组件归入"未知页面" | `flowId` 有值但无法匹配 `flowNodes.nodeId` |
| `vibex-component-tree-grouping` | 2026-03-30 | 全部组件归入"通用组件" | AI 生成时 `flowId='common'` 触发 `COMMON_FLOW_IDS` |

**两问题同根**：AI 生成阶段 `flowId` 填充不正确。

### 2.2 Git History 分析

| Commit | 操作 |
|--------|------|
| `448414b8` | 流程治理 S3.1-S3.3 完成 |
| `b85f3ac7` | canvasLogger 重构（影响 ComponentTree） |

**关键文件**: `src/components/canvas/ComponentTree.tsx`

### 2.3 当前分组逻辑

**ComponentTree.tsx 分组规则**：

```typescript
// 1. 判断是否通用组件
export function inferIsCommon(node: ComponentNode): boolean {
  if (COMMON_FLOW_IDS.has(node.flowId) || !node.flowId) return true;  // flowId='common' → 通用
  if (COMMON_COMPONENT_TYPES.has(node.type)) return true;              // modal/button → 通用
  return false;
}

// 2. 页面标签获取（有多级 fallback）
export function matchFlowNode(flowId, flowNodes): BusinessFlowNode | null {
  // L1: 精确匹配 nodeId
  // L2: Prefix 匹配
  // L3: 名称模糊匹配
}
```

**现有 fallback 机制已较为完善**，问题在于 AI 生成阶段。

---

## 3. 业务场景分析

### 3.1 用户旅程

```
用户输入需求 → AI 生成组件 → 组件出现在组件树 → 用户期望按页面分组
```

**当前问题**：
1. 用户在 LeftDrawer 输入需求
2. AI 生成组件，`flowId='common'` 或与 flowNodes 不匹配
3. 组件树显示"通用组件"或"未知页面"虚线框
4. 用户无法理解组件属于哪个页面

### 3.2 JTBD 分析

| JTBD | 当前痛点 | 期望 |
|------|----------|------|
| 理解组件归属 | 组件堆在"通用组件"里 | 清楚看到每个组件属于哪个页面 |
| 导航定位 | 大量组件混在一起 | 按页面折叠/展开，快速定位 |
| 批量操作 | 无法按页面选中组件 | 选中整个页面的组件 |

---

## 4. 方案对比

### 方案 A：扩展 matchFlowNode 模糊匹配 + AI prompt 强化（推荐）

**前端改动**：
1. 扩展 `matchFlowNode()` 的名称模糊匹配逻辑（已有 L3，支持 flowId prefix）
2. 在 `ComponentTree.tsx` 分组前，对每个 component 调用 `matchFlowNode` 获取 page label

**AI prompt 改动**：
在 AI 生成组件的 prompt 中增加 `flowId` 填充指令：
```
要求为每个组件指定正确的 flowId，值为对应的 BusinessFlow nodeId。
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~2h（1h 前端 + 1h prompt 调整） |
| 风险 | 低 |
| 用户价值 | 高（立即解决页面归属问题） |

### 方案 B：前端运行时通过 component name 推断页面归属

不依赖 AI prompt，在前端通过组件名称匹配 flow name：
- `"LoginPage"` → 匹配 `"登录页面"` flow
- `"ProductList"` → 匹配 `"产品列表"` flow

| 维度 | 评分 |
|------|------|
| 工作量 | ~4h（需建立名称→flow 映射表） |
| 风险 | 中（名称映射可能不准确） |
| 用户价值 | 中（无法处理自定义命名） |

### 方案 C：按页面重构组件树数据模型

将 `componentStore` 中的组件按 `pageId` 重新组织，而非按 `flowId`：
```typescript
interface PageComponentGroup {
  pageId: string;
  pageName: string;
  components: ComponentNode[];
}
```

| 维度 | 评分 |
|------|------|
| 工作量 | ~8h（数据模型重构 + store 改造） |
| 风险 | 高（影响面广） |
| 用户价值 | 高（彻底解决分组问题） |

---

## 5. 推荐方案

**方案 A**：扩展 `matchFlowNode` + AI prompt 强化。

**理由**：
1. 利用已有 fallback 机制，改动最小
2. 同时修复 AI 生成端，从源头解决问题
3. 风险低，不破坏现有功能
4. 历史分析已验证根因，方案可行性高

**具体实施**：
1. 在 AI prompt 中明确要求 `flowId` 填充为对应 BusinessFlow nodeId
2. 确认 `matchFlowNode()` 的 L2/L3 fallback 正常工作
3. 添加单元测试验证模糊匹配逻辑

---

## 6. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| 1 | AI 生成组件后，`flowId` 与实际 flowNode 匹配 | 手动测试 + 检查 JSON response |
| 2 | 组件树中，页面组件显示正确页面名称，非"未知页面" | UI 验证 |
| 3 | 通用组件（modal/button 等）仍正确归入"通用组件" | 回归测试 |
| 4 | `matchFlowNode()` 的 prefix 匹配正确工作 | 单元测试 |
| 5 | 多 flow 节点场景下，组件正确分散到各页面 | 手动测试 |

---

## 7. 风险识别

| 风险 | 影响 | 缓解 |
|------|------|------|
| AI prompt 改动后 flowId 仍不匹配 | 中 | 保留前端 fallback 作为兜底 |
| 名称模糊匹配误匹配 | 低 | prefix 匹配优先于名称匹配 |
| 多 flowId 组件归属歧义 | 低 | 按第一个匹配的 flowNode 归属 |

---

## 8. 相关历史文档

- `docs/vibex-component-tree-page-classification/analysis.md` (2026-03-30)
- `docs/vibex-component-tree-grouping/analysis.md` (2026-03-30)
