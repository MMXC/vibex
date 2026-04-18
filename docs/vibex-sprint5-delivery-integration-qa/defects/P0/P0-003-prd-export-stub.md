# P0-003: PRD 导出为 Stub — 不生成任何文件

**严重性**: P0 (阻塞)
**Epic**: E4
**Spec 引用**: E4-prd-fusion.md §PRD Markdown 导出规格

## 问题描述

`deliveryStore.ts` 中 `exportItem()` 和 `exportAll()` 为 stub 实现，注释 "TODO: Replace with actual API call"。点击导出按钮模拟进度条走完，但**不生成任何文件**。

## 代码证据

```typescript
// deliveryStore.ts（待验证）
exportItem: async (type) => {
  // TODO: Replace with actual API call
  // const response = await fetch('/api/delivery/export', ...);
  // triggerDownload(data.downloadUrl, data.filename);
  // 实际：无任何网络请求，不下载文件
}
```

## 修复建议

在实现 `generatePRD()` 和 `generatePRDMarkdown()` 后，替换 TODO：
```typescript
exportItem: async (type) => {
  if (type === 'prd') {
    const markdown = generatePRDMarkdown(state.prototypeStore, state.ddsStore);
    downloadFile(markdown, 'prd.md', 'text/markdown');
  }
  // ... 其他类型
}
```

## 影响范围

- `deliveryStore.ts`
