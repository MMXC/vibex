# 分析报告: ThemeWrapper 时序 bug

## 问题描述
ThemeWrapper 在 API 数据加载前渲染 ThemeProvider，导致 merge 策略失效，所有主题显示 'system' 而非 API 返回值。

## 根因
1. `ThemeWrapper` 初始化 `homepageData = null`，同步渲染 `ThemeProvider`（传入 `undefined`）
2. `ThemeProvider` 检测到 `homepageData === undefined`，走 legacy fallback：`localStorage ?? defaultMode('system')`
3. `useEffect` fetch 完成后更新 wrapper 状态，但 `ThemeProvider` 不重新渲染（无状态更新触发点）
4. 3 个测试期望 API dark → 实际显示 system

## 影响范围
- `ThemeWrapper` 组件（Epic3 新增）
- `ThemeProvider`（Epic1）
- `theme-binding.test.tsx`（Epic3 新增）

## 修复方案
**方案 A（推荐）**: 条件渲染 - `homepageData` 未就绪时不渲染 `ThemeProvider`
```tsx
if (homepageData === null) {
  return <LoadingFallback />; // 或 children 原样渲染（无主题上下文）
}
return <ThemeProvider homepageData={homepageData}>{children}</ThemeProvider>;
```

**方案 B**: Loading 状态处理 - `ThemeProvider` 支持 `loading` 状态

## 验收标准
1. `npm test -- --testPathPatterns "homepageAPI|ThemeWrapper|theme-binding" --no-watchAll` — 30/30 通过
2. 主题显示正确：API dark → mode='dark'
3. 合并策略优先级正确
