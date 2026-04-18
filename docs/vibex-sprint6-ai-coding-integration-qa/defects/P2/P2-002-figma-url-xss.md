# P2-002: /api/figma 缺少 URL 输入校验（XSS 风险）

**严重性**: P2 (安全)
**Epic**: E1
**Spec 引用**: analyst-qa-report.md §3.2 设计一致性

## 问题描述

`/api/figma` 未对 Figma URL 进行输入校验，可能存在 XSS 风险。

## 修复建议

增加 URL 格式校验：
```typescript
const figmaUrlPattern = /^https:\/\/([\w-]+\.)?figma\.com\/(file|proto)\/[\w-]+/;
if (!figmaUrlPattern.test(url)) {
  return NextResponse.json({ error: '无效的 Figma URL' }, { status: 400 });
}
```

## 影响范围

- `app/api/figma/route.ts`
