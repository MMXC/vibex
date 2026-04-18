# P0-002: VersionDiff 缺少路由页面 — 用户无法访问

**严重性**: P0 (阻塞)
**Epic**: E3
**Spec 引用**: E3-version-history.md + analyst-qa-report.md §BLOCKER

## 问题描述

`VersionDiffPanel.tsx` 组件存在，测试 11/11 通过，但路由页面 `app/canvas/delivery/version/page.tsx` 不存在。用户无法访问版本 Diff 功能。

## 代码证据

```bash
# 验证路由页面存在
find src/app/canvas/delivery/version/ -name "page.tsx"
# 预期：存在
# 实际：目录不存在

# 验证 VersionDiffPanel 存在
find src/components/version-diff/ -name "*.tsx"
# 预期：存在
# 实际：VersionDiff.tsx ✅
```

## 修复建议

创建 `app/canvas/delivery/version/page.tsx`，集成 VersionDiffPanel：
```tsx
// app/canvas/delivery/version/page.tsx
export default function VersionDiffPage() {
  return <VersionDiffPanel />;
}
```

## 影响范围

- `app/canvas/delivery/version/page.tsx`（新建）
- `components/version-diff/VersionDiffPanel.tsx`（引用）

## 验证标准

```bash
find app/canvas/delivery/version/ -name "page.tsx"
# 期望：存在
```
