# VIBEX-002 需求分析报告

**项目**: vibex-integrated-preview  
**分析师**: analyst  
**日期**: 2026-03-11  
**状态**: 分析完成

---

## 执行摘要

VIBEX-002 核心目标是将分散的多页面确认流程整合到单一首页界面，实现"需求输入 → 实时预览 → 确认"的无缝体验。现有架构已具备良好基础（三栏布局、confirmationStore 状态管理、组件化设计），主要工作在于**界面重构**和**预览组件集成**。

---

## 1. 问题定义

### 1.1 现状问题

| 问题 | 影响 | 严重级 |
|------|------|--------|
| 首页与确认流程分离 | 用户需跳转多个页面，体验割裂 | P1 |
| 无实时预览 | 用户无法即时看到生成效果 | P1 |
| 模板功能未绑定事件 | 模板按钮点击无响应 | P2 |
| 确认流程页面样式不统一 | VIBEX-003: 页面样式问题 | P2 |

### 1.2 设计目标

```
┌─────────────────────────────────────────────────────────┐
│ 顶部: 产品一句话说明 "用 AI 轻松构建你的 Web 应用"       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    中间: 实时预览区域                    │
│         (动态显示: 上下文图 → 模型图 → 流程图)          │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ 底部: 需求输入框 + 生成按钮 + AI 对话                   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 现有架构分析

### 2.1 首页组件 (`app/page.tsx`)

**现有布局**:
- 左侧 (15%): 流程指示器 STEPS
- 中间 (60%): 需求输入区域
- 右侧 (25%): AI 助手面板

**已有功能**:
- ✅ 需求输入框
- ✅ 示例需求选择
- ✅ AI 对话面板
- ✅ 快捷回复
- ⚠️ "使用模板" 按钮无事件绑定
- ❌ 无预览区域

### 2.2 确认流程 (`/confirm/*`)

**页面结构**:
```
/confirm/page.tsx          → Step 1: 需求输入
/confirm/context/page.tsx  → Step 2: 限界上下文图
/confirm/model/page.tsx    → Step 3: 领域模型类图
/confirm/flow/page.tsx     → Step 4: 业务流程图
/confirm/success/page.tsx  → 项目创建成功
```

**状态管理** (`confirmationStore.ts`):
- 使用 Zustand + persist 中间件
- 支持 Undo/Redo 快照
- 完整的步骤状态跟踪

**可复用组件**:
| 组件 | 路径 | 用途 |
|------|------|------|
| `ConfirmationSteps` | `@/components/ui/ConfirmationSteps` | 步骤指示器 |
| `RequirementScore` | `@/components/ui/RequirementScore` | 需求评分 |
| `TemplateSelector` | `@/components/templates` | 模板选择器 |

### 2.3 API 服务

| API | 功能 | 状态 |
|-----|------|------|
| `generateBoundedContext` | 生成限界上下文 | ✅ 可用 |
| `generateDomainModel` | 生成领域模型 | ✅ 可用 |
| `generateBusinessFlow` | 生成业务流程 | ✅ 可用 |
| `createProject` | 创建项目 | ✅ 可用 |

---

## 3. 集成方案

### 方案 A: 首页改造 (推荐)

**思路**: 在首页集成预览区域，逐步渲染各阶段产出

**架构变更**:
```
首页组件结构:
├── Header (产品说明)
├── PreviewPanel (预览区域)
│   ├── ContextPreview (限界上下文图)
│   ├── ModelPreview (领域模型图)
│   └── FlowPreview (业务流程图)
├── InputPanel (输入区域)
│   ├── RequirementInput (需求输入框)
│   ├── TemplateSelector (模板选择)
│   └── ActionButtons (生成按钮)
└── AIPanel (AI 助手 - 保留)
```

**工作量估算**: 3-4 天

**优点**:
- 符合 VIBEX-002 设计目标
- 用户体验流畅
- 最大化复用现有组件

**风险**:
- 需要处理步骤切换的复杂状态
- 预览区域布局需要精心设计

### 方案 B: 保留独立页面 + 嵌入预览

**思路**: 确认流程保持独立页面，但嵌入预览组件

**架构变更**:
- 为 `/confirm/*` 页面添加实时预览侧边栏
- 优化页面样式统一性

**工作量估算**: 2-3 天

**优点**:
- 改动较小
- 风险较低

**缺点**:
- 未完全满足"单一界面"需求
- 用户仍需页面跳转

### 推荐方案

**选择方案 A**，理由：
1. 完全符合 VIBEX-002 设计目标
2. 现有 confirmationStore 已支持步骤管理，无需重构
3. 组件化设计便于渐进开发

---

## 4. 实现要点

### 4.1 集成点识别

| 集成点 | 现有位置 | 改造方案 |
|--------|----------|----------|
| 步骤切换 | URL 路由 | 改用组件内状态切换 |
| 预览渲染 | 各 confirm 页面 | 提取为独立 PreviewPanel 组件 |
| 模板选择 | TemplateSelector 组件 | 绑定 handleTemplateSelect 事件 |
| AI 对话 | 已有 AI 面板 | 保持不变 |

### 4.2 状态管理

复用 `confirmationStore`:
```typescript
// 首页读取 store 状态
const { 
  currentStep,        // 当前步骤
  contextMermaidCode, // 上下文图代码
  modelMermaidCode,   // 模型图代码
  flowMermaidCode,    // 流程图代码
} = useConfirmationStore();
```

### 4.3 预览区域实现

```tsx
// PreviewPanel.tsx
function PreviewPanel() {
  const { currentStep, contextMermaidCode, modelMermaidCode, flowMermaidCode } = useConfirmationStore();
  
  return (
    <div className={styles.previewPanel}>
      {currentStep === 'context' && <MermaidRenderer code={contextMermaidCode} />}
      {currentStep === 'model' && <MermaidRenderer code={modelMermaidCode} />}
      {currentStep === 'flow' && <MermaidRenderer code={flowMermaidCode} />}
    </div>
  );
}
```

### 4.4 模板功能修复

```tsx
// 在首页绑定模板选择事件
const handleTemplateClick = () => {
  setIsTemplateOpen(true);
};

// TemplateSelector 选择后
const handleTemplateSelect = (template: RequirementTemplate) => {
  setRequirementText(template.content || template.description);
  setIsTemplateOpen(false);
};
```

---

## 5. 验收标准

| 验收项 | 标准 | 验证方式 |
|--------|------|----------|
| 顶部产品说明 | 显示一句话功能说明 | 手动检查 |
| 中间预览区域 | 实时显示当前步骤产出 | 手动检查 |
| 底部输入框 | 需求输入 + 生成按钮 | 手动检查 |
| 步骤切换 | 无页面跳转，组件内切换 | 手动检查 |
| 模板功能 | 点击模板有响应 | 手动检查 |
| AI 对话 | 保持原有功能 | 手动检查 |
| 样式美观 | 符合设计风格 | 视觉检查 |

---

## 6. 风险评估

| 风险 | 影响 | 可能性 | 缓解措施 |
|------|------|--------|----------|
| 状态复杂度增加 | 中 | 中 | 充分利用 confirmationStore，避免新增状态 |
| 预览性能问题 | 低 | 低 | 使用懒加载 + 虚拟滚动 |
| 布局适配问题 | 中 | 中 | 响应式设计，支持移动端 |
| API 响应延迟 | 中 | 中 | 添加 Loading 状态，提供进度反馈 |

---

## 7. 下一步

1. **PM**: 根据本分析产出 PRD
2. **Architect**: 设计组件结构和状态流转
3. **Dev**: 实现首页改造
4. **Tester**: E2E 测试新流程

---

**产出文件**: `docs/output/VIBEX-002-analysis.md`  
**依赖任务**: 无  
**下一步任务**: `create-prd` (pm)