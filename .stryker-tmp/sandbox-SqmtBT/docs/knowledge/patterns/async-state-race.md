# Pattern: 异步状态竞态 (Async State Race)

## 触发条件
- React 组件依赖异步数据渲染
- useEffect 依赖项缺失或错误
- 数据请求完成时机与组件生命周期不同步

## 典型症状
```
Warning: Can't perform a React state update on an unmounted component.
```
或测试中：
```
await waitFor(...) times out
// 原因：Promise 永远未 resolve，或 resolve 时组件已卸载
```

## 根因分析
1. **组件卸载后更新状态**：异步操作在组件 unmount 后仍尝试 setState
2. **useEffect 依赖缺失**：数据变化时未重新 fetch，或无限循环
3. **Race condition**：多个异步请求竞态，后发起的请求先返回

## 修复方案

### 1. AbortController 取消请求
```typescript
useEffect(() => {
  const controller = new AbortController();
  
  fetchData({ signal: controller.signal })
    .then(data => setData(data))
    .catch(err => {
      if (err.name !== 'AbortError') throw err;
    });
  
  return () => controller.abort();
}, []);
```

### 2. 组件卸载标志
```typescript
useEffect(() => {
  let isMounted = true;
  
  fetchData().then(data => {
    if (isMounted) setData(data);
  });
  
  return () => { isMounted = false; };
}, []);
```

### 3. 测试中的 act/waitFor
```typescript
await act(async () => {
  // 触发异步操作
});

await waitFor(() => {
  expect(screen.getByText('loaded')).toBeInTheDocument();
});
```

## 验收标准
- [ ] 无 "Cannot update on unmounted component" 警告
- [ ] 组件卸载后异步回调不产生副作用
- [ ] 测试中 waitFor 超时率 < 1%

## 相关检查清单
- Async Cleanup
- Mock Isolation
