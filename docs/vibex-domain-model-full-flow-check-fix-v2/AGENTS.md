# AGENTS.md — 领域模型全流程检查修复 v2

> 本文件是 Dev Agent 的开发约束手册，所有开发任务必须遵循本文档。

## 项目信息

- **项目**: vibex-domain-model-full-flow-check-fix-v2
- **工作目录**: /root/.openclaw/vibex/vibex-fronted
- **状态管理**: Zustand（不迁移到 Redux）
- **测试框架**: Jest + React Testing Library + Playwright

---

## 铁律

### 绝对禁止

1. **禁止修改现有 slice 的 API 签名** — `setBoundedContexts` / `setDomainModels` / `setBusinessFlows` 的参数类型不可改变，向后兼容
2. **禁止在 middleware 中直接调用 dispatch** — 必须通过 `get()` 读取状态，`set()` 写入，使用 Zustand 原生 API
3. **禁止在组件中直接操作 sessionStorage** — 所有持久化逻辑必须经由 `sessionStorageAdapter.ts` 封装
4. **禁止在空值保护中使用 `any` 类型** — 必须使用明确的类型或 `unknown + 类型守卫`
5. **禁止删除现有测试文件** — 只能新增或修改，空值保护不应破坏现有回归测试

### 强制要求

1. **每个空值分支必须有 fallback UI** — 不能静默消失，必须有视觉反馈
2. **所有新文件必须包含类型定义** — `.ts`/`.tsx` 文件不得有 `// @ts-ignore`
3. **中间件必须有单元测试** — 覆盖率 ≥ 90%，含 happy path + 异常路径
4. **E2E 测试必须覆盖三页面切换场景** — 使用 Playwright，路径 `/ddd/bounded-context` → `/ddd/domain-model` → `/ddd/business-flow`

---

## 文件修改规范

### 新建文件白名单

| 文件 | 用途 | 位置 |
|------|------|------|
| `FallbackErrorBoundary.tsx` | 错误边界组件 | `src/components/ui/` |
| `EmptyFallback.tsx` | 空数据 fallback | `src/components/ui/` |
| `ErrorFallback.tsx` | 错误 fallback | `src/components/ui/` |
| `dddStateSyncMiddleware.ts` | 状态同步中间件 | `src/stores/middleware/` |
| `sessionStorageAdapter.ts` | sessionStorage 适配器 | `src/stores/middleware/` |
| `dddStateSyncMiddleware.test.ts` | 中间件测试 | `src/stores/middleware/` |
| `e2e/ddd-page-switch.spec.ts` | 页面切换 E2E | `src/__tests__/e2e/` |
| `e2e/ddd-empty-state.spec.ts` | 空值 E2E | `src/__tests__/e2e/` |

### 修改文件清单（禁止修改白名单以外的文件）

| 文件 | 允许修改内容 |
|------|-------------|
| `stores/contextSlice.ts` | F1.3 空值保护（输入校验） |
| `stores/modelSlice.ts` | F1.3 空值保护（输入校验） |
| `stores/designStore.ts` | F1.2/F1.3 空值保护（businessFlows 相关） |
| `stores/index.ts` | F2.1 注册 middleware |
| `services/ddd/stream-service.ts` | F1.2 空值保护（try/catch） |
| `components/domain-model-diagram/DomainModelDiagram.tsx` | F1.1 空值保护（fallback） |
| `components/visualization/MermaidRenderer/MermaidRenderer.tsx` | F1.1 空值保护（fallback） |
| `components/flow-diagram/ParallelFlowDiagram.tsx` | F1.1 空值保护（fallback） |
| `components/ui/MermaidPreview.tsx` | F1.1 空值保护（fallback） |
| `components/canvas/BoundedContextGroup.tsx` | F1.1 空值保护（fallback） |

---

## 代码风格规范

### 空值保护模板

```typescript
// ✅ 推荐：三级防护
function SafeMermaid({ code, fallback }: { code?: string; fallback?: string }) {
  // 第一级：undefined / null
  if (!code) {
    return <EmptyFallback message={fallback ?? '暂无数据，请先生成'} />;
  }
  // 第二级：空字符串
  if (!code.trim()) {
    return <EmptyFallback message={fallback ?? '暂无数据，请先生成'} />;
  }
  // 第三级：渲染异常
  try {
    return <MermaidContent code={code} />;
  } catch (e) {
    return <ErrorFallback error={e} />;
  }
}
```

### Middleware 规范

```typescript
// ✅ 推荐：使用 subscribeWithSelector 避免循环
const middleware: StateCreator<any> = (set, get, api) => (config) => {
  const store = config(set, get, api);
  
  subscribeWithSelector(store)((state, prev) => {
    // 只在特定 slice 变化时触发
    if (state.ddd?.context !== prev.ddd?.context) {
      persistSnapshot(state);
    }
  });
  
  return store;
};
```

### Reducer 防御性编程

```typescript
// ✅ 推荐：每个 action 添加输入校验
const contextReducer = (state: ContextState, action: ContextAction): ContextState => {
  switch (action.type) {
    case 'setBoundedContexts': {
      // F1.3: 防护非法 payload
      if (!Array.isArray(action.payload)) return state;
      if (action.payload.some(c => !c?.id)) return state;
      return produce(state, draft => {
        draft.boundedContexts = action.payload;
      });
    }
    default:
      return state;
  }
};
```

---

## 测试要求

### 单元测试覆盖清单

| 文件 | 必测场景 |
|------|----------|
| `contextSlice.ts` | 合法/非法 payload、null/undefined、空数组 |
| `modelSlice.ts` | 合法/非法 payload、null/undefined、空数组 |
| `dddStateSyncMiddleware.ts` | 状态同步、sessionStorage 写入恢复、超时过期 |
| `stream-service.ts` | 正常流、异常流、网络错误、后端返回 null |
| `EmptyFallback.tsx` | 渲染正确、message prop 传递 |
| `ErrorFallback.tsx` | 渲染正确、error 对象展示 |

### E2E 测试清单

```typescript
// e2e/ddd-page-switch.spec.ts
test.describe('DDD 三页面切换', () => {
  test('bounded-context → domain-model 状态保留', async ({ page }) => {
    // 1. 进入 bounded-context 页，生成上下文
    // 2. 切换到 domain-model 页
    // 3. 断言 mermaid 图表可见
    // 4. 切换回 bounded-context
    // 5. 断言上下文数据仍在
  });
  
  test('三页面来回切换≥3次数据无丢失', async ({ page }) => {
    // 完整切换循环 ≥ 3 次
    // 每步断言数据完整性
  });
  
  test('空值场景显示 fallback', async ({ page }) => {
    // 直接访问 domain-model 页（无上下文数据）
    // 断言 EmptyFallback 显示
  });
});
```

---

## 提交规范

| 类型 | Commit Message | 示例 |
|------|----------------|------|
| 空值保护 | `fix(ddd): add null-safe guards for {component}` | `fix(ddd): add null-safe guards for DomainModelDiagram` |
| 状态同步 | `feat(ddd): add state sync middleware` | `feat(ddd): add dddStateSyncMiddleware` |
| sessionStorage | `feat(ddd): add sessionStorage persistence` | `feat(ddd): add sessionStorage TTL adapter` |
| 测试 | `test(ddd): add {type} tests for {target}` | `test(ddd): add unit tests for contextSlice` |
| 回归 | `test(ddd): add e2e page switch tests` | `test(ddd): add e2e page switch tests` |

---

## 审查清单（Reviewer）

### 代码审查

- [ ] 所有 `.ts`/`.tsx` 无 `any` 类型
- [ ] 所有空值分支有 fallback UI
- [ ] Middleware 无循环触发（检查 `subscribeWithSelector` 使用）
- [ ] sessionStorage 操作经由 `sessionStorageAdapter.ts`
- [ ] Reducer 输入校验完整
- [ ] 测试覆盖率报告达标（≥ 90% 中间件/Reducer）

### E2E 审查

- [ ] `ddd-page-switch.spec.ts` 三页面切换测试通过
- [ ] `ddd-empty-state.spec.ts` 空值 fallback 测试通过
- [ ] 无 console.error（空值场景）

### 构建审查

- [ ] `npm run build` 成功
- [ ] `npm test` 全量通过
- [ ] TypeScript 0 错误

---

## 验收标准

| 功能点 | 验收条件 |
|--------|----------|
| F1.1 | 所有 6 个 mermaid 组件空值时显示 EmptyFallback，不崩溃 |
| F1.2 | useDDDStream 异常返回安全默认值，不抛错到 UI |
| F1.3 | 非法 payload 不触发状态变更，Reducer 单元测试覆盖率 ≥ 90% |
| F2.1 | Middleware 单元测试覆盖率 ≥ 90%，三页面切换状态保留 |
| F2.2 | 刷新页面后状态恢复（sessionStorage TTL 30min） |
| F2.3 | Playwright E2E 三页面切换≥3次数据无丢失 |
| F3.1 | npm test 全量通过，npm run build 成功 |
