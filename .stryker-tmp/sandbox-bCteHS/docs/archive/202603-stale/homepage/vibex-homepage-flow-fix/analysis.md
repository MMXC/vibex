# 需求分析: 首页流程修复

**项目**: vibex-homepage-flow-fix
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 问题概述

用户报告 5 个问题，按优先级排序：

| ID | 问题 | 优先级 | 类型 |
|----|------|--------|------|
| P0-1 | 步骤自动跳转失效 | P0 | 状态逻辑 |
| P0-2 | 水平三栏布局未实现 | P0 | 布局结构 |
| P1-1 | Build/Plan 模式请求相同 | P1 | API 逻辑 |
| P1-2 | 组件选择未传递到下一步 | P1 | 状态传递 |
| P2-1 | 需求诊断功能保留 | P2 | 功能保留 |

---

## 2. 问题分析

### 2.1 P0-1: 步骤自动跳转问题

**现象**: 限界上下文请求完成后应自动跳转下一步，实际只解锁了步骤选择器，需手动点击。

**代码定位**: `src/components/homepage/hooks/useHomePage.ts`

```typescript
// Lines 112-120: 现有逻辑
useEffect(() => {
  if (streamStatus === 'done') {
    setBoundedContexts(streamContexts);
    setContextMermaidCode(streamMermaidCode);
    if (streamContexts.length > 0 || streamMermaidCode) {
      setCurrentStep(2);  // ✅ 这里确实设置了
      setCompletedStep(2);
    }
  }
}, [streamStatus, streamContexts, streamMermaidCode]);
```

**根因分析**:

| 环节 | 问题 | 影响 |
|------|------|------|
| 状态设置 | ✅ setCurrentStep(2) 被调用 | 正确 |
| 状态更新 | ⚠️ 可能被其他 useEffect 覆盖 | 需检查 |
| 渲染反映 | ❌ InputArea 步骤指示器未正确响应 | UI 问题 |

**InputArea 步骤指示器逻辑** (Lines 176-179):
```typescript
<button
  className={`${styles.stepItem} ${
    step.id === currentStep ? styles.active : ''  // 依赖 currentStep
  } ${step.id <= completedStep ? styles.completed : ''}`}
  onClick={() => onStepClick?.(step.id)}
```

**推测根因**:
1. `currentStep` 状态已更新，但 InputArea 的 `completedStep` prop 可能未正确传递
2. 按钮的 `disabled={step.id > completedStep + 1}` 逻辑可能阻止了自动跳转感知

**修复方案**:
- 确认 `completedStep` 正确传递
- 添加视觉反馈指示"已完成，请点击下一步"

---

### 2.2 P0-2: 水平三栏布局

**现象**: 当前为垂直两栏 (60%+40%)，期望水平三栏 (15%+60%+25%)。

**代码定位**:
- `src/components/homepage/HomePage.tsx` - 使用 `mainContentVertical` 布局
- `src/app/homepage.module.css` - 三栏 CSS 已存在

**根因**: HomePage.tsx 未使用三栏布局结构。

**已有 CSS** (homepage.module.css):
```css
.mainContainer { display: flex; }
.sidebar { width: 15%; }
.content { width: 60%; }
.aiPanel { width: 25%; }
```

**已有组件**:
- `Sidebar` - 步骤指示器 ✅
- `MainContent` - 三栏布局容器 ✅
- `AIPanel` - AI 分析面板 ✅

**修复方案**: 重构 HomePage.tsx 使用三栏布局（详见 vibex-homepage-three-column-layout 分析）

---

### 2.3 P1-1: Build/Plan 模式差异

**现象**: 两种模式只有页面组件渲染不同，请求逻辑相同。

**代码定位**:
- `src/stores/plan-build-store.ts` - 模式状态管理
- `src/hooks/usePlanBuild.ts` - 模式 Hook
- `src/components/plan-build/PlanBuildButtons.tsx` - 切换按钮

**当前逻辑**:
```typescript
// usePlanBuild.ts
const runPlanAnalysis = useCallback(async (requirementText: string) => {
  setPlanLoading(true);
  const result = await analyzeRequirement({ requirementText });  // Plan 模式
  setPlanResult(result);
}, []);

// useHomePage.ts - 不区分模式
const { generateContexts } = useDDDStream();  // 所有模式相同
```

**根因分析**:
- `mode` 状态存在于 `plan-build-store`
- 但 `useHomePage` 未使用该状态区分 API 调用

**修复方案**:
```typescript
// useHomePage.ts 修改
import { usePlanBuildStore } from '@/stores/plan-build-store';

export function useHomePage() {
  const mode = usePlanBuildStore((state) => state.mode);
  
  const handleGenerate = useCallback((text: string) => {
    if (mode === 'plan') {
      // Plan 模式：先规划，再分步执行
      runPlanAnalysis(text);
    } else {
      // Build 模式：直接生成
      generateContexts(text);
    }
  }, [mode]);
}
```

---

### 2.4 P1-2: 组件选择传递

**现象**: 用户在前一步选择的组件没有传入下一步。

**代码定位**: `src/components/homepage/PreviewArea/PreviewArea.tsx`

```typescript
// Lines 50-52: 选择状态是局部的
const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
```

**根因分析**:
- `selectedNodes` 是 PreviewArea 的局部状态
- 未提升到 useHomePage 或全局状态
- 下一步生成时无法获取选择信息

**修复方案**:
1. 将 `selectedNodes` 提升到 useHomePage
2. 传递给 generateDomainModels 和 generateBusinessFlow

```typescript
// useHomePage.ts 新增
const [selectedContextIds, setSelectedContextIds] = useState<Set<string>>(new Set());
const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set());

// 传递给下一步生成
const generateDomainModelsWithSelection = useCallback((text: string, contexts: BoundedContext[]) => {
  const selectedContexts = contexts.filter(c => selectedContextIds.has(c.id));
  generateDomainModels(text, selectedContexts);
}, [selectedContextIds]);
```

---

### 2.5 P2-1: 需求诊断功能保留

**代码定位**: `src/components/diagnosis/DiagnosisPanel.tsx`

**状态**: 组件存在，但未集成到当前 HomePage.tsx

**修复方案**: 在三栏布局的右栏（AIPanel）或独立区域集成诊断功能。

---

## 3. 组件状态分析

### 3.1 现有组件清单

| 组件 | 路径 | 状态 | 问题 |
|------|------|------|------|
| HomePage | `homepage/HomePage.tsx` | ✅ 存在 | 布局需调整 |
| Sidebar | `homepage/Sidebar/` | ✅ 存在 | 未使用 |
| MainContent | `homepage/MainContent.tsx` | ✅ 存在 | 未使用 |
| AIPanel | `homepage/AIPanel/` | ✅ 存在 | 未集成 |
| ThinkingPanel | `homepage/ThinkingPanel/` | ✅ 存在 | 未集成 |
| DiagnosisPanel | `diagnosis/` | ✅ 存在 | 未集成 |
| PreviewArea | `homepage/PreviewArea/` | ✅ 存在 | 选择状态局部化 |
| InputArea | `homepage/InputArea/` | ✅ 存在 | 包含步骤指示器 |
| useHomePage | `homepage/hooks/` | ✅ 存在 | 需增强模式判断 |

### 3.2 状态管理分析

```
┌─────────────────────────────────────────────────────────────┐
│                     useHomePage (主状态)                     │
├─────────────────────────────────────────────────────────────┤
│ ✅ currentStep, completedStep                                │
│ ✅ boundedContexts, domainModels, businessFlow               │
│ ✅ requirementText                                           │
│ ❌ selectedContextIds (缺失)                                 │
│ ❌ selectedModelIds (缺失)                                   │
│ ❌ mode (需从 plan-build-store 引入)                        │
└─────────────────────────────────────────────────────────────┘
          │                    │                    │
          v                    v                    v
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │Sidebar   │        │PreviewArea│        │InputArea │
    │          │        │(局部选择状态)      │          │
    └──────────┘        └──────────┘        └──────────┘
```

---

## 4. 修复方案

### 4.1 优先级排序

| 优先级 | 任务 | 预估工时 |
|--------|------|----------|
| P0-1 | 重构 HomePage.tsx 三栏布局 | 3h |
| P0-2 | 集成 AIPanel/ThinkingPanel | 2h |
| P1-1 | 修复步骤自动跳转感知 | 1h |
| P1-2 | Build/Plan 模式区分 | 2h |
| P1-3 | 组件选择状态提升 | 1h |
| P2-1 | 集成诊断功能 | 1h |
| **总计** | | **10h** |

### 4.2 推荐实施顺序

1. **Phase 1 (P0)**: 布局重构
   - 重构 HomePage.tsx 使用三栏布局
   - 集成 Sidebar, AIPanel

2. **Phase 2 (P1)**: 状态逻辑修复
   - 修复步骤自动跳转
   - 区分 Build/Plan 模式
   - 提升选择状态

3. **Phase 3 (P2)**: 功能完善
   - 集成诊断功能
   - 测试验证

---

## 5. 验收标准

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | 限界上下文完成后自动跳转到步骤 2 | 功能测试 |
| AC1.2 | 左栏 15%，中栏 60%，右栏 25% | 视觉检查 |
| AC1.3 | AI 分析过程显示在右栏 | 视觉检查 |
| AC2.1 | Plan 模式调用 analyzeRequirement | 网络请求检查 |
| AC2.2 | Build 模式直接调用 generateContexts | 网络请求检查 |
| AC3.1 | 选择的上下文传递到领域模型生成 | 状态检查 |
| AC4.1 | 需求诊断功能可用 | 功能测试 |

---

## 6. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 布局重构引入新问题 | 中 | 高 | 充分测试 |
| 状态提升影响性能 | 低 | 中 | 优化渲染 |
| 模式区分破坏现有流程 | 中 | 高 | 保持向后兼容 |

---

## 附录

### A. 相关文件清单

**需要修改**:
- `src/components/homepage/HomePage.tsx` - 布局重构
- `src/components/homepage/hooks/useHomePage.ts` - 状态增强
- `src/components/homepage/PreviewArea/PreviewArea.tsx` - 选择状态提升

**需要集成**:
- `src/components/homepage/Sidebar/`
- `src/components/homepage/AIPanel/`
- `src/components/homepage/ThinkingPanel/`
- `src/components/diagnosis/DiagnosisPanel.tsx`

### B. 组件依赖关系

```
HomePage.tsx
├── useHomePage (状态管理)
│   ├── useDDDStream
│   ├── useDomainModelStream
│   ├── useBusinessFlowStream
│   └── usePlanBuildStore (需引入)
├── Sidebar (步骤指示器)
├── MainContent 或自定义布局
│   ├── PreviewArea
│   │   └── NodeTreeSelector (选择状态需提升)
│   └── InputArea
│       └── PlanBuildButtons
└── AIPanel/ThinkingPanel (AI 过程)
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-homepage-flow-fix/analysis.md`