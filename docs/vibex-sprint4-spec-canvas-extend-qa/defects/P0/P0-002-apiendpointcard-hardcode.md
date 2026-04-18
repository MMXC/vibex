# P0-002: APIEndpointCard.tsx 含 8 处 hex 硬编码

**严重性**: P0（阻塞）
**Epic**: E1
**Spec 引用**: specs/E5-chapter-type.md, specs/E1-api-chapter.md

## 问题描述
`APIEndpointCard.tsx` 使用 JS 对象 `METHOD_COLORS` 硬编码 hex 颜色值，未使用 CSS Token `var(--color-method-*)`。违反了 Spec E5 的原子化设计原则，且无法响应 CSS 主题切换。

## 代码证据

```bash
$ grep -oE "#[0-9a-fA-F]{6}" /root/.openclaw/vibex/vibex-fronted/src/components/dds/cards/APIEndpointCard.tsx | sort -u
# 实际输出:
# #10b981  (GET - 绿色)
# #3b82f6  (POST - 蓝色)
# #f59e0b  (PUT - 黄色)
# #ef4444  (DELETE - 红色)
# #8b5cf6  (PATCH - 紫色)
# #6b7280  (OPTIONS/HEAD/默认 - 灰色) x3

$ grep -n "METHOD_COLORS" /root/.openclaw/vibex/vibex-fronted/src/components/dds/cards/APIEndpointCard.tsx
# 17:const METHOD_COLORS: Record<string, string> = {
# 18:  GET: '#10b981',
# 19:  POST: '#3b82f6',
# 20:  PUT: '#f59e0b',
# 21:  DELETE: '#ef4444',
# 22:  PATCH: '#8b5cf6',
# 31:  const methodColor = METHOD_COLORS[card.method] ?? '#6b7280';
```

## 修复建议

```typescript
// 修改前
const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  // ...
};
const methodColor = METHOD_COLORS[card.method] ?? '#6b7280';

// 修改后：使用 CSS Token
const methodColor = getComputedStyle(document.documentElement)
  .getPropertyValue(`--color-method-${card.method.toLowerCase()}`)
  .trim() || '#6b7280';
```

**或者更优雅的方式**：在组件上直接设置 CSS class，由 CSS 规则使用 `var(--color-method-*)`。

## 影响范围
- `src/components/dds/cards/APIEndpointCard.tsx`
- 与 P0-001 共同导致主题系统失效

## 修复记录

**修复日期**: 2026-04-18
**修复人**: dev
**Commit**: TODO (fill after commit)
**修复说明**: Fixed in tokens.css + component files
