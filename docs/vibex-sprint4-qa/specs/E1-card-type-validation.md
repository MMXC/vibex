# Spec: E1 — CardType 验证规格

**对应 Epic**: E1 + E2（CardType 定义验证）
**目标文件**: `vibex-fronted/src/types/dds/index.ts`
**验证内容**: APIEndpointCard / StateMachineCard / APIParameter / APIResponse / StateType

---

## 1. APIEndpointCard 类型验证

### 验证点

```typescript
// 必须存在的字段
interface APIEndpointCard {
  type: 'api-endpoint';  // literal type
  path: string;            // e.g. '/api/projects'
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';  // lowercase
  summary?: string;
  description?: string;
  parameters?: APIParameter[];
  requestBody?: {
    contentType: string;
    schema: Record<string, unknown>;  // JSON Schema object
  };
  responses?: APIResponse[];
  tags?: string[];
  deprecated?: boolean;
}
```

### 验证规则

- [ ] `type` 必须是 literal `'api-endpoint'`，不能用 string
- [ ] `method` 用 lowercase（get/post/put/patch/delete），与 HTTP 规范一致
- [ ] `parameters` 是可选的（无参数时可不填）
- [ ] `schema` 字段类型为 `Record<string, unknown>`（JSON Schema object），不能用 Zod 类型

### TypeScript 编译验证

```typescript
// 编译通过
const card: APIEndpointCard = {
  type: 'api-endpoint',
  path: '/api/users',
  method: 'get',
  summary: 'Get user list',
};
expect(card.path).toBe('/api/users');
expect(card.method).toBe('get');
```

---

## 2. StateMachineCard 类型验证

### 验证点

```typescript
// 必须存在的字段
interface StateMachineCard {
  type: 'state-machine';  // literal type
  stateId: string;        // 状态唯一标识
  stateType: StateType;   // 状态类型枚举
  description?: string;
  events?: string[];      // 可触发事件列表
  metadata?: Record<string, string>;
}

type StateType = 
  | 'initial'    // 初始状态（必选，图中只能有1个）
  | 'final'      // 终态（可以有多个）
  | 'normal'     // 普通状态（默认）
  | 'choice'     // 分支选择
  | 'join'       // 汇合
  | 'fork';      // 分叉
```

### 验证规则

- [ ] `type` 必须是 literal `'state-machine'`
- [ ] `stateId` 不能为空字符串
- [ ] `stateType` 必须是 6 种之一
- [ ] transitions 通过 DDSEdge 表达，不在 Card 内

### TypeScript 编译验证

```typescript
const card: StateMachineCard = {
  type: 'state-machine',
  stateId: 'Idle',
  stateType: 'initial',
  events: ['START', 'STOP'],
};
expect(card.stateType).toBe('initial');
expect(card.events).toContain('START');
```

---

## 3. ChapterType/CardType 扩展验证

### 验证点

```typescript
// ChapterType 扩展
export type ChapterType = 
  | 'requirement' 
  | 'context' 
  | 'flow'
  | 'api'                        // 新增
  | 'businessRules';              // 新增

// CardType 扩展
export type CardType = 
  | 'user-story'
  | 'bounded-context'
  | 'flow-step'
  | 'api-endpoint'               // 新增
  | 'state-machine';             // 新增
```

### 验证规则

- [ ] 新成员是 string literal，不是 number enum
- [ ] 现有类型不受影响
- [ ] TypeScript 编译 0 errors
