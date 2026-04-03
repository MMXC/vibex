# PRD: 领域模型全流程检查修复 v2

## 1. 概述

### 1.1 项目背景
- 2026-03-16 已完成领域模型渲染基础修复（commit 005279b），解决了限界上下文生成后点击「生成领域模型」图表不渲染问题
- 修复后存在遗漏：缺少空值保护措施，全流程切换一致性未验证
- 目标：确保 DDD 全流程（限界上下文→领域模型→业务流程）稳定可用，无崩溃、无状态不一致

### 1.2 成功指标
| 指标 | 目标值 |
|------|--------|
| 页面崩溃率 | 0%（空值/异常场景） |
| 状态丢失率 | 0%（三页面切换场景） |
| 空值保护覆盖率 | 100%（涉及 mermaid 渲染的组件） |
| 单元测试覆盖率 | ≥90%（状态同步逻辑） |
| npm test 通过率 | 100% |

### 1.3 目标用户
所有使用 vibex DDD 设计功能的产品经理、架构师、开发人员

---

## 2. Epic & Story 拆分

### Epic 1: 空值保护措施补充
**目标**：消除所有 mermaid 渲染和模型数据相关组件的空值崩溃风险

#### Story 1.1: 组件层空值保护
- **功能点**: 在所有接收 mermaidCode、流数据的组件添加 `?.` 可选链和 fallback UI
- **验收标准**:
  - `expect(screen.queryByText('暂无数据，请先生成')).toBeInTheDocument()` 当 mermaidCode 为空时
  - `expect(screen.queryByText('网络错误，请重试')).toBeInTheDocument()` 当网络异常时
  - 组件不抛出 console.error
- **DoD**: 覆盖所有 6 个涉及渲染的组件（bounded-context-chart、domain-model-chart、business-flow-chart 及其 fallback 组件）

#### Story 1.2: Hook 层空值保护
- **功能点**: `useDDDStream` 等自定义 Hook 添加空值校验，异常时返回默认空结构 `{}`
- **验收标准**:
  - `expect(hookResult.data).toEqual({})` 当后端返回 null/undefined 时
  - `expect(hookResult.error).toBe(null)` 不抛异常，由调用方处理
- **DoD**: 所有 useDDDStream 调用点均有 fallback 逻辑

#### Story 1.3: Redux Reducer 层空值保护
- **功能点**: context/model/flow 三个 slice 的 reducer 添加输入校验，非法数据写入时被拦截
- **验收标准**:
  - `expect(invalidAction).not.toChangeState()` 非法 payload 不触发状态变更
  - `expect(store.getState().ddd.model).toBe(initialState)` 异常写入后状态不变
- **DoD**: reducer 有防御性编程，无裸露的 state.xxx.yyy 访问

---

### Epic 2: 全流程页面切换一致性
**目标**：确保限界上下文→领域模型→业务流程三页面切换时状态不丢失

#### Story 2.1: 状态同步中间件
- **功能点**: 添加 Redux 中间件实现 context/model/flow 三 slice 跨 slice 状态同步
- **验收标准**:
  - `expect(store.getState().ddd.context).toEqual(expectedContext)` 切换回上下文页面时数据保留
  - `expect(store.getState().ddd.model).toEqual(expectedModel)` 切换回领域模型页面时数据保留
  - `expect(store.getState().ddd.flow).toEqual(expectedFlow)` 切换回业务流程页面时数据保留
- **DoD**: 中间件单元测试覆盖率≥90%，无竞态条件

#### Story 2.2: 路由切换状态持久化
- **功能点**: 路由切换时触发状态校验和同步钩子，sessionStorage 作为兜底
- **验收标准**:
  - `expect(sessionStorage.setItem).toHaveBeenCalledWith('ddd-state', expect.any(String))` 页面离开时持久化
  - 刷新页面后状态恢复，内容不丢失
  - `expect(window.location.pathname).toBe('/ddd/domain-model')` 路由跳转正常
- **DoD**: 刷新+返回场景全流程测试通过

#### Story 2.3: 页面间状态传递验证
- **功能点**: 限界上下文→领域模型→业务流程数据流验证
- **验收标准**:
  - 限界上下文生成完成后，切换到领域模型页面，图表正确渲染
  - 领域模型生成完成后，切换到业务流程页面，图表正确渲染
  - 三页面来回切换≥3次，内容无丢失
- **DoD**: 端到端测试覆盖所有切换路径

---

### Epic 3: 原有功能回归验证
**目标**：确保修复不影响现有功能

#### Story 3.1: 领域模型生成功能回归
- **功能点**: 验证领域模型生成功能正常，图表渲染正确，和修复前行为一致
- **验收标准**:
  - `expect(screen.getByTestId('domain-model-chart')).toBeVisible()` 正常生成后图表可见
  - `expect(mermaidCode).toContain('graph')` mermaidCode 格式正确
  - npm build 验证通过，TypeScript 无错误

---

## 3. 功能点总表

| ID | 功能点 | Epic | 描述 | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | 组件层空值保护 | Epic1 | 所有 mermaid 组件添加 fallback UI | expect fallback shown when null | 【需页面集成】 |
| F1.2 | Hook 层空值保护 | Epic1 | useDDDStream 等 Hook 返回安全默认值 | expect({}).toEqual(result) | ❌ |
| F1.3 | Reducer 层空值保护 | Epic1 | slice reducer 拦截非法数据写入 | expect(state unchanged).when(invalid payload) | ❌ |
| F2.1 | 状态同步中间件 | Epic2 | 跨 slice 状态同步逻辑 | expect(model preserved).after(context switch | ❌ |
| F2.2 | sessionStorage 兜底 | Epic2 | 路由切换时持久化状态 | expect(data restored).after(refresh | ❌ |
| F2.3 | 三页面切换验证 | Epic2 | 限界上下文↔领域模型↔业务流程切换 | expect(no data loss).after(≥3 switches | 【需页面集成】 |
| F3.1 | 回归测试 | Epic3 | npm test 全量通过，build 验证 | expect(all tests pass) | ❌ |

---

## 4. 非功能需求

| 类型 | 需求 |
|------|------|
| 性能 | 状态同步操作 < 50ms，不阻塞 UI 渲染 |
| 兼容性 | 兼容现有 Redux 架构，中间件不影响其他 slice |
| 可维护性 | 空值保护使用 `?.` 和 `??` 操作符，代码简洁 |
| 测试覆盖 | 状态同步逻辑覆盖率≥90%，所有空值路径有测试 |
| TypeScript | 无 `any` 类型，无类型错误 |

---

## 5. 依赖项

| 依赖方 | 依赖内容 | 预计就绪 |
|--------|----------|----------|
| Architect | 架构文档（已存在 analysis.md） | ✅ |
| Dev | 实现修复代码 | 等待 PRD |
| Tester | E2E 测试和回归测试 | 等待开发完成 |
| Reviewer | 代码审查 + 页面审查 | 等待测试完成 |

---

## 6. 验收清单

- [ ] PRD 文档完成
- [ ] specs/ 目录包含所有功能详细规格
- [ ] Epic/Story 拆分完整，验收标准可写 expect() 断言
- [ ] 架构文档已就绪（analysis.md）
- [ ] 页面集成需求已标注（F1.1, F2.3）
- [ ] 非功能需求明确

---

*Created by PM Agent | 2026-03-29*
