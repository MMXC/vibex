# Spec: E3 — Schema 适配层验证规格

**对应 Epic**: E3（Schema 适配层验证）
**目标文件**: `vibex-fronted/src/lib/contract/APICanvasExporter.ts`
**相关文件**: `vibex-fronted/src/lib/contract/OpenAPIGenerator.ts`

---

## 1. 背景问题

OpenAPIGenerator 使用 Zod 类型：
```typescript
interface EndpointDefinition {
  requestSchema?: z.ZodType<unknown>;
  responseSchema?: z.ZodType<unknown>;
}
```

APIEndpointCard 存储 JSON Schema：
```typescript
requestBody?: {
  schema: Record<string, unknown>;  // JSON Schema object
};
```

两者类型不匹配。适配层需要解决这个不匹配。

---

## 2. 方案C：patch Spec 验证

### 验证规则

APICanvasExporter 必须满足：
1. 不修改 OpenAPIGenerator.ts 源码
2. 直接将 JSON Schema 写入生成的 spec.paths
3. 不在导出代码中使用 `z.ZodType`

### 验证点

```typescript
// APICanvasExporter.ts 验证
import { OpenAPIGenerator } from './OpenAPIGenerator';  // ✅ 只读导入

export function exportToOpenAPI(cards: APIEndpointCard[]): OpenAPISpec {
  const generator = new OpenAPIGenerator();
  cards.forEach(card => {
    generator.addEndpoint({
      path: card.path,
      method: card.method,
      summary: card.summary,
      // 注意：不传 requestSchema / responseSchema
    });
  });
  
  // patch: 直接写入 JSON Schema
  const spec = generator.generate();
  cards.forEach(card => {
    if (card.requestBody?.schema) {
      // 直接 patch spec.paths，不依赖 Zod
      spec.paths[card.path][card.method].requestBody = {
        content: {
          'application/json': {
            schema: card.requestBody.schema  // JSON Schema object
          }
        }
      };
    }
  });
  
  return spec;
}
```

### 验证用例

```typescript
// T6-U1: 不导入 Zod
const exporterCode = fs.readFileSync('APICanvasExporter.ts', 'utf8');
expect(exporterCode).not.toMatch(/import.*z.*from 'z'/);
expect(exporterCode).not.toMatch(/z\.ZodType/);
expect(exporterCode).not.toMatch(/z\.object/);

// T6-U2: 直接 patch spec.paths
expect(exporterCode).toMatch(/spec\.paths/);
expect(exporterCode).toMatch(/card\.requestBody/);

// T6-U3: 基础导出通过
const spec = exportToOpenAPI([{ type: 'api-endpoint', path: '/test', method: 'get' }]);
expect(spec.openapi).toMatch(/3\.\d+/);
expect(spec.paths['/test']).toBeDefined();
expect(spec.paths['/test'].get).toBeDefined();

// T6-U4: JSON Schema patch 生效
const cardWithSchema = {
  type: 'api-endpoint',
  path: '/api/users',
  method: 'post',
  summary: 'Create user',
  requestBody: { contentType: 'application/json', schema: { type: 'object' } }
};
const spec2 = exportToOpenAPI([cardWithSchema]);
expect(spec2.paths['/api/users'].post.requestBody).toBeDefined();
expect(spec2.paths['/api/users'].post.requestBody.content['application/json'].schema).toEqual({ type: 'object' });
```

---

## 3. StateMachine JSON 导出验证

### 验证点

```typescript
// SMExporter.ts 验证
export function exportToStateMachine(
  nodes: StateMachineCard[],
  edges: DDSEdge[]
): StateMachineJSON {
  const initial = nodes.find(n => n.stateType === 'initial')?.stateId;
  const states = Object.fromEntries(
    nodes.map(n => [n.stateId, {
      on: Object.fromEntries(
        edges.filter(e => e.source === n.id).map(e => [
          e.label || '*',
          { target: e.target, guard: e.guard }
        ])
      )
    }])
  );
  return { initial, states };
}
```

### 验证用例

```typescript
// T7-U1: 有 initial 节点
const nodes = [{ id: '1', stateId: 'Idle', stateType: 'initial' }];
const sm = exportToStateMachine(nodes, []);
expect(sm.initial).toBe('Idle');
expect(sm.states['Idle']).toBeDefined();

// T7-U2: 无 initial 节点
const nodes2 = [{ id: '1', stateId: 'Active', stateType: 'normal' }];
const sm2 = exportToStateMachine(nodes2, []);
expect(sm2.initial).toBeUndefined();

// T7-U3: 转移映射
const nodes3 = [
  { id: '1', stateId: 'Idle', stateType: 'initial' },
  { id: '2', stateId: 'Active', stateType: 'normal' }
];
const edges3 = [{ source: '1', target: '2', label: 'START', guard: 'isActive' }];
const sm3 = exportToStateMachine(nodes3, edges3);
expect(sm3.states['Idle'].on['START'].target).toBe('Active');
expect(sm3.states['Idle'].on['START'].guard).toBe('isActive');
```
