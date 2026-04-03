# Spec: API 调用规格

**Story**: S1.3 API 调用与状态更新  
**文件**: `src/app/canvas/page.tsx`, `src/lib/api/canvas.ts`

---

## 1. API 调用

### 1.1 请求

```typescript
// 接口
POST /api/canvas/component-tree

// 请求体
{
  flowData: {
    nodes: FlowNode[],
    edges: FlowEdge[],
    // ... 其他流程数据
  }
}
```

### 1.2 响应

```typescript
// 成功响应
{
  success: true,
  data: {
    components: ComponentNode[],
    cards: ComponentCard[]
  }
}

// 失败响应
{
  success: false,
  error: string
}
```

### 1.3 错误处理

| 错误码 | 处理方式 |
|--------|----------|
| 400 | 显示"参数错误" |
| 401 | 跳转登录页 |
| 500 | 显示"服务器错误，请重试" |
| Timeout | 显示"请求超时" |

---

## 2. 验收断言

```ts
// F1.3.1 API 请求
const [request] = await Promise.all([
  page.waitForRequest(req => req.url().includes('/component-tree') && req.method() === 'POST'),
  page.click('button:has-text("继续·组件树")')
]);
expect(request).toBeDefined();

// F1.3.2 请求参数
const body = await request.postDataJSON();
expect(body).toHaveProperty('flowData');

// F1.3.3 加载状态
const btn = page.locator('button:has-text("继续·组件树")');
await expect(btn).toContainText('加载中');

// F1.3.4 成功回调
await page.waitForResponse(resp => resp.url().includes('/component-tree'));
const store = useDDDStore.getState();
expect(store.componentTree).toBeDefined();
```
