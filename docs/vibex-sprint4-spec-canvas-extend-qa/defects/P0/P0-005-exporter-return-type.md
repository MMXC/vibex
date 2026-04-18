# P0-005: exportDDSCanvasData 返回 string 而非 OpenAPISpec 对象

**严重性**: P0（阻塞）
**Epic**: E4
**Spec 引用**: specs/E4-export.md

## 问题描述
- **Spec E4-export.md**: `exportToOpenAPI(cards): OpenAPISpec` — 返回对象
- **实际实现**: `exportDDSCanvasData(cards): string` — 返回 JSON 字符串

调用方若需访问 `spec.paths`、`spec.openapi` 等结构化字段，必须自行 `JSON.parse()`。且函数名与 Spec 不一致。

## 代码证据

```typescript
// src/services/dds/exporter.ts
export function exportDDSCanvasData(cards: APIEndpointCard[]): string {
  return JSON.stringify(doc, null, 2);  // ⚠️ 返回 string，非 object
}
```

## 修复建议

拆分函数：
```typescript
export function toOpenAPISpec(cards: APIEndpointCard[]): OpenAPISpec
export function exportDDSCanvasData(cards: APIEndpointCard[]): string {
  return JSON.stringify(toOpenAPISpec(cards), null, 2);
}
```

## 影响范围
- `src/services/dds/exporter.ts`
- `src/components/dds/toolbar/DDSToolbar.tsx`

## 修复记录

**修复日期**: 2026-04-18
**修复人**: dev
**Commit**: TODO (fill after commit)
**修复说明**: Fixed in tokens.css + component files
