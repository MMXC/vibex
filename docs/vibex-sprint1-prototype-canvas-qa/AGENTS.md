# AGENTS.md — vibex-sprint1-prototype-canvas-qa

**项目**: vibex-sprint1-prototype-canvas-qa
**日期**: 2026-04-18
**角色**: Architect
**受众**: Dev Agent、Review Agent、QA Agent

---

## 开发约束

### 组件架构

- **ProtoEditor** 是唯一入口，集成所有子组件
- 子组件职责边界清晰，不相互直接引用，通过 `prototypeStore` 中转状态
- 所有组件位于 `src/components/prototype/`
- 测试文件位于 `src/components/prototype/__tests__/`

### 样式约束

- **禁止硬编码颜色值**（`#fff`、`blue` 等）
- 使用 CSS Token：`var(--color-primary)`、`var(--color-skeleton)`、`var(--color-error)`
- **禁止硬编码间距**，使用 `var(--space-1)` (8px) / `var(--space-2)` (16px) / `var(--space-3)` (24px)
- 固定宽度：`ComponentPanel` 240px、`ProtoAttrPanel` 280px

### 拖拽实现

- 使用 **HTML5 drag-and-drop API**（dataTransfer JSON）
- ComponentPanel 是 drag 源，ProtoFlowCanvas 是 drop 目标
- **不要**混用 React DnD 或其他拖拽库

### 状态管理

- **仅通过 prototypeStore** 管理状态（Zustand + localStorage persist）
- 组件内部无状态（除了 UI 瞬态如 modal open/close）
- store 持久化 key：`vibex-prototype-canvas`

### Mock 数据

- MockData Tab 集成在 ProtoAttrPanel 内，**不要**新建 `MockDataPanel.tsx`
- mock 数据存储在 `node.data.mockData`
- 导出时 mock 数据写入 `mockDataBindings` 数组

### 页面管理（方案A）

- **不要**实现按 page 隔离节点集（本期不做）
- pages 仅作元数据（id/name/route）
- 切换页面不重置画布节点

### 导出格式

- **必须**使用 `version: '2.0'`（固定值）
- 导出/导入通过 `prototypeStore.getExportData()` / `loadFromExport()`
- Export Modal 集成在 ProtoEditor 内，**不要**新建独立组件

### PrototypeExporter.tsx

- **废弃标记**：575 行组件 `PrototypeExporter.tsx` 不接入本期
- 如后续需要原型预览页，可考虑复用

### 测试要求

- **E4-U2 Round-trip 测试是 DoD 必须项**（上期 GAP）
- `prototypeStore.test.ts` 新增 5 个测试用例：
  - E4-U2.1: nodes 全等
  - E4-U2.2: pages 全等
  - E4-U2.3: mockDataBindings 全等
  - E4-U2.4: 无效 version 忽略
  - E4-U2.5: 空数据 round-trip
- 所有组件测试使用 **Vitest + Testing Library**（项目基准框架）
- TypeScript 编译必须 0 errors

### 四态设计

每个组件必须实现四态：
- **Ideal**: 正常渲染
- **Empty**: 引导内容（非留白）
- **Loading**: 骨架屏（**禁止**转圈）
- **Error**: 内联错误提示 + 防御设计

详见 `specs/E1-drag-drop-editor.md` 等规格文档。

### 不在本期处理

- 节点拖拽位置微调优化
- mock 数据模板预设
- mock 数据 JSON 文件导入
- 页面间连线关系可视化
- PrototypeExporter 组件接入
- Dev Server middleware 警告（全局问题）
- 每 page 独立节点集（方案B）

### 提交规范

- 每个 Epic 可单独提交
- commit message 格式：`[<Epic>] <变更描述>`
  - 例：`[E1] 组件面板拖拽实现`
  - 例：`[E4] Round-trip 测试补充`
- 禁止未完成功能提交

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint1-prototype-canvas-qa
- **执行日期**: 2026-04-18
