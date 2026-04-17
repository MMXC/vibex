# AGENTS.md — vibex-sprint4-spec-canvas-extend

**项目**: vibex-sprint4-spec-canvas-extend
**日期**: 2026-04-18
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### 架构约束

- **Sprint2 优先复用**: 所有基础设施（DDSScrollContainer、DDSFlow、DDSPanel、DDSToolbar、CrossChapterEdgesOverlay、DDSCanvasStore）只扩展，不修改核心逻辑
- **APIEndpointCard** 和 **StateMachineCard** 是两个独立的自定义节点组件，放在 `src/components/dds/cards/`
- **CardRenderer.tsx** 是唯一的多态分发入口，新节点类型必须在这里注册
- 组件文件命名：`APIEndpointCard.tsx` / `StateMachineCard.tsx`（与 `UserStoryCard.tsx` 等命名风格一致）

### 类型约束

- **ChapterType**: 扩展为 `'requirement' | 'context' | 'flow' | 'api' | 'businessRules'`
- **CardType**: 扩展为 `'user-story' | 'bounded-context' | 'flow-step' | 'api-endpoint' | 'state-machine'`
- 新类型放在 `src/types/dds/api-endpoint.ts` 和 `src/types/dds/state-machine.ts`，在 `src/types/dds/index.ts` 中导出
- **禁止**在 `DDSCanvasStore` 外部直接引用子类型文件

### 拖拽实现

- **使用 HTML5 drag-and-drop API**（与 Sprint2 ComponentPanel 一致）
- DDSPanel 根据 `activeChapter` 切换显示不同组件面板
- dragstart 通过 dataTransfer 传递 `{ type: 'api-endpoint' }` 或 `{ type: 'state-machine' }` JSON

### 状态管理

- **仅通过 DDSCanvasStore** 管理状态
- 新章节数据存在 `chapters[chapterType].cards[]` 和 `chapters[chapterType].edges[]`
- 跨章节边存在 `crossChapterEdges` 数组（已有字段）
- store 持久化 key：`dds-canvas`

### 导出实现

- **APICanvasExporter** 是 OpenAPIGenerator 的中间转换层，负责 APIEndpointCard[] → EndpointDefinition[]
- **SMExporter** 是独立导出器，负责 StateMachineCard[] + edges → StateMachineJSON
- 导出 Modal 可以是 DDSPanel 内置组件，也可以是独立 Modal，取决于复杂度和复用需求

### 样式约束

- **禁止硬编码颜色值**，使用 CSS Token
- API 方法 badge 颜色：`var(--color-method-get)` / `var(--color-method-post)` / `var(--color-method-put)` / `var(--color-method-delete)` / `var(--color-method-patch)`
- 状态机图标颜色：`var(--color-sm-initial)` / `var(--color-sm-final)` / `var(--color-sm-normal)` / `var(--color-sm-choice)` / `var(--color-sm-join)` / `var(--color-sm-fork)`
- 跨章节边：`var(--color-cross-chapter-edge)`（紫色）
- 节点宽度：APIEndpointCard 180px / StateMachineCard 140px（固定）

### 测试要求

- **Vitest + Testing Library**（项目基准，不是 Jest）
- APIEndpointCard 组件测试 ≥ 10 个用例
- StateMachineCard 组件测试 ≥ 10 个用例
- APICanvasExporter 导出测试 ≥ 5 个用例（E4-U1.1 ~ E4-U1.5）
- SMExporter 导出测试 ≥ 5 个用例（E4-U2.1 ~ E4-U2.5）
- TypeScript 编译 0 errors

### 四态设计

每个组件必须实现四态：
- **Ideal**: 正常渲染
- **Empty**: 引导内容（非留白）
- **Loading**: 骨架屏（**禁止**转圈）
- **Error**: 内联错误提示 + 防御设计

详见 `specs/E1-api-chapter.md` 和 `specs/E2-business-rules.md`。

### 提交规范

- 每个 Epic 可单独提交
- commit message 格式：`[<Epic>] <变更描述>`
  - 例：`[E1] APIEndpointCard 节点组件实现`
  - 例：`[E4] APICanvasExporter 导出器实现`
- 禁止未完成功能提交

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint4-spec-canvas-extend
- **执行日期**: 2026-04-18
