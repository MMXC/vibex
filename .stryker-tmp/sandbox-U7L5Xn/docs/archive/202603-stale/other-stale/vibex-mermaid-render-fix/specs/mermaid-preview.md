# Feature: MermaidPreview 组件重构

## Jobs-To-Be-Done
- 作为用户，我希望渲染失败时能看到清晰的错误提示和降级内容，以便我知道发生了什么并能继续使用。

## User Stories
- US1: 作为用户，当 Mermaid 渲染失败时，我希望能直接看到原始图表代码作为降级方案
- US2: 作为开发者，我希望 MermaidPreview 使用统一的 MermaidManager，消除与旧 MermaidRenderer 的竞争

## Requirements
- [ ] (F2.1) MermaidPreview 替换自有 getMermaid() 为使用 mermaidManager.render()
- [ ] (F2.2) 渲染失败时显示 `<details>` 折叠原始代码（降级方案）
- [ ] (F2.3) 错误消息从通用 "图表渲染失败" 改为具体原因（如语法错误、初始化失败）
- [ ] (F2.4) 移除 MermaidRenderer.tsx 的备用引用，统一使用 MermaidPreview

## Technical Notes
- 目标文件：`src/components/ui/MermaidPreview.tsx`
- 降级显示：在 error 状态下渲染 `<pre>{processedCode}</pre>`
- 页面集成：首页 PreviewArea 组件使用 MermaidPreview

## Acceptance Criteria
- [ ] AC1: 传入无效 Mermaid 代码后，页面显示 SVG 渲染区域 + `<details>` 原始代码
- [ ] AC2: expect(error state).toBeTruthy() 且 error message 不为 "图表渲染失败"
- [ ] AC3: MermaidPreview.tsx 中不存在 `import { MermaidRenderer }` 引用
- [ ] AC4: npm run build 成功（无类型错误）
