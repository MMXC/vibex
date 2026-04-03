# Architecture: VibeX Canvas Living JSON — 选择驱动生成模式

**项目**: vibex-canvas-living-json
**日期**: 2026-03-31
**状态**: Draft v2（已根据用户澄清更新）

---

## 1. 核心设计原则

### PRIN-1：单一数据源
Canvas 唯一真实来源是 `CanvasDocument`。所有操作（对话框生成、重新生成）都修改这棵树。UI = 树的投影。

### PRIN-2：选择驱动生成
用户必须先选择节点，再触发生成命令。没有自由文本编辑，只能通过"选中 + 按钮"操作。

### PRIN-3：无自动联动
修改上游节点不会自动修改下游。用户必须显式选择上游节点并点击"重新生成"或"生成下一步"。

### PRIN-4：空树初始状态
画布打开时，三棵树存在但节点数组为空。用户通过对话框输入需求，AI 填充第一棵 context 树。

### PRIN-5：JSON 可导入/导出
一份 JSON 包含完整三棵树，可导出为文件或通过 URL 分享。

---

## 2. CanvasDocument Schema（JSON Schema v2）

```typescript
interface CanvasDocument {
  metadata: {
    id: string;           // UUID
    name: string;        // 项目名称
    version: number;      // 递增版本号
    createdAt: string;    // ISO 8601
    updatedAt: string;    // ISO 8601
  };

  /** 限界上下文树（初始为空）*/
  contextNodes: BoundedContextNode[];

  /** 业务流程树（初始为空）*/
  flowNodes: FlowNode[];

  /** 组件树（初始为空）*/
  componentNodes: ComponentNode[];
}

// 限界上下文节点
interface BoundedContextNode {
  nodeId: string;
  name: string;
  description: string;
  type: 'core' | 'supporting' | 'generic' | 'external';
  /** 生成状态：idle=可生成, generating=生成中, done=已完成, error=失败 */
  status: 'idle' | 'generating' | 'done' | 'error';
  /** 节点来源：manual=用户手动, generated=AI生成 */
  source: 'manual' | 'generated';
  parentId?: string;
  children: string[];   // 子节点 ID 列表
}

// 业务流程节点
interface FlowNode {
  nodeId: string;
  /** 引用 contextNodes 中的 nodeId */
  contextId: string;
  name: string;
  steps: FlowStep[];
  status: 'idle' | 'generating' | 'done' | 'error';
  source: 'manual' | 'generated';
  parentId?: string;
  children: string[];
}

interface FlowStep {
  stepId: string;
  name: string;
  actor: string;
  description?: string;
  order: number;
}

// 组件节点
interface ComponentNode {
  nodeId: string;
  /** 引用 flowNodes 中的 nodeId */
  flowId: string;
  name: string;
  type: string;
  props?: Record<string, unknown>;
  status: 'idle' | 'generating' | 'done' | 'error';
  source: 'manual' | 'generated';
  parentId?: string;
  children: string[];
}
```

### 与现有 schema 对比

| 现有字段 | 变更 | 原因 |
|---------|------|------|
| `phase` | **移除** | 无阶段概念 |
| `confirmed` | **移除** | 无确认门控 |
| `NodeStatus.pending` | → `status: idle` | pending 语义不清 |
| `cascadePending` | **移除** | 无自动联动 |
| `exampleCanvasData` | 初始空数组 | 从空树开始 |

---

## 3. 生成命令映射

| 用户操作 | 触发条件 | AI 输入 | 产出 |
|---------|---------|--------|------|
| 对话框输入需求 | 未选中任何卡片 | 原始需求文本 | contextNodes[]（覆盖或追加）|
| 点击"生成流程" | 选中 ≥1 context 卡片 | 选中的 context 节点数据 + 需求上下文 | flowNodes[] |
| 点击"重新生成上下文" | 选中 ≥1 context 卡片 | 选中的 context 节点 + 需求文本 | 覆盖选中 context 节点 |
| 点击"重新生成流程" | 选中 ≥1 flow 卡片 | 选中的 flow 节点 + 关联 context | 覆盖选中 flow 节点 |
| 点击"生成组件" | 选中 ≥1 flow 卡片 | 选中的 flow 节点 + 关联 context | componentNodes[] |

---

## 4. Zustand Store 重构

```typescript
interface CanvasStore {
  // === CanvasDocument ===
  document: CanvasDocument;

  // === 视图状态 ===
  selectedNodes: Set<string>;    // 当前选中的节点 ID（多选）
  activeTree: TreeType | null;  // 当前聚焦的树

  // === 节点操作 ===
  addContextNode: (node: Omit<BoundedContextNode, 'nodeId' | 'status' | 'source'>) => void;
  updateContextNode: (nodeId: string, patch: Partial<BoundedContextNode>) => void;
  deleteContextNode: (nodeId: string) => void;
  // ... flow / component 同理

  // === 选择操作 ===
  selectNode: (nodeId: string, mode: 'single' | 'multi' | 'toggle') => void;
  clearSelection: () => void;

  // === 生成命令（核心）===
  generateFromRequirement: (requirement: string) => Promise<void>;  // 原始需求 → context
  generateFlows: (contextNodeIds: string[]) => Promise<void>;        // context → flow
  regenerateContexts: (contextNodeIds: string[], requirement: string) => Promise<void>;
  regenerateFlows: (flowNodeIds: string[]) => Promise<void>;         // 重新生成 flow
  generateComponents: (flowNodeIds: string[]) => Promise<void>;       // flow → component

  // === 持久化 ===
  resetCanvas: () => void;              // 回到空树状态
  exportJSON: () => string;
  importJSON: (json: string) => boolean;
}

// 废弃（移除）：
// - phase 状态
// - confirmed / areAllConfirmed
// - CascadeUpdateManager
// - confirmationStore 引用
```

---

## 5. 组件层级

```
CanvasPage
  ├── CommandDialog                    # 对话框（输入原始需求）
  ├── CanvasToolbar
  │   ├── [生成业务流程]              # 选中 context 时可用
  │   ├── [重新生成上下文]            # 选中 context 时可用
  │   ├── [重新生成流程]              # 选中 flow 时可用
  │   ├── [生成组件树]                # 选中 flow 时可用
  │   └── [导出 JSON] [重置画布]
  ├── CanvasWorkspace
  │   ├── TreePanel (context)         # 空时显示引导文案
  │   ├── TreePanel (flow)
  │   └── TreePanel (component)
  └── CanvasStatusBar                  # AI 生成中状态
```

---

## 6. API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `POST /api/canvas/generate-context` | POST | 原始需求 → context 树 |
| `POST /api/canvas/generate-flows` | POST | 选中 context → flow 树 |
| `POST /api/canvas/generate-components` | POST | 选中 flow → component 树 |
| `GET /api/canvas/templates` | GET | 模板列表 |

---

## 7. 迁移计划

| Phase | 内容 |
|-------|------|
| Phase 1 | JSON Schema 定义 + Store 重构 + 空树初始状态 |
| Phase 2 | CommandDialog + 原始需求 → context 生成 |
| Phase 3 | 选择驱动生成（选中 context → 生成 flow）|
| Phase 4 | 选择驱动生成（选中 flow → 生成 component / 重新生成）|
| Phase 5 | 导出/导入/重置 |

---

## 8. 与 analysis.md 对齐

- [x] 单一数据源（PRIN-1）
- [x] 选择驱动生成（PRIN-2）— 选中 + 按钮
- [x] 无自动联动（PRIN-3）
- [x] 空树初始状态（PRIN-4）
- [x] JSON 导入导出（PRIN-5）
- [x] phase 完全移除
- [x] confirmed 完全移除
- [x] MVP 命令已定义
