# IMPLEMENTATION_PLAN: VibeX TypeScript Type Safety 2026-04-10

> **项目**: vibex-reviewer-proposals-vibex-proposals-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. Sprint 规划

| Sprint | 周期 | 内容 | 工时 |
|--------|------|------|------|
| Sprint 1 | Day 1 AM | Epic 1: React Flow 类型修复 | 2.5h |
| Sprint 2 | Day 1 PM | Epic 2: Zustand Middleware 修复 | 1h |
| Sprint 3 | Day 2 AM | Epic 3: API Schema 类型修复 | 0.5h |
| Sprint 4 | Day 2 PM | Epic 4: 双重断言消除 | 1.5h |

**总工时**: 5.5h | **团队**: 1 Dev

---

## 2. Sprint 1: React Flow 类型修复（2.5h）

### Step 1: 创建类型定义（0.5h）

```bash
# 创建类型文件
mkdir -p vibex-fronted/src/types
cat > vibex-fronted/src/types/flow.ts << 'EOF'
import type { NodeProps } from '@xyflow/react';

export interface BaseNodeData {
  id: string;
  label?: string;
  selected?: boolean;
}

export interface FlowNodeData extends BaseNodeData {
  type: 'flow';
  flowType?: 'domain-event' | 'command' | 'query' | 'policy';
  boundedContext?: string;
  description?: string;
}

export interface CardNodeData extends BaseNodeData {
  type: 'card';
  cardType?: 'entity' | 'value-object' | 'aggregate' | 'service';
  attributes?: Attribute[];
}

export interface Attribute {
  name: string;
  type: string;
}

export type AnyNodeData = FlowNodeData | CardNodeData | BaseNodeData;
EOF
```

### Step 2: FlowNodes.tsx 修复（1h）

```bash
# 找到所有使用 NodeProps<any> 的文件
grep -rn "NodeProps<any>" vibex-fronted/src/ --include="*.tsx"
```

```typescript
// 修复 FlowNodes.tsx
// 修复前
const FlowNode: React.FC<NodeProps<any>> = ({ data }) => { ... }

// 修复后
import type { FlowNodeData } from '@/types/flow';

interface FlowNodeComponentProps {
  data: FlowNodeData;
  selected?: boolean;
}

const FlowNode: React.FC<FlowNodeComponentProps> = ({ data, selected }) => {
  return <div className={cn('flow-node', selected && 'selected')}>...</div>;
};
```

### Step 3: DomainPageContent 修复（0.5h）

```typescript
// 修复前
const [nodes, setNodes] = useNodesState<any>([]);

// 修复后
import type { FlowNodeData } from '@/types/flow';
const [nodes, setNodes] = useNodesState<FlowNodeData>([]);
```

### Step 4: preview/page.tsx 修复（0.5h）

```typescript
// 修复前
modelList.map((ctx: any) => <div key={ctx.id}>{ctx.name}</div>)

// 修复后
interface DomainContext {
  id: string;
  name: string;
}

modelList.map((ctx: DomainContext) => <div key={ctx.id}>{ctx.name}</div>)
```

---

## 3. Sprint 2: Zustand Middleware 修复（1h）

### Step 1: 创建 store 类型

```typescript
// types/store.ts
export interface StoreState {
  selectedNodeIds: Set<string>;
  activeFlowId: string | null;
}

export interface StoreActions {
  selectNode: (id: string) => void;
  deselectNode: (id: string) => void;
  setActiveFlow: (id: string | null) => void;
}

export type AppStore = StoreState & StoreActions;

export type AppStoreSlice = (
  set: SetStateFunction<StoreState>,
  get: GetStateFunction<StoreState>,
  api: StoreApi<StoreState>
) => Partial<StoreActions>;
```

### Step 2: 修复 middleware.ts

```bash
# 找到所有 StoreSlice<any>
grep -rn "StoreSlice<any>" vibex-fronted/src/ --include="*.ts"
```

```typescript
// 修复前
export const createSlice = <T>(slice: StoreSlice<any>) => slice;

// 修复后
import type { AppStoreSlice } from '@/types/store';
export const createSlice = (slice: AppStoreSlice) => slice;
```

---

## 4. Sprint 3: API Schema 类型修复（0.5h）

```typescript
// types/api.ts
export interface AIMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
  timestamp?: number;
}
```

```bash
# 找到 messages: any[]
grep -rn "messages: any\[\]" vibex-fronted/src/ --include="*.ts"
```

```typescript
// 修复前
const messages: any[] = [];

// 修复后
import type { AIMessage } from '@/types/api';
const messages: AIMessage[] = [];
```

---

## 5. Sprint 4: 双重断言消除（1.5h）

### Step 1: 找到所有 as any as

```bash
grep -rn "as any as" vibex-fronted/src/ --include="*.tsx"
```

### Step 2: CardTreeRenderer 修复

```typescript
// 修复前
<CardTreeRenderer
  {...(props as any)}
  onNodeClick={handleNodeClick}
/>

// 修复后
// 1. 提取 CardTreeRenderer 需要的 props
interface CardTreeRendererProps {
  nodes: CardNodeData[];
  onNodeClick?: (nodeId: string) => void;
  selectedIds?: Set<string>;
}

// 2. 调用处传递正确类型
<CardTreeRenderer
  nodes={props.nodes}
  onNodeClick={handleNodeClick}
  selectedIds={props.selectedIds}
/>
```

### Step 3: 验证

```bash
# 验证无 as any as
grep -rn "as any as" vibex-fronted/src/ --include="*.tsx"
# 应输出: (空)
```

---

## 6. 验收命令

```bash
# 全部检查
echo "=== NodeProps<any> ===" && grep -rn "NodeProps<any>" vibex-fronted/src/ --include="*.tsx" | wc -l
echo "=== StoreSlice<any> ===" && grep -rn "StoreSlice<any>" vibex-fronted/src/ --include="*.ts" | wc -l
echo "=== as any as ===" && grep -rn "as any as" vibex-fronted/src/ --include="*.tsx" | wc -l
echo "=== any[] ===" && grep -rn ": any\[\]" vibex-fronted/src/ --include="*.ts" | wc -l
echo "=== tsc ===" && cd vibex-fronted && pnpm exec tsc --noEmit; echo "Exit: $?"
```

**目标输出**:
```
=== NodeProps<any> ===
0
=== StoreSlice<any> ===
0
=== as any as ===
0
=== any[] ===
0
=== tsc ===
Exit: 0
```

---

## 7. 回滚计划

| Sprint | 回滚步骤 | 时间 |
|--------|---------|------|
| Sprint 1 | `git checkout HEAD -- src/types/flow.ts src/components/FlowNodes.tsx` | <2 min |
| Sprint 2 | `git checkout HEAD -- src/types/store.ts src/stores/middleware.ts` | <2 min |
| Sprint 3 | `git checkout HEAD -- src/types/api.ts` | <1 min |
| Sprint 4 | `git checkout HEAD -- src/components/CardTreeRenderer.tsx` | <2 min |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
