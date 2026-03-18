---
name: stale-closures
category: state-management
severity: high
confidence: 80
signatures:
  - pattern: "setTimeout\\s*\\([^)]*\\b(count|value|data|item|state)\\b[^)]*\\)\\s*,"
    description: "setTimeout 中引用了外部状态变量"
  - pattern: "setInterval\\s*\\([^)]*\\b(count|value|data)\\b[^)]*\\)\\s*,"
    description: "setInterval 中引用了外部状态变量"
  - pattern: "addEventListener\\s*\\([^,]+,\\s*\\(\\)\\s*=>\\s*{[^}]*\\bstate\\."
    description: "事件监听器中引用了状态对象"
fix_suggestions:
  - "使用 useRef 存储最新的值"
  - "在 cleanup 函数中清理定时器/监听器"
  - "使用 useCallback 固定函数引用"
---
# 闭包陷阱检测

## 问题描述

在回调函数（setTimeout、事件监听器等）中引用外部状态变量时，由于闭包特性，这些变量在回调创建时的值会被"锁定"，导致使用过时的数据。

## 示例

```tsx
// ❌ 闭包陷阱
const [count, setCount] = useState(0);
useEffect(() => {
  const id = setTimeout(() => {
    alert(`Count is: ${count}`); // count 永远是初始值 0
  }, 1000);
  return () => clearTimeout(id);
}, []); // 空依赖数组

// ✅ 正确：使用 useRef
const countRef = useRef(count);
countRef.current = count;
useEffect(() => {
  const id = setTimeout(() => {
    alert(`Count is: ${countRef.current}`); // 最新的值
  }, 1000);
  return () => clearTimeout(id);
}, []);
```
