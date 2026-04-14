# Spec: 三种卡片 JSON Schema 详细定义

## Base Card

```typescript
interface BaseCard {
  id: string;           // UUID v4
  type: CardType;       // 'user-story' | 'bounded-context' | 'flow-step'
  title: string;
  description?: string;
  position: { x: number; y: number }; // React Flow position
  createdAt: string;   // ISO 8601
  updatedAt: string;
}
```

## User Story Card（需求分析章节）

```typescript
interface UserStoryCard extends BaseCard {
  type: 'user-story';
  role: string;         // 作为[角色]
  action: string;       // 我想要[行为]
  benefit: string;     // 以便于[收益]
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria?: string[];
  children?: string[];  // 子用户故事 ID（树关系）
  parentId?: string;    // 父用户故事 ID
}
```

## Bounded Context Card（上下文分析章节）

```typescript
interface BoundedContextCard extends BaseCard {
  type: 'bounded-context';
  name: string;         // 上下文名称
  description: string;
  responsibility: string; // 职责描述
  children?: string[];  // 子域 ID
  parentId?: string;
  relations?: {
    targetId: string;   // 关联上下文 ID
    type: 'upstream' | 'downstream' | 'anticorruption' | 'shared-kernel';
    label?: string;
  }[];
}
```

## Flow Step Card（领域流程章节）

```typescript
interface FlowStepCard extends BaseCard {
  type: 'flow-step';
  stepName: string;     // 步骤名称
  actor?: string;       // 执行者
  preCondition?: string;  // 前置条件
  postCondition?: string; // 后置条件
  nextSteps?: string[];   // DAG: 后续步骤 ID（可多个）
  parallelSteps?: string[]; // 并行步骤 ID
}
```

## React Flow 节点/边映射

```typescript
// 节点
type DDSCardNode = UserStoryNode | BoundedContextNode | FlowStepNode;

// 边（统一）
interface DDSEdge {
  id: string;
  source: string;       // 源卡片 ID
  target: string;      // 目标卡片 ID
  type: 'smoothstep';   // 统一边类型
  animated?: boolean;   // 动画（表示 AI 生成）
}
```
