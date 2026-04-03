# 需求分析: 图片渲染 + 按钮指向修复

**项目**: vibex-image-and-button-fix
**日期**: 2026-03-17
**分析师**: Analyst Agent

---

## 1. 执行摘要

### 问题概述

| ID | 问题 | 优先级 | 状态 |
|----|------|--------|------|
| P0-1 | 开始生成按钮仍指向 boundcontext | P0 | 已定位根因 |
| P0-2 | 图片未渲染问题 | P0 | 需更多信息 |

---

## 2. P0-1: 开始生成按钮指向问题

### 2.1 问题现象

点击"开始生成"后，按钮仍指向 boundcontext（限界上下文），而非根据当前步骤指向正确的下一步。

### 2.2 代码定位

**HomePage.tsx** (Lines 60-63):
```typescript
// Handle requirement submission
const handleRequirementSubmit = useCallback(() => {
  if (requirementText.trim()) {
    generateContexts(requirementText);  // ⚠️ 始终调用 generateContexts
  }
}, [requirementText, generateContexts]);
```

**HomePage.tsx** (Lines 104-108) - InputArea 传参:
```typescript
<InputArea
  requirementText={requirementText}
  onRequirementChange={setRequirementText}
  onSubmit={handleRequirementSubmit}  // ⚠️ 只传递了这一个回调
  isGenerating={isGenerating}
/>
```

### 2.3 根因分析

| 环节 | 问题 | 影响 |
|------|------|------|
| 回调函数 | `handleRequirementSubmit` 只调用 `generateContexts` | 不区分步骤 |
| 传参方式 | 只传递 `onSubmit`，未传递其他回调 | 无法处理不同步骤 |
| InputArea | 支持 `onGenerateDomainModel`、`onGenerateBusinessFlow` props | 但未使用 |

**InputArea 支持的 Props** (Lines 42-46):
```typescript
onGenerate?: () => void;
onGenerateDomainModel?: () => void;
onGenerateBusinessFlow?: () => void;
onCreateProject?: () => void;
```

### 2.4 修复方案

**方案 A: 在 HomePage 中处理步骤逻辑** (推荐)

```typescript
// HomePage.tsx
const handleGenerate = useCallback(() => {
  switch (currentStep) {
    case 1:
      // 步骤1: 需求输入 -> 生成限界上下文
      if (requirementText.trim()) {
        generateContexts(requirementText);
      }
      break;
    case 2:
      // 步骤2: 限界上下文 -> 生成领域模型
      if (boundedContexts.length > 0) {
        generateDomainModels(requirementText, boundedContexts);
      }
      break;
    case 3:
      // 步骤3: 领域模型 -> 生成业务流程
      if (domainModels.length > 0) {
        generateBusinessFlow(domainModels);
      }
      break;
    case 4:
      // 步骤4: 业务流程 -> 创建项目
      // TODO: 实现项目创建
      break;
    default:
      break;
  }
}, [currentStep, requirementText, boundedContexts, domainModels, generateContexts, generateDomainModels, generateBusinessFlow]);

// 传递给 InputArea
<InputArea
  currentStep={currentStep}
  requirementText={requirementText}
  onRequirementChange={setRequirementText}
  onSubmit={handleGenerate}  // 使用统一的处理函数
  isGenerating={isGenerating}
  // 或者分别传递不同回调:
  onGenerate={() => generateContexts(requirementText)}
  onGenerateDomainModel={() => generateDomainModels(requirementText, boundedContexts)}
  onGenerateBusinessFlow={() => generateBusinessFlow(domainModels)}
/>
```

**方案 B: 在 InputArea 中处理步骤逻辑**

InputArea 已有 `currentStep` prop，可以在组件内部根据步骤调用不同回调：

```typescript
// InputArea.tsx
const handleGenerateClick = useCallback(() => {
  switch (currentStep) {
    case 1:
      onGenerate?.();
      break;
    case 2:
      onGenerateDomainModel?.();
      break;
    case 3:
      onGenerateBusinessFlow?.();
      break;
    case 4:
      onCreateProject?.();
      break;
    default:
      onSubmit?.();
  }
}, [currentStep, onGenerate, onGenerateDomainModel, onGenerateBusinessFlow, onCreateProject, onSubmit]);
```

### 2.5 预估工时

| 任务 | 工时 |
|------|------|
| 修改 HomePage.tsx | 0.5h |
| 测试各步骤生成 | 0.5h |
| **总计** | **1h** |

---

## 3. P0-2: 图片未渲染问题

### 3.1 问题现象

用户报告页面中图片无法正常显示，提供了 HTML 截图。

### 3.2 当前排查状态

**已检查**:
- ✅ Navbar 组件: 使用文字 Logo (`◈ VibeX`)，无图片
- ✅ Homepage 组件: 无 `<img>` 或 `<Image>` 标签
- ✅ MermaidPreview: 使用 SVG 渲染，有 ErrorBoundary 保护
- ✅ Public 目录: SVG 文件存在 (globe.svg, next.svg 等)

**可能的原因**:
1. **Mermaid 图表渲染失败**: SVG 生成错误
2. **外部图片加载失败**: 如用户头像、外部资源
3. **CSS 背景图片**: 使用 `background-image` 的资源未加载
4. **Cloudflare Pages 静态资源**: 部署后资源路径问题

### 3.3 需要更多信息

| 信息项 | 用途 |
|--------|------|
| 用户截图 | 确认具体是哪张图片 |
| 浏览器控制台错误 | 排查网络请求失败 |
| Network 面板 | 检查图片请求状态 |

### 3.4 临时方案

如果确认是 Mermaid 图表问题，可检查：

```typescript
// MermaidPreview.tsx
// 确保错误处理完善
<ErrorBoundary fallback={<div>图表渲染失败</div>}>
  <MermaidPreviewInner ... />
</ErrorBoundary>
```

---

## 4. 验收标准

### 4.1 按钮指向问题

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC1.1 | 步骤1点击"开始生成"调用 generateContexts | 网络请求检查 |
| AC1.2 | 步骤2点击"继续"调用 generateDomainModels | 网络请求检查 |
| AC1.3 | 步骤3点击"继续"调用 generateBusinessFlow | 网络请求检查 |
| AC1.4 | 按钮文字根据步骤变化 | 视觉检查 |

### 4.2 图片渲染问题

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| AC2.1 | Mermaid 图表正确渲染 | 功能测试 |
| AC2.2 | 无控制台错误 | 检查 Console |
| AC2.3 | 无网络请求失败 | 检查 Network |

---

## 5. 实施建议

### 5.1 优先级

1. **立即修复**: 按钮指向问题 (已有完整方案)
2. **待确认**: 图片渲染问题 (需更多信息)

### 5.2 推荐方案

- 按钮问题: 使用方案 A (在 HomePage 中统一处理)
- 图片问题: 等待用户提供截图和错误信息后再定位

---

## 附录

### A. 相关文件

**需要修改**:
- `src/components/homepage/HomePage.tsx` - 添加 handleGenerate 函数

**可能修改**:
- `src/components/homepage/InputArea/InputArea.tsx` - 可选方案 B

### B. InputArea 完整 Props 列表

```typescript
interface VerticalInputProps {
  currentStep?: number;
  requirementText?: string;
  onRequirementChange?: (text: string) => void;
  onSubmit?: () => void;
  isGenerating?: boolean;
  steps?: Step[];
  completedStep?: number;
  onStepClick?: (step: number) => void;
  onGenerate?: () => void;                    // ✅ 已支持
  onGenerateDomainModel?: () => void;         // ✅ 已支持
  onGenerateBusinessFlow?: () => void;        // ✅ 已支持
  onCreateProject?: () => void;               // ✅ 已支持
  boundedContexts?: BoundedContext[];
  domainModels?: DomainModel[];
  businessFlow?: BusinessFlow | null;
}
```

---

**产出物**: `/root/.openclaw/vibex/docs/vibex-image-and-button-fix/analysis.md`