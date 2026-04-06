# Spec: Epic E5 — useCanvasExport 响应式修复

## 1. ref → useState

```typescript
// src/hooks/canvas/useCanvasExport.ts
// Before (❌):
const isExportingRef = useRef(false);
return {
  exportCanvas,
  isExporting: isExportingRef.current, // 静态值
};

// After (✅):
const [isExporting, setIsExporting] = useState(false);
const exportCanvas = useCallback(async (...) => {
  setIsExporting(true);
  try {
    await doExport(...);
  } finally {
    setIsExporting(false);
  }
}, [...]);
return { exportCanvas, isExporting, error: null, cancelExport };
```

## 2. 验收标准

```typescript
// 导出进行中
const { result } = renderHook(() => useCanvasExport());
act(() => { result.current.exportCanvas(mockProject) });
expect(result.current.isExporting).toBe(true);

// 导出结束后
await waitFor(() => {
  expect(result.current.isExporting).toBe(false);
});
```
