# Spec: E1 + E2 - Component API Response Fix

## 1. 概述

**工时**: 1.5h | **优先级**: P0
**依赖**: 无

## 2. 修改文件

`canvasStore.ts` generateComponentFromFlow / fetchComponentTree

## 3. 修改方案

### 3.1 Defensive Parsing

```ts
const validTypes = ['page', 'form', 'list', 'detail', 'modal'];
const validMethods = ['GET', 'POST'];

return result.components.map((comp) => {
  const type = (comp.type && validTypes.includes(comp.type))
    ? comp.type as ComponentType
    : 'page';

  const method = (comp.api?.method && validMethods.includes(comp.api.method))
    ? comp.api.method
    : 'GET';

  const flowId = (comp.flowId && comp.flowId !== 'unknown')
    ? comp.flowId
    : '';

  return {
    nodeId: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    flowId,
    name: comp.name ?? '未命名组件',
    type,
    props: {},
    api: {
      method,
      path: comp.api?.path ?? '/api/' + (comp.name ?? 'component').toLowerCase(),
      params: comp.api?.params ?? [],
    },
    confidence: comp.confidence ?? 0,
    status: 'pending' as const,
    children: [],
  };
});
```

### 3.2 ZodError 友好错误

```ts
try {
  const result = await api.generateComponents(payload);
  // ...
} catch (err) {
  if (err instanceof ZodError) {
    toast({ type: 'error', message: '组件生成失败，请重试' });
  } else {
    throw err;
  }
}
```

## 4. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| E1-AC1 | 非法 type | 解析 | 'page' |
| E1-AC2 | 非法 method | 解析 | 'GET' |
| E1-AC3 | confidence undefined | 解析 | 0 |
| E1-AC4 | flowId 'unknown' | 解析 | '' |
| E2-AC1 | ZodError | API 调用 | toast，无白屏 |

## 5. DoD

- [ ] type fallback → 'page'
- [ ] method fallback → 'GET'
- [ ] confidence → 0
- [ ] flowId → ''（非 unknown）
- [ ] ZodError toast 处理
