# vibex-json-render-integration — 需求分析报告

**项目**: vibex-json-render-integration
**任务**: analyze-requirements
**日期**: 2026-04-14
**作者**: Analyst Agent
**状态**: ✅ 完成

---

## 1. 业务场景分析

### 1.1 问题背景

VibeX Canvas 的 json-render 集成存在多层缺陷，导致 Canvas 生成的组件树无法正确预览：

1. `catalog.ts` 中所有容器组件（`Page`、`Form`、`DataTable` 等）**缺少 `slots` 声明**，`children` 无法通过 schema 验证
2. `JsonRenderPreview.nodesToSpec()` 的 **ComponentNode → Spec 转换逻辑不完整**，parentId 关系未重建，嵌套渲染失效
3. `Registry` 组件实现**粗糙**：`emit` 事件未实现、`ActionProvider` 为空、`Page` 在 Modal 中 `min-h-screen` 溢出
4. 组件树数据结构与 json-render Spec 格式**未对齐**

### 1.2 根因定位

**数据流链路**：

```
ComponentStore (componentNodes: ComponentNode[])
  ↓
CanvasPreviewModal → JsonRenderPreview(nodes={componentNodes})
  ↓
nodesToSpec() — ComponentNode[] → Spec
  ↓
Renderer(spec, registry) — json-render 渲染
  ↓
vibexCanvasRegistry 组件实现
```

**四类根因**：

| # | 根因 | 位置 | 影响 |
|---|------|------|------|
| R1 | catalog 中容器组件无 `slots` 声明 | `catalog.ts` | children 无法通过 schema 验证，嵌套组件静默不渲染 |
| R2 | `nodesToSpec()` 未使用 `parentId` 重建嵌套关系 | `JsonRenderPreview.tsx` | 扁平数组无法建立树形结构 |
| R3 | Registry `Page` 使用 `min-h-screen`，Preview Modal 溢出 | `registry.tsx` | 预览弹窗无法正常显示 |
| R4 | `emit` 事件和 `ActionProvider` 未实现 | `registry.tsx` + `JsonRenderPreview.tsx` | 组件交互（点击/表单）无法响应 |

**关键代码证据**：

```typescript
// catalog.ts — R1: 无 slots 声明
const rawCatalog = defineCatalog(schema, {
  components: {
    Page: {
      props: z.object({ title: z.string(), description: z.string().optional() }),
      // ❌ 缺少 slots: ["default"]
    },
    Form: { props: z.object({ ... }), /* ❌ 无 slots */ },
  }
});

// JsonRenderPreview.tsx — R2: 未使用 parentId
const element = {
  type: registryType,
  props: { ...node.props, title: node.name },
  children: node.children ?? [],  // 直接用 ComponentNode.children（子节点ID数组）
  // ❌ 未考虑 parentId 层级关系
};
```

```typescript
// registry.tsx — R3: Page 尺寸问题
const PageImpl = ({ props, children }) => (
  <div className="min-h-screen bg-gray-50">  {/* ❌ 在 Modal 中溢出 */}
    <header>...</header>
    <main>{children}</main>
  </div>
);

// JsonRenderPreview.tsx — R4: 空 ActionProvider
<ActionProvider handlers={{}}>  {/* ❌ handlers 为空，emit 无效 */}
```

### 1.3 受影响范围

| 功能 | 当前行为 | 期望行为 |
|------|----------|----------|
| 嵌套组件渲染 | schema 验证失败，children 不渲染 | children 正确嵌套渲染 |
| 多页面预览 | 仅渲染第一个 page | 支持多页面切换或 PageGrid |
| Preview Modal | Page 溢出/不可见 | 正确适配容器尺寸 |
| 组件交互 | emit/action 无响应 | 按钮点击等事件正确触发 |
| 单元测试 | 仅 5 个测试用例，覆盖不足 | 关键路径覆盖 |
| E2E 测试 | 仅 3 个基础测试 | 嵌套渲染、交互、E2E 覆盖 |

---

## 2. Research 结果

### 2.1 Git History

| Commit | 描述 | 教训 |
|--------|------|------|
| `75a116c3` | E4.1/E4.2 E2E tests for JsonRenderPreview + PrototypeQueuePanel | JsonRenderPreview 已有 3 个 E2E 测试，但仅覆盖空状态/按钮可见性，未测试嵌套渲染 |
| `dc52da1a` | fix(internal-tools): E1 dedup field rename | 涉及 ComponentNode 结构变更，需注意与 json-render 转换逻辑的一致性 |

**关键发现**：json-render 目录无历史改动记录（git log 空），说明这部分是较新实现的，可能缺少充分的架构评审。

### 2.2 已有参考文档

**`docs/json-render-integration-analysis.md`** — 完整的 json-render 用法索引和 VibeX 现状分析，已由任务方提供。本报告基于该文档分析。

**`docs/vibex-fifth/IMPLEMENTATION_PLAN.md`** — Epic E4 的实现计划，E4.1/E4.2 已完成，E4.3/E4.4 未启动（对应本次任务需求）。

### 2.3 来自 learnings

**无直接命中**。learnings 目录中无 json-render 相关经验沉淀。canvas-api-completion 中提到的"Route 顺序敏感性"教训对本次任务不适用。

---

## 3. 技术方案选项

### 方案 A — 增量修复：P0 止血 + Registry 完善（推荐）

**思路**：按优先级分批修复，Phase 1 解决阻塞问题，Phase 2 完善功能。

**Phase 1（P0 — 阻断性）**：
1. `catalog.ts`：为所有容器组件添加 `slots: ["default"]` 声明
2. `JsonRenderPreview.tsx`：修复 `nodesToSpec()`，正确处理 parentId 关系重建
3. `registry.tsx`：`Page` 组件改用 `min-h-full` 或移除 `min-h-screen`

**Phase 2（P1 — 功能增强）**：
4. `ActionProvider` 实现：`emit` 事件和 handlers
5. `CanvasPreviewModal` 尺寸适配
6. 单元测试补充（nodesToSpec 覆盖 parentId 转换）

**优点**：
- 风险低，每个改动独立可测试
- 已有参考文档（`json-render-integration-analysis.md`）指导实现
- 不破坏现有已工作的部分

**缺点**：
- 分阶段交付，短期体验不完整

**工期**：Phase 1 = 1d，Phase 2 = 1d

---

### 方案 B — 架构重构：统一数据模型

**思路**：重新设计 ComponentNode 与 json-render Spec 的映射关系，将 parentId 作为主要关系建立方式，而非依赖扁平 children 数组。

```typescript
// 新的转换逻辑
function nodesToSpecWithParentId(nodes: ComponentNode[]): Spec {
  const elements: Spec['elements'] = {};
  const rootNodes = nodes.filter(n => !n.parentId); // 根节点

  // 建立 parentId → children 映射
  const parentChildrenMap: Record<string, string[]> = {};
  for (const node of nodes) {
    if (node.parentId) {
      parentChildrenMap[node.parentId] = [
        ...(parentChildrenMap[node.parentId] ?? []),
        node.nodeId,
      ];
    }
  }

  for (const node of nodes) {
    elements[node.nodeId] = {
      type: registryType,
      props: { ...node.props, title: node.name },
      children: parentChildrenMap[node.nodeId] ?? [], // 用 parentId 映射重建 children
    };
  }

  return {
    root: rootNodes[0]?.nodeId ?? nodes[0]?.nodeId,
    elements,
  };
}
```

**优点**：从架构层面解决问题，parentId 和 children 一致性有保障。

**缺点**：
- 改动范围大，涉及 ComponentNode 数据流全链路
- parentId 是否已在所有场景正确设置需要验证
- 与现有 ComponentTree 面板逻辑可能冲突

**工期**：3d
**风险**：高。涉及数据结构改动，回归风险大。

---

### 方案 C — 保守修复：仅修复 catalog slots + 尺寸（最小改动）

**思路**：仅修复最明确的两个 P0 问题（slots 缺失 + Page 尺寸），暂不处理 parentId 和 emit。

```typescript
// catalog.ts — 仅添加 slots
Page: { props: ..., slots: ["default"], description: "页面容器" },
Form: { props: ..., slots: ["default"], description: "表单容器" },
```

**优点**：最小改动，最快止血。

**缺点**：parentId 问题依然存在，多层嵌套组件仍无法渲染。

**工期**：0.5d
**风险**：低。

---

## 4. 可行性评估

| 维度 | 方案 A | 方案 B | 方案 C |
|------|--------|--------|--------|
| 技术难度 | ⭐ 中 | ⭐ 高 | ⭐ 低 |
| 改动范围 | 3 个文件（P1） | 全链路 | 2 个文件 |
| 工期 | 2d | 3d | 0.5d |
| 风险 | 低 | 高 | 极低 |
| 完整性 | 高 | 高 | 低（仅止血） |

**推荐**：方案 A。技术可行、风险可控、收益明确。Phase 1 解决阻断问题，Phase 2 完善功能。

---

## 5. 初步风险识别

### 风险 1 — parentId 不一致性（高）
`ComponentNode.parentId` 在所有创建路径上是否始终正确设置未知。若 parentId 不完整，`nodesToSpec` 的 parentId 映射会漏掉部分子节点。

**缓解**：先写单元测试验证 parentId 在所有场景（增/删/移动/重排序）下的正确性。

### 风险 2 — json-render schema 验证严格性（中）
catalog 中添加 `slots: ["default"]` 后，json-render 内部如何处理 schema 验证失败需要实测。若验证失败时静默跳过 children 而非报错，修复效果难以感知。

**缓解**：参考 json-render 文档，确认 schema 验证失败时的行为（warn vs error）。增加 Playwright 截图对比验证嵌套渲染是否可见。

### 风险 3 — Registry 组件 emit 与 AI 集成（中）
`emit` 事件目前是空实现。若未来 AI 需要通过 json-render 的 action 系统与用户交互，emit 链路需要打通。但当前 Phase 1/2 目标不含 AI 集成，可接受空实现。

**缓解**：Phase 3 再考虑 emit 链路完整化。

### 风险 4 — 多 page 根节点选择（低）
当 componentNodes 包含多个 page 类型的节点时，当前逻辑只选第一个。这在 VibeX 多页面原型场景下不合理。

**缓解**：Phase 2 考虑 `PageGrid` 组件或 Tab 切换机制。

### 风险 5 — E2E 测试依赖环境（中）
json-render-preview E2E 测试依赖登录流程和 canvas 页面加载，网络不稳定时 flaky。

**缓解**：分离"有组件树"的场景测试，用 mock 数据减少环境依赖。

---

## 6. 验收标准

### 6.1 Catalog & Schema（P0 — 必须）
- [ ] `catalog.ts` 中 `Page`、`Form`、`DataTable`、`DetailView`、`Modal` 均声明 `slots: ["default"]`
- [ ] `Page`、`Form` 的 `slots` 应包含 `["default"]` 至少一个 slot
- [ ] `pnpm tsc --noEmit` 通过（catalog 类型检查）

### 6.2 nodesToSpec 转换（P0 — 必须）
- [ ] 单节点（无 children）渲染正常
- [ ] 二层嵌套（parent → children）渲染正常，children 可见
- [ ] 多层嵌套（3+ 层）渲染正常
- [ ] `parentId` 和 `children` 数组两个关系源一致（通过单元测试断言）

### 6.3 Registry 组件（P0 — 必须）
- [ ] `Page` 组件在 Preview Modal 中不溢出（移除 `min-h-screen`）
- [ ] `Form` 组件正确渲染 fields（props.fields 映射）
- [ ] `Button` 组件正确渲染 label

### 6.4 ActionProvider（Phase 2）
- [ ] `emit` 事件可触发（哪怕是 console.log）
- [ ] `ActionProvider` handlers 包含至少一个可触发的 action
- [ ] 按钮点击在 Preview 中有视觉反馈（hover/active）

### 6.5 测试覆盖（必须）
- [ ] `nodesToSpec()` 单元测试：单节点、二层嵌套、多层嵌套、parentId 一致性
- [ ] `catalog.ts` 组件数量与 registry 组件数量一致
- [ ] E2E 测试：点击预览按钮 → 打开 Modal → 渲染内容（非空状态）

### 6.6 构建 & 回归
- [ ] `pnpm build` 通过
- [ ] 修复前后 Playwright 截图对比无意外视觉变化
- [ ] 现有单元测试（5 个）仍然通过

---

## 7. 执行决策

```markdown
## 执行决策
- **决策**: 已采纳
- **执行项目**: vibex-json-render-integration (Phase 1: catalog slots + nodesToSpec + Page 尺寸)
- **执行日期**: 2026-04-14
- **备注**: Phase 2 继续 ActionProvider 实现 + 单元测试补充；Phase 3 考虑 emit 链路和 PageGrid
```

---

*Analyst Agent — 2026-04-14*
