---
name: missing-dependencies
category: ui-rendering
severity: high
confidence: 85
signatures:
  - pattern: "useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*(set[A-Z][a-zA-Z]+)\([^)]+\)[^}]*\}\s*,\s*\[\s*\]"
    description: "useEffect 依赖数组为空但调用了状态更新函数"
  - pattern: "useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*\b(count|value|data|item|result|state)\b[^}]*\}\s*,\s*\[\s*\]"
    description: "useEffect 依赖数组为空但引用了外部变量"
  - pattern: "useEffect\s*\(\s*\(\s*\)\s*=>\s*\{[^}]*(useState|useRef|useContext)\b"
    description: "useEffect 内部使用了hook"
fix_suggestions:
  - "将所有使用的外部变量加入依赖数组"
  - "使用 useRef 存储不需要触发更新的值"
  - "使用 useCallback 包装回调函数"
---
# 缺失依赖检测

## 问题描述

React 的 `useEffect` 依赖数组用于告诉 React 何时重新运行副作用。依赖数组为空 `[]` 但 effect 内部使用了外部变量时，会导致闭包陷阱——effect 使用的是过时的变量值。

## 常见场景

```tsx
// ❌ 错误：count 是外部变量但不在依赖数组中
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1); // count 永远是初始值
  }, 1000);
}, []); // 空依赖数组

// ✅ 正确：使用函数式更新
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1); // 使用函数式更新
  }, 1000);
}, []);
```
