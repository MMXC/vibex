# AGENTS.md - Canvas API Completion

## 开发约束

### API 规范
```typescript
// 统一错误响应
interface ApiError {
  error: string;    // 错误消息
  code: string;     // 错误码
  statusCode: number;
}

// 成功响应
interface ApiSuccess<T> {
  data: T;
  success: true;
}
```

### 测试规范
```typescript
// 每个端点必须测试
describe('Projects API', () => {
  it('should create project', async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });
    expect(res.status).toBe(201);
  });
});
```

### 禁止事项
- ❌ 硬编码数据库连接
- ❌ 未处理 null/undefined
- ❌ 缺少错误处理

*Architect Agent | 2026-04-05*
