# P0-002: PRD 生成函数不存在 — PRD Tab 使用硬编码 stub

**严重性**: P0 (阻塞)
**Epic**: E4
**Spec 引用**: E4-prd-fusion.md + analyst-qa-report.md BLOCKER 2

## 问题描述

PRD Tab 使用 4 个硬编码 section（"电商系统" mock 文案），`generatePRD()` 和 `generatePRDMarkdown()` 函数**不存在**。导出按钮调用 `exportItem()` 但 store 内为 TODO stub。

## 代码证据

```typescript
// PRDTab.tsx 硬编码内容（待验证）
const sections = [
  { title: '电商系统 PRD', content: '...mock...' },  // ❌ 硬编码
]

// deliveryStore.ts exportItem
// TODO: Replace with actual API call
// const response = await fetch('/api/delivery/export', ...);
// triggerDownload(data.downloadUrl, data.filename);
```

## 修复建议

1. 实现 `generatePRD(prototypeStore, ddsStore): PRDOutline` 函数
2. 实现 `generatePRDMarkdown(prd: PRDOutline): string` 函数
3. 替换 deliveryStore.ts 中 `exportItem` TODO stub 为实际下载逻辑

## 影响范围

- `PRDTab.tsx`
- `deliveryStore.ts` (exportItem/exportAll)
