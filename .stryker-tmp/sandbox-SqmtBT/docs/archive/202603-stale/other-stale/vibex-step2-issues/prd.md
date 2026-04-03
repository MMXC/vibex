# PRD: vibex-step2-issues

> **状态**: 建设中 | **优先级**: P1 | **分析师**: Analyst Agent | **PM**: PM Agent
> **根因**: `/design/*` 5个页面均为占位桩，缺少步骤指示器、思考面板、API持久化、步骤回退

---

## 1. 执行摘要

设计流程（`/design/*`）5个页面均为占位桩，仅有硬编码文本。首页步骤流已有完整实现（`StepRequirementInput` 等），但设计页面未复用。需要接入步骤导航、流式思考面板、API 持久化和步骤回退功能。

---

## 2. Epic 拆分

### Epic 1: 步骤指示器与导航

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S1.1 | 集成 StepNavigator | 每个 `/design/*` 页面顶部显示5步导航条 |
| S1.2 | 接入 designStore.currentStep | 步骤指示器状态与 store 同步 |
| S1.3 | 已完成步骤可点击跳转 | index < currentStep 时可点击回退 |

### Epic 2: 思考过程面板

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S2.1 | 集成 ThinkingPanel | bounded-context 页面显示流式思考输出 |
| S2.2 | markdown 渲染支持 | 思考内容支持代码块、列表等格式 |
| S2.3 | 中断功能 | 用户可随时停止正在进行的流式输出 |

### Epic 3: API 持久化

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S3.1 | RESTful 接口 | `/api/design/[step]` GET/POST 接口 |
| S3.2 | 页面加载恢复 | 页面挂载时自动从 API 恢复数据 |
| S3.3 | localStorage 兜底 | API 不可用时降级到 localStorage |

### Epic 4: 步骤回退与快照

| Story | 描述 | 验收标准 |
|--------|------|---------|
| S4.1 | designStore 双向导航 | 支持 currentStep 前进和回退 |
| S4.2 | 数据快照保留 | 回退后再次前进数据从快照恢复 |
| S4.3 | 清除后续步骤 | 回退到 Step 1 时清除后续快照 |

---

## 3. 功能点

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | StepNavigator 集成 | 每个设计页面顶部渲染步骤导航条 | expect(screen.getByText(/Step 2 of 5/)).toBeInTheDocument() | **【需页面集成】** `/design/bounded-context`, `/design/clarification` 等 |
| F1.2 | currentStep 同步 | StepNavigator 状态与 designStore 同步 | 点击 Step 1 后 expect(designStore.currentStep).toBe(0) | - |
| F1.3 | 已完成步骤可点击 | index < currentStep 的步骤可跳转 | expect(buttons[0]).not.toBeDisabled() | **【需页面集成】** StepNavigator 组件 |
| F2.1 | ThinkingPanel 集成 | bounded-context 页面渲染思考面板 | expect(screen.getByText(/正在分析/)).toBeInTheDocument() | **【需页面集成】** `/design/bounded-context` |
| F2.2 | markdown 渲染 | 思考输出支持 markdown 格式 | render markdown 后 expect(screen.getByText(/代码高亮/)).toBeInTheDocument() | - |
| F2.3 | 中断流式输出 | 提供停止按钮，支持 AbortController | 点击停止后 expect(streamingState).toBe('stopped') | **【需页面集成】** ThinkingPanel |
| F3.1 | GET /api/design/[step] | 加载当前步骤数据 | expect(await fetch('/api/design/bounded-context')).resolves.toEqual(expect.any(Object)) | - |
| F3.2 | POST /api/design/[step] | 保存当前步骤数据 | expect(await post('/api/design/bounded-context', data)).resolves.toEqual({success: true}) | - |
| F3.3 | 页面加载恢复 | useEffect 中调用 load() | 刷新页面后 expect(data).toEqual(savedData) | **【需页面集成】** 各设计页面 |
| F4.1 | 双向步骤导航 | designStore.currentStep 支持前进和回退 | 回退后 expect(currentStep).toBeLessThan(initialStep) | - |
| F4.2 | 数据快照恢复 | 回退后前进数据从 snapshot 恢复 | 回退再前进后 expect(data).toEqual(originalData) | - |
| F4.3 | 清除后续步骤 | 回退到 Step 1 时后续快照清除 | 回退 Step 1 后 expect(Object.keys(snapshots)).toHaveLength(1) | - |

---

## 4. 依赖关系

- **上游**: vibex-step2-issues / analyze-requirements ✅
- **下游**: vibex-step2-issues / impl-design-steps（Dev）
- **下游**: vibex-step2-issues / test-design-steps（Tester）

---

## 5. 技术约束

1. **复用优先**: 设计页面复用首页已有组件（StepNavigator, ThinkingPanel），减少重复代码
2. **状态隔离**: designStore 支持多流程状态（首页 DDD vs 设计流程），避免状态冲突
3. **降级兜底**: API 不可用时使用 localStorage，保证功能可用
4. **页面集成**: 所有涉及 UI 的功能均标注【需页面集成】

---

## 6. 实施步骤

```
Phase 1: 步骤指示器 (3h)
  - 各设计页面集成 StepNavigator
  - 接入 designStore.currentStep
  - 实现已步骤点击跳转

Phase 2: 思考面板 (5h)
  - bounded-context 页面集成 ThinkingPanel
  - 接入 stream-service 流式输出
  - 添加 markdown 渲染 + 中断功能

Phase 3: API 持久化 (4h)
  - 设计 /api/design/[step] RESTful 接口
  - designStore 添加 load/save 方法
  - localStorage 兜底降级

Phase 4: 步骤回退 (3h)
  - designStore 实现 stepSnapshots
  - 双向导航逻辑
  - 清除后续步骤快照
```

**预估总工时**: 约 15 小时

---

## 7. 验收标准汇总

- [ ] F1.1: StepNavigator 在所有设计页面可见
- [ ] F1.2: 步骤状态与 designStore 同步
- [ ] F1.3: 已完成步骤可点击跳转
- [ ] F2.1: ThinkingPanel 流式输出正常
- [ ] F2.2: markdown 渲染正确
- [ ] F2.3: 中断功能工作正常
- [ ] F3.1: GET 接口正常返回数据
- [ ] F3.2: POST 接口正常保存数据
- [ ] F3.3: 刷新后数据恢复
- [ ] F4.1: 双向导航正常
- [ ] F4.2: 快照恢复正确
- [ ] F4.3: 回退 Step 1 清除后续数据
- [ ] npm run build 成功

---

*PM Agent | 2026-03-20*
