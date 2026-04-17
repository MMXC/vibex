# Research Summary — vibex-sprint3-prototype-extend

**Agent**: analyst
**日期**: 2026-04-17
**任务**: vibex-sprint3-prototype-extend / analyze-requirements (Research Phase)

---

## Historical Learnings

### Sprint1 prototype-canvas (vibex-sprint1-prototype-canvas)
Sprint1 已完成 prototype-canvas 基础建设，核心资产：

- `prototypeStore.ts`（217行）：Zustand store，已包含 nodes/edges/pages/selectedNodeId，支持节点 CRUD、页面 CRUD、导入导出。**edges 数组已存在但从未被 UI 填充**，这是页面跳转连线的天然切入点。
- `ProtoFlowCanvas.tsx`：React Flow 画布，支持节点拖拽、缩放、选择。
- `FlowTreePanel.tsx`：路由树，当前仅展示页面列表（无视觉连接线）。
- `ComponentTreePanel.tsx`：组件树。
- `ContextTreePanel.tsx`：限界上下文树。
- `MockDataPanel.tsx`：属性面板的 Mock 数据 Tab（E1-U4 实现），支持双击节点打开右侧面板修改 props。
- `ImportPanel.tsx`（175行）：导入面板，支持 JSON 导入。
- 10 个默认 UI 组件（Button/Input/Card/Image/Text/Container/Grid/Flex/Spacer/Icon）。

**关键结论**: prototypeStore 可直接复用，只需扩展 edges 和 breakpoint 字段。

### Sprint1 analysis.md 关键发现
- "路由树"的展示形式有 A（页面列表）和 B（视觉连线）两种方案，Sprint1 选择了 A（快速上线）。
- 属性面板已有基础（Mock 数据 tab），Sprint3 需要扩展为完整的 PropertyPanel。
- Sprint1 分析已标记响应式断点为"未来方向"，本次 Sprint3 可以实现。

### 现有 AI/图片相关代码
- `services/figma/figma-import.ts`：Figma Import Service，存在但功能仅限于 Figma URL 解析。**未接入 prototypeStore**。
- **无现有 AI sketch 识别能力**。
- `services/oauth/oauth.ts` 中有 `ai` 相关代码段（OAuth 认证相关，非 AI 识别）。

### 现有响应式相关代码
- `styles/responsive.tsx`：VibeX Responsive Utilities，已建立完整的断点系统：
  - Breakpoints: 375px（mobile）/ 768px（tablet）/ 1024px（desktop）/ 1440px（wide）
  - 已建立 ResponsiveProvider context 和 useBreakpoint hook
  - **与 prototypeStore 完全隔离**，未接入原型画布。

---

## Git History Context

```
06ad347e review: vibex-sprint1-prototype-canvas/Epic1 approved
f18d48f4 feat(prototype): Epic1 拖拽布局编辑器核心实现
```

Sprint1 代码集中在以下目录：
- `vibex-fronted/src/stores/prototypeStore.ts`
- `vibex-fronted/src/components/canvas/`（CanvasPage 911 行 + panels + features）
- `vibex-fronted/src/lib/prototypes/`

**关键教训（来自 docs/learnings/）**:
- `canvas-testing-strategy.md`：Mock Store 真实性和 Vitest/Jest 语法冲突是主要陷阱
- `canvas-api-completion.md`：Hono 路由顺序问题（GET /latest 必须在 GET /:id 之前）
- `vibex-e2e-test-fix.md`：Epic 划分与实现契合的重要性

---

## Current Code State

### prototypeStore 数据模型（关键片段）
```typescript
interface CanvasNode {
  id: string;
  type: 'boundedContext' | 'businessFlow' | 'component';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}
interface Page {
  id: string;
  name: string;
  route: string;
  nodes: CanvasNode[];
}
interface PrototypeState {
  nodes: CanvasNode[];
  edges: Edge[];      // ← 已存在但从未被 UI 填充！
  pages: Page[];
  selectedNodeId: string | null;
}
```

### CanvasPage 布局（911行）
- 三列横向布局：ContextTreePanel | FlowTreePanel | ComponentTreePanel
- 通过 `useCanvasPanels` hook 管理面板状态
- 响应式支持：移动端 Tab 切换显示不同面板

### ImportPanel（175行）
- 支持 JSON 解析导入
- `importFromJson(json: string)` 方法已存在
- **未接入 AI 图像识别**

### figma-import.ts（~80行）
- `fetchFigmaDesign()`：Figma URL → JSON 解析
- `parseFigmaJson()`：解析 Figma JSON → 内部结构
- **未接入 prototypeStore.addNode**

---

## Key Findings

1. **页面跳转连线是增量开发**：prototypeStore.edges 数组已存在，只需激活 FlowTreePanel 的连线创建 UI。这是最简单的 Epic。

2. **组件属性面板已有基础**：MockDataPanel.tsx 是起点，但需要重大重构为 PropertyPanel（Tabs 架构）。

3. **响应式断点需与 CanvasPage 集成**：responsive.tsx 的断点系统需要接入 prototypeStore 的节点数据模型，CanvasPage 工具栏需要新增设备切换 UI。

4. **AI 导入需要新增 pipeline**：figma-import.ts 可扩展，但需要新增 `importFromImage()` 方法调用 AI Vision API，解析结果需要映射到 prototypeStore 的节点格式。

5. **CanvasPage 是风险点**：911 行文件，任何布局改动都可能影响现有功能。属性面板和响应式断点都涉及 CanvasPage 重构，需要分区修改 + gstack browse 验证。

6. **测试策略**：prototypeStore 需要增加 edges 和 breakpoint 的单元测试（参考 canvas-testing-strategy.md 教训：Mock Store 必须真实反映 Zustand 行为）。

---

## Recommendations

1. **E1（页面跳转连线）先做**：风险最低，prototypeStore.edges 已存在，只需开发 UI。
2. **E2（属性面板）次之**：MockDataPanel 重构，依赖 E1 无直接依赖，但与 E1 可以并行。
3. **E3（响应式断点）第三**：需要仔细处理 CanvasPage 布局。
4. **E4（AI导入）最后**：依赖 AI 服务可用性，设计为"辅助建议"而非自动完成。

**风险提醒**：CanvasPage 重构时使用 feature flag 或逐步灰度，避免破坏 Sprint1 上线功能。
