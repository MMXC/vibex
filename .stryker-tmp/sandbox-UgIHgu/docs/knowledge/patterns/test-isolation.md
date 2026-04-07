# Pattern: 测试隔离失效 (Test Isolation Failure)

## 触发条件
- 多个测试套件顺序运行时，前一个测试的副作用影响后一个测试
- 测试顺序变化时结果不同
- 只在 CI 环境中出现失败，本地通过

## 典型症状
```
Expected: "clean state"
Received: "state from previous test"
```
或
```
TypeError: Cannot read property 'xxx' of undefined
// 原因：前一个测试清空了共享的 module cache
```

## 根因分析
1. **全局状态污染**：beforeAll 修改了全局变量/module 缓存，未在 afterAll 恢复
2. **Mock 未清理**：jest.spyOn / jest.mock 未正确卸载
3. **Timer 泄漏**：setTimeout/setInterval 未 clear，异步回调在错误测试中触发
4. **数据库状态**：测试间共享同一数据库连接，insert/delete 互相影响

## 修复方案

### 1. 全局状态恢复
```typescript
describe('Module X', () => {
  const originalState = getGlobalState();
  
  beforeAll(() => {
    setGlobalState({ ... });
  });
  
  afterAll(() => {
    setGlobalState(originalState); // 必须恢复
  });
});
```

### 2. Mock 清理
```typescript
// 推荐：restoreAllMocks（自动恢复原始实现）
afterAll(() => {
  jest.restoreAllMocks();
});

// 或手动清理
afterAll(() => {
  jest.clearAllMocks();    // 清除调用记录
  jest.resetAllMocks();    // 清除 + 重置实现
  jest.restoreAllMocks();  // 恢复原始实现
});
```

### 3. 异步清理
```typescript
afterAll(() => {
  jest.useRealTimers();
  jest.clearAllTimers();
});
```

## 验收标准
- [ ] 测试任意顺序执行均通过
- [ ] `jest --randomize` 多次运行结果一致
- [ ] CI 与本地结果一致

## 相关检查清单
- Global State Management
- Mock Isolation
- Async Cleanup
