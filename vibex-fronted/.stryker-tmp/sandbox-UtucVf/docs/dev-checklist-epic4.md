# 开发检查清单 - Epic 4: AIPanel + Hooks 拆分

**项目**: vibex-homepage-modular-refactor  
**任务**: impl-epic4-aipanel-hooks  
**日期**: 2026-03-15  
**Agent**: dev

---

## 验收标准检查

| ID | 功能点 | 验收标准 | 状态 |
|----|--------|----------|------|
| F4.1 | AIPanel 组件 | `expect(aiPanel).toRender()` | ✅ |
| F4.2 | ThinkingPanel | `expect(thinking).toRender()` | ✅ |
| F4.3 | 自定义 Hooks | `expect(hook).toWork()` | ✅ |

---

## 详细检查

### F4.1: AIPanel 组件 ✅

**文件**:
- `components/homepage/AIPanel/AIPanel.tsx`
- `components/homepage/AIPanel/AIPanel.module.css`

**功能**:
- AI 消息列表展示
- 消息输入框
- 发送消息功能

### F4.2: ThinkingPanel ✅

**已有组件**:
- `components/ui/ThinkingPanel.tsx`
- `components/ui/ThinkingPanel.module.css`

### F4.3: 自定义 Hooks ✅

**新创建**:

1. **useHomeGeneration** (`hooks/useHomeGeneration.ts`)
   - `isGenerating: boolean`
   - `generationError: Error | null`
   - `streamStatus: StreamStatus`
   - `generateContexts(requirement: string)`
   - `generateDomainModels(contexts: BoundedContext[])`
   - `generateBusinessFlow(models: DomainModel[])`
   - `createProject()`
   - `sendMessage(message: string)`
   - `abort()`, `retry()`, `clearError()`

2. **useHomePanel** (`hooks/useHomePanel.ts`)
   - `panelSizes: number[]`
   - `setPanelSizes(sizes: number[])`
   - `maximizedPanel: string | null`
   - `toggleMaximize(panelId: string)`
   - `minimizedPanel: string | null`
   - `toggleMinimize(panelId: string)`
   - `reset()`
   - localStorage 持久化

---

## 验证

- TypeScript 编译: ✅ 通过

---

## 产出物

- `components/homepage/AIPanel/AIPanel.tsx`
- `components/homepage/AIPanel/AIPanel.module.css`
- `components/homepage/hooks/useHomeGeneration.ts`
- `components/homepage/hooks/useHomePanel.ts`
- `components/homepage/hooks/index.ts` (更新)

---

## 备注

- AIPanel 组件已存在
- ThinkingPanel 使用现有组件
- 新增 useHomeGeneration 和 useHomePanel hooks
- 下一任务: impl-epic5-style-optimize