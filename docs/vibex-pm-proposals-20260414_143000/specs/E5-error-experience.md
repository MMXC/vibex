# Spec: E5 - 错误体验统一规格

## 后端错误格式

```typescript
// 统一格式
{ error: { code: string, message: string, details?: unknown } }

// 错误码映射
const MAP = {
  401: { code: 'AUTH_001', message: '登录已过期，请重新登录' },
  403: { code: 'AUTH_002', message: '无权访问此资源' },
  404: { code: 'RESOURCE_001', message: '请求的资源不存在' },
  500: { code: 'SERVER_001', message: '服务器开小差了，请稍后重试' },
  503: { code: 'SERVER_002', message: '服务暂时不可用，请稍后重试' },
};
```

## 前端展示

- 全站使用 `useToast` 组件
- 5xx：显示重试按钮
- 人类可读文字（不使用 HTTP 状态码描述）
- Inline 错误：红色边框 + 错误文字
