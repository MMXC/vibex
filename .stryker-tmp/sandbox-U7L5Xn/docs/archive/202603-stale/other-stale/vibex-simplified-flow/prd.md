# PRD: Vibex 流程简化（5步→3步）

**项目**: vibex-simplified-flow  
**版本**: 1.0  
**日期**: 2026-03-23  
**角色**: PM  

---

## 1. 执行摘要

| 属性 | 值 |
|------|-----|
| **项目名** | Vibex 流程简化 |
| **类型** | UX/功能重构 |
| **目标** | 将 5 步 DDD 建模流程压缩为 3 步，用业务语言替代技术术语，提升用户体验 |
| **优先级** | P1 |
| **预估工期** | 6 人日 |
| **向后兼容** | 保留现有 5 步 API，新旧流程共存 |

---

## 2. 问题陈述

当前 Vibex 使用 5 步 DDD 建模流程，存在以下问题：

| 问题 | 影响 |
|------|------|
| DDD 术语门槛高 | 限界上下文、聚合根等概念对非 DDD 专家用户不友好 |
| 步骤冗余 | bounded-context 和 business-flow 有大量重叠信息 |
| 用户参与感低 | 用户只能看不能改，无法真正参与建模 |
| 流程割裂 | 限界上下文和业务流程分离，体验不连贯 |

---

## 3. 解决方案

### 3.1 流程重构

```
现有 5 步:
  Step 1: bounded-context → Step 2: clarification → Step 3: business-flow → Step 4: ui-generation → Step 5: domain-model

简化为 3 步:
  Step 1: 业务领域定义 (Business Domain) ← 合并 bounded-context + business-flow
  Step 2: 需求澄清 (Clarification) ← 保留
  Step 3: UI 生成 (UI Generation) ← 合并 ui-generation + domain-model
```

### 3.2 术语映射表

| 旧术语 (DDD) | 新术语 (业务语言) | 说明 |
|------------|----------------|------|
| 限界上下文 (Bounded Context) | 业务领域 | 用户可理解的核心概念 |
| 核心域 (Core Domain) | 核心业务 | 系统最核心的业务价值 |
| 支撑域 (Supporting Domain) | 支撑业务 | 支撑核心业务的辅助功能 |
| 通用域 (Generic Domain) | 通用能力 | 可复用的通用模块 |
| 聚合根 (Aggregate Root) | 核心实体 | 业务实体的核心 |
| 领域事件 (Domain Event) | 业务事件 | 业务流程中的关键节点 |
| 领域模型 (Domain Model) | 数据结构 | 技术团队可见的底层结构 |

### 3.3 核心变更

1. **Step 1 并行生成**: AI 同时生成业务领域 + 业务流程图，无需用户分别填写
2. **交互式编辑**: 用户可修改节点名称、勾选功能点、添加新节点
3. **AI 生成 + 用户确认**: 不再要求用户手动建模，降低门槛
4. **组件勾选**: Step 3 生成带勾选框的页面卡片，用户选择要包含的组件

---

## 4. Success Metrics

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 流程步骤数 | 5 步 | 3 步 |
| 术语技术化率 | 100% (DDD 术语) | 0% (全业务语言) |
| 用户可编辑节点 | 0 | 100% (所有节点) |
| npm build | — | 通过 |
| E2E 测试 | — | 通过 |

---

## 5. 功能需求矩阵

### F1: Step 1 — 业务领域定义

> 合并 bounded-context + business-flow，用业务语言表达

| ID | 功能点 | 描述 | 验收标准 | 优先级 | 页面集成 |
|----|--------|------|----------|--------|----------|
| F1.1 | AI 并行生成 | 用户输入需求后，AI 同时生成业务领域 + 业务流程 | `expect(await generateBusinessDomain(requirements)).toResolveWith({ domains: Array, flow: FlowChart })` | P0 | ✅ |
| F1.2 | 业务领域展示 | 以卡片/树形展示业务领域（替代限界上下文） | `expect(screen.getByText('核心业务')).toBeVisible()` | P0 | ✅ |
| F1.3 | 业务流程图展示 | 以流程图展示业务流程 | `expect(flowChart.nodes).toHaveLength(expected)` | P0 | ✅ |
| F1.4 | 节点名称修改 | 用户可双击修改任意节点名称 | `expect(user.editNodeName('Order', '订单')).toUpdateName('订单')` | P0 | ✅ |
| F1.5 | 功能点勾选 | 用户可勾选/取消勾选业务领域下的功能点 | `expect(checkbox.click()).toToggleCheck()` | P0 | ✅ |
| F1.6 | 新增节点 | 用户可在业务领域或流程中添加新节点 | `expect(addNode('新节点')).toBeInFlow()` | P1 | ✅ |
| F1.7 | 删除节点 | 用户可删除不需要的节点 | `expect(deleteNode(node)).toRemoveFromFlow()` | P1 | ✅ |
| F1.8 | 步骤导航 | 可跳转至 Step 2，数据自动保存 | `expect(goToStep2()).toNavigateWith({ data: preserved })` | P0 | ✅ |

**DoD**: 用户在输入需求后 5s 内看到并行的业务领域 + 流程图，且可编辑

### F2: Step 2 — 需求澄清

> 保留现有逻辑，复用澄清机制

| ID | 功能点 | 描述 | 验收标准 | 优先级 | 页面集成 |
|----|--------|------|----------|--------|----------|
| F2.1 | 澄清问题展示 | 显示 AI 生成的澄清问题 | `expect(clarificationQuestions).toHaveLength(expected)` | P0 | ✅ |
| F2.2 | 回答输入 | 用户可输入对每个问题的回答 | `expect(user.answer('Q1', '回答')).toUpdateAnswer()` | P0 | ✅ |
| F2.3 | 问题跳过 | 用户可选择跳过某些问题 | `expect(skipQuestion('Q2')).toMarkSkipped()` | P1 | ✅ |
| F2.4 | 上下文关联 | 澄清答案自动更新 Step 1 的业务领域 | `expect(answer).toUpdateStep1Domains()` | P0 | ✅ |
| F2.5 | 步骤导航 | 可返回 Step 1 或跳转至 Step 3 | `expect(navigate('next')).toGoToStep3()` | P0 | ✅ |

**DoD**: 澄清流程正常工作，答案影响最终 UI 生成结果

### F3: Step 3 — UI 生成

> 合并 ui-generation + domain-model，生成带组件勾选框的页面卡片

| ID | 功能点 | 描述 | 验收标准 | 优先级 | 页面集成 |
|----|--------|------|----------|--------|----------|
| F3.1 | 页面卡片生成 | 基于 Step 1-2 数据生成页面卡片 | `expect(generatePageCards()).toHaveLength(expected)` | P0 | ✅ |
| F3.2 | 组件勾选框 | 每个卡片显示可勾选的组件列表 | `expect(pageCard.checkboxes).toHaveLength(components)` | P0 | ✅ |
| F3.3 | 组件勾选/取消 | 用户可勾选或取消要包含的组件 | `expect(toggleComponent('Button')).toUpdateCard()` | P0 | ✅ |
| F3.4 | 预览更新 | 勾选后实时更新预览 | `expect(preview).toReflectChanges()` | P0 | ✅ |
| F3.5 | 数据结构隐藏 | 底层 DDD 数据结构对普通用户隐藏 | `expect(userView).not.toContain('聚合根')` | P0 | ✅ |
| F3.6 | 技术视图入口 | 提供「高级模式」入口，显示底层 DDD 结构（可选） | `expect(advancedModeToggle).toBeVisible()` | P1 | ✅ |
| F3.7 | 项目创建 | 将配置生成完整项目 | `expect(createProject(config)).toGenerateCode()` | P0 | ✅ |

**DoD**: 用户能通过勾选组件生成符合需求的页面，npm build 通过

### F4: 术语翻译层

> 统一处理旧术语→新术语的翻译

| ID | 功能点 | 描述 | 验收标准 | 优先级 | 页面集成 |
|----|--------|------|----------|--------|----------|
| F4.1 | 术语映射表 | 前端统一维护术语映射配置 | `expect(termMap['bounded-context']).toBe('业务领域')` | P0 | — |
| F4.2 | API 响应翻译 | 后端返回的 DDD 术语在前端自动翻译 | `expect(translateAPIResponse(raw)).toUseBusinessTerms()` | P0 | — |
| F4.3 | 提示文案翻译 | 所有 UI 提示文案使用业务语言 | `expect(hintText).toBe('请输入核心业务描述')` | P0 | ✅ |
| F4.4 | 错误信息翻译 | 错误提示使用用户友好语言 | `expect(errorMsg).not.toContain('aggregate')` | P0 | ✅ |

**DoD**: 任何用户可见文本不包含 DDD 术语（bounded-context/aggregate/event sourcing 等）

### F5: 向后兼容

> 确保现有 API 和数据格式不受影响

| ID | 功能点 | 描述 | 验收标准 | 优先级 | 页面集成 |
|----|--------|------|----------|--------|----------|
| F5.1 | API 共存 | 新流程和旧流程 API 同时可用 | `expect(newFlowAPI).toBeAccessible()` && `expect(oldFlowAPI).toBeAccessible()` | P0 | — |
| F5.2 | 数据迁移 | 用户切换流程时数据不丢失 | `expect(switchFlow()).toPreserveData()` | P0 | — |
| F5.3 | Feature Flag | 通过 feature flag 控制新旧流程切换 | `expect(ENABLE_SIMPLIFIED_FLOW).toBe(true\|false)` | P0 | — |
| F5.4 | 旧流程保留 | 旧 5 步流程在 flag=false 时完全可用 | `expect(oldFlow).toWorkWhen(flag=false)` | P0 | — |

**DoD**: Feature Flag 切换后 0 回归，旧流程功能完整

---

## 6. UI/UX 流程

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: 业务领域定义                                     │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  需求输入 → [AI 并行生成] → 业务领域卡片 + 流程图      │ │
│  │  用户可修改节点名称、勾选功能、添加节点               │ │
│  └─────────────────────────────────────────────────────┘ │
│                          ↓                                │
│  Step 2: 需求澄清                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  AI 生成澄清问题 → 用户回答 → 自动更新 Step 1         │ │
│  └─────────────────────────────────────────────────────┘ │
│                          ↓                                │
│  Step 3: UI 生成                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  页面卡片列表 → 组件勾选 → 实时预览 → 创建项目         │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Epic 拆分

### Epic 1: 流程架构重构

**目标**: 将 5 步流程重构为 3 步，建立新的步骤组件和路由

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S1.1 | 创建 3 步流程路由 | `expect('/create/step1').toRender(BusinessDomainStep)` | P0 |
| S1.2 | 移除 bounded-context 独立路由 | `expect('/design/bounded-context').toRedirect('/create/step1')` | P0 |
| S1.3 | 移除 domain-model 独立路由 | `expect('/design/domain-model').toRedirect('/create/step3')` | P0 |
| S1.4 | 步骤进度条更新 | `expect(stepper.steps).toHaveLength(3)` | P0 |
| S1.5 | Feature Flag 集成 | `expect(ENABLE_SIMPLIFIED_FLOW).toBeConfigurable()` | P0 |
| S1.6 | 步骤间数据传递 | `expect(step1Data).toPersistToStep2()` && `expect(step2Data).toPersistToStep3()` | P0 |

### Epic 2: 业务领域定义 (Step 1)

**目标**: 实现 Step 1 的并行生成和交互式编辑

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S2.1 | AI 并行生成业务领域 + 流程图 | `expect(parallelGenerate(requirements)).toResolveIn(<5s)` | P0 |
| S2.2 | 业务领域卡片组件 | `expect(DomainCard).toRenderWith({ domain, features })` | P0 |
| S2.3 | 业务流程图组件 (ReactFlow) | `expect(FlowChart).toRenderWith({ nodes, edges })` | P0 |
| S2.4 | 节点编辑 (名称修改) | `expect(editNode(id, name)).toUpdateNode()` | P0 |
| S2.5 | 功能点勾选 | `expect(toggleFeature(id)).toUpdateState()` | P0 |
| S2.6 | 新增/删除节点 | `expect(addNode()).toInsertIntoFlow()` && `expect(deleteNode()).toRemoveFromFlow()` | P1 |
| S2.7 | 数据保存到 Zustand/store | `expect(store.getState().step1).toMatchObject({ domains: [], flow: {} })` | P0 |

### Epic 3: 需求澄清 (Step 2)

**目标**: 复用并优化 Step 2 澄清机制

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S3.1 | 澄清问题列表组件 | `expect(ClarificationList).toRenderWith(questions)` | P0 |
| S3.2 | 回答输入组件 | `expect(AnswerInput).toUpdateAnswer(questionId)` | P0 |
| S3.3 | 答案回写 Step 1 | `expect(answer).toTriggerStep1Update()` | P0 |
| S3.4 | 跳过功能 | `expect(skip(questionId)).toMarkSkipped()` | P1 |

### Epic 4: UI 生成 (Step 3)

**目标**: 实现 Step 3 的组件勾选和预览

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S4.1 | 页面卡片列表组件 | `expect(PageCardList).toRenderWith(cards)` | P0 |
| S4.2 | 组件勾选框 | `expect(ComponentCheckbox).toToggle(selected)` | P0 |
| S4.3 | 实时预览更新 | `expect(preview).toReRenderOnToggle()` | P0 |
| S4.4 | 项目创建 API 调用 | `expect(createProject(config)).toCallAPI()` | P0 |

### Epic 5: 术语翻译层

**目标**: 消除所有用户可见的 DDD 术语

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S5.1 | 术语映射配置文件 | `expect(TERM_MAP).toHaveProperty('bounded-context', '业务领域')` | P0 |
| S5.2 | API 响应翻译 hook | `expect(useTermTranslation(raw)).toReturnBusinessTerms()` | P0 |
| S5.3 | i18n 文案更新 | `expect(i18n['step1.hint']).toBe('请输入核心业务描述')` | P0 |
| S5.4 | 错误信息翻译 | `expect(errorMessages).toContainNoDDDTerms()` | P0 |

### Epic 6: 向后兼容

**目标**: 确保新旧流程共存，0 回归

| Story | 描述 | 验收标准 | 优先级 |
|-------|------|----------|--------|
| S6.1 | Feature Flag 实现 | `expect(NEXT_PUBLIC_SIMPLIFIED_FLOW).toBe('true'\|'false')` | P0 |
| S6.2 | 旧路由保留 (读) | `expect('/design/bounded-context').toWorkWhen(flag=false)` | P0 |
| S6.3 | 数据格式兼容 | `expect(oldDataFormat).toBeReadableBy(newAPI()` | P0 |
| S6.4 | E2E 回归测试 | `expect(E2E_TESTS).toPass()` | P0 |

---

## 8. 非功能需求

| 类型 | 要求 |
|------|------|
| **兼容性** | npm build 通过，npm run lint 通过 |
| **回归** | 旧 5 步流程在 flag=false 时功能完整 |
| **性能** | Step 1 AI 生成 < 5s（并行），页面切换 < 200ms |
| **可访问性** | 符合 WCAG 2.1 AA 标准 |
| **国际化** | 术语翻译层支持多语言扩展 |

---

## 9. Out of Scope

- AI Prompt 优化（由 architect/analyst 负责）
- 旧流程数据迁移工具（v2.0）
- 多语言 UI（i18n 基础设施已就绪，可后续迭代）
- 移动端适配（首期仅支持桌面端）

---

## 10. 依赖

| 依赖方 | 需求 |
|--------|------|
| architect | 提供术语映射表初始版本 |
| dev | Feature Flag 环境变量配置 |
| tester | E2E 测试覆盖 3 步流程 |

---

## 11. DoD (Definition of Done)

- [ ] `ENABLE_SIMPLIFIED_FLOW=true` 时，流程为 3 步
- [ ] `ENABLE_SIMPLIFIED_FLOW=false` 时，流程为 5 步（回归）
- [ ] 所有用户可见文本无 DDD 术语
- [ ] npm build 通过
- [ ] npm run lint 通过
- [ ] E2E 测试覆盖 3 步完整流程
- [ ] 步骤间数据正确传递
- [ ] 组件勾选功能正常，预览实时更新
- [ ] PRD 评审通过
