# P0-004: E5 状态处理不完整 — 骨架屏/toast/导出进度缺失

**严重性**: P0 (阻塞)
**Epic**: E5
**Spec 引用**: E5-state-handling.md + analyst-qa-report.md BLOCKER 3

## 问题描述

E5 的三个子项均有缺项：
1. **骨架屏**：交付 Tab 切换无骨架屏，页面会闪动
2. **导出失败 toast**：store 有 progress 状态但无 toast UI
3. **导出进度 Modal**：DDLDrawer 无进度状态，PRDTab 有 progress bar 但无真实进度

## 代码证据

```typescript
// deliveryStore.ts（待验证）
// exportItem/exportAll 有 progress 状态但无 toast 触发
// DDLDrawer.tsx 无 loading 骨架屏

// analyst-qa-report.md 记录：
// "交付 Tab 切换无骨架屏（页面闪动）"
// "exportItem/exportAll 实际不调用 API（stub 实现）"
```

## 修复建议

1. **骨架屏**：DeliveryTabs 每个 Tab 区域增加 `ChapterSkeleton` 或等效骨架屏组件
2. **Toast**：在 `exportAll` 失败时触发 toast UI（`useToast()`）
3. **进度状态**：DDLDrawer 增加进度状态显示

## 影响范围

- `DDLDrawer.tsx`
- `PRDTab.tsx`
- `deliveryStore.ts`

## 验证标准

```bash
# 骨架屏存在
expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()

# toast 存在
expect(screen.getByText(/导出失败/i)).toBeInTheDocument()

# 无 spinner
expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
```
