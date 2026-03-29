# Spec: F2 全流程页面切换一致性

## F2.1 状态同步中间件

### 设计目标
在 Redux store 中添加中间件 `dddStateSyncMiddleware`，当 context/model/flow 任一 slice 状态更新时，同步触发关联 slice 的状态校验和同步。

### 中间件逻辑
```typescript
const dddStateSyncMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState().ddd;
  
  if (action.type.startsWith('boundedContext/')) {
    // 限界上下文更新后，校验领域模型是否依赖该上下文
    syncContextToModel(state);
  }
  if (action.type.startsWith('domainModel/')) {
    // 领域模型更新后，校验业务流程是否依赖该模型
    syncModelToFlow(state);
  }
  return result;
};
```

### 同步规则
| 触发条件 | 同步动作 |
|----------|----------|
| boundedContext/生成完成 | 将 contextId 同步到 domainModel.pendingContextId |
| domainModel/生成完成 | 将 modelId 同步到 businessFlow.pendingModelId |
| 页面切换到领域模型 | 校验 context 数据是否存在，不存在则提示 |
| 页面切换到业务流程 | 校验 model 数据是否存在，不存在则提示 |

### 测试用例
```typescript
describe('状态同步中间件', () => {
  it('限界上下文更新后同步到领域模型', () => {
    store.dispatch(boundedContextSlice.actions.generateSuccess({ id: 'ctx-1' }));
    const modelState = store.getState().ddd.domainModel;
    expect(modelState.pendingContextId).toBe('ctx-1');
  });
  it('状态同步不阻塞正常 action', () => {
    const start = Date.now();
    store.dispatch(domainModelSlice.actions.generateSuccess({ id: 'm-1' }));
    expect(Date.now() - start).toBeLessThan(50);
  });
});
```

---

## F2.2 sessionStorage 兜底

### 实现方案
```typescript
// 页面离开时持久化
useEffect(() => {
  const unsubscribe = router.events.subscribe((routeChange) => {
    if (routeChange.type === 'routeChangeStart') {
      sessionStorage.setItem('ddd-state', JSON.stringify(store.getState().ddd));
    }
  });
  return unsubscribe;
}, []);

// 页面加载时恢复
const savedState = sessionStorage.getItem('ddd-state');
if (savedState && isValidDDDState(JSON.parse(savedState))) {
  store.dispatch(restoreState(JSON.parse(savedState)));
}
```

### 测试用例
```typescript
describe('sessionStorage 兜底', () => {
  beforeEach(() => sessionStorage.clear());
  
  it('页面离开时持久化状态', () => {
    store.dispatch(generateModel({ id: 'm-1' }));
    fireEvent.routeChangeStart();
    expect(sessionStorage.getItem('ddd-state')).toBeTruthy();
  });
  it('刷新后状态恢复', () => {
    sessionStorage.setItem('ddd-state', JSON.stringify({ model: { id: 'm-1' } }));
    renderApp();
    expect(screen.getByTestId('domain-model-chart')).toBeVisible();
  });
  it('非法数据不恢复', () => {
    sessionStorage.setItem('ddd-state', 'invalid-json');
    const store = createStore();
    expect(store.getState().ddd).toEqual(initialState);
  });
});
```

---

## F2.3 页面切换 E2E 验证

### 切换路径
1. 限界上下文页面 → 生成上下文 → 切换到领域模型页面
2. 领域模型页面 → 生成模型 → 切换到业务流程页面
3. 业务流程页面 → 返回领域模型 → 返回限界上下文（来回≥3次）

### Playwright E2E 测试
```typescript
test('全流程页面切换无状态丢失', async () => {
  await page.goto('/ddd/bounded-context');
  await page.click('[data-testid="generate-context-btn"]');
  await page.waitForSelector('[data-testid="context-chart"]');
  
  // 切换到领域模型
  await page.click('[data-testid="nav-to-domain-model"]');
  await page.waitForSelector('[data-testid="domain-model-chart"]');
  
  // 切换到业务流程
  await page.click('[data-testid="nav-to-business-flow"]');
  await page.waitForSelector('[data-testid="flow-chart"]');
  
  // 来回切换3次
  for (let i = 0; i < 3; i++) {
    await page.click('[data-testid="nav-to-domain-model"]');
    await page.waitForSelector('[data-testid="domain-model-chart"]');
    await page.click('[data-testid="nav-to-business-flow"]');
    await page.waitForSelector('[data-testid="flow-chart"]');
  }
  
  // 验证数据未丢失
  const flowData = await page.evaluate(() => store.getState().ddd.flow);
  expect(flowData.chartData).toBeTruthy();
});
```

---

*Spec by PM Agent | 2026-03-29*
