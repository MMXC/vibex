# PRD: VibeX 画布启动 API 对接（SSE 方案）

**项目**: vibex-canvas-api-fix-20260326
**版本**: 1.0
**PM**: PM Agent
**日期**: 2026-03-26
**状态**: 🔴 草稿

---

## 1. 执行摘要

### 问题陈述
用户点击画布"启动画布"按钮后，`onClick` 仅切换 phase，不调用任何后端 API，导致三树（上下文树 / 流程树 / 组件树）全为空。

**gstack 验证证据**:
- 点击"启动画布"后，三树仍显示 `0/0` ✅
- 后端 SSE 端点 `/api/ddd/bounded-context/stream` 已验证可用 ✅
- 缺口在前端未集成 DDD API

### 目标
前端在点击"启动画布"后，通过 SSE 调用后端 DDD API，实时展示 AI 分析过程并生成上下文树节点。

### 成功指标
| 指标 | 目标 |
|------|------|
| 启动后上下文树非空率 | ≥ 90% |
| SSE 连接成功率 | ≥ 95% |
| loading 期间按钮禁用率 | 100% |
| API 失败友好降级率 | 100% |
| 页面刷新数据不丢失 | 100% |

---

## 2. 功能需求

### F1: DDD API 客户端封装 【需页面集成】
**文件**: `src/lib/canvas/api/dddApi.ts`
**负责人**: Dev | **工时**: ~1h

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| F1.1 | `dddApi.generateContexts(text)` SSE 调用 | `expect(typeof dddApi.generateContexts).toBe('function')` |
| F1.2 | SSE 事件解析（thinking / context / done） | `expect(event.type).toBeOneOf(['thinking', 'context', 'done'])` |
| F1.3 | fetch + AbortController 超时控制（10s） | `expect(controller.signal.aborted).toBe(false)` on success |
| F1.4 | 错误处理（网络错误 / API 错误） | `expect(error.message).toBeDefined()` |

### F2: CanvasPage 启动按钮集成 【需页面集成】
**文件**: `src/components/canvas/CanvasPage.tsx`
**负责人**: Dev | **工时**: ~1h

| ID | 功能点 | 验收标准 | 页面集成 |
|----|--------|---------|----------|
| F2.1 | 启动按钮触发 SSE 调用 | `expect(button.disabled).toBe(true)` during loading | 【需页面集成】 |
| F2.2 | loading 状态：按钮文字变为"分析中..." | `expect(screen.getByText('分析中...')).toBeInTheDocument()` | 【需页面集成】 |
| F2.3 | thinking 事件：树面板显示 AI 分析提示 | `expect(screen.getByText(/正在分析/)).toBeInTheDocument()` | 【需页面集成】 |
| F2.4 | loading 结束后按钮恢复 | `expect(button.disabled).toBe(false)` after done | 【需页面集成】 |
| F2.5 | 按钮 disabled 时不可重复点击 | `expect(fireEvent.click(button)).toBe(0)` — 无 API 重复调用 | 【需页面集成】 |

### F3: canvasStore 三树状态管理
**文件**: `src/lib/canvas/canvasStore.ts`
**负责人**: Dev | **工时**: ~1h

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| F3.1 | `generateContextsFromRequirement(text)` action | `expect(typeof store.getState().generateContextsFromRequirement).toBe('function')` |
| F3.2 | SSE thinking 事件更新 loading 提示 | `expect(store.getState().aiThinking).toBeTruthy()` |
| F3.3 | SSE context 事件追加到 `contextNodes` | `expect(store.getState().contextNodes.length).toBeGreaterThan(0)` |
| F3.4 | SSE done 事件结束 loading | `expect(store.getState().aiThinking).toBeFalsy()` |
| F3.5 | API 失败时保留当前状态，不崩溃 | `expect(store.getState().contextNodes.length).toBeGreaterThanOrEqual(0)` |

### F4: 错误处理与降级 【需页面集成】
**负责人**: Dev | **工时**: ~0.5h

| ID | 功能点 | 验收标准 | 页面集成 |
|----|--------|---------|----------|
| F4.1 | 断网时显示 toast 错误提示 | `expect(toast.error).toHaveBeenCalledWith(/网络.*错误|请求失败/i)` | 【需页面集成】 |
| F4.2 | API 超时（10s）显示超时提示 | `expect(toast.error).toHaveBeenCalledWith(/超时/i)` | 【需页面集成】 |
| F4.3 | 画布不崩溃，保持当前状态 | `expect(screen.getByText('启动画布')).toBeInTheDocument()` | 【需页面集成】 |

### F5: 数据持久化验证
**负责人**: Tester | **工时**: ~0.5h

| ID | 功能点 | 验收标准 |
|----|--------|---------|
| F5.1 | 刷新页面后三树数据不丢失 | gstack 截图验证刷新前后节点数一致 |
| F5.2 | localStorage 无残留脏数据 | gstack 截图验证首次访问三树 `0/0` |

---

## 3. Epic 拆分

### Epic 1: DDD API 客户端实现（P0）
**工时**: ~2h | **负责人**: Dev

| Story | 描述 | 验收 |
|-------|------|------|
| S1.1 | 实现 `dddApi.ts` SSE 客户端 | F1.1-F1.4 全部 expect() 通过 |
| S1.2 | 集成到 canvasStore 生成 action | F3.1-F3.5 全部 expect() 通过 |
| S1.3 | 超时与错误处理 | F4.1-F4.3 全部 expect() 通过 |

### Epic 2: CanvasPage 集成（P0）
**工时**: ~2h | **负责人**: Dev

| Story | 描述 | 验收 |
|-------|------|------|
| S2.1 | 启动按钮改为异步调用 | F2.1-F2.5 全部 expect() 通过 |
| S2.2 | loading UI + thinking 提示 | gstack 截图验证 |
| S2.3 | 回归现有 ProjectBar / export / status | V4 回归通过 |

### Epic 3: E2E 测试验证（P0）
**工时**: ~2h | **负责人**: Tester

| Story | 描述 | 验收 |
|-------|------|------|
| S3.1 | 完整启动流程 E2E 测试 | V1-V3 gstack 截图验证 |
| S3.2 | 错误降级 E2E 测试 | V5 gstack 断网测试 |
| S3.3 | 持久化回归 E2E 测试 | V6 gstack 刷新测试 |

---

## 4. UI/UX 流程

### 正常流程
```
[用户输入需求文本]
         ↓
[点击"启动画布"]
         ↓
[SSE 连接中 → 按钮禁用，文字"分析中..."]
         ↓
[event: thinking → 显示"正在分析需求..."提示]
         ↓
[event: context → 逐个追加上下文节点到 contextNodes]
         ↓
[event: done → loading 结束，按钮恢复]
         ↓
[限界上下文树 N/N，非空 ✅]
```

### 错误流程
```
[SSE 连接失败 / 超时 / 断网]
         ↓
[显示 toast 错误提示]
         ↓
[画布保持当前状态，不崩溃]
         ↓
[用户可重试]
```

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **性能** | SSE 端到端延迟 ≤ 10s（超时配置） |
| **可用性** | API 失败友好降级，不阻塞用户 |
| **兼容性** | 回归测试 100% 通过（ProjectBar / export / status） |
| **可测试性** | 每个功能点可写 expect() 断言 |

---

## 6. Open Questions（需确认）

| # | 问题 | 优先级 | 状态 |
|---|------|--------|------|
| OQ1 | SSE vs REST 选择？（分析已推荐 SSE 方案） | P0 | 🟡 等待 Architect 确认 |
| OQ2 | 确认上下文后是否调用 business-flow/stream？ | P1 | 🟡 待确认 |
| OQ3 | 是否需要新增 component/stream 端点？ | P2 | 🟢 可延期 |

---

## 7. DoD

- [ ] F1-F5 全部功能点实现
- [ ] 每个功能点有 expect() 验收标准
- [ ] gstack 截图验证 V1-V3（正常流程）
- [ ] gstack 截图验证 V5（错误降级）
- [ ] gstack 截图验证 V6（持久化）
- [ ] Epic 3 E2E 测试全部通过
- [ ] 回归测试 100% 通过（ProjectBar / export / status）
- [ ] OQ1 至少得到 Architect 确认

---

## 8. gstack 验证清单

| # | 验证项 | 命令 | 预期结果 |
|---|--------|------|---------|
| G1 | 初始状态三树 0/0 | `/browse /canvas` → 截图 | `0/0` |
| G2 | 启动后三树非空 | `/qa-only` 输入文本 → 启动 → 截图 | `contextNodes.length > 0` |
| G3 | loading 状态按钮禁用 | `/qa-only` → 点击 → 截图 | 按钮 `disabled` |
| G4 | 断网错误提示 | `/qa-only` 断网 → 启动 → 截图 | toast 错误提示 |
| G5 | 刷新后数据不丢失 | G2 后刷新 → 截图 | 节点数不变 |

---

*基于 analysis.md (vibex-canvas-api-fix-20260326) 产出*
