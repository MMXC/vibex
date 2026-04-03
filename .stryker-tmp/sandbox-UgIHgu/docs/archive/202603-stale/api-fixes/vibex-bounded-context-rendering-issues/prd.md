# PRD: 限界上下文渲染和进度条问题修复

**项目**: vibex-bounded-context-rendering-issues
**产品经理**: PM Agent
**日期**: 2026-03-17
**版本**: 1.1
**状态**: Ready for Dev

---

## 1. 执行摘要

### 1.1 背景

首页存在三个 P0 级问题，影响用户完成领域建模流程：
- 限界上下文生成完成后图表不渲染
- 流程按钮无法根据步骤区分操作
- AI 思考过程不是渐进式显示

### 1.2 目标

| 问题 ID | 问题描述 | 优先级 |
|---------|----------|--------|
| P0-1 | 限界上下文请求完成后图没有渲染 | P0 |
| P0-2 | 流程分析按钮无变化 | P0 |
| P0-3 | AI思考过程不是渐进式出结果 | P0 |

---

## 2. 问题陈述

### P0-1: 限界上下文渲染问题

**根因**: `streamMermaidCode` 状态同步逻辑存在，但可能数据未正确返回

**影响**: 用户无法看到生成的限界上下文图表

**涉及页面**: `src/components/homepage/HomePage.tsx`

### P0-2: 流程按钮无变化

**根因**: `handleRequirementSubmit` 始终调用 `generateContexts`，未根据 `currentStep` 区分

**影响**: 用户无法在不同步骤触发正确的生成操作

**涉及页面**: `src/components/homepage/HomePage.tsx`

### P0-3: AI思考过程不渐进

**根因**: `thinkingMessages` 被解构为 `_ctxMessages`（未使用），传递给 ThinkingPanel 的是空数组

**影响**: 用户无法看到 AI 思考过程

**涉及页面**: `src/components/homepage/HomePage.tsx`, `src/components/homepage/ThinkingPanel.tsx`

---

## 3. 功能需求 (Functional Requirements)

### F1: 限界上下文渲染修复

**描述**: 修复限界上下文生成完成后图表不渲染的问题

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 图表显示 | 限界上下文生成完成后，图表正确显示在预览区域 | `expect(previewArea.querySelector('svg')).toBeTruthy()` | 【需页面集成】src/components/homepage/HomePage.tsx |
| F1.2 | 状态同步 | `streamMermaidCode` 正确更新到 `currentMermaidCode` | `expect(setCurrentMermaidCode).toHaveBeenCalledWith(expect.any(String))` | 【需页面集成】src/components/homepage/hooks/useHomePage.ts |
| F1.3 | 预览渲染 | 预览区域显示 Mermaid 图表 | `expect(mermaidRenderer.render).toHaveBeenCalled()` | 【需页面集成】src/components/homepage/HomePage.tsx |

### F2: 流程按钮步骤区分

**描述**: 修复按钮无法根据当前步骤触发不同操作的问题

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | 步骤1调用 | 步骤1点击"开始生成"调用 `generateContexts` | `expect(generateContexts).toHaveBeenCalledWith(requirementText)` | 【需页面集成】src/components/homepage/HomePage.tsx |
| F2.2 | 步骤2调用 | 步骤2点击"继续"调用 `generateDomainModels` | `expect(generateDomainModels).toHaveBeenCalledWith(requirementText, boundedContexts)` | 【需页面集成】src/components/homepage/HomePage.tsx |
| F2.3 | 步骤3调用 | 步骤3点击"继续"调用 `generateBusinessFlow` | `expect(generateBusinessFlow).toHaveBeenCalledWith(domainModels)` | 【需页面集成】src/components/homepage/HomePage.tsx |
| F2.4 | 按钮文字 | 按钮文字根据当前步骤变化 | `expect(buttonText).toBe('继续' || '生成')` | 【需页面集成】src/components/homepage/HomePage.tsx |

### F3: 渐进式思考过程

**描述**: 修复 AI 思考过程不渐进显示的问题

**功能点**:

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | 显示思考 | 请求过程中显示思考步骤 | `expect(ThinkingPanel).toRender()` | 【需页面集成】src/components/homepage/HomePage.tsx |
| F3.2 | 渐进更新 | 思考步骤渐进式显示（实时更新） | `expect(setThinkingMessages).toHaveBeenCalled()` | 【需页面集成】src/components/homepage/hooks/useHomePage.ts |
| F3.3 | 保留历史 | 完成后思考过程保留在界面 | `expect(thinkingMessages.length).toBeGreaterThan(0)` | 【需页面集成】src/components/homepage/ThinkingPanel.tsx |
| F3.4 | 数据传递 | `thinkingMessages` 从 useHomePage 正确传递到 ThinkingPanel | `expect(HomePage.props.thinkingMessages).toEqual(thinkingMessages)` | 【需页面集成】src/components/homepage/HomePage.tsx |

---

## 4. Epic 拆分 (Epics Breakdown)

| Epic ID | 名称 | 描述 | 功能点 | 工作量 | 负责人 |
|---------|------|------|--------|--------|--------|
| E-001 | 渲染修复 | 修复限界上下文图表渲染 | F1.1, F1.2, F1.3 | 1h | Dev |
| E-002 | 按钮修复 | 修复流程按钮步骤区分 | F2.1, F2.2, F2.3, F2.4 | 0.5h | Dev |
| E-003 | 思考过程 | 修复渐进式思考显示 | F3.1, F3.2, F3.3, F3.4 | 1h | Dev |
| E-004 | 测试验证 | 功能回归测试 | - | 1h | Tester |

**总工作量**: 3.5 小时

---

## 5. 用户故事 (User Stories)

| ID | 角色 | 故事 | 验收条件 |
|----|------|------|----------|
| US-001 | 用户 | 作为用户，我希望生成限界上下文后能看到图表，以便确认生成结果 | F1.1, F1.2, F1.3 |
| US-002 | 用户 | 作为用户，我希望每步点击按钮能触发正确的生成操作，以便完成完整流程 | F2.1, F2.2, F2.3, F2.4 |
| US-003 | 用户 | 作为用户，我希望看到 AI 的思考过程，以便了解分析进度 | F3.1, F3.2, F3.3, F3.4 |

---

## 6. 验收标准 (Acceptance Criteria)

### 6.1 成功标准

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC-001 | 限界上下文生成后图表显示 | `expect(preview.querySelector('svg')).toBeTruthy()` |
| AC-002 | 按钮根据步骤调用不同 API | `expect(generateXxx).toHaveBeenCalledWith(...)` |
| AC-003 | 思考过程实时显示 | `expect(thinkingMessages.length).toBeGreaterThan(0)` |

### 6.2 DoD (Definition of Done)

- [ ] 三个 P0 问题全部修复
- [ ] 回归测试通过
- [ ] 代码审查通过

---

## 7. 页面集成检查清单

| 功能点 | 涉及页面 | 修改内容 | 验证方式 |
|--------|----------|----------|----------|
| F1.1, F1.3 | HomePage.tsx | 图表预览区域 | 页面截图 |
| F1.2 | useHomePage.ts | 状态同步逻辑 | 代码审查 |
| F2.x | HomePage.tsx | 按钮回调 | 页面截图 |
| F3.x | HomePage.tsx, ThinkingPanel.tsx | props 传递 | 页面截图 |

---

## 8. 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 修复引入新问题 | 中 | 中 | 回归测试 |
| 数据流不确定 | 低 | 高 | 添加调试日志 |

---

## 9. 实施计划

| 阶段 | 时间 | 内容 |
|------|------|------|
| Phase 1 | Day 1 | E-001: 渲染修复 + E-002: 按钮修复 |
| Phase 2 | Day 1 | E-003: 思考过程修复 |
| Phase 3 | Day 1 | E-004: 测试验证 |

---

## 10. 附录

- 分析文档: `docs/vibex-bounded-context-rendering-issues/analysis.md`
- 架构文档: `docs/vibex-bounded-context-rendering-issues/architecture.md`
