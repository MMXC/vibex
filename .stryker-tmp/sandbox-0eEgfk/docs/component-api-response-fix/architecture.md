# Architecture: Component API Response Fix

**项目**: component-api-response-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

前端防御性解析 `generate-components` API 响应，非法值 fallback 不崩溃，ZodError = 0。

**总工时**: 1.5h

---

## 1. Tech Stack

React + TypeScript + Zod（无新依赖）

---

## 2. 防御性解析方案

### E1: Fallback 策略

```typescript
// 防御性解析
const parseComponentResponse = (data: unknown) => {
  const schema = z.object({
    type: z.string(),
    name: z.string(),
    method: z.string(),
    confidence: z.number().optional(),
    flowId: z.string().optional(),
  });

  const result = schema.safeParse(data);
  if (!result.success) return null;

  const { type, method, confidence, flowId } = result.data;

  return {
    type: VALID_COMPONENT_TYPES.includes(type) ? type : 'page',
    name: result.data.name,
    method: VALID_METHODS.includes(method?.toUpperCase()) ? method.toUpperCase() : 'GET',
    confidence: confidence ?? 0,
    flowId: flowId === 'unknown' ? '' : flowId ?? '',
  };
};
```

### E2: 友好错误

```typescript
// ZodError 时 toast 提示，不白屏
try {
  const data = parseComponentResponse(raw);
  if (!data) throw new Error('Invalid response');
  // ...
} catch (err) {
  toast.error('组件生成失败，请重试');
  // 不崩溃，store 不写入非法数据
}
```

---

## 3. 性能影响

无风险，safeParse + 字符串数组查找（O(1)）。

---

## ADR-001: 前端防御性解析

**状态**: Accepted

**决策**: 不依赖后端修复，前端对所有响应做 safeParse + fallback。

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: component-api-response-fix
- **执行日期**: 2026-04-02
