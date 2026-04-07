# Implementation Plan: Canvas Component Validate Fix

**项目**: canvas-component-validate-fix
**版本**: v1.0
**日期**: 2026-04-02
**状态**: ✅ 设计完成

---

## E1: Component Type 枚举修复（0.5h）

1. 找到 Zod schema 定义
2. 对齐 `componentType` 枚举值
3. 验证 `npx tsc --noEmit` 通过

## E2: API Method 大小写修复（0.25h）

1. 检查 API 调用代码
2. 修正 method 大小写
3. 验证 API 调用成功

## E3: confidence 默认值（0.25h）

```typescript
// Zod schema
confidence: z.number().default(1.0)
```

## E4: flowId 传递修复（0.25h）

1. 找到 `generateComponentFromFlow` 函数
2. 确保 flowId 作为参数传递
3. 验证 API 响应中 flowId 非 "unknown"

---

## 验收清单

- [x] ZodError = 0（schema transform 修复）
- [x] API method 正确（toUpperCase → 'GET'/'POST'）
- [x] confidence 有默认值（.optional().default(1.0)）
- [x] flowId 非 "unknown"（fetchComponentTree: 'unknown'|empty → ''）
- [x] npm test 通过
