# Spec: smartFetch Mock 检测修复

## 文件
`src/services/__mocks__/homepageAPI.ts`

## 修复详情

### 修改前
```typescript
async function smartFetch(): Promise<Response> {
  const fetch = global.fetch as unknown;
  if (
    typeof fetch === 'function' &&
    (fetch as any).mock &&
    (fetch as any)._isMockFunction
  ) {
    // ... mock handling
  }
  // fallback to stub
}
```

### 修改后
```typescript
async function smartFetch(): Promise<Response> {
  if (typeof global.fetch === 'function') {
    try {
      const result = await (global.fetch as Function)();
      // 检查是否为有效的 Response-like 对象（包含 json 方法）
      if (result && typeof result === 'object' && 'json' in result) {
        return result as Response;
      }
    } catch {
      // fetch 调用失败，使用 stub
    }
  }
  
  // Fallback to stub
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: () => Promise.resolve(STUB_DATA),
  } as unknown as Response;
}
```

## 测试用例

| 用例 | 输入 | 预期输出 |
|------|------|----------|
| valid jest mock | `setupFetchMock({ theme: 'dark', userPreferences: { theme: 'light' } })` | `smartFetch()` 返回包含正确数据的 Response |
| non-mock fetch | `global.fetch = realFetch` | 返回 STUB_DATA |
| broken mock | `global.fetch = jest.fn().mockRejectedValue(...)` | 返回 STUB_DATA |
