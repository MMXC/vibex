# Product Requirements Document: vibex-stage-integration

## Problem Statement

用户在完成三阶段流程（对话→流程→页面编辑）时，`/confirm/flow` 完成后跳转到 `/prototype` 时业务流数据丢失，导致原型编辑阶段无法参考之前创建的流程图。

## Success Metrics

| 指标 | 目标 |
|------|------|
| 阶段数据传递成功率 | ≥ 95% |
| 流程编辑留存率 | 较基线提升 30% |
| 用户返回修改比例 | ≤ 10%（流程顺畅） |

---

## User Stories

| ID | As a... | I want to... | So that... |
|----|---------|--------------|------------|
| US1 | 用户 | 在原型编辑页面看到之前创建的流程图 | 能基于业务流程设计原型 |
| US2 | 用户 | 编辑完流程后能返回修改 | 修正流程错误 |
| US3 | 用户 | 刷新页面后我的工作不丢失 | 放心长时间编辑 |
| US4 | 开发者 | 跨组件共享流程数据更简单 | 减少代码耦合 |

---

## Epic Breakdown

### Epic 1: 阶段数据传递修复

**目标**: 修复 `/confirm/flow` → `/prototype` 数据断裂问题

#### Story 1.1: 数据桥接实现
- **功能点**: 在 confirmationStore 中添加 prototypeData 字段，flow 完成后自动传递到 prototype 页面
- **验收标准**: 
  - expect(在 /confirm/flow 填写 flow 数据后跳转 /prototype 能读取到)
  - expect(flow 数据显示在 prototype 页面 UI 中)
- **页面集成**: 【需页面集成】src/app/confirm/flow/page.tsx → src/app/prototype/page.tsx

#### Story 1.2: 返回修改功能
- **功能点**: 支持从 prototype 页面返回 flow 编辑
- **验收标准**:
  - expect(prototype 页面有"返回修改"按钮)
  - expect(点击后跳转回 /confirm/flow 且数据保留)

---

### Epic 2: FlowContext 架构

**目标**: 创建独立的 FlowContext，解耦业务逻辑与 UI

#### Story 2.1: FlowContext Provider
- **功能点**: 创建 FlowContext，提供 businessFlow 读写能力
- **验收标准**:
  - expect(FlowContext 提供 updateFlow 方法)
  - expect(跨组件可通过 useFlowContext 访问 flow 数据)

#### Story 2.2: Flow 持久化
- **功能点**: Flow 数据自动持久化到 localStorage
- **验收标准**:
  - expect(刷新页面后 flow 数据不丢失)
  - expect(loadFlow 能恢复之前保存的 flow)

---

### Epic 3: 统一阶段状态管理

**目标**: 创建 useStageTransition hook，统一管理阶段跳转

#### Story 3.1: 阶段状态 Hook
- **功能点**: 实现 useStageTransition，提供 currentStage/goToStage/canGoBack 等方法
- **验收标准**:
  - expect(useStageTransition 返回当前阶段标识)
  - expect(canGoBack 在第一阶段返回 false)

#### Story 3.2: 阶段切换拦截
- **功能点**: 在阶段切换前执行校验，未保存内容提示用户
- **验收标准**:
  - expect(有未保存更改时切换阶段弹出确认框)

---

## Acceptance Criteria

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 用户完成 flow 填写 | 跳转至 /prototype | 页面显示完整的 flow 数据 |
| AC2 | 用户在 prototype 页面 | 点击"返回修改" | 跳转至 /confirm/flow 且数据保留 |
| AC3 | 用户刷新 prototype 页面 | 页面重新加载 | flow 数据依然显示（持久化） |
| AC4 | 开发者使用 FlowContext | 在任意组件调用 useFlowContext | 能获取和修改 flow 数据 |
| AC5 | 用户在第一阶段 | 点击返回 | canGoBack 返回 false，无响应 |

---

## Out of Scope

- 实时协作功能
- AI 辅助流程优化
- 多用户权限管理

---

## Dependencies

| 依赖项 | 说明 |
|--------|------|
| confirmationStore | 现有 Zustand store |
| /confirm/* 页面 | 现有对话和流程页面 |
| /prototype 页面 | 现有原型编辑页面 |

---

## Technical Notes

- FlowContext 使用 React Context + Zustand
- 数据传递通过 store + URL params 混合方式
- 持久化使用 Zustand persist middleware
