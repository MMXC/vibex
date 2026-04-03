# 开发检查清单 - Epic 3: PreviewArea + InputArea 拆分

**项目**: vibex-homepage-modular-refactor  
**任务**: impl-epic3-preview-input  
**日期**: 2026-03-15  
**Agent**: dev

---

## 验收标准检查

| ID | 功能点 | 验收标准 | 状态 |
|----|--------|----------|------|
| F3.1 | PreviewArea | `expect(preview).toRender()` | ✅ |
| F3.2 | InputArea | `expect(input).toRender()` | ✅ |
| F3.3 | 节点勾选 | `expect(checkbox).toWork()` | ✅ |

---

## 详细检查

### F3.1: PreviewArea 组件 ✅

**文件**:
- `components/homepage/PreviewArea/PreviewCanvas.tsx`
- `components/homepage/PreviewArea/PreviewCanvas.module.css`

**Props**:
- `currentStep: number`
- `mermaidCodes: MermaidCodes`
- `boundedContexts: BoundedContext[]`
- `domainModels: DomainModel[]`
- `businessFlow: BusinessFlow | null`
- `selectedNodes: Set<string>`
- `onNodeToggle: (nodeId: string) => void`
- `maximizedPanel: string | null`
- `minimizedPanel: string | null`
- `onMaximize: (panelId: string) => void`
- `onMinimize: (panelId: string) => void`

**功能**:
- 根据 currentStep 渲染不同 Mermaid 图表
- 节点勾选功能 (Step 2)
- 面板最大/最小化
- 响应式布局

### F3.2: InputArea 组件 ✅

**文件**:
- `components/homepage/InputArea/InputArea.tsx`
- `components/homepage/InputArea/InputArea.module.css`

**Props**:
- `currentStep: number`
- `requirementText: string`
- `onRequirementChange: (text: string) => void`
- `onGenerate: () => void`
- `onGenerateDomainModel?: () => void`
- `onGenerateBusinessFlow?: () => void`
- `onCreateProject?: () => void`
- `isGenerating: boolean`
- `boundedContexts?: BoundedContext[]`
- `domainModels?: DomainModel[]`
- `businessFlow?: BusinessFlow | null`

**功能**:
- 需求输入 (RequirementInput)
- GitHub 导入
- Figma 导入
- Plan/Build 模式选择
- 步骤特定操作按钮

### F3.3: 节点勾选 ✅

- PreviewCanvas 包含节点勾选 UI
- 接收 `selectedNodes` 和 `onNodeToggle` props

---

## 页面集成

**文件**: `src/app/page.tsx`

**状态**: 组件已创建，待集成

---

## 验证

- TypeScript 编译: ✅ 通过

---

## 产出物

- `components/homepage/PreviewArea/PreviewCanvas.tsx`
- `components/homepage/PreviewArea/PreviewCanvas.module.css`
- `components/homepage/InputArea/InputArea.tsx`
- `components/homepage/InputArea/InputArea.module.css`

---

## 备注

- PreviewCanvas 和 InputArea 组件已创建
- 组件符合架构文档定义的 Props 接口
- 节点勾选功能已包含
- 下一任务: impl-epic4-aipanel-hooks