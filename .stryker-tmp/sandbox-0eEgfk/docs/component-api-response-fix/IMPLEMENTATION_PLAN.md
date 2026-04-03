# Implementation Plan: Component API Response Fix

**项目**: component-api-response-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: Defensive Parsing（1h）

### 步骤 1: 定义常量

```typescript
const VALID_COMPONENT_TYPES = ['page', 'section', 'component', 'layout'];
const VALID_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
```

### 步骤 2: 实现 parseComponentResponse

```typescript
const parseComponentResponse = (data: unknown) => {
  // safeParse + fallback
};
```

### 步骤 3: 替换 API 调用处

找到 `generateComponentFromFlow`，替换为 `parseComponentResponse` 结果。

### 步骤 4: flowId 空字符串

`'unknown' → ''`

---

## E2: ZodError 友好错误（0.5h）

### 步骤 1: try-catch + toast

```typescript
try {
  const data = parseComponentResponse(raw);
} catch {
  toast.error('组件生成失败');
}
```

---

## 验收清单

- [x] 非法 type → 'page' (validTypes: page/form/list/detail/modal)
- [x] 非法 method → 'GET' (validMethods: GET/POST)
- [x] flowId 'unknown' → ''
- [x] name fallback → '未命名组件'（API 可能返回 null）
- [x] path fallback → /api/{name}
- [x] ZodError 不白屏（re-throw，CanvasPage.tsx try/catch + toast）
- [x] npm test 通过
