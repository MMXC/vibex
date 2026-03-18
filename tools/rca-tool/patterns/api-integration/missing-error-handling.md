---
name: missing-error-handling
category: api-integration
severity: high
confidence: 90
signatures:
  - pattern: "fetch\\s*\\([^)]+\\)\\s*\\.(then|catch|finally)"
    description: "fetch 缺少 .catch 错误处理"
  - pattern: "await\\s+fetch\\s*\\([^)]+\\)\\s*[^;]*;\\s*$"
    description: "await fetch 后缺少 try-catch"
  - pattern: "\\.then\\s*\\(\\s*res\\s*=>\\s*[^)]+\\)\\s*(?!\\.then|\\.catch)"
    description: "Promise chain 末尾缺少 .catch"
fix_suggestions:
  - "添加 .catch(err => console.error(...)) 处理网络错误"
  - "使用 try-catch 包裹 await 调用"
  - "考虑使用 axios 或 ky 等带默认错误处理的库"
---
# 缺少错误处理检测

## 问题描述

API 调用缺少错误处理会导致：
- 网络失败时用户看不到任何反馈
- 错误被静默吞掉，难以调试
- 未定义行为（undefined/null 导致的崩溃）

## 示例

```tsx
// ❌ 无错误处理
const data = await fetch('/api/users');
const users = await data.json();

// ✅ 正确：try-catch
try {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('请求失败');
  const users = await res.json();
} catch (err) {
  setError(err.message);
}

// ✅ 正确：Promise chain
fetch('/api/users')
  .then(res => res.json())
  .catch(err => console.error('请求失败:', err));
```
