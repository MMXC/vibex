# PRD: 首页 AI 思考过程显示修复

**项目**: vibex-homepage-thinking-panel-fix-v2
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

用户在首页 Step 1 点击"开始生成"后，AI 思考面板显示错误的步骤信息（P0 级问题）。

### 目标

修复 ThinkingPanel 消息选择逻辑，使其基于实际 SSE 状态而非 `currentStep` 显示。

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Step 1 消息正确率 | 100% |
| Step 2 消息正确率 | 100% |
| Step 3 消息正确率 | 100% |

---

## 2. 问题陈述

### 2.1 用户痛点

- Step 1 点击"开始生成"后，AI 面板显示业务流程消息
- 用户无法看到限界上下文生成的实际进度
- 严重破坏用户体验

### 2.2 根因

| 当前实现 | 正确实现 |
|----------|----------|
| 基于 `currentStep` 选择消息 | 基于活跃的 SSE Hook 状态 |

---

## 3. 功能需求

### F1: SSE 状态驱动的消息选择

**描述**: ThinkingPanel 根据 SSE Hook 的实际状态（thinking/done/error）选择显示消息

**验收标准**:
- AC1.1: 当 `useDDDStream` 状态为 thinking 时，显示 `thinkingMessages`
- AC1.2: 当 `useDomainModelStream` 状态为 thinking 时，显示 `modelThinkingMessages`
- AC1.3: 当 `useBusinessFlowStream` 状态为 thinking 时，显示 `flowThinkingMessages`
- AC1.4: 当所有状态为 idle 时，显示默认空状态

### F2: 状态优先级处理

**描述**: 多个 SSE Hook 同时活跃时的优先级处理

**验收标准**:
- AC2.1: 限界上下文生成优先级最高
- AC2.2: 领域模型生成次之
- AC2.3: 业务流程生成优先级最低

### F3: 错误状态正确显示

**描述**: SSE 发生错误时正确显示错误消息

**验收标准**:
- AC3.1: 当任一 Hook 状态为 error 时，显示对应的 errorMessage
- AC3.2: 重试按钮绑定到正确的 abort 函数

---

## 4. Epic 拆分

### Epic 1: 消息选择逻辑重构

**负责人**: Dev | **预估**: 1-2h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 实现 `getActiveStreamData()` 函数 | expect(getActiveStreamData()).toReturn(activeStream) |
| S1.2 | 替换 ThinkingPanel 的消息来源 | expect(thinkingPanel.props.messages).toEqual(activeStream.thinkingMessages) |
| S1.3 | 处理 idle 空状态 | expect(idleState).toShowDefaultView() |

---

### Epic 2: 测试验证

**负责人**: Tester | **预估**: 1h

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | Step 1 手动测试 | expect(step1Panel).toShowContextMessages() |
| S2.2 | Step 2 手动测试 | expect(step2Panel).toShowModelMessages() |
| S2.3 | Step 3 手动测试 | expect(step3Panel).toShowFlowMessages() |
| S2.4 | E2E 测试 | expect(e2e).toPass() |

---

## 5. UI/UX 流程

```
用户进入首页 (currentStep = 1)
    ↓
点击「🚀 开始生成」
    ↓
useDDDStream 状态变为 'thinking'
    ↓
getActiveStreamData() 检测到 thinking
    ↓
ThinkingPanel 显示限界上下文消息 ✓
    ↓
SSE 完成，状态变为 'done'
    ↓
currentStep 切换到 2
```

---

## 6. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | 状态检测无额外渲染延迟 |
| 兼容性 | Chrome / Edge / Firefox 最新版 |
| 可维护性 | 逻辑集中，易于理解和扩展 |

---

## 7. 依赖项

| 依赖 | 说明 |
|------|------|
| useDDDStream hook | 限界上下文 SSE |
| useDomainModelStream hook | 领域模型 SSE |
| useBusinessFlowStream hook | 业务流程 SSE |
| ThinkingPanel 组件 | 无需修改 |

---

## 8. 实施计划

| 阶段 | 任务 | 预估工时 |
|------|------|----------|
| Phase 1 | 实现 getActiveStreamData 函数 | 1h |
| Phase 2 | 替换 ThinkingPanel 数据源 | 0.5h |
| Phase 3 | 手动测试验证 | 0.5h |
| Phase 4 | E2E 测试 | 0.5h |

**总计**: 2.5h

---

## 9. 验收 CheckList

- [ ] AC1.1: Step 1 显示限界上下文消息
- [ ] AC1.2: Step 2 显示领域模型消息
- [ ] AC1.3: Step 3 显示业务流程消息
- [ ] AC1.4: idle 状态显示默认视图
- [ ] AC2.1: 优先级处理正确
- [ ] AC3.1: 错误状态显示 errorMessage
- [ ] AC3.2: 重试按钮绑定正确

---

## 10. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 多 SSE 同时活跃 | 低 | 中 | 优先级处理 |
| 修改影响其他步骤 | 低 | 中 | 回归测试 |

---

**DoD (Definition of Done)**:
1. 代码合并到 main 分支
2. 手动测试通过
3. E2E 测试通过
4. 无阻断性 bug
