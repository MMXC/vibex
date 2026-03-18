---
name: infinite-loops
category: ui-rendering
severity: high
confidence: 80
signatures:
  - pattern: "useEffect\\s*\\([^)]*\\)\\s*{[^}]*(set[A-Z][a-zA-Z]+\\([^)]*\\)[^}]*}\\s*,\\s*\\[([^\\]]*)\\][^}]*\\1"
    description: "useEffect 可能导致无限循环"
  - pattern: "useEffect\\s*\\(\\s*\\(\\)\\s*=>\\s*{[^}]*(set[A-Z][a-zA-Z]+)\\([^;)]+\\)[^}]*}\\s*,\\s*\\[([^\\]]*\\1[^\\]]*)\\]"
    description: "依赖数组中的值在 effect 中被设置"
fix_suggestions:
  - "使用 useCallback 包装设置函数"
  - "使用 useMemo 缓存计算结果"
  - "重构状态逻辑，使用 reducer 模式"
---
# 无限循环检测

## 问题描述

当 useEffect 的依赖数组中的值在 effect 内部被更新时，会导致无限循环：状态更新 → 依赖变化 → effect 运行 → 状态更新 → ...

## 示例

```tsx
// ❌ 无限循环
useEffect(() => {
  setData(fetchData()); // 设置 data
}, [data]); // data 在依赖数组中！

// ✅ 正确做法
useEffect(() => {
  fetchData().then(setData);
}, []); // 空依赖数组，或使用正确的依赖
```
