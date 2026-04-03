# Spec: 术语映射表

## 配置结构

```typescript
// src/config/termMap.ts
export const TERM_MAP: Record<string, string> = {
  // DDD → 业务语言
  'bounded-context': '业务领域',
  'core-domain': '核心业务',
  'supporting-domain': '支撑业务',
  'generic-domain': '通用能力',
  'aggregate-root': '核心实体',
  'domain-event': '业务事件',
  'domain-model': '数据结构',
  'entity': '数据对象',
  'value-object': '值对象',
  'ubiquitous-language': '统一业务语言',
  // 更多映射...
};

export const REVERSE_TERM_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TERM_MAP).map(([k, v]) => [v, k])
);
```

## 验收标准

```typescript
// __tests__/termMap.test.ts
describe('TERM_MAP', () => {
  it('所有键均为小写', () => {
    Object.keys(TERM_MAP).forEach(key => {
      expect(key).toBe(key.toLowerCase());
    });
  });

  it('无重复值', () => {
    const values = Object.values(TERM_MAP);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  it('包含所有核心 DDD 术语', () => {
    const coreTerms = ['bounded-context', 'core-domain', 'aggregate-root', 'domain-event'];
    coreTerms.forEach(term => {
      expect(TERM_MAP).toHaveProperty(term);
    });
  });
});
```
