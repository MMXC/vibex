# Feature: 思考过程面板（ThinkingPanel）

## Jobs-To-Be-Done
- 作为用户，我希望在 AI 分析过程中看到流式思考输出，以便了解系统正在做什么、建立信任感、避免误以为系统卡死。

## User Stories
- US1: 作为用户，我希望在 AI 分析时看到实时流式输出，而非白屏等待
- US2: 作为用户，我希望能用 markdown 格式阅读分析结果（代码块、列表、加粗）
- US3: 作为用户，我希望能随时中断正在进行的流式输出

## Requirements
- [ ] (F2.1) bounded-context 页面集成 `ThinkingPanel` 组件
- [ ] (F2.2) ThinkingPanel 接入 `stream-service.ts` 流式输出，数据来源为 `designStore.boundedContexts`
- [ ] (F2.3) 流式输出支持 markdown 渲染（代码高亮、列表、加粗等）
- [ ] (F2.4) 提供 "停止" 按钮，支持 `AbortController` 中断流式输出
- [ ] (F2.5) 流式完成后，将结果存入 `designStore` 供后续步骤使用

## Technical Notes
- ThinkingPanel 路径: `@/components/ui/ThinkingPanel` 或 `@/components/homepage/ThinkingPanel`
- stream-service 路径: `@/services/stream-service.ts` 或 `@/lib/stream-service.ts`
- 状态: loading / streaming / complete / error

## Acceptance Criteria
- [ ] AC1: 触发分析后 1 秒内 ThinkingPanel 显示流式内容
- [ ] AC2: 思考面板内容支持 markdown 渲染（`react-markdown` 或等效方案）
- [ ] AC3: 点击停止后流式输出中断，页面保留已输出内容
- [ ] AC4: expect(screen.getByText(/正在分析/)).toBeInTheDocument() 或等效加载状态
