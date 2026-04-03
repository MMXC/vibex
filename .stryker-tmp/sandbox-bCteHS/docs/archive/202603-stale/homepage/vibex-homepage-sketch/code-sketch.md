# VibeX 首页代码草图

**项目**: vibex-homepage-sketch  
**角色**: Dev  
**日期**: 2026-03-14  
**类型**: 代码草图

---

## 页面结构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              NAVBAR                                     │
│  [◈ VibeX]                    [功能] [价格]              [开始使用]     │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                                HERO                                     │
│                                                                          │
│                    [Badge: AI 驱动的应用构建平台]                         │
│                                                                          │
│                     用 AI 轻松构建                                        │
│                     你的 Web 应用                                         │
│                                                                          │
│        VibeX 是一个 AI 驱动的应用构建平台，通过自然语言描述                 │
│        即可生成完整的 Web 应用界面和功能。                                 │
│                                                                          │
│                    [免费开始]   [查看演示]                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                          FEATURES SECTION                               │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│   │    🎯    │  │    📐    │  │    ⚡    │  │    🔄    │             │
│   │  你主导  │  │ DDD 建模 │  │ 快速生成 │  │ 实时预览 │             │
│   │AI辅助分析 │  │方法论    │  │一键完成  │  │边输边看  │             │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                        MAIN CONTAINER (三栏)                            │
│                                                                          │
│  ┌────────────┐  ┌────────────────────────────────┐  ┌─────────────┐   │
│  │ SIDEBAR    │  │        CONTENT                  │  │  AI PANEL  │   │
│  │ (15%)      │  │        (60%)                    │  │  (25%)     │   │
│  │            │  │                                │  │             │   │
│  │ 设计流程   │  │ [📝 需求输入] [👁️ 实时预览]    │  │ 🤖 AI助手  │   │
│  │            │  │                                │  │             │   │
│  │ ① 需求输入 │  │ Step 1: 需求输入               │  │ [消息列表] │   │
│  │ ✓ 限界上下文│  │                                │  │             │   │
│  │   领域模型 │  │ 描述你的产品需求               │  │ [快捷回复] │   │
│  │   业务流程 │  │                                │  │             │   │
│  │   项目创建 │  │ [输入框 + 生成按钮]            │  │ [输入框]   │   │
│  │            │  │                                │  │             │   │
│  │            │  │ [导入选项: GitHub / Figma]     │  │             │   │
│  │            │  │                                │  │             │   │
│  │            │  │ [示例需求按钮]                  │  │             │   │
│  │            │  │                                │  │             │   │
│  │            │  │ [诊断面板]                      │  │             │   │
│  └────────────┘  └────────────────────────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 详细区域规格

### 1. Navbar (导航栏)
- **高度**: ~60px
- **布局**: logo (左) + nav links (中) + CTA button (右)
- **元素**:
  - Logo: `◈ VibeX`
  - Nav Links: 功能, 价格
  - CTA: 开始使用 (链接到 /auth)

### 2. Hero Section (英雄区)
- **布局**: 居中对齐
- **元素**:
  - Badge: "● AI 驱动的应用构建平台"
  - 标题: "用 AI 轻松构建 / 你的 Web 应用" (渐变字)
  - 副标题: VibeX 介绍文字
  - 按钮: "免费开始" (主按钮), "查看演示" (次按钮)
- **背景**: 粒子特效 (galaxy preset) + 网格叠加 + 光晕效果

### 3. Features Section (特性展示)
- **布局**: 4 列网格
- **卡片内容**:
  | ID | Icon | Title | Description | Color |
  |----|------|-------|-------------|-------|
  | 1 | 🎯 | 你主导 | AI 辅助分析，你决策每一步 | #00d4ff |
  | 2 | 📐 | DDD 建模 | 专业领域驱动设计方法论 | #8b5cf6 |
  | 3 | ⚡ | 快速生成 | 从需求到代码一键完成 | #10b981 |
  | 4 | 🔄 | 实时预览 | 边输入边看 AI 分析结果 | #f59e0b |

### 4. Main Container (主容器) - 三栏布局

#### 4.1 Sidebar (左侧边栏) - 15%
- **宽度比例**: 15%
- **内容**:
  - 标题: "设计流程"
  - 5 个步骤指示器:
    - ① 需求输入
    - ② 限界上下文
    - ③ 领域模型
    - ④ 业务流程
    - ⑤ 项目创建
- **状态样式**: active (高亮), completed (勾选), clickable (可点击)

#### 4.2 Content (中间内容区) - 60%
- **宽度比例**: 60%
- **结构**:
  1. Tab 切换: [📝 需求输入] / [👁️ 实时预览]
  2. 页面标题 + 副标题
  3. 输入区域 (Tab=input 时):
     - RequirementInput 组件 (统一需求输入)
     - GitHub 导入选项 (可展开)
     - Figma 导入选项 (可展开)
     - Plan/Build 模式选择器
     - 示例需求按钮
     - 诊断面板
  4. 预览区域 (Tab=preview 时):
     - Step 1: 需求预览 (Mermaid 流程图)
     - Step 2: 限界上下文 (Mermaid 图 + 列表)
     - Step 3: 领域模型 (类图 + 列表)
     - Step 4: 业务流程 (流程图 + 页面树结构)
     - Step 5: 项目创建成功 (成功卡片)

#### 4.3 AI Panel (右侧 AI 面板) - 25%
- **宽度比例**: 25%
- **两种模式**:
  1. **普通模式**:
     - Header: 🤖 AI 设计助手
     - 消息列表 (用户/AI 对话)
     - 快捷回复按钮
     - 输入框 + 发送按钮
  2. **ThinkingPanel 模式** (流式生成时):
     - AI 思考过程可视化
     - 实时显示分析思路
     - 终止/重试按钮

---

## 关键组件列表

| 组件 | 路径 | 用途 |
|------|------|------|
| MainContent | components/homepage/MainContent.tsx | 三栏布局容器 |
| StepNavigator | components/homepage/StepNavigator.tsx | 左侧步骤导航 |
| RequirementInput | components/requirement-input/ | 统一需求输入 |
| GitHubImport | components/github-import/GitHubImport.tsx | GitHub 导入 |
| FigmaImport | components/figma-import/FigmaImport.tsx | Figma 导入 |
| DiagnosisPanel | components/diagnosis/DiagnosisPanel.tsx | 需求诊断 |
| MermaidPreview | components/ui/MermaidPreview.tsx | Mermaid 图表渲染 |
| ThinkingPanel | components/ui/ThinkingPanel.tsx | AI 思考过程 |
| PageTreeDiagram | components/page-tree-diagram/ | 页面树结构 |
| PlanBuildButtons | components/plan-build/PlanBuildButtons.tsx | Plan/Build 切换 |
| ParticleBackground | components/particles/ParticleBackground.tsx | 粒子背景 |

---

## 状态管理

- **currentStep**: 1-5 (当前步骤)
- **activeTab**: 'input' | 'preview' (内容/预览切换)
- **requirementText**: string (需求文本)
- **boundedContexts**: BoundedContext[] (限界上下文)
- **domainModels**: DomainModel[] (领域模型)
- **businessFlow**: BusinessFlow (业务流程)
- **streamStatus**: 'idle' | 'streaming' | 'done' | 'error' (流状态)

---

## 代码 vs PRD 差异点

> 待 reviewer 对比后填写

---

**产出物**: docs/vibex-homepage-sketch/code-sketch.md  
**下一步**: compare-sketches (tester)
