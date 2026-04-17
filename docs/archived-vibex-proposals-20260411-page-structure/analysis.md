# Analysis: 组件树按页面+通用部分组织，支持 pageId+pageName+JSON预览渲染

**Project**: vibex-proposals-20260411-page-structure  
**Stage**: analyze-requirements  
**Analyst**: Analyst  
**Date**: 2026-04-07  
**Status**: Research Complete

---

## 1. Research Findings

### 1.1 Git History 关键 Lessons

| # | Lesson | Source |
|---|--------|--------|
| L1 | 分组逻辑从单维度(flowId)→双维度(flowId+type)→4层fallback，逐步演进 | ComponentTree.tsx 32次提交 |
| L2 | Common 组件 label 从"未知页面"→"❓flowId"→"🔧 通用组件"，体现UX打磨 | git commit fc8162d3 |
| L3 | JSON Preview 是独立能力，需先建立 catalog+registry+error boundary | git commit 307ab9fd |
| L4 | Store 拆分(1451→170行)是独立Epic，不能在功能迭代中顺手做 | git commit bd4ec0c2 |
| L5 | `matchFlowNode()` 共享函数抽取后，测试从失败→29 tests pass | git commit 7e2b8278 |

### 1.2 Institutional Learnings

- `docs/learnings/react-hydration-fix.md` — Hydration问题模式：SSR/客户端不一致 → 日期格式化方案
- `docs/learnings/canvas-testing-strategy.md` — Canvas测试策略：分组逻辑有224行单元测试覆盖
- `docs/learnings/vibex-e2e-test-fix.md` — E2E测试稳定性：testDir配置限制了测试发现

### 1.3 现有组件树架构

**数据模型** (`types.ts`):
- `ComponentNode.flowId: string` — 关联到 BusinessFlowNode.nodeId
- `ComponentNode.name: string` — 组件名称
- `ComponentNode.type: ComponentType` — 'page'|'form'|'list'|'detail'|'modal'

**分组逻辑** (`ComponentTree.tsx`):
```
groupByFlowId(nodes, flowNodes) → ComponentGroup[]
  ├─ 通用组(置顶): isCommon=true 的组件 → flowId∈{mock,manual,common,__ungrouped__,''} 或 type∈通用组件类型集
  └─ 页面组: 其他组件 → 按 flowId 映射到 BusinessFlowNode.name
```

**标签生成** (`getPageLabel`):
```
1. 精确匹配 nodeId
2. Prefix 匹配
3. 名称模糊匹配(忽略 - _ 空格)
4. 兜底: ❓shortId 或 🔧 通用组件
```

**JSON Preview**:
- 已集成 `@json-render/core + @json-render/react`
- `vibexCanvasCatalog` 定义了10个组件 + Zod schemas
- `CanvasPreviewModal` 集成在 CanvasPage toolbar

---

## 2. 业务场景分析

### 2.1 当前问题

| # | 问题 | 根因 |
|---|------|------|
| P1 | 页面名称依赖 BusinessFlowNode.name，无法独立配置 | flowId 是唯一分组键，无 pageId 概念 |
| P2 | 用户无法直观看到组件的页面归属关系 | 分组只展示 BusinessFlowNode.name，不展示 pageId |
| P3 | JSON Preview 功能分散，无统一入口查看组件树结构 | CanvasPreviewModal 仅展示单组件，非树结构视角 |
| P4 | 通用组件和非通用组件区分不够明显 | 只有 flowId + type 两维判断，用户感知弱 |

### 2.2 目标用户

| 用户类型 | 核心诉求 |
|----------|----------|
| 产品经理 | 快速查看组件归属的页面，直观了解全量结构 |
| 开发者 | 导出代码时知道组件属于哪个页面，便于组织文件结构 |
| AI Agent | 基于 pageId+pageName 理解组件的页面归属，生成更准确的代码 |

---

## 3. 需求澄清

### 3.1 核心需求

| # | 需求 | 描述 |
|---|------|------|
| R1 | pageId 字段 | 每个组件节点需要一个明确的 pageId，用于标识组件归属的页面 |
| R2 | pageName 字段 | 每个页面需要一个可配置的展示名称（可独立于 flowName） |
| R3 | JSON 预览渲染 | 组件树支持 JSON 格式预览，展示 pageId+pageName+组件结构 |
| R4 | 通用组件分离 | 通用组件组保持置顶，视觉上与页面组件区分 |

### 3.2 待确认问题

> **Q1**: `pageId` 与现有 `flowId` 的关系是什么？
> - A: `pageId = flowId`（复用 flowId 作为页面标识）
> - B: `pageId` 是独立字段，与 flowId 一对多
> - C: `pageId` 由 `contextId + flowId` 组合生成

> **Q2**: `pageName` 是否允许用户自定义，还是只能从 BusinessFlowNode.name 派生？

> **Q3**: JSON 预览是新增功能还是增强现有 CanvasPreviewModal？

---

## 4. 技术方案选项

### 方案 A: 最小增强（推荐）

**核心思路**: 复用现有 `flowId` 作为 `pageId`，增强 `pageName` 展示，增加 JSON 预览入口

```
Type 修改:
  ComponentNode {
    + pageName?: string  // 新增可选字段，允许覆盖 BusinessFlowNode.name
  }

  ComponentGroup {
    + pageId: string     // 从 groupId 提取
    + pageName: string   // 显示名称
    + componentCount: number
  }
```

**实现内容**:
1. ComponentNode 增加 `pageName?: string` 可选字段
2. `getPageLabel()` 优先使用 `pageName`，fallback 到 BusinessFlowNode.name
3. ComponentGroup 增加 pageId + componentCount 元数据
4. 组件树顶部添加「JSON 预览」按钮，点击弹出 JSON 树视图
5. JSON 视图展示: `{ pageId, pageName, components: [{nodeId, name, type, flowId}] }`

**工作量**: ~3h
**风险**: 低（增量修改，不破坏现有逻辑）

---

### 方案 B: 中等增强

**核心思路**: 引入独立的 Page 概念，组件与页面解耦

```
新增类型:
  interface Page {
    pageId: string
    pageName: string
    flowId?: string      // 可选关联到 BusinessFlowNode
    componentIds: string[]
  }

  ComponentNode {
    pageId: string       // 必填，与 Page.pageId 对应
    pageName?: string    // 覆盖 Page.pageName
  }
```

**实现内容**:
1. 新增 PageStore 管理页面列表
2. 组件树左侧增加「页面管理」面板（添加/重命名/删除页面）
3. 拖拽组件到页面卡片，实现归属变更
4. JSON 预览展示完整 Page→Component 树结构
5. 通用组件单独一个 Page，pageId='__common__'

**工作量**: ~8h
**风险**: 中（涉及 store 重构，需测试覆盖）

---

### 方案 C: 完全重构

**核心思路**: 组件树完全按 Page 维度重组，通用组件作为特殊 Page

```
数据结构:
  canvasStore.pages: Page[]          // 页面列表
  canvasStore.components: ComponentNode[]  // 组件列表(去掉 flowId)

  Page {
    pageId: string
    pageName: string
    flowId?: string
    isCommon?: boolean   // 通用组件页面
    componentIds: string[]
  }
```

**实现内容**:
1. 废弃 flowId 分组逻辑，改用 pageId
2. 新增 Page 管理 CRUD
3. 组件树完全重构，支持页面折叠/展开
4. JSON 导出支持 Page 结构 + 组件列表

**工作量**: ~15h
**风险**: 高（破坏性变更，影响面广）

---

## 5. 推荐方案

**推荐**: 方案 A（最小增强）

**理由**:
1. **成本最低**: ~3h vs 8h vs 15h
2. **风险可控**: 增量修改，不破坏现有分组逻辑
3. **用户价值**: pageName 可覆盖 + JSON 预览入口，解决核心痛点
4. **符合演进路径**: Git history 显示分组逻辑经历了多轮迭代，大改动的时机未到

---

## 6. 验收标准

### 方案 A 验收标准

- [ ] **AC1**: ComponentNode 新增 `pageName?: string` 字段，TypeScript 类型正确
- [ ] **AC2**: 组件树分组标题显示 `pageName`（优先）或 BusinessFlowNode.name（fallback）
- [ ] **AC3**: 分组信息包含 `pageId` + `componentCount`，JSON 序列化包含这些字段
- [ ] **AC4**: 组件树顶部添加「📋 JSON」按钮，点击弹出 JSON 树视图
- [ ] **AC5**: JSON 视图展示 `{ pages: [{pageId, pageName, componentCount, components: [...]}] }`
- [ ] **AC6**: 通用组件组保持置顶，label 为「🔧 通用组件」，pageId='__common__'
- [ ] **AC7**: 单元测试覆盖 `getPageLabel` + `groupByFlowId` 的 pageName fallback 逻辑
- [ ] **AC8**: E2E 测试验证 JSON 预览按钮可见且点击后显示正确结构

---

## 7. 风险评估

| # | 风险 | 影响 | 缓解 |
|---|------|------|------|
| R1 | pageName 与 BusinessFlowNode.name 不同步 | 低 | pageName 可选，用户主动配置才生效 |
| R2 | JSON 预览数据结构与现有 catalog 不兼容 | 低 | JSON 预览是独立视图，不影响现有功能 |
| R3 | 组件拖拽到页面功能超出方案范围 | 低 | 方案A不含拖拽，仅静态展示 |

---

## 8. 下一步

1. **等待用户确认**: Q1/Q2/Q3 三个待确认问题
2. **确认后**: 更新 analysis.md，补充方案 A 详细实现步骤
3. **创建 PRD**: 产出 `prd.md` 供后续开发使用

---

## Appendix A: Research Artifacts

### A.1 Git History (Key Commits)

```
4de7dbb0 — 首次引入 groupByFlowId 按 flowId 虚线框包裹组件组
a283223c — inferIsCommon() 增加 COMMON_COMPONENT_TYPES（25种），4层fallback
7e2b8278 — 抽取 matchFlowNode() 共享函数，224行单元测试
fc8162d3 — getPageLabel mock/manual/空→🔧通用组件，测试29 pass
547a4858 — 分组批量确认功能 F3.1-F3.3
bd4ec0c2 — Store 拆分 1451→170行，修复194个TS错误
307ab9fd — @json-render/core+@json-render/react 集成，vibexCanvasCatalog
```

### A.2 文件路径索引

| 文件 | 用途 |
|------|------|
| `vibex-fronted/src/components/canvas/ComponentTree.tsx` | 组件树主组件，含分组逻辑 |
| `vibex-fronted/src/components/canvas/groups/ComponentGroupOverlay.tsx` | SVG虚线框分组覆盖层 |
| `vibex-fronted/src/components/canvas/ComponentTreeCard.tsx` | 组件卡片组件 |
| `vibex-fronted/src/components/visualization/JsonTreeRenderer/JsonTreeRenderer.tsx` | JSON树渲染器 |
| `vibex-fronted/src/lib/canvas/types.ts` | 核心类型定义 |
| `vibex-fronted/src/components/canvas/__tests__/CommonComponentGrouping.test.tsx` | 分组逻辑单元测试 |

---

*Research completed. Awaiting clarification on Q1/Q2/Q3.*
