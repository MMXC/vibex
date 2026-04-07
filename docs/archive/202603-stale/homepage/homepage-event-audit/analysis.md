# 首页事件绑定与 API 调用审计报告

> 项目: homepage-event-audit  
> 角色: Analyst Agent  
> 审计时间: 2026-03-22  
> 审计范围: HomePage.tsx 及所有子组件的事件处理器、API 调用绑定、状态管理连接  
> 工作目录: /root/.openclaw/vibex/vibex-fronted

---

## 一、审计背景

### 1.1 审计目标
全面审计首页所有按钮的事件处理器、API 调用绑定，识别缺失事件和错误绑定，形成完整的首页功能开发路线图。

### 1.2 审计范围
- **组件层级**: HomePage (容器) → BottomPanel / AIPanel / Navbar / Sidebar / PreviewArea
- **事件类型**: onClick / onChange / onKeyDown / onSubmit / 状态管理连接
- **API 调用**: SSE 流式 API / REST API / localStorage / sessionStorage
- **状态管理**: Zustand stores (authStore / confirmationStore / homePageStore)

### 1.3 首页功能清单摘要

| 模块 | 功能数 | 实现状态 |
|------|--------|---------|
| F1 布局框架 | 5 | ✅ 完整 |
| F2 Header导航 | 4 | ⚠️ 部分 |
| F3 左侧抽屉 | 3 | ✅ 完整 |
| F4 预览区 | 6 | ⚠️ 部分 |
| F5 右侧抽屉 | 3 | ❌ 严重缺失 |
| F6 底部面板 | 10 | ❌ 严重缺失 |
| F7 AI展示区 | 4 | ❌ 未绑定 |
| F9 状态管理 | 4 | ⚠️ 部分 |

---

## 二、问题清单

### 🔴 P0 - 严重阻塞 (共 5 项)

#### P0-1: HomePage.tsx 所有 BottomPanel 回调均为空函数 stub

**文件**: `src/components/homepage/HomePage.tsx` 第 150-158 行

**问题描述**: HomePage 向 BottomPanel 传递的所有 8 个回调 props 均为空函数：

```tsx
<BottomPanel
  isGenerating={isGenerating}
  onAIAsk={() => {}}           // ❌ 空函数
  onDiagnose={() => {}}        // ❌ 空函数
  onOptimize={() => {}}        // ❌ 空函数
  onHistory={() => {}}         // ❌ 空函数
  onSave={() => {}}            // ❌ 空函数
  onRegenerate={() => {}}      // ❌ 空函数
  onCreateProject={() => {}}   // ❌ 空函数
  onSendMessage={handleAIPanelSend} // ❌ TODO: 空实现
/>
```

**影响范围**: 
- ActionBar 的 7 个按钮全部失效（诊断/优化/历史/保存/重新生成/AI询问/创建项目）
- 底部面板 F6.4-F6.10 全部不可用

**根因分析**: useHomePage hook 定义了这些回调的能力，但没有在 HomePage 组件中调用它们

**实现方案**:

```tsx
// 新增: 底部面板发送处理
const handleBottomPanelSend = useCallback((message: string) => {
  if (!message.trim() || isGenerating) return;
  setRequirementText(message);
  clearDraft();
  setCompletedStep(0);
  setCurrentStep(1);
  setThinkingMessages([]);
  generateContexts(message);
}, [isGenerating, setRequirementText, clearDraft, generateContexts]);

// 新增: 诊断处理
const handleDiagnose = useCallback(async () => {
  const res = await fetch(getApiUrl('/ddd/diagnosis'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementText, boundedContexts }),
  });
  const data = await res.json();
  setDiagnosisCount(data.issues?.length || 0);
}, [requirementText, boundedContexts]);

// 新增: 优化处理
const handleOptimize = useCallback(async () => {
  const res = await fetch(getApiUrl('/ddd/optimize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirementText, domainModels }),
  });
  const data = await res.json();
  setOptimizeCount(data.suggestions?.length || 0);
}, [requirementText, domainModels]);

// 新增: 保存处理
const handleSave = useCallback(() => {
  const snapshot = { step: currentStep, requirementText, timestamp: Date.now() };
  localStorage.setItem(`vibex-snapshot-${Date.now()}`, JSON.stringify(snapshot));
}, [currentStep, requirementText]);

// 新增: 历史记录处理
const handleHistory = useCallback(() => {
  setHistoryDrawerOpen(true);
}, []);

// 新增: 创建项目处理
const handleCreateProject = useCallback(() => {
  router.push({ pathname: '/projects/new', query: { requirement: requirementText } });
}, [requirementText]);

// 新增: 重新生成处理
const handleRegenerate = useCallback(() => {
  retryCurrentStep();
}, [retryCurrentStep]);
```

**验收标准**:
- [ ] `cy.get('[data-testid="action-bar"] button').contains('诊断').click()` 触发诊断 API 调用
- [ ] `cy.get('[data-testid="action-bar"] button').contains('优化').click()` 触发优化 API 调用
- [ ] `cy.get('[data-testid="action-bar"] button').contains('历史').click()` 打开历史抽屉
- [ ] `cy.get('[data-testid="action-bar"] button').contains('保存').click()` 保存到 localStorage
- [ ] `cy.get('[data-testid="action-bar"] button').contains('重新生成').click()` 重试 SSE 流
- [ ] `cy.get('[data-testid="action-bar"] button').contains('创建项目').click()` 导航到 /projects/new
- [ ] `cy.get('[data-testid="action-bar"] button').contains('AI询问').click()` 触发 AI 对话

---

#### P0-2: Navbar onMenuToggle 和 onSettingsClick 为空 stub

**文件**: `src/components/homepage/HomePage.tsx` 第 110-111 行

**问题描述**:

```tsx
<Navbar
  isAuthenticated={isAuthenticated}
  onLoginClick={() => setIsLoginDrawerOpen(true)}  // ✅ 正确实现
  onMenuToggle={() => {}}    // ❌ 空函数
  onSettingsClick={() => {}} // ❌ 空函数
/>
```

**影响范围**: 移动端菜单按钮和设置按钮无法使用

**实现方案**:

```tsx
const [isMenuOpen, setIsMenuOpen] = useState(false);

<Navbar
  isAuthenticated={isAuthenticated}
  onLoginClick={() => setIsLoginDrawerOpen(true)}
  onMenuToggle={() => setIsMenuOpen(v => !v)}
  onSettingsClick={() => router.push('/settings')}
/>
```

**验收标准**:
- [ ] 移动端点击菜单按钮展开/收起移动菜单
- [ ] 点击设置按钮导航到 /settings

---

#### P0-3: AIPanel onClose 为空 stub

**文件**: `src/components/homepage/HomePage.tsx` 第 142 行

**问题描述**:

```tsx
<AIPanel
  isOpen={true}
  messages={adaptedMessages}
  onClose={() => {}}   // ❌ 空函数 - 右侧抽屉无法关闭
  onSendMessage={handleAIPanelSend}
/>
```

**影响范围**: 右侧 AI 面板无法通过 × 按钮关闭（虽然 isOpen 硬编码为 true）

**实现方案**:

```tsx
const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);

<AIPanel
  isOpen={isAIPanelOpen}
  messages={adaptedMessages}
  onClose={() => setIsAIPanelOpen(false)}
  onSendMessage={handleAIPanelSend}
  newItemId={newThinkingItemId}
/>
```

**验收标准**:
- [ ] 点击 × 按钮关闭右侧 AI 面板
- [ ] `cy.get('[data-testid="ai-panel"] .closeButton').click()` 触发 onClose

---

#### P0-4: handleAIPanelSend 为空 TODO stub

**文件**: `src/components/homepage/HomePage.tsx` 第 99 行

**问题描述**:

```tsx
const handleAIPanelSend = useCallback((_message: string) => {
  // TODO: 实现 AI 对话发送逻辑 (后续 Epic 集成)
}, []);
```

**影响范围**: 
- AIPanel 输入框的发送功能完全无效
- 用户在 AI 面板中无法发送任何消息

**实现方案**:

```tsx
const handleAIPanelSend = useCallback(async (message: string) => {
  setThinkingMessages(prev => [...prev, { step: 'chat', message: `[用户]: ${message}` }]);
  try {
    const res = await fetch(getApiUrl('/ddd/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, requirementText }),
    });
    const data = await res.json();
    setThinkingMessages(prev => [...prev, { step: 'chat', message: data.reply }]);
  } catch (err) {
    setThinkingMessages(prev => [...prev, { step: 'chat', message: `错误: ${err.message}` }]);
  }
}, [requirementText]);
```

**验收标准**:
- [ ] 在 AIPanel 输入框输入文字，点击发送后消息出现在消息列表
- [ ] `cy.get('[data-testid="ai-panel"] .sendButton').click()` 触发发送
- [ ] Enter 键触发发送
- [ ] 发送后输入框清空

---

#### P0-5: requirementText 未与 BottomPanelInputArea 绑定

**文件**: `src/components/homepage/HomePage.tsx`

**问题描述**: 
- `useHomePage` 返回了 `requirementText` 和 `setRequirementText`
- 但 BottomPanelInputArea 有自己的内部 `inputValue` state
- 草稿恢复功能 (`useDraft`) 使用独立存储
- 两套状态系统并存，数据不同步

**数据流分析**:

```
BottomPanelInputArea 用户输入
  → handleInputChange → saveDraft (localStorage)
  → handleSend → onSendMessage(message)
    → handleAIPanelSend (空 stub) ❌
    → generateContexts 从未被调用
```

**实现方案**:

```tsx
// handleSend 调用改为触发实际生成
const handleBottomPanelSend = useCallback((message: string) => {
  if (!message.trim() || isGenerating) return;
  setRequirementText(message);
  clearDraft();
  setCompletedStep(0);
  setCurrentStep(1);
  setThinkingMessages([]);
  generateContexts(message);
}, [isGenerating, setRequirementText, clearDraft, generateContexts]);
```

**验收标准**:
- [ ] 在底部面板输入需求文本，点击发送触发 SSE 流式生成
- [ ] Ctrl+Enter 快捷键触发发送
- [ ] 发送后预览区显示加载状态
- [ ] 草稿在刷新后正确恢复

---

### 🟡 P1 - 重要缺陷 (共 6 项)

#### P1-1: FloatingMode 组件已定义但未使用

**文件**: `src/components/homepage/FloatingMode.tsx` + `src/components/homepage/HomePage.tsx`

**问题描述**: `useFloatingMode` hook 和 `FloatingMode` 组件已完整实现（ST-8.1 滚动触发收起、ST-8.2 停止滚动恢复），但 HomePage.tsx 中没有引入和使用。

**实现方案**:

```tsx
import { FloatingMode } from './FloatingMode';
import { useFloatingMode } from './hooks/useFloatingMode';

const { isFloating } = useFloatingMode({ threshold: 0.5, resumeDelay: 1000, enabled: true });

// 包裹底部面板
<FloatingMode enabled={true} bottomPanelRef={bottomPanelRef}>
  <div className={styles.bottomPanel}>
    <BottomPanel ... />
  </div>
</FloatingMode>
```

**验收标准**:
- [ ] 滚动预览区超过 50% 时底部面板收起为悬浮栏
- [ ] 停止滚动 1s 后底部面板恢复
- [ ] 悬浮栏可点击收起按钮完全关闭

---

#### P1-2: ChatHistory.onExpand 重新填充输入框但无后续动作

**文件**: `src/components/homepage/BottomPanel/BottomPanel.tsx` 第 100-107 行

**问题描述**: 点击历史记录项填充到输入框后，需要手动点击发送按钮

**实现方案**:

```tsx
const handleHistoryExpand = useCallback(
  (messageId: string) => {
    const msg = chatHistory.find((m) => m.id === messageId);
    if (msg) {
      setInputValue(msg.content);
      saveDraft(msg.content);
      // 自动重新发送
      handleSend(msg.content);
    }
  },
  [chatHistory, saveDraft, handleSend]
);
```

**验收标准**:
- [ ] 点击历史记录项自动重新发送该消息
- [ ] 不需要手动点击发送按钮

---

#### P1-3: QuickAskButtons 点击后无后续动作

**文件**: `src/components/homepage/BottomPanel/BottomPanel.tsx` 第 80-86 行

**问题描述**: 5 个快捷问题按钮 `onQuickAsk` → `onAIAsk` → 空 stub，无任何后续处理

**实现方案**:

```tsx
const handleQuickAsk = useCallback(
  (question: string) => {
    setInputValue(question);
    saveDraft(question);
    handleSend(question);
  },
  [saveDraft, handleSend]
);
```

**验收标准**:
- [ ] 点击任意快捷问题按钮，消息出现在 AI 面板
- [ ] SSE 流响应显示在 thinkingMessages

---

#### P1-4: useHomePage 自动步骤触发仅限首次运行

**文件**: `src/components/homepage/hooks/useHomePage.ts` 第 148-162 行

**问题描述**: 自动触发 Step 2→3 和 Step 3→4 的 useEffect 仅在 `domainModels.length === 0` 时触发。重新生成时上下文失效。

**验收标准**:
- [ ] 完成 Step 1 后自动触发 Step 2
- [ ] 完成 Step 2 后自动触发 Step 3
- [ ] 手动点击"重新生成"后正确重置并重新触发

---

#### P1-5: Header vs Navbar 组件职责混淆

**文件**: `src/components/homepage/Header/Header.tsx` vs `src/components/homepage/Navbar/Navbar.tsx`

**问题描述**: 
- `Header`: 完整导航 (项目/模板/文档/登录) + 认证状态管理 ✅
- `Navbar`: 简化版 (模板/开始使用) + 无认证管理 ⚠️
- HomePage 使用 Navbar，功能不完整

**验收标准**:
- [ ] 登录状态切换时 Header/Navbar 正确更新
- [ ] 所有导航链接可点击并正确跳转

---

#### P1-6: 6-step 流程组件完全未使用

**文件**: `src/components/homepage/HomePage.tsx` 第 44-52 行 + `src/components/homepage/steps/`

**问题描述**: 定义了完整的 6 步流程常量，但对应的 Step 组件 (StepBoundedContext / StepDomainModel / StepClarification / StepBusinessFlow / StepProjectCreate) 未在任何地方使用。代码废弃但维护成本存在。

**验收标准**:
- [ ] 当前步骤在侧边栏正确高亮
- [ ] 步骤切换后预览区内容正确刷新

---

### 🟢 P2 - 优化建议 (共 4 项)

#### P2-1: confirmationStore 和 homePageStore 状态重复

三层状态管理并存：`confirmationStore` / `homePageStore` / `useHomePage` useState。建议统一使用 `confirmationStore`。

#### P2-2: 缺少错误边界和重试 UI

SSE 出错时仅设置 `currentError`，没有错误展示组件和重试按钮。应在 PreviewArea 中添加错误状态展示。

#### P2-3: AIDisplay 三个卡片为 disabled 时无视觉反馈

建议添加 loading 动画和禁用态视觉区分。

#### P2-4: Stream Service 无超时保护

SSE fetch 无超时配置，网络断开时可能无限等待。建议添加 AbortSignal timeout:

```tsx
const timeoutId = setTimeout(() => abortControllerRef.current?.abort(), 60000);
try {
  // SSE stream...
} finally {
  clearTimeout(timeoutId);
}
```

---

## 三、技术风险评估

| 风险 ID | 风险描述 | 严重度 | 概率 | 缓解策略 |
|---------|---------|--------|------|---------|
| TR-1 | BottomPanel 回调全为 stub，核心业务流程断裂 | 🔴 高 | 确定 | P0 优先级修复 |
| TR-2 | requirementText 未绑定，数据流断裂 | 🔴 高 | 确定 | P0 优先级修复 |
| TR-3 | 6-step 组件未使用，代码废弃 | 🟡 中 | 确定 | P1 优先级清理或集成 |
| TR-4 | 多层状态管理导致数据不一致 | 🟡 中 | 高 | P2 统一 store |
| TR-5 | SSE 无超时，网络异常时无法恢复 | 🟢 低 | 中 | 添加 timeout |
| TR-6 | FloatingMode 未集成，悬浮交互缺失 | 🟢 低 | 确定 | P1 优先级集成 |

---

## 四、API 调用完整审计

### 4.1 已实现的 SSE API

| 端点 | 方法 | 调用位置 | 状态 |
|------|------|---------|------|
| `/ddd/bounded-context/stream` | POST | useDDDStream | ✅ 完整 |
| `/ddd/domain-model/stream` | POST | useDomainModelStream | ✅ 完整 |
| `/ddd/business-flow/stream` | POST | useBusinessFlowStream | ✅ 完整 |

### 4.2 需要新增的 API 端点

| 功能 | 端点 | 方法 | 状态 |
|------|------|------|------|
| 智能诊断 | `/ddd/diagnosis` | POST | ❌ 待实现 |
| 应用优化 | `/ddd/optimize` | POST | ❌ 待实现 |
| AI 对话 | `/ddd/chat` | POST | ❌ 待实现 |
| 创建项目 | `/projects` | POST | ❌ 待实现 |

### 4.3 登录认证 API

| 功能 | 端点 | 状态 | 文件 |
|------|------|------|------|
| 登录 | `POST /auth/login` | ✅ 完整 | LoginDrawer.tsx |
| 注册 | `POST /auth/register` | ✅ 完整 | LoginDrawer.tsx |
| 退出 | 清除 store + storage | ✅ 完整 | authStore.ts |
| 状态检测 | `useAuthStore.checkAuth()` | ✅ 完整 | useHomePage.ts |

---

## 五、事件处理器绑定矩阵

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HomePage (容器层)                              │
├──────────────────┬──────────────┬──────────────────────────────────┤
│ 组件             │ 事件         │ 绑定状态                          │
├──────────────────┼──────────────┼──────────────────────────────────┤
│ Navbar           │ onLoginClick │ ✅ setIsLoginDrawerOpen(true)     │
│ Navbar           │ onMenuToggle │ ❌ 空 stub (P0-2)                │
│ Navbar           │ onSettings   │ ❌ 空 stub (P0-2)                │
│ Sidebar          │ onStepClick  │ ✅ setCurrentStep(step)          │
│ BottomPanel      │ onAIAsk      │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onDiagnose   │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onOptimize   │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onHistory    │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onSave       │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onRegenerate │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onCreateProj │ ❌ 空 stub (P0-1)                │
│ BottomPanel      │ onSendMsg    │ ❌ 空 stub (P0-1+P0-5)          │
│ AIPanel          │ onClose      │ ❌ 空 stub (P0-3)                │
│ AIPanel          │ onSendMsg    │ ❌ handleAIPanelSend TODO (P0-4)│
├──────────────────┼──────────────┼──────────────────────────────────┤
│                   BottomPanel (子组件)                                │
├──────────────────┼──────────────┼──────────────────────────────────┤
│ CollapseHandle   │ onToggle     │ ✅ setIsCollapsed                 │
│ QuickAskButtons  │ onQuickAsk   │ ⚠️ 传入 onAIAsk → 空 (P1-3)     │
│ AIDisplay        │ onDiagnose   │ ✅ 传入 BottomPanel props         │
│ AIDisplay        │ onOptimize   │ ✅ 传入 BottomPanel props         │
│ AIDisplay        │ onClarify    │ ✅ 传入 BottomPanel props         │
│ InputArea        │ onChange     │ ✅ saveDraft (草稿)               │
│ InputArea        │ onSend       │ ✅ 传入 onSendMessage → 空 stub  │
│ InputArea        │ onKeyDown    │ ✅ Ctrl+Enter → handleSend       │
│ ChatHistory       │ onExpand     │ ⚠️ 填充输入框但无发送 (P1-2)    │
│ ActionBar        │ (7个按钮)    │ ✅ 传入 BottomPanel props         │
├──────────────────┼──────────────┼──────────────────────────────────┤
│                   AIPanel (子组件)                                    │
├──────────────────┼──────────────┼──────────────────────────────────┤
│ 输入框           │ onChange     │ ✅ setInputValue                  │
│ 输入框           │ onKeyDown    │ ✅ Enter → handleSend             │
│ 发送按钮         │ onClick      │ ✅ handleSend                     │
│ 关闭按钮         │ onClick      │ ✅ 传入 onClose → 空 stub         │
└──────────────────┴──────────────┴──────────────────────────────────┘

图例: ✅ 已正确绑定  ⚠️ 部分绑定  ❌ 未绑定 (stub)
```

---

## 六、首页功能开发路线图

### Phase 1: 核心回调修复 (P0) - 预计 4h

**目标**: 修复所有 stub 回调，使核心业务流程可运行

| 任务 | 描述 | 验收标准 | 预计工时 |
|------|------|---------|---------|
| T-1.1 | 绑定 BottomPanel 8 个回调到 useHomePage | 所有 ActionBar 按钮可点击响应 | 1h |
| T-1.2 | 修复 requirementText 数据流 | 输入→发送→SSE 生成完整链路 | 1h |
| T-1.3 | 实现 handleAIPanelSend | AIPanel 消息可发送和展示 | 1h |
| T-1.4 | 绑定 Navbar stub 和 AIPanel onClose | 导航和抽屉可关闭 | 0.5h |
| T-1.5 | 集成测试覆盖 | Playwright E2E 覆盖核心路径 | 0.5h |

### Phase 2: 快捷功能实现 (P1) - 预计 6h

**目标**: 实现诊断/优化/保存等快捷功能

| 任务 | 描述 | 验收标准 | 预计工时 |
|------|------|---------|---------|
| T-2.1 | 实现智能诊断 API 调用 | 诊断结果展示在 AIDisplay | 1h |
| T-2.2 | 实现应用优化 API 调用 | 优化建议展示在 AIDisplay | 1h |
| T-2.3 | 实现历史记录 localStorage 持久化 | 历史可查看/恢复/删除 | 1h |
| T-2.4 | 实现保存快照功能 | 多版本快照保存和恢复 | 1h |
| T-2.5 | 集成 FloatingMode | 悬浮交互体验 | 1h |
| T-2.6 | 修复 ChatHistory 和 QuickAsk 自动发送 | 用户体验优化 | 1h |

### Phase 3: 状态管理重构 (P2) - 预计 4h

**目标**: 统一状态管理，消除重复 store

| 任务 | 描述 | 验收标准 | 预计工时 |
|------|------|---------|---------|
| T-3.1 | 统一 confirmationStore | 消除 homePageStore 重复 | 2h |
| T-3.2 | 添加 SSE 超时保护 | 网络异常自动中断+重试 | 1h |
| T-3.3 | 错误边界和重试 UI | 优雅的错误展示 | 1h |

### Phase 4: 清理与集成 (P2) - 预计 2h

**目标**: 清理废弃代码，集成未使用的组件

| 任务 | 描述 | 验收标准 | 预计工时 |
|------|------|---------|---------|
| T-4.1 | 决定 6-step 组件去留 | 集成或移除废弃代码 | 1h |
| T-4.2 | 统一 Header/Navbar | 导航体验一致 | 1h |

---

## 七、实现方案详细说明

### 7.1 核心数据流修复

**当前断裂的数据流**:

```
用户输入 → BottomPanelInputArea.internalState → handleSend → onSendMessage
→ handleAIPanelSend (空) → ❌ 断裂
```

**修复后的数据流**:

```
用户输入 → BottomPanelInputArea.value → handleSend → handleBottomPanelSend
→ setRequirementText + generateContexts → SSE stream → thinkingMessages
→ setCurrentStep(2) → PreviewArea 更新
```

### 7.2 诊断/优化 API 端点设计

**POST /ddd/diagnosis** - 智能诊断
```json
// Request
{ "requirementText": "string", "boundedContexts": [...] }
// Response
{ "issues": [{ "severity": "high|medium|low", "message": "string", "suggestion": "string" }] }
```

**POST /ddd/optimize** - 应用优化
```json
// Request
{ "requirementText": "string", "domainModels": [...] }
// Response
{ "suggestions": [{ "type": "refactor|performance|ux", "message": "string" }] }
```

**POST /ddd/chat** - AI 对话
```json
// Request
{ "message": "string", "requirementText": "string", "context": "..." }
// Response
{ "reply": "string", "thinking": "string" }
```

### 7.3 关键文件修改清单

| 文件 | 修改类型 | 涉及任务 |
|------|---------|---------|
| `src/components/homepage/HomePage.tsx` | 重构 | T-1.1 ~ T-1.4 |
| `src/components/homepage/BottomPanel/BottomPanel.tsx` | 修复 | T-1.5, T-2.3, T-2.6 |
| `src/components/homepage/AIPanel/AIPanel.tsx` | 增强 | T-1.3 |
| `src/components/homepage/Navbar/Navbar.tsx` | 增强 | T-1.4, T-4.2 |
| `src/components/homepage/hooks/useHomePage.ts` | 增强 | T-1.2, T-1.4, P1-4 |
| `src/components/homepage/FloatingMode.tsx` | 集成 | T-2.5 |
| `src/services/ddd/stream-service.ts` | 增强 | T-3.2 |
| `src/services/api/index.ts` | 新增 | T-2.1, T-2.2 |
| `src/stores/confirmationStore.ts` | 重构 | T-3.1 |

---

## 八、总结

### 审计结果

| 严重度 | 数量 | 状态 |
|--------|------|------|
| P0 严重阻塞 | 5 | 全部需要修复 |
| P1 重要缺陷 | 6 | 建议修复 |
| P2 优化建议 | 4 | 可延后处理 |

### 核心发现

1. **HomePage.tsx 是问题集中点** - 所有 8 个 BottomPanel 回调 + 2 个 Navbar 回调 + 1 个 AIPanel 回调全部为空 stub
2. **数据流断裂** - requirementText 未与 BottomPanelInputArea 绑定，导致发送按钮无法触发生成
3. **已实现但未集成的功能** - FloatingMode、6-step 组件已完整实现但未使用
4. **状态管理混乱** - 三层状态并存，confirmationStore / homePageStore / useHomePage useState
5. **已实现的 SSE API 工作正常** - 三个流式 API (bounded-context / domain-model / business-flow) 完整可用

### 建议优先级

1. **立即修复**: P0-1 ~ P0-5 (核心回调 + 数据流)
2. **尽快完成**: P1-1 ~ P1-6 (快捷功能 + 交互体验)
3. **规划修复**: P2-1 ~ P2-4 (状态重构 + 细节优化)
