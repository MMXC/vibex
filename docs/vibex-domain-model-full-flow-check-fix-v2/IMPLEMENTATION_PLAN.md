# IMPLEMENTATION_PLAN: 领域模型全流程检查修复 v2

## 项目信息

- **项目**: vibex-domain-model-full-flow-check-fix-v2
- **创建时间**: 2026-03-29
- **架构师**: architect
- **工作目录**: /root/.openclaw/vibex/vibex-fronted/src

---

## 执行概览

| 阶段 | 任务 | 预计工时 | 依赖 |
|------|------|----------|------|
| Phase 1 | F1.1 组件层空值保护 | 2h | 无 |
| Phase 1 | F1.2 Hook 层空值保护 | 1h | F1.1 |
| Phase 1 | F1.3 Reducer 层空值保护 | 1.5h | 无 |
| Phase 2 | F2.1 状态同步中间件 | 4h | Phase 1 |
| Phase 2 | F2.2 sessionStorage 兜底 | 2h | F2.1 |
| Phase 2 | F2.3 三页面切换验证 | 2h | F2.1 + F2.2 |
| Phase 3 | F3.1 回归测试 | 2h | Phase 2 |
| **合计** | | **14.5h** | |

---

## Phase 1: 空值保护（Epic 1）

### F1.1 组件层空值保护

**涉及文件**：
```
src/components/domain-model-diagram/DomainModelDiagram.tsx
src/components/domain-model-diagram/DomainModelDiagram.module.css  (新建)
src/components/visualization/MermaidRenderer/MermaidRenderer.tsx
src/components/visualization/VisualizationPlatform/VisualizationPlatform.tsx
src/components/flow-diagram/ParallelFlowDiagram.tsx
src/components/ui/MermaidPreview.tsx
src/components/canvas/BoundedContextGroup.tsx
src/components/ui/FallbackErrorBoundary.tsx  (新建)
src/components/ui/EmptyFallback.tsx  (新建)
src/components/ui/ErrorFallback.tsx  (新建)
```

**实现步骤**：

1. **新建 Fallback 组件**：
   - `EmptyFallback`: 接收 `message` prop，渲染"暂无数据"提示
   - `ErrorFallback`: 接收 `error` prop，渲染错误信息

2. **修改 `MermaidRenderer.tsx`**：
   ```typescript
   // 在 render 入口添加空值保护
   if (!code || !code.trim()) {
     return <EmptyFallback message={fallbackMessage ?? '暂无数据，请先生成'} />;
   }
   try {
     const svg = renderMermaid(code);
     return <div dangerouslySetInnerHTML={{ __html: svg }} />;
   } catch (e) {
     return <ErrorFallback error={e} />;
   }
   ```

3. **修改 `DomainModelDiagram.tsx`**：
   - `modelMermaidCode` 为空时渲染 `EmptyFallback`
   - 已有测试文件 `DomainModelDiagram.test.tsx`，需补充空值测试用例

4. **修改 `ParallelFlowDiagram.tsx`**：
   - `flowMermaidCode` 为空时渲染 `EmptyFallback`

5. **修改 `BoundedContextGroup.tsx`**：
   - `contextMermaidCode` 为空时渲染 `EmptyFallback`

**验收标准**：
- [ ] `EmptyFallback` 组件渲染正确
- [ ] `ErrorFallback` 组件渲染正确
- [ ] 所有 6 个组件空值时显示 fallback，不崩溃
- [ ] `npm test` 通过

---

### F1.2 Hook 层空值保护

**涉及文件**：
```
src/services/ddd/stream-service.ts
src/stores/contextSlice.ts
src/stores/modelSlice.ts
src/stores/designStore.ts
```

**实现步骤**：

1. **修改 `stream-service.ts`**：
   - `useDDDStream` 添加 try/catch
   - 异常时返回 `{ data: null, error: '网络错误' }` 而非抛出
   - `onContext` 回调添加空值校验：`if (!data) return`

2. **修改 `contextSlice.ts`**：
   - `setBoundedContexts` 校验：`if (!Array.isArray(contexts)) return`
   - 空数据时返回 `[]` 而非 `undefined`

3. **修改 `modelSlice.ts`**：
   - `setDomainModels` 校验：`if (!Array.isArray(models)) return`
   - 空数据时返回 `[]`

**验收标准**：
- [ ] `useDDDStream` 异常不抛错，返回安全默认值
- [ ] 各 slice action 非法输入被静默拦截

---

### F1.3 Reducer 层空值保护

**涉及文件**：
```
src/stores/contextSlice.ts
src/stores/modelSlice.ts
src/stores/designStore.ts
```

**实现步骤**：

1. 在每个 slice 的 action handler 入口添加防御性校验：
   ```typescript
   // 防非法 payload 写入
   if (action.type === 'setBoundedContexts') {
     if (!Array.isArray(action.payload)) return state;
     if (action.payload.some(c => !c?.id)) return state;
   }
   ```

2. 所有 `state.xxx.yyy` 链式访问改为 `state.xxx?.yyy ?? defaultValue`

3. 补充 Reducer 单元测试（覆盖率 ≥ 90%）

**验收标准**：
- [ ] 非法 payload 不触发状态变更
- [ ] `npm test -- --coverage` reducer 覆盖率 ≥ 90%

---

## Phase 2: 状态同步（Epic 2）

### F2.1 状态同步中间件

**涉及文件**：
```
src/stores/middleware/dddStateSyncMiddleware.ts  (新建)
src/stores/index.ts  (注册中间件)
src/stores/navigationStore.ts  (读取路由状态)
```

**实现步骤**：

1. **创建 `dddStateSyncMiddleware.ts`**：
   - 使用 Zustand `subscribeWithSelector` 精确订阅
   - 监听 context/model/flow 三个 slice 的变更
   - 变更时调用 `persistSnapshot()`

2. **修改 `stores/index.ts`**：
   - 将中间件注册到 Zustand store 创建流程

3. **连接 `navigationStore`**：
   - Middleware 订阅路由变化事件
   - 路由切换时触发 `checkAndRestoreState()`

**验收标准**：
- [ ] 中间件单元测试覆盖率 ≥ 90%
- [ ] 无循环触发问题
- [ ] 三页面切换状态保留

---

### F2.2 sessionStorage 兜底

**涉及文件**：
```
src/stores/middleware/dddStateSyncMiddleware.ts
src/stores/middleware/sessionStorageAdapter.ts  (新建)
```

**实现步骤**：

1. **创建 `sessionStorageAdapter.ts`**：
   - 封装 `sessionStorage.setItem/getItem/removeItem`
   - 添加 JSON.parse 错误处理
   - 添加 TTL 过期逻辑（30min）

2. **Middleware 集成**：
   - 页面 unload 时持久化快照
   - 页面 load 时检查并恢复

**验收标准**：
- [ ] 刷新页面后状态恢复
- [ ] sessionStorage 损坏时不崩溃

---

### F2.3 三页面切换验证

**涉及文件**：
```
src/app/design/bounded-context/page.tsx
src/app/design/domain-model/page.tsx
src/app/design/business-flow/page.tsx
```

**实现步骤**：

1. **在每个页面添加切换日志**（开发模式）：
   ```typescript
   useEffect(() => {
     console.debug('[DDD Page] mounted:', pathname);
     return () => console.debug('[DDD Page] unmounted:', pathname);
   }, [pathname]);
   ```

2. **Playwright E2E 测试**：
   ```typescript
   test('三页面来回切换≥3次，数据无丢失', async ({ page }) => {
     // 1. bounded-context: 生成上下文
     // 2. 切换到 domain-model
     // 3. 切换回 bounded-context
     // 4. 切换到 domain-model
     // 5. 切换到 business-flow
     // 6. 断言数据完整性
   });
   ```

**验收标准**：
- [ ] 来回切换≥3次，内容无丢失
- [ ] E2E 测试通过

---

## Phase 3: 回归验证（Epic 3）

### F3.1 原有功能回归

**涉及文件**：
```
src/components/domain-model-diagram/DomainModelDiagram.test.tsx
src/services/ddd/stream-service.test.ts
src/stores/__tests__/contextSlice.test.ts
src/stores/__tests__/modelSlice.test.ts
src/stores/designStore.test.ts
src/stores/designStore.comprehensive.test.ts
```

**实现步骤**：

1. 运行 `npm test` 确保无新增失败
2. 运行 `npm run build` 确保 TypeScript 无错误
3. 补充空值场景测试用例到各测试文件

**验收标准**：
- [ ] `npm test` 全量通过
- [ ] `npm run build` 成功
- [ ] 无 TypeScript 类型错误

---

## 测试策略

### 单元测试（Jest）

| 测试文件 | 覆盖范围 | 目标覆盖率 |
|----------|----------|------------|
| `dddStateSyncMiddleware.test.ts` | 中间件逻辑 | ≥ 90% |
| `contextSlice.test.ts` | 空值保护 + 状态同步 | ≥ 90% |
| `modelSlice.test.ts` | 空值保护 + 状态同步 | ≥ 90% |
| `stream-service.test.ts` | Hook 层空值 | ≥ 80% |

### 集成测试（Playwright）

| 测试文件 | 测试场景 |
|----------|----------|
| `e2e/ddd-page-switch.spec.ts` | 三页面切换数据完整性 |
| `e2e/ddd-empty-state.spec.ts` | 空值场景 fallback 显示 |

---

## 风险控制

| 风险 | 缓解措施 | 验证方法 |
|------|----------|----------|
| 中间件循环触发 | 使用 `subscribeWithSelector` | 写测试用例验证 |
| sessionStorage 爆满 | 添加 TTL（30min）清理 | 手动验证过期清理 |
| 空值保护过度 | 保留原逻辑，仅添加 fallback | E2E 回归测试 |
| 影响现有 persist | 中间件不修改 Zustand persist 配置 | 现有测试全通过 |

---

## 交付物清单

- [ ] `architecture.md` — 架构设计文档
- [ ] `IMPLEMENTATION_PLAN.md` — 本实施计划
- [ ] `AGENTS.md` — 开发约束
- [ ] `FallbackErrorBoundary.tsx` — Fallback 组件
- [ ] `dddStateSyncMiddleware.ts` — 状态同步中间件
- [ ] `sessionStorageAdapter.ts` — sessionStorage 适配器
- [ ] 各 slice 空值保护修改
- [ ] 各组件空值保护修改
- [ ] 单元测试文件
- [ ] E2E 测试文件
