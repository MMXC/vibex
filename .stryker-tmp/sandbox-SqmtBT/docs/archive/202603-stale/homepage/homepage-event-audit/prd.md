# PRD: 首页事件绑定与 API 调用修复

**项目名称**: homepage-event-audit  
**版本**: 1.0  
**创建日期**: 2026-03-22  
**类型**: Bug Fix / Feature Implementation  
**负责人**: PM Agent

---

## 1. 执行摘要

### 背景
首页 (`HomePage.tsx`) 存在严重事件绑定缺失：8 个 BottomPanel 回调、2 个 Navbar 回调、1 个 AIPanel 回调均为空 stub，导致核心业务流程断裂。

### 目标
修复所有 stub 回调，建立完整事件 → API 调用链路，使核心业务流程可运行。

### 成功指标
- 所有 ActionBar 按钮（诊断/优化/历史/保存/重新生成/AI询问/创建项目）可点击响应
- BottomPanel 输入发送后触发 SSE 流式生成
- AIPanel 消息可发送和展示
- Navbar 菜单和设置按钮可用

---

## 2. Epic 拆分

### Epic 1: 核心回调绑定修复（P0）
**目标**: 修复所有 stub，使核心业务流程可运行

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S1.1 | 绑定 BottomPanel 8 个回调 | `expect(cy.get('[data-testid="action-bar"] button').contains('诊断').click().then(() => fetch...)` 可触发 API | 【需页面集成】 |
| S1.2 | 修复 requirementText 数据流 | BottomPanel 输入 → handleBottomPanelSend → generateContexts → SSE stream | 【需页面集成】 |
| S1.3 | 实现 handleAIPanelSend | AIPanel 输入 → 发送 → 消息展示 | 【需页面集成】 |
| S1.4 | 绑定 Navbar stub + AIPanel onClose | 移动菜单切换 + 设置导航 + AI 面板关闭 | 【需页面集成】 |
| S1.5 | 修复 handleBottomPanelSend | `expect(handleBottomPanelSend('test').then(() => generateContexts)).toHaveBeenCalled()` | 【需页面集成】 |

### Epic 2: 快捷功能实现（P1）
**目标**: 实现诊断/优化/保存等快捷功能

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S2.1 | 实现智能诊断 API | `expect(fetch('/ddd/diagnosis')).toHaveBeenCalledWith({ requirementText, boundedContexts })` | 【需页面集成】 |
| S2.2 | 实现应用优化 API | `expect(fetch('/ddd/optimize')).toHaveBeenCalledWith({ requirementText, domainModels })` | 【需页面集成】 |
| S2.3 | 集成 FloatingMode | 滚动触发底部面板收起/恢复 | 【需页面集成】 |
| S2.4 | ChatHistory 自动发送 | 点击历史项 → 自动重新发送该消息 | 【需页面集成】 |
| S2.5 | QuickAskButtons 自动发送 | 点击快捷问题 → 自动发送 | 【需页面集成】 |

### Epic 3: 状态管理重构（P2）
**目标**: 统一状态管理，消除重复 store

| Story ID | 功能点 | 验收标准 | 页面集成 |
|----------|--------|----------|----------|
| S3.1 | 统一 confirmationStore | `expect(Object.keys(useHomePage()).filter(k => storeKeys.includes(k))).toHaveLength(1)` | ❌ |
| S3.2 | SSE 超时保护 | `expect(fetch with AbortSignal.timeout(60000)).toHaveBeenCalled()` | 【需页面集成】 |
| S3.3 | 错误边界 UI | SSE 出错时显示重试按钮 | 【需页面集成】 |

---

## 3. 功能需求详情

### F1: BottomPanel 回调绑定
| 属性 | 值 |
|------|-----|
| **功能ID** | F1.1 |
| **功能点** | 绑定 BottomPanel 8 个回调到实际逻辑 |
| **描述** | 将 BottomPanel 的 onAIAsk/onDiagnose/onOptimize/onHistory/onSave/onRegenerate/onCreateProject/onSendMessage 从空 stub 绑定到实际处理函数 |
| **验收标准** | `expect(fetch).toHaveBeenCalled()` 验证 API 调用 |
| **DoD** | 每个按钮可点击并触发对应逻辑 |

### F2: requirementText 数据流修复
| 属性 | 值 |
|------|-----|
| **功能ID** | F2.1 |
| **功能点** | 修复 BottomPanel 输入 → SSE 生成链路 |
| **描述** | 将 BottomPanelInputArea 的 `onSendMessage` 从空 stub 改为调用 `handleBottomPanelSend`，触发 `generateContexts` 和 SSE 流 |
| **验收标准** | `expect(generateContexts).toHaveBeenCalledWith(expect.any(String))` |
| **DoD** | 输入文本 → 点击发送 → 预览区显示加载 → SSE 流式生成 |

### F3: AIPanel 消息发送
| 属性 | 值 |
|------|-----|
| **功能ID** | F3.1 |
| **功能点** | 实现 handleAIPanelSend |
| **描述** | 实现 `/ddd/chat` API 调用，消息展示在 AIPanel 消息列表 |
| **验收标准** | `expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/ddd/chat'))` |
| **DoD** | 输入消息 → 发送 → 消息出现在消息列表 |

### F4: Navbar 交互绑定
| 属性 | 值 |
|------|-----|
| **功能ID** | F4.1 |
| **功能点** | 绑定 Navbar onMenuToggle + onSettingsClick |
| **描述** | 实现移动菜单切换和设置页面导航 |
| **验收标准** | `expect(setIsMenuOpen).toHaveBeenCalled()` / `expect(router.push).toHaveBeenCalledWith('/settings')` |
| **DoD** | 点击菜单按钮展开/收起，点击设置导航到 /settings |

---

## 4. API 调用规范

| 功能 | 端点 | 方法 | Request | Response |
|------|------|------|---------|----------|
| 智能诊断 | `/ddd/diagnosis` | POST | `{ requirementText, boundedContexts }` | `{ issues: [...] }` |
| 应用优化 | `/ddd/optimize` | POST | `{ requirementText, domainModels }` | `{ suggestions: [...] }` |
| AI 对话 | `/ddd/chat` | POST | `{ message, requirementText }` | `{ reply, thinking }` |
| 创建项目 | `/projects` | POST | `{ requirement }` | `{ projectId }` |

---

## 5. 验收标准

### P0（必须完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P0-1 | 诊断按钮触发 API | `cy.get('[data-testid="action-bar"] button').contains('诊断').click()` → fetch 触发 |
| AC-P0-2 | 优化按钮触发 API | `cy.get('[data-testid="action-bar"] button').contains('优化').click()` → fetch 触发 |
| AC-P0-3 | 历史按钮打开抽屉 | `cy.get('[data-testid="action-bar"] button').contains('历史').click()` → 抽屉打开 |
| AC-P0-4 | 保存按钮写 localStorage | `expect(localStorage.setItem).toHaveBeenCalled()` |
| AC-P0-5 | 重新生成触发 SSE | `expect(retryCurrentStep).toHaveBeenCalled()` |
| AC-P0-6 | AIPanel 发送消息 | 输入文字 → 发送 → 消息出现 |
| AC-P0-7 | BottomPanel 发送触发生成 | 输入 → 发送 → SSE 流开始 |

### P1（建议完成）
| ID | 验收项 | 验证命令 |
|----|--------|----------|
| AC-P1-1 | FloatingMode 悬浮交互 | 滚动超过 50% → 底部面板收起 |
| AC-P1-2 | ChatHistory 自动发送 | 点击历史项 → 自动发送 |
| AC-P1-3 | QuickAskButtons 自动发送 | 点击快捷问题 → 自动发送 |

---

## 6. 实施计划

| 阶段 | 任务 | 产出 | 预计工时 |
|------|------|------|---------|
| Phase1 | 核心回调修复 | 所有 stub 绑定到实际逻辑 | 4h |
| Phase2 | 快捷功能实现 | 诊断/优化/保存/历史 | 6h |
| Phase3 | 状态管理重构 | 统一 store + SSE 超时 | 4h |
| Phase4 | 清理与集成 | FloatingMode + 废弃代码 | 2h |

---

## 7. 非功能需求

| 类型 | 描述 |
|------|------|
| **性能** | SSE fetch 添加 AbortSignal timeout(60000) |
| **可靠性** | 错误边界 + 重试 UI |
| **可测试性** | 每个功能点有 cypress E2E 覆盖 |

---

*PRD 版本: 1.0 | 编写: PM Agent | 2026-03-22*
