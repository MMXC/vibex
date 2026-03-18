---
name: memory-leaks
category: performance
severity: high
confidence: 70
signatures:
  - pattern: "setInterval\\s*\\([^)]+\\)\\s*;\\s*$"
    description: "setInterval 可能缺少清理"
  - pattern: "addEventListener\\s*\\([^)]+\\)\\s*(?!;.*removeEventListener)"
    description: "addEventListener 可能缺少对应的 removeEventListener"
  - pattern: "window\\.addEventListener\\s*\\([^)]+\\)\\s*;\\s*(?!.*window\\.removeEventListener)"
    description: "window 事件监听器缺少清理"
fix_suggestions:
  - "在 useEffect cleanup 函数中清理定时器"
  - "使用 AbortController 取消事件监听"
  - "使用 useEffect 返回的清理函数"
---
# 内存泄漏检测

## 问题描述

未清理的定时器和事件监听器是最常见的内存泄漏原因：
- setInterval/setTimeout 未被 clearInterval/clearTimeout
- addEventListener 未配对 removeEventListener
- 组件卸载后定时器仍在运行

## 示例

```tsx
// ❌ 内存泄漏
useEffect(() => {
  const id = setInterval(() => {
    fetchData();
  }, 5000);
  // 缺少 return 清理函数
}, []);

// ✅ 正确
useEffect(() => {
  const id = setInterval(() => {
    fetchData();
  }, 5000);
  return () => clearInterval(id); // 组件卸载时清理
}, []);
```
