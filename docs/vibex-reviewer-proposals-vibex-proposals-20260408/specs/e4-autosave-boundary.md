# Spec: Epic E4 — useAutoSave 边界测试

## 1. 边界测试场景

```typescript
// tests/unit/hooks/canvas/useAutoSave.boundary.test.ts
describe('useAutoSave boundary cases', () => {
  it('debounce: 不在 2s 内触发保存', async () => {
    // 快速连续变更 → 期望只触发一次保存
  });
  
  it('保存中再次触发不重复请求', async () => {
    // 模拟保存耗时 > 0 时再次变更
  });
  
  it('beforeunload 正确序列化 beacon', async () => {
    // window.dispatchEvent(new Event('beforeunload'))
    // expect(navigator.sendBeacon).toHaveBeenCalledWith(url, expect.any(Blob))
  });
  
  it('unmount 后不调用 setState', async () => {
    // unmount 组件后，保存回调不更新已卸载组件的 state
  });
  
  it('onSaveSuccess 回调被正确调用', async () => {
    // 验证 callback 参数
  });
  
  it('网络错误后重试逻辑', async () => {
    // mock fetch 失败，验证重试
  });
});
```

## 2. 验收标准

```bash
pnpm vitest run tests/unit/hooks/canvas/useAutoSave.boundary.test.ts
# 期望: 6 tests, 0 failures
```
