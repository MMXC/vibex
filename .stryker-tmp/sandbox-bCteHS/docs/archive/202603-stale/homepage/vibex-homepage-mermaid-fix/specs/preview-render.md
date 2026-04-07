# Feature: 首页流程图渲染修复

## Jobs-To-Be-Done
- 作为用户，我希望在首页预览区看到 Mermaid 流程图（而非占位图），以便我验证 AI 分析结果。

## Requirements
- [ ] (F1.1) PreviewArea 正确订阅 confirmationStore.flowMermaidCode
- [ ] (F1.2) flowMermaidCode 存在时渲染 MermaidPreview，否则显示友好提示
- [ ] (F1.3) MermaidManager 初始化完成后才渲染（useEffect + isReady 标志）
- [ ] (F1.4) 流式输出完成后 flowMermaidCode 正确保存到 store

## Acceptance Criteria
- [ ] AC1: 业务流生成完成后，首页预览区显示 SVG 流程图（非占位）
- [ ] AC2: flowMermaidCode 为空时显示友好提示（非空白崩溃）
- [ ] AC3: 页面刷新后流程图数据从 store 恢复
