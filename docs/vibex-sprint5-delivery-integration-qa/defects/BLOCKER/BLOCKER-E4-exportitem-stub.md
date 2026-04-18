# BLOCKER-E4-exportItem: exportItem 是 stub，仅模拟进度

**严重性**: BLOCKER（阻塞）
**Epic**: E4
**Spec 引用**: specs/E4-prd-fusion.md, analyst-qa-report.md

## 问题描述
`deliveryStore.ts` 中 `exportItem` 函数是纯 stub：模拟进度条（setTimeout 循环），但没有任何实际下载逻辑。注释 `// TODO: Replace with actual API call` 表明功能未实现。

## 代码证据

```typescript
// src/stores/deliveryStore.ts 第 381-455 行
exportItem: async (type, id, format) => {
  // ... 进度条模拟
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 100));
    set({ exportProgress: { type, id, progress: i, status: 'exporting' } });
  }
  // ...
  // TODO: Replace with actual API call
  // const response = await fetch('/api/delivery/export', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ type, id, format }),
  // });
  // const data = await response.json();
  // triggerDownload(data.downloadUrl, data.filename);
  set({ isExporting: false, exportProgress: null });
},
```

**验证**:
```bash
$ grep -n "TODO.*Replace with actual API call" /root/.openclaw/vibex/vibex-fronted/src/stores/deliveryStore.ts
432:        // TODO: Replace with actual API call
```

## 修复建议

**方案 A（纯前端，无需后端）**: 使用 `Blob` + `URL.createObjectURL` 实现下载：
```typescript
exportItem: async (type, id, format) => {
  // ... 进度条模拟 ...
  const content = await generateExportContent(type, id, format);
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${id}.${format === 'markdown' ? 'md' : 'pdf'}`;
  a.click();
  URL.revokeObjectURL(url);
  // ...
},
```

**方案 B（需后端 API）**: 补全 TODO 注释的 fetch 逻辑（需与后端对齐）。

## 影响范围
- `src/stores/deliveryStore.ts`（exportItem 函数）
- 所有导出功能（context / flow / component / PRD）
