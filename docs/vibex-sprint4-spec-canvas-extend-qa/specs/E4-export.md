# Spec: E4 — 导出功能规格

**对应 Epic**: E1-A6（OpenAPI 导出）+ E2-B5（StateMachine JSON 导出）
**文件**: `vibex-fronted/src/lib/contract/APICanvasExporter.ts`（新建）+ `vibex-fronted/src/lib/stateMachine/SMExporter.ts`（新建）
**相关**: `vibex-fronted/src/lib/contract/OpenAPIGenerator.ts`

---

## 1. OpenAPI 导出规格

### APICanvasExporter 行为

```typescript
// 导出流程
exportToOpenAPI(cards: APIEndpointCard[]): OpenAPISpec

// 输入：Canvas 上的 APIEndpointCard 节点数组
// 输出：符合 OpenAPI 3.0 的 JSON 对象

interface OpenAPISpec {
  openapi: string;        // "3.0.3"
  info: { title, version };
  paths: Record<string, {
    [method: string]: {
      summary: string;
      parameters?: Parameter[];
      requestBody?: { content: { 'application/json': { schema: object } } };
      responses: Record<string, { description: string }>;
    }
  }>;
}
```

### 验证要求

```typescript
// E4-U1: 基础导出
test('E4-U1: 导出包含 openapi 版本', () => {
  const spec = exportToOpenAPI([])
  expect(spec.openapi).toBe('3.0.3')
})

// E4-U2: 端点映射
test('E4-U2: GET /api/users 映射到 paths["/api/users"].get', () => {
  const spec = exportToOpenAPI([{ method: 'GET', path: '/api/users', summary: 'List users', ... }])
  expect(spec.paths['/api/users'].get).toBeDefined()
  expect(spec.paths['/api/users'].get.summary).toBe('List users')
})

// E4-U3: 全部 HTTP 方法
test('E4-U3: GET/POST/PUT/DELETE/PATCH 全部映射', () => {
  const cards = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => ({ method: m, path: `/api/test-${m}`, summary: 'Test' }))
  const spec = exportToOpenAPI(cards)
  ;['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
    expect(spec.paths[`/api/test-${method.toUpperCase()}`][method]).toBeDefined()
  })
})

// E4-U4: 空数组
test('E4-U4: 空数组导出空 paths', () => {
  const spec = exportToOpenAPI([])
  expect(spec.paths).toEqual({})
})

// E4-U5: 异常输入不崩溃
test('E4-U5: 非法端点数据不崩溃，返回部分结果', () => {
  expect(() => exportToOpenAPI([{ method: 'INVALID', path: '' }])).not.toThrow()
})
```

---

## 2. StateMachine JSON 导出规格

### SMExporter 行为

```typescript
// 导出流程
exportToStateMachine(nodes: StateMachineCard[], edges: DDSEdge[]): StateMachineJSON

interface StateMachineJSON {
  initial: string;                        // 初始状态 ID
  states: Record<string, {
    type?: string;
    on?: Record<string, { target: string; guard?: string; actions?: string[] }>;
  }>;
}
```

### 导出逻辑

1. 找到 `stateType === 'initial'` 的节点 → `initial` 字段
2. 其余节点按 `stateId` 分组 → `states` 对象
3. 每条边 → `states[sourceId].on[eventName]` 条目
4. `eventName` 取自边 label 或默认 `'*'`

### 验证要求

```typescript
// E4-U6: 基础导出
test('E4-U6: 有 initial 节点时导出包含 initial', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'initial' }]
  const sm = exportToStateMachine(nodes, [])
  expect(sm.initial).toBe('Idle')
})

// E4-U7: 转移映射
test('E4-U7: 边映射为 on 事件', () => {
  const nodes = [
    { id: 's1', stateId: 'Idle', stateType: 'initial' },
    { id: 's2', stateId: 'Active', stateType: 'normal' }
  ]
  const edges = [{ source: 's1', target: 's2', label: 'START' }]
  const sm = exportToStateMachine(nodes, edges)
  expect(sm.states['Idle'].on['START'].target).toBe('Active')
})

// E4-U8: guard 条件
test('E4-U8: 边有 guard 时包含 condition', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'initial' }, { id: 's2', stateId: 'Active', stateType: 'normal' }]
  const edges = [{ source: 's1', target: 's2', label: 'START', guard: 'isActive' }]
  const sm = exportToStateMachine(nodes, edges)
  expect(sm.states['Idle'].on['START'].guard).toBe('isActive')
})

// E4-U9: 无 initial 节点
test('E4-U9: 无 initial 时 initial 为 undefined', () => {
  const nodes = [{ id: 's1', stateId: 'Idle', stateType: 'normal' }]
  const sm = exportToStateMachine(nodes, [])
  expect(sm.initial).toBeUndefined()
})

// E4-U10: 空数组
test('E4-U10: 空 nodes 返回空 states', () => {
  const sm = exportToStateMachine([], [])
  expect(sm.states).toEqual({})
})
```

---

## 3. 导出 Modal UI 规格

### 理想态
- JSON 预览区：等宽字体 + 语法高亮（关键词蓝色/字符串绿色/数字橙色）
- 复制按钮：点击后变为"已复制 ✓"（2秒后恢复）
- 下载按钮：下载 `openapi.json` 或 `statemachine.json`

### 空状态
- 空 JSON `{}`

### 加载态
- JSON 预览区骨架屏

### 错误态
- 导出异常：显示错误信息 + 重试按钮
- 不崩溃，不覆盖已有数据
