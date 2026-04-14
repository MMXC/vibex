# Spec: E4 - API 错误格式 + 前端展示规格

## E4.1 后端统一错误格式

```typescript
// 统一错误响应格式
interface ApiErrorResponse {
  error: {
    code: string;    // 错误码，如 "AUTH_001"
    message: string; // 人类可读消息
    details?: unknown; // 可选详细信息
  };
}

// 错误码映射表
const ERROR_CODE_MAP: Record<string, Record<number, { code: string; message: string }>> = {
  '401': { code: 'AUTH_001', message: '登录已过期，请重新登录' },
  '403': { code: 'AUTH_002', message: '无权访问此资源' },
  '404': { code: 'RESOURCE_001', message: '请求的资源不存在' },
  '500': { code: 'SERVER_001', message: '服务器开小差了，请稍后重试' },
  '503': { code: 'SERVER_002', message: '服务暂时不可用，请稍后重试' },
};

// 统一错误处理中间件
function apiError(status: number, message: string, code?: string) {
  return new Response(
    JSON.stringify({
      error: {
        code: code || ERROR_CODE_MAP[String(status)]?.code || 'UNKNOWN',
        message: message || ERROR_CODE_MAP[String(status)]?.message || '未知错误',
      }
    }),
    { status, headers: { 'Content-Type': 'application/json' } }
  );
}
```

## E4.2 前端错误展示规范

```typescript
// useToast 错误展示
const { showError } = useToast();

// 5xx 可恢复错误，显示重试按钮
showError({
  title: '网络错误',
  message: '服务器开小差了，请稍后重试',
  action: { label: '重试', onClick: () => retry() },
  type: 'warning', // yellow
});

// 4xx 客户端错误，不显示重试
showError({
  title: '操作失败',
  message: '无权访问此资源',
  type: 'error', // red
});
```

## E4.3 验收测试用例

```typescript
// E4.1.1 错误格式验证
test('401 响应格式正确', async () => {
  const res = await api.get('/protected');
  expect(res.status).toBe(401);
  expect(res.data).toEqual({
    error: { code: 'AUTH_001', message: '登录已过期，请重新登录' }
  });
});

// E4.2.1 人类可读文字
test('前端不显示 HTTP 技术描述', async () => {
  await api.get('/protected');
  const toast = screen.getByRole('alert');
  expect(toast.textContent).not.toContain('401');
  expect(toast.textContent).not.toContain('Unauthorized');
  expect(toast.textContent).toContain('登录已过期');
});

// E4.2.2 重试按钮
test('5xx 错误显示重试按钮', async () => {
  server.use(rest.get('/api/test', (req, res, ctx) => res(ctx.status(500))));
  await api.get('/api/test');
  const retryButton = screen.getByRole('button', { name: '重试' });
  expect(retryButton).toBeVisible();
});

// E4.2.3 Inline 错误样式
test('Input 错误时显示红色边框', async () => {
  render(<InputWithValidation />);
  fireEvent.invalid(getByLabelText('Email'));
  expect(getByLabelText('Email')).toHaveStyle({ borderColor: 'var(--color-error)' });
});
```
