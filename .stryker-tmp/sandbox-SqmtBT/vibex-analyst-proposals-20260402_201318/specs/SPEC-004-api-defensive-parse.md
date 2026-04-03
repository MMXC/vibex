# SPEC-004: API 响应防御性解析

**文件名**: `generateComponents` 响应处理逻辑
**Epic**: Epic-2 / Feature-2.1
**优先级**: P1
**状态**: Draft

---

## 1. 问题描述

`generateComponents` API 返回非法 `type`/`method` 时无 fallback，导致数据不一致和 UI 错误。

---

## 2. 白名单定义

```ts
// constants/validators.ts

export const VALID_COMPONENT_TYPES = [
  'page',
  'layout',
  'component',
  'template',
  'widget',
] as const;

export const VALID_HTTP_METHODS = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
] as const;

export type ComponentType = typeof VALID_COMPONENT_TYPES[number];
export type HttpMethod = typeof VALID_HTTP_METHODS[number];
```

---

## 3. 防御性解析函数

```ts
// utils/sanitizeComponent.ts

import { VALID_COMPONENT_TYPES, VALID_HTTP_METHODS } from '../constants/validators';

interface RawComponent {
  type?: string;
  name?: string;
  api?: {
    method?: string;
    url?: string;
  };
}

interface SanitizedComponent {
  type: ComponentType;
  name: string;
  api: {
    method: HttpMethod;
    url: string;
  };
}

export function sanitizeComponent(raw: RawComponent): SanitizedComponent {
  const type = VALID_COMPONENT_TYPES.includes(raw.type as any)
    ? raw.type
    : 'page';

  const method = raw.api?.method &&
    VALID_HTTP_METHODS.includes(raw.api.method as any)
    ? raw.api.method
    : 'GET';

  return {
    type: type as ComponentType,
    name: raw.name ?? 'Unnamed Component',
    api: {
      method: method as HttpMethod,
      url: raw.api?.url ?? '',
    },
  };
}

export function sanitizeComponentList(rawList: RawComponent[]): SanitizedComponent[] {
  return rawList.map(sanitizeComponent);
}
```

---

## 4. 集成点

在 `generateComponents` API 响应处理处调用：

```ts
// 在 store 或 API 层
const response = await api.generateComponents(payload);
const components = sanitizeComponentList(response.components);
setNodes(components);
```

---

## 5. 验收标准

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | API 返回合法 type='page' | 解析组件 | type 保持 'page' |
| AC2 | API 返回 type='invalid' | 解析组件 | fallback 到 'page'，不报错 |
| AC3 | API 返回 method='PUT' | 解析组件 | method 保持 'PUT' |
| AC4 | API 返回 method='INVALID' | 解析组件 | fallback 到 'GET' |
| AC5 | API 返回空数组 | 解析组件 | 返回空数组，UI 不崩溃 |

---

## 6. 单元测试

```ts
describe('sanitizeComponent', () => {
  it('passes valid type and method', () => {
    const result = sanitizeComponent({ type: 'page', api: { method: 'POST' } });
    expect(result.type).toBe('page');
    expect(result.api.method).toBe('POST');
  });

  it('falls back to page for invalid type', () => {
    const result = sanitizeComponent({ type: 'unknown' });
    expect(result.type).toBe('page');
  });

  it('falls back to GET for invalid method', () => {
    const result = sanitizeComponent({ api: { method: 'INVALID' } });
    expect(result.api.method).toBe('GET');
  });

  it('handles missing fields gracefully', () => {
    const result = sanitizeComponent({});
    expect(result.type).toBe('page');
    expect(result.api.method).toBe('GET');
    expect(result.name).toBe('Unnamed Component');
  });
});
```

---

## 7. 影响范围

- [ ] `generateComponents` API 响应处理
- [ ] 所有消费组件数据的组件
- [ ] Zod schema 验证层
