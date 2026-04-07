# Architecture: Canvas Component Validate Fix

**项目**: canvas-component-validate-fix
**版本**: v1.0
**日期**: 2026-04-02
**架构师**: architect
**状态**: ✅ 设计完成

---

## 执行摘要

修复 `/api/v1/canvas/generate-components` ZodError 验证失败问题。

**总工时**: 1.25h

---

## 1. 问题与修复

### E1: Component Type 枚举对齐

对齐 Zod schema `componentType` 枚举与 API 返回值。

### E2: API Method 大小写

确保 API method 调用使用正确大小写。

### E3: confidence 默认值

```typescript
// 响应 schema 添加默认值
const ComponentSchema = z.object({
  name: z.string(),
  type: z.string(),
  confidence: z.number().default(1.0),
});
```

### E4: flowId 传递

确保 flowId 从前端正确传递到 API，非 "unknown"。

---

## 2. 性能影响

无风险，纯数据修复。

---

## ADR-001: Zod schema 与 API 对齐

**状态**: Accepted

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: canvas-component-validate-fix
- **执行日期**: 2026-04-02
