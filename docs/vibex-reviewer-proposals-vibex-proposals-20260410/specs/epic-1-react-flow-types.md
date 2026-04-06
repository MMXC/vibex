# Spec: Epic 1 — React Flow 类型修复

**Epic**: E1  
**优先级**: P0  
**预计工时**: 2.5h  
**关联 Issue**: R-P0-1, R-P0-2, R-P0-5

---

## 概述

为所有 React Flow 节点组件提供强类型支持，消除 `NodeProps<any>` 和 `useNodesState<any>` 类型断言。

---

## Story S1.1: 定义 FlowNodeData / CardNodeData 接口

### 目标
在 `src/types/` 下新建 `flow.ts`，定义 FlowNodeData 和 CardNodeData 接口。

### 实现

```typescript
// src/types/flow.ts

export interface FlowNodeData {
  id: string;
  type: string;
  label: string;
  selected?: boolean;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface CardNodeData extends FlowNodeData {
  type: 'card';
  label: string;
  children?: string[];
  collapsed?: boolean;
}

export interface PageNodeData extends FlowNodeData {
  type: 'page';
  label: string;
  path?: string;
}

export interface ContextNodeData extends FlowNodeData {
  type: 'context';
  label: string;
  boundedContext?: string;
}

// 节点组件 props 类型
export type CardNodeProps = NodeProps<CardNodeData>;
export type PageNodeProps = NodeProps<PageNodeData>;
export type ContextNodeProps = NodeProps<ContextNodeData>;
```

### 验收标准

```typescript
// spec/s1.1-flow-node-data.spec.ts

describe('S1.1 FlowNodeData 接口定义', () => {
  it('FlowNodeData 接口存在于 types/flow.ts', () => {
    const flowTypes = require('../src/types/flow');
    expect(flowTypes.FlowNodeData).toBeDefined();
    expect(flowTypes.CardNodeData).toBeDefined();
    expect(flowTypes.PageNodeData).toBeDefined();
  });

  it('接口包含必要字段', () => {
    const typeCheck: keyof FlowNodeData = 'id';
    expect(typeCheck).toBe('id');
  });
});
```

---

## Story S1.2: FlowNodes.tsx 替换 NodeProps<any>

### 目标
替换 `components/ui/FlowNodes.tsx` 中的所有 `NodeProps<any>` 为具体节点类型。

### 修改文件
- `components/ui/FlowNodes.tsx`

### 实现要点

```typescript
// 修复前
function getFlowData(props: NodeProps<any>) {
  const { data, selected } = props as any as {...};
}

// 修复后
import { CardNodeData, PageNodeData } from '@/types/flow';

function getFlowData(props: NodeProps<CardNodeData | PageNodeData>) {
  const { data, selected } = props;
  // data 类型安全，selected 类型安全
}
```

### 验收标准

```typescript
// spec/s1.2-flow-nodes.spec.ts

describe('S1.2 FlowNodes.tsx 类型修复', () => {
  it('无 NodeProps<any> 断言', () => {
    const content = readFileSync('components/ui/FlowNodes.tsx', 'utf-8');
    expect(content).not.toMatch(/NodeProps<any>/);
  });

  it('tsc 编译无错误', () => {
    const result = execSync('npx tsc --noEmit components/ui/FlowNodes.tsx', { encoding: 'utf-8' });
    expect(result).toBe('');
  });
});
```

---

## Story S1.3: DomainPageContent useNodesState 泛型

### 目标
修复 `components/domain/DomainPageContent.tsx:599` 的 `useNodesState<any>()`。

### 修改文件
- `components/domain/DomainPageContent.tsx`

### 实现

```typescript
// 修复前
const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);

// 修复后
import { FlowNodeData } from '@/types/flow';
const [nodes, setNodes, onNodesChange] = useNodesState<FlowNodeData>(initialNodes);
```

### 验收标准

```typescript
describe('S1.3 useNodesState 泛型修复', () => {
  it('无 useNodesState<any> 断言', () => {
    const content = readFileSync('components/domain/DomainPageContent.tsx', 'utf-8');
    expect(content).not.toMatch(/useNodesState<any>/);
  });
});
```

---

## Story S1.4: preview/page.tsx map 回调类型

### 目标
修复 `app/preview/page.tsx:149,178` 的 `(ctx: any)` / `(model: any)` 断言。

### 修改文件
- `app/preview/page.tsx`

### 实现

```typescript
// 定义接口
interface BoundedContext {
  id: string;
  name: string;
  models: DomainModel[];
}

interface DomainModel {
  id: string;
  name: string;
  type: string;
}

// 修复前
contexts.map((ctx: any) => ...)
models.map((model: any) => ...)

// 修复后
contexts.map((ctx: BoundedContext) => ...)
models.map((model: DomainModel) => ...)
```

### 验收标准

```typescript
describe('S1.4 preview/page.tsx 类型修复', () => {
  it('无 ctx: any 断言', () => {
    const content = readFileSync('app/preview/page.tsx', 'utf-8');
    expect(content).not.toMatch(/\(ctx: any\)/);
  });

  it('无 model: any 断言', () => {
    const content = readFileSync('app/preview/page.tsx', 'utf-8');
    expect(content).not.toMatch(/\(model: any\)/);
  });
});
```

---

## 集成验收

```typescript
describe('Epic 1 集成验收', () => {
  it('tsc --noEmit 无类型错误', () => {
    const result = execSync('npx tsc --noEmit', { encoding: 'utf-8' });
    expect(result).toBe('');
  });

  it('无任何 as any 类型断言', () => {
    const tsxFiles = glob.sync('**/*.tsx', { ignore: ['node_modules/**'] });
    for (const file of tsxFiles) {
      const content = readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/NodeProps<any>/);
    }
  });
});
```
