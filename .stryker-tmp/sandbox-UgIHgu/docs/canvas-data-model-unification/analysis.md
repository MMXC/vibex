# VibeX Canvas 前端数据统一 — 需求分析

**项目**: canvas-data-model-unification  
**阶段**: analyze-requirements  
**Analyst**: analyst  
**日期**: 2026-03-31  
**状态**: ✅ 完成（v2: 补充核心设计原则）

---

## 0. 核心设计原则（设计锚点）

> 来源：小羊原话 — 2026-03-31
> 「没有阶段的概念，用户确认画布、后台生成数据、模板套用，理论上都是操作这一个统一的数据，然后画布负责渲染就行，不用管哪个按钮不允许操作，什么确认后才可以下一步，什么回到前一步后面的画布就不能直接返回」

### 四大原则

| # | 原则 | 含义 | 当前实现问题 |
|---|------|------|-------------|
| **PRIN-1** | **无 phase 约束** | `phase: input/context/flow/component/prototype` 状态机是错的；用户应能自由导航，不存在「确认后才能操作下一步」的硬约束 | `canvasStore.phase` 控制按钮可用性，强制线性流程 |
| **PRIN-2** | **单一数据源** | AI 生成、用户确认、模板套用——所有操作都作用在同一份数据；不存在「AI 的数据」和「用户的数据」之分 | 三棵树各自独立更新，无统一写入层；`confirmationStore` 有独立的 `BoundedContext` 与 `canvasStore` 不兼容 |
| **PRIN-3** | **画布即渲染层** | 画布只负责渲染数据，不知道业务规则；操作按钮可以存在，但按钮的「允许/禁止」由外部数据状态决定，而非画布自己维护的 phase | `handlePhaseClick` 限制只能回退不能前进；`areAllConfirmed` 决定是否解锁下一步 |
| **PRIN-4** | **无 confirmed 状态** | 「确认」是多余设计；节点只有三种状态：active（勾选）/ inactive（不勾选）/ deleted（删除）；删除 = 不要，不勾选 ≠ 不要（只是不参与本次生成） | `node.confirmed: boolean` + `confirmContextNode()` + `confirmAllComponentNodes()` 是多余的门控操作；`cascadeContextChange` pending 逻辑需要重新设计 |
| **PRIN-5** | **无状态约束** | 用户可自由编辑任意节点；「确认」只是一种节点状态标记，不是流程门控（已被 PRIN-4 覆盖） | `areAllConfirmed` 控制 phase 前进；`confirmAllComponentNodes` 批量确认后才允许创建项目 |
| **PRIN-6** | **单一 JSON 可导出/导入** | 一份 JSON 包含所有三棵树数据，能完整重建 canvas；通过 URL query/fragment 编码实现「复制链接即分享」；模板本质上是「模板 JSON」 | 当前无统一 JSON schema；三树数据分散在不同 store，无法一次性序列化 |
| **PRIN-7** | **URL 长度安全** | 分享链接 URL 长度 < 2KB（浏览器限制）；超过限制时使用 LZ-String 压缩或文件下载兜底 | 当前无 URL 分享机制 |

### 对统一数据模型的影响

```
统一数据模型 = CanvasData（画布数据）+ CanvasRenderer（渲染层）
                         ↓
              CanvasData 是唯一的真数据源
              CanvasRenderer 是纯展示组件，只读 CanvasData
              所有操作（AI/用户/模板）都 → CanvasData
```

---

## 1. 现有 Store 审计

### 1.1 canvasStore（1288 行，Zustand + persist）

| Slice | 字段 | 说明 |
|-------|------|------|
| **Phase** | `phase`, `activeTree` | 当前阶段和活跃树 |
| **Panel Collapse** | `*PanelCollapsed` | 三面板折叠状态 |
| **Expand** | `leftExpand/centerExpand/rightExpand`, `expandMode` | 面板展开状态 |
| **Context** | `contextNodes: BoundedContextNode[]`, `contextDraft` | 限界上下文树 |
| **Flow** | `flowNodes: BusinessFlowNode[]`, `flowDraft` | 业务流程树 |
| **Component** | `componentNodes: ComponentNode[]`, `componentDraft` | 组件树 |
| **Multi-Select** | `selectedNodeIds: Record<TreeType, string[]>` | 多选状态 |
| **Queue** | `projectId`, `prototypeQueue: PrototypePage[]` | 项目和原型队列 |
| **AI Thinking** | `aiThinking`, `aiThinkingMessage`, `requirementText` | AI 思考状态 |
| **Left/Right Drawer** | `leftDrawerOpen/rightDrawerOpen`, `leftDrawerWidth/rightDrawerWidth` | 左右抽屉 |
| **SSE** | `sseStatus`, `sseError`, `abortControllerRef` | SSE 连接状态 |
| **Flow Generation** | `flowGenerating`, `flowGeneratingMessage` | 流程生成状态 |
| **Drag** | `draggedNodeId`, `draggedPositions` | 拖拽状态 |
| **Bounded Group** | `boundedGroups`, `boundedEdges`, `flowEdges` | 分组和连线 |

**persist 范围**: `projectId`, `draggedPositions`, `boundedGroups`, `boundedEdges`, `flowEdges`, `leftExpand/centerExpand/rightExpand`

### 1.2 messageDrawerStore（120 行，Zustand + persist）

```typescript
interface MessageItem {
  id: string;
  type: 'user_action' | 'ai_suggestion' | 'system' | 'command_executed';
  content: string;
  meta?: string;
  timestamp: number;
}
// 状态：isOpen, messages: MessageItem[]
// persist: 仅 messages（不含 isOpen）
```

**与 canvasStore 的关联**: 独立存在，通过 `addNodeMessage()` / `addSystemMessage()` / `addCommandMessage()` 手动调用，**无自动联动**

### 1.3 historySlice（315 行，Zustand + persist）

```typescript
interface HistoryStack<T> {
  past: T[];      // 最多 50 步
  present: T;
  future: T[];
}
// 三树独立历史栈：contextHistory / flowHistory / componentHistory
// persist: 是（localStorage）
```

**与 canvasStore 的关联**: 通过 `initAllHistories()` / `recordSnapshot()` / `undo()` / `redo()` 与 canvasStore 手动同步

### 1.4 confirmationStore（465 行，Zustand + persist）

```typescript
// 独立于 canvasStore 的确认流程：
// - ConfirmationStep: input → context → model → clarification → flow → success
// - BoundedContext, DomainModel, BusinessFlow, ClarificationRound
// - 完整的确认流程快照系统
```

**与 canvasStore 的关联**: **完全独立**，`BoundedContext` 和 `BusinessFlow` 结构与 `BoundedContextNode` / `BusinessFlowNode` **不兼容**

---

## 2. 当前问题分析

### 2.1 问题汇总（对照核心原则）

| # | 问题（违反原则） | 影响 | 优先级 |
|---|------|------|--------|
| P1 | **违反 PRIN-2**：三棵树（context/flow/component）无顶层统一结构，`projectId` 是唯一关联字段 | 无法一次性序列化/反序列化整个画布状态；AI 数据与用户数据无法互通 | P0 |
| P2 | **违反 PRIN-2**：`confirmationStore` 的 `BoundedContext` 与 `canvasStore` 的 `BoundedContextNode` 结构不兼容 | 同一份数据两份定义，状态不一致 | P0 |
| P3 | **违反 PRIN-3**：`canvasStore.phase` 控制按钮可用性，画布自己维护流程门控（`areAllConfirmed`） | 画布承担了业务规则，不符合「画布即渲染层」原则 | P0 |
| P4 | **违反 PRIN-4**：`handlePhaseClick` 只允许回退不允许前进；`confirmAllComponentNodes` 批量确认后才允许创建项目 | 状态约束强制线性流程，用户无法自由编辑 | P0 |
| P5 | `messageDrawerStore` 与 `canvasStore` 无自动联动，需手动调用 `addNodeMessage()` | 消息记录容易遗漏，维护成本高 | P1 |
| P6 | `historySlice` 与 `canvasStore` 需手动同步 `recordSnapshot()` | 每次节点操作都需显式调用，容易遗漏 | P1 |
| P7 | 无顶层 `CanvasSession` 概念，`sessionId` 散落在 `canvasApi.generateComponents()` 调用处 | 无法统一管理会话生命周期 | P1 |
| P8 | **违反 PRIN-4**：`node.confirmed` + `confirmContextNode()` + `confirmAllComponentNodes()` 是多余的门控设计；`cascadeContextChange` 的 pending 逻辑依赖 confirmed 状态 | 用户需要单独的确认操作才能让节点「参与生成」，而非直接通过勾选控制 | P0 |
| P9 | **违反 PRIN-4**：删除节点 vs 不勾选节点的行为混用；`isDeleted` 和 `confirmed` 两种机制并存 | 用户不清楚「确认」和「不勾选」的区别 | P0 |
| P10 | AI 思考状态（`aiThinking`）和 SSE 状态（`sseStatus`）散落在 canvasStore 中，无统一会话状态层 | 状态管理碎片化 | P2 |
| P11 | **违反 PRIN-6**：无统一 JSON Schema；三树数据分散在 canvasStore，无法一次性序列化完整画布 | 无法导出完整画布为单 JSON；无法实现 URL 分享 | P0 |
| P12 | **违反 PRIN-6**：现有 `example-canvas.json` 格式与 canvasStore 数据结构不兼容 | 无法直接迁移到新格式 | P1 |
| P13 | **违反 PRIN-7**：URL 分享链接无压缩机制；大画布（>2KB）无兜底方案 | 超过 URL 长度限制时分享失效 | P1 |

### 2.2 数据流现状图（标注违反原则处）

```
❌ 违反 PRIN-2/PRIN-3/PRIN-4：存在多个独立数据源 + 画布维护业务规则

┌─────────────────────────────────────────────────────┐
│   canvasStore (1288行) — 包含 phase 状态机 + 三树  │
│   ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│   │ Context  │  │   Flow   │  │   Component    │  │
│   │  Nodes   │  │   Nodes  │  │   Nodes        │  │
│   └──────────┘  └──────────┘  └────────────────┘  │
│   + phase (线性约束!) + AI状态 + Drawer状态         │
│   ❌ 画布自己维护流程门控（违反 PRIN-3）             │
└─────────────────────────────────────────────────────┘
         ↑手动调用              ↑手动调用        ↑无关联
         recordSnapshot         recordSnapshot
         addNodeMessage
┌─────────────────────────────────────────────────────┐
│    confirmationStore — 独立数据源（违反 PRIN-2）    │
│    BoundedContext ≠ BoundedContextNode（不兼容!）   │
│    BusinessFlow ≠ BusinessFlowNode（不兼容!）        │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│         historySlice (独立 persist)                 │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│       messageDrawerStore (独立 persist)             │
└─────────────────────────────────────────────────────┘
```

### 2.3 目标数据流图（符合核心原则）

```
┌─────────────────────────────────────────────────────────┐
│              CanvasData（唯一的真数据源）               │
│  ┌─────────────────────────────────────────────────┐  │
│  │ sessionId / projectId / requirementText          │  │
│  │ contextNodes / flowNodes / componentNodes         │  │
│  │ messages / history / boundedEdges / flowEdges      │  │
│  │                                                   │  │
│  │ Node 三态（替代 confirmed）：                       │  │
│  │   - node.isActive = true  → 勾选，参与生成        │  │
│  │   - node.isActive = false → 不勾选，不参与生成    │  │
│  │   - node.isDeleted = true → 已删除，不要         │  │
│  └─────────────────────────────────────────────────┘  │
│           ↑ 所有操作（AI生成/用户编辑/模板）都写入这里  │
└─────────────────────────────────────────────────────────┘
                              ↓ 只读
┌─────────────────────────────────────────────────────────┐
│         CanvasRenderer（画布 — 纯渲染层）               │
│  三列树渲染 / 节点卡片 / 工具栏 / 快捷键              │
│  ❌ 不维护任何业务规则（无 phase 状态机）              │
│  ❌ 不控制按钮「允许/禁止」（由 CanvasData 决定）      │
│  ❌ 没有「确认」按钮（勾选 = 参与，不勾选 = 暂不参与）  │
└─────────────────────────────────────────────────────────┘
                              ↓ 读取 isActive 决定参与生成
┌─────────────────────────────────────────────────────────┐
│         OperationPanel（操作按钮面板）                  │
│  「勾选/不勾选」「删除」「生成流程」等按钮            │
│  生成流程时：只取 isActive=true 的节点                │
│  ❌ 不需要「确认」按钮                               │
│  ❌ 不需要 areAllConfirmed 来门控                      │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Jobs-To-Be-Done (JTBD)

| # | JTBD | 用户故事 | 对应原则 | 优先级 |
|---|------|----------|----------|--------|
| JTBD-1 | **消除 phase 状态机** | 作为用户，我希望在任何时候都能编辑任意节点，不受「当前阶段」限制 | PRIN-1 | P0 |
| JTBD-2 | **统一数据模型** | 作为开发者，我希望有一个顶层 `CanvasData` 数据结构包含所有画布状态，以便序列化、持久化和恢复画布会话 | PRIN-2 | P0 |
| JTBD-3 | **消除重复类型** | 作为开发者，我希望 `BoundedContextNode` 和 `BusinessFlowNode` 是唯一的定义，消除与 `confirmationStore` 的类型重复 | PRIN-2 | P0 |
| JTBD-4 | **画布纯渲染** | 作为开发者，我希望画布组件只负责渲染，不知道业务规则；按钮的可用性由 CanvasData 的状态决定 | PRIN-3 | P0 |
| JTBD-5 | **无状态约束** | 作为用户，我希望能自由编辑任意节点，确认只是状态标记，不是流程门控 | PRIN-4 | P1 |
| JTBD-6 | **自动消息联动** | 作为用户，我希望节点操作自动记录到消息抽屉，无需手动调用 | — | P1 |
| JTBD-7 | **统一会话生命周期** | 作为用户，我希望切换项目时自动保存当前会话状态，并恢复新会话的完整状态 | — | P1 |
| JTBD-8 | **历史自动记录** | 作为用户，我希望所有节点操作自动记录历史，无需手动调用 `recordSnapshot()` | — | P1 |
| JTBD-9 | **消除 confirmed 字段** | 作为用户，我只用勾选/不勾选/删除来控制节点；不需要「确认」操作；勾选的节点直接参与下一步生成 | PRIN-4 | P0 |
| JTBD-10 | **单一 JSON 导出/导入** | 作为用户，我希望导出一份 JSON 后能完整重建画布（包括三棵树和节点关系）；作为设计师，我希望分享模板链接 | PRIN-6 | P0 |
| JTBD-11 | **URL 分享** | 作为用户，我希望复制一个链接就能分享画布给对方；超过 URL 长度时有兜底下载方案 | PRIN-6, PRIN-7 | P1 |

---

## 4. 技术方案对比

### 方案 A：统一 CanvasSession 类型（推荐）

**思路**: 定义顶层 `CanvasSession` 接口，将所有 store 纳入统一结构，通过 Zustand slice composition 重建 store。

```typescript
// types.ts — 新增统一类型
interface CanvasSession {
  sessionId: string;
  projectId: string | null;
  createdAt: number;
  updatedAt: number;
  
  // 阶段
  phase: Phase;
  activeTree: TreeType | null;
  
  // 三棵树（唯一定义，消除重复）
  contextNodes: BoundedContextNode[];
  flowNodes: BusinessFlowNode[];
  componentNodes: ComponentNode[];
  
  // 元数据
  requirementText: string;
  
  // AI/SSE 状态
  aiStatus: 'idle' | 'generating' | 'done' | 'error';
  aiMessage: string | null;
  sseStatus: SSEStatus;
  
  // UI 状态（会话级）
  drawerState: {
    leftOpen: boolean;
    rightOpen: boolean;
    leftWidth: number;
    rightWidth: number;
  };
  
  // 消息历史
  messages: MessageItem[];
  
  // 节点关系（与三树分离，减少嵌套）
  boundedEdges: BoundedEdge[];
  flowEdges: FlowEdge[];
  boundedGroups: BoundedGroup[];
}
```

**优点**:
- 顶层统一，序列化/反序列化简单（一个 JSON）
- 消除 `confirmationStore` 与 `canvasStore` 的类型重复
- 历史记录可以基于 `CanvasSession[]` 实现版本化
- 消息自动联动可作为 middleware 实现

**缺点**:
- 重构范围大，，涉及 4 个 store 的合并
- 需处理 persist 兼容（迁移旧数据）
- Zustand middleware 的自动联动需要仔细设计

**预估工时**: 30-40h（大规模重构）

---

### 方案 B：类型统一 + Store 分离（保守）

**思路**: 保持现有 store 结构不变，仅统一类型定义和共享类型文件，同时新增 `useCanvasSession` 组合 hook。

```typescript
// 新增 useCanvasSession.ts — 组合 hook
function useCanvasSession() {
  const contextNodes = useCanvasStore((s) => s.contextNodes);
  const flowNodes = useCanvasStore((s) => s.flowNodes);
  const componentNodes = useCanvasStore((s) => s.componentNodes);
  const messages = useMessageDrawerStore((s) => s.messages);
  const projectId = useCanvasStore((s) => s.projectId);
  // ...
  return { sessionId, projectId, contextNodes, flowNodes, componentNodes, messages };
}
```

**优点**:
- 渐进式改动，风险低
- 不破坏现有 persist 数据
- 可以在 PM 迭代中逐步完成

**缺点**:
- 类型统一了但 store 还是分离的，长期技术债务
- 消息联动仍需手动调用
- 无法解决 confirmationStore 的重复类型问题

**预估工时**: 8-12h

---

### 方案 C：DDD 聚合根重构（激进）

**思路**: 将 canvasStore 改造成 DDD 聚合根，三棵树作为聚合内的实体，消息、历史作为领域事件。

**优点**:
- 架构最清晰，符合 DDD 原则
- 天然支持命令溯源（event sourcing）扩展

**缺点**:
- 需要引入新的状态管理框架（xState 或类似）
- 开发周期长（> 3 周）
- 对现有功能侵入性最强

**预估工时**: 60-80h

---

## 5. JSON Schema 设计（PRIN-6 & PRIN-7）

### 5.1 CanvasJSON Schema（草案）

```typescript
// CanvasJSON — 统一导出/导入/分享格式（PRIN-6）
interface CanvasJSON {
  version: string;           // e.g. "2.0.0" — 用于 migration
  exportedAt: string;         // ISO timestamp

  // 顶层元数据
  meta: {
    name: string;            // 画布名称
    description?: string;
    author?: string;
    tags?: string[];
  };

  // 三棵树（核心数据）
  trees: {
    context: ContextNode[];   // BoundedContextNode[]
    flow: FlowNode[];        // BusinessFlowNode[]
    component: ComponentNode[]; // ComponentNode[]
  };

  // 节点关系（与三树平级，避免嵌套过深）
  relationships: {
    boundedEdges?: BoundedEdge[];
    flowEdges?: FlowEdge[];
    boundedGroups?: BoundedGroup[];
  };

  // 勾选状态（PRIN-4: 用 isActive 替代 confirmed）
  // 仅导出 isActive=true 的节点（参与本次生成）
  activeNodeIds?: string[];   // 可选：标记参与生成的节点

  // 可选附加数据
  attachments?: {
    requirementText?: string;
    messages?: MessageItem[];  // 最近 N 条消息
  };
}

// 模板格式（模板 = 无 activeNodeIds 的 CanvasJSON）
type CanvasTemplate = Omit<CanvasJSON, 'activeNodeIds'>;
```

### 5.2 URL 分享策略（PRIN-7）

| 策略 | 适用场景 | 实现方式 |
|------|----------|----------|
| **URL Fragment（推荐）** | 画布 < 2KB | `/#/canvas?data=<base64(JSON)>`，fragment 不发送服务器 |
| **URL Query** | 画布 < 2KB | `/?canvas=<lz-string(JSON)>`，需 URLEncode |
| **文件下载兜底** | 画布 > 2KB | 生成 `.canvas.json` 文件，URL 指向文件 |
| **IndexedDB 兜底** | 大画布本地缓存 | 分享短 ID（如 `?id=abc123`），数据存 IndexedDB |

```typescript
// URL 编码/解码工具
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';

function shareCanvas(canvasJSON: CanvasJSON): string {
  const json = JSON.stringify(canvasJSON);
  if (json.length < 2000) {
    // 小画布：用 URL fragment（最简洁）
    const encoded = btoa(unescape(encodeURIComponent(json)));
    return `${window.location.origin}/canvas?data=${encoded}`;
  } else {
    // 大画布：用 LZ-String 压缩
    const compressed = compressToEncodedURIComponent(json);
    if (compressed.length < 4000) {
      return `${window.location.origin}/canvas?lz=${compressed}`;
    } else {
      // 超过 4KB：文件下载兜底
      downloadJSON(canvasJSON);
      return `${window.location.origin}/canvas?download=true`;
    }
  }
}
```

### 5.3 与现有 example-canvas.json 的兼容性

现有 `example-canvas.json` 格式与新 CanvasJSON 不兼容，迁移方案：

| 现有字段 | 新字段 | 迁移方式 |
|----------|--------|----------|
| `contextNodes[]` | `trees.context[]` | 直接映射 |
| `flowNodes[]` | `trees.flow[]` | 直接映射 |
| `componentNodes[]` | `trees.component[]` | 直接映射 |
| 无 | `version: "2.0.0"` | 新增，标记迁移后格式 |
| 无 | `meta.name` | 从项目名或 "Imported Canvas" 填充 |
| `node.confirmed` | `node.isActive` | `confirmed=true` → `isActive=true` |

---

## 5（续）. 推荐方案

**推荐方案 B（类型统一 + Store 分离）作为 Phase 1，方案 A（统一 CanvasData）作为 Phase 2**

**原因**:
1. 方案 C（DDD 聚合根）太激进，不适合当前迭代节奏
2. 方案 A 重构范围大（30-40h），风险高
3. 方案 B 改动小（8-12h），收益明确（消除类型重复 + 组合 hook）
4. **JTBD-1（消除 phase 状态机）** 在 Phase 1 中通过移除 phase 对按钮的门控实现，无需等待数据模型重构

### Phase 1 关键改动（方案 B）

| 改动 | 文件 | 说明 | 对应 JTBD |
|------|------|------|-----------|
| **移除 phase 状态机门控** | `CanvasPage.tsx` | 删除 `areAllConfirmed` 对按钮的门控；`handlePhaseClick` 不再限制前进 | JTBD-1, JTBD-4 |
| **移除 confirmed 字段，替换为 isActive** | `types.ts` + 所有组件 | `node.confirmed` → `node.isActive`；删除 `confirmContextNode()` / `confirmFlowNode()` / `confirmComponentNode()` / `confirmAllComponentNodes()`；生成流程时直接过滤 `isActive=true` 的节点 | JTBD-9 |
| **重新设计 cascade 逻辑** | `cascade.ts` | `cascadeContextChange` 等不再依赖 `confirmed`，改为基于 `isActive` | JTBD-9 |
| 消除 `confirmationStore` 重复类型 | `confirmationTypes.ts` → `canvas/types.ts` | `BoundedContext` → `BoundedContextNode`，删除重复定义 | JTBD-3 |
| 新增 `useCanvasData` hook | `lib/canvas/useCanvasData.ts` | 组合所有 store，提供统一读取接口 | JTBD-2 |
| 新增 `bindHistoryMiddleware` | `lib/canvas/historyMiddleware.ts` | Zustand middleware，自动 recordSnapshot | JTBD-8 |
| 新增 `bindMessageMiddleware` | `lib/canvas/messageMiddleware.ts` | Zustand middleware，自动 addNodeMessage | JTBD-6 |

### Phase 2 关键改动（方案 A）

| 改动 | 说明 | 对应 JTBD |
|------|------|-----------|
| 合并 `messageDrawerStore` → `canvasStore` | 作为 canvasStore 的 slice | JTBD-2 |
| 合并 `historySlice` → `canvasStore` | 作为 canvasStore 的 slice | JTBD-2 |
| 消除 `confirmationStore` 完整引用 | 完全引用 `canvasStore`，删除独立 store | JTBD-2, JTBD-3 |
| 新增 `CanvasData` 持久化 | 整个会话作为单个 JSON 存储，version 化管理 | JTBD-2 |

---

## 6. 技术风险识别

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| **移除 `confirmed` 导致 cascade 逻辑失效** | **极高** | `cascadeContextChange` 等依赖 `confirmed` 的逻辑需要同步重构；建议先梳理所有 `confirmed` 引用点再动手 |
| Phase 1 改动后 persist 数据格式变化（migration） | 高 | 实现 `migrate` 函数，处理旧版本数据（`confirmed` → `isActive=true`） |
| middleware 循环触发（recordSnapshot 触发 store 更新 → 再次 recordSnapshot） | 高 | middleware 内加 `isRecording` flag 防止递归 |
| `confirmationStore` 引用方（多个页面）改动成本 | 中 | 逐个页面迁移，不一次性替换 |
| Zustand persist 版本管理 | 中 | 显式 `version` 字段，每次 breaking change 递增 |
| 与 canvas-drawer-msg 项目的消息 store 冲突 | 中 | 确认 `messageDrawerStore` 即为最终实现，复用不合并 |

---

## 7. 验收标准

| ID | 验收条件 | 对应原则 | 测试方法 |
|----|----------|----------|----------|
| **AC-0** | **phase 状态机已移除**：`handlePhaseClick` 不再限制前进；`areAllConfirmed` 不再控制按钮可用性 | PRIN-1 | 刷新页面 → 在 input 阶段点击「继续到流程树」→ 按钮可用 |
| **AC-1** | `confirmationTypes.ts` 不再包含与 `types.ts` 重复的 `BoundedContext` / `BusinessFlow` 定义 | PRIN-2 | 代码搜索，无重复类型 |
| **AC-2** | `useCanvasData()` hook 返回完整的会话信息（sessionId + 三棵树 + messages + projectId） | PRIN-2 | 单元测试 hook 返回值 |
| **AC-3** | 新增节点后，`historySlice` 自动记录快照，无需手动调用 | — | 触发 `addContextNode` → 检查 historySlice.past.length 增加 |
| **AC-4** | 新增/确认/删除节点后，`messageDrawerStore.messages` 自动追加记录 | — | 触发节点操作 → 检查 messages.length |
| **AC-5** | 刷新页面后，`useCanvasData()` 返回的 session 数据完整恢复 | PRIN-2 | 刷新页面 → 验证所有状态恢复 |
| **AC-6** | `CanvasData` 可序列化为单个 JSON，大小 < 1MB（1000 节点以内） | PRIN-2 | 填充测试数据 → JSON.stringify → 验证大小 |
| **AC-7** | 旧版本 persist 数据迁移后不会丢失（migration 测试） | — | 清除 localStorage → 写入旧格式 → 加载 → 验证数据完整 |
| **AC-8** | 在任意 phase，用户都可以触发 AI 生成（如「生成流程树」），不受当前阶段限制 | PRIN-1, PRIN-4 | 切换到 component phase → 仍能触发「生成流程树」 |
| **AC-9** | 「确认」节点只是视觉状态标记，不阻止任何其他操作 | PRIN-4 | 确认一个 context 节点后，仍能编辑/删除其他未确认的节点 |
| **AC-10** | `node.confirmed` 字段已移除，所有节点使用 `node.isActive` 控制参与生成 | PRIN-4 | 代码搜索确认无 `confirmed` 字段；`isActive=true` 的节点参与生成，`isActive=false` 不参与 |
| **AC-11** | 无 `confirmContextNode()` / `confirmFlowNode()` / `confirmAllComponentNodes()` 方法 | PRIN-4 | 代码搜索确认无这些方法 |
| **AC-12** | `cascadeContextChange` 等 cascade 逻辑不再依赖 confirmed 状态 | PRIN-4 | 验证 cascade 行为与 isActive 联动 |
| **AC-13** | CanvasJSON 可导出：canvasJSON = exportCanvasJSON(canvasStore)，包含三棵树和节点关系 | PRIN-6 | 导出 JSON → 验证包含 contextNodes/flowNodes/componentNodes/boundedEdges |
| **AC-14** | CanvasJSON 可导入：`importCanvasJSON(json)` 后三棵树完全恢复 | PRIN-6 | 导出 → 清空 store → 导入 → 验证数据一致 |
| **AC-15** | URL 分享链接 < 2KB 时直接通过 URL 编码分享 | PRIN-7 | 生成链接 → 复制到新标签页 → 验证画布正确加载 |
| **AC-16** | 画布 > 2KB 时提供文件下载兜底 | PRIN-7 | 生成大画布 → 验证出现下载选项而非超长 URL |
| **AC-17** | 现有 example-canvas.json 可迁移到新 CanvasJSON 格式 | PRIN-6 | 导入旧 example → 验证 version="2.0.0" 且数据正确 |

---

## 8. 与相关项目的关系

| 项目 | 关系 | 建议 |
|------|------|------|
| `canvas-drawer-msg` | 右抽屉消息功能依赖 `messageDrawerStore` | Phase 1 保留 `messageDrawerStore` 不合并，Phase 2 再考虑 |
| `canvas-drawer-persistent` | 左右抽屉状态（`leftDrawerOpen` 等）已在 canvasStore | 可直接复用，无需改动 |
| `canvas-data-model-unification` | 本项目 | — |

---

## 9. 实施计划（初步）

### Phase 1（方案 B）：15-20h（工作量增加，因涉及 confirmed 字段移除）

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 1 | **移除 confirmed 字段**：替换为 `isActive`；删除所有 `confirm*` 方法；更新 types.ts | 3h |
| Epic 2 | **重构 cascade 逻辑**：`cascadeContextChange` 等基于 `isActive` 而非 `confirmed` 重写 | 2h |
| Epic 3 | **移除 phase 状态机门控**：删除 `areAllConfirmed`；`handlePhaseClick` 不再限制前进 | 2h |
| Epic 4 | 消除 confirmationStore 重复类型 | 2h |
| Epic 5 | 新增 useCanvasData hook | 2h |
| Epic 6 | 实现 historyMiddleware（自动 recordSnapshot） | 3h |
| Epic 7 | 实现 messageMiddleware（自动 addNodeMessage） | 2h |
| Epic 8 | Migration 测试 + 回归测试 | 3h |

### Phase 2（方案 A）：30-40h

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 9 | 合并 messageDrawerStore → canvasStore | 4h |
| Epic 10 | 合并 historySlice → canvasStore | 4h |
| Epic 11 | 设计 CanvasJSON Schema 并实现导出/导入 | 5h |
| Epic 12 | 实现 URL 分享（含 LZ-String 压缩 + 文件下载兜底） | 4h |
| Epic 13 | 实现 example-canvas.json 迁移到新格式 | 2h |
| Epic 14 | 消除 confirmationStore 完整引用 | 4h |
| Epic 15 | E2E 测试 + 回归测试 | 6h |

### Phase 2（方案 A）：30-40h

| Epic | 内容 | 工时 |
|------|------|------|
| Epic 6 | 合并 messageDrawerStore → canvasStore | 4h |
| Epic 7 | 合并 historySlice → canvasStore | 4h |
| Epic 8 | 设计 CanvasSession 持久化格式 | 3h |
| Epic 9 | 实现 CanvasSession persist migration | 3h |
| Epic 10 | 消除 confirmationStore 完整引用 canvasStore | 4h |
| Epic 11 | E2E 测试 + 回归测试 | 6h |

**总预估工时**: Phase 1: 8-12h + Phase 2: 30-40h

---

## 10. 下一步

1. **PM**: 评审 Phase 1 / Phase 2 划分，确认优先级
2. **Architect**: 确认 Zustand middleware 方案的技术可行性
3. **Coord**: 确认与 `canvas-drawer-msg` 的 store 共存策略

---

*分析文档完毕。*
