# Implementation Plan — vibex-sprint3-prototype-extend

**项目**: vibex-sprint3-prototype-extend
**版本**: 1.0
**日期**: 2026-04-17
**角色**: Architect
**状态**: Draft

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 页面跳转连线 | E1-U1 ~ E1-U3 | ⬜ 0/3 | E1-U1 |
| E2: 组件属性面板 | E2-U1 ~ E2-U3 | ⬜ 0/3 | E2-U1 |
| E3: 响应式断点 | E3-U1 ~ E3-U3 | ⬜ 0/3 | E3-U1 |
| E4: AI 草图导入 | E4-U1 ~ E4-U2 | ⬜ 0/2 | E4-U1 |

---

## E1: 页面跳转连线

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | prototypeStore edges CRUD 扩展 | ⬜ | — | store.addEdge/removeEdge 方法可用，级联清除正确 |
| E1-U2 | FlowTreePanel 连线创建 UI | ⬜ | E1-U1 | 「添加连线」按钮可见，点击后能选择源/目标页面 |
| E1-U3 | ProtoFlowCanvas 连线渲染 | ⬜ | E1-U1 | 画布上两点之间出现箭头连线，连线可被选中并删除 |

---

### E1-U1: prototypeStore edges CRUD 扩展

**Goal:** 在 prototypeStore 中实现 `addEdge`、`removeEdge`，并确保 `removeNode` 级联清除相关 edges。

**Requirements:** E1-AC1, E1-AC3

**Dependencies:** —

**Files:**
- Modify: `vibex-fronted/src/stores/prototypeStore.ts`
- Test: `vibex-fronted/src/stores/__tests__/prototypeStore.test.ts`

**Approach:**
- `addEdge(source, target)` → 生成 id，拼装 `Edge` 对象（type: `smoothstep`），写入 `edges[]`
- `removeEdge(edgeId)` → `edges.filter(e => e.id !== edgeId)`
- 复用已有的 `removeNode` 扩展 `edges` 过滤逻辑（已有 `source !== nodeId && target !== nodeId` 过滤，无需额外修改）
- `edges` 已有类型定义（`Edge[]` from `@xyflow/react`），无需修改接口

**Patterns to follow:**
- `vibex-fronted/src/stores/prototypeStore.ts` 现有 `addNode`/`removeNode` 实现模式

**Test scenarios:**
- Happy path: `addEdge` 后 edges 长度 +1，source/target 正确
- Edge case: 重复添加同一对 source/target，应允许（用户可能需要多重连线）
- Error path: `removeEdge` 不存在的 id 不抛异常，静默忽略

**Verification:**
- `expect(store.getState().edges).toHaveLength(1)` 通过
- `expect(store.getState().edges[0].type).toBe('smoothstep')` 通过

---

### E1-U2: FlowTreePanel 连线创建 UI

**Goal:** FlowTreePanel 增加「添加连线」按钮，用户可选择源页面和目标页面创建连线。

**Requirements:** E1-AC1

**Dependencies:** E1-U1

**Files:**
- Modify: `vibex-fronted/src/components/canvas/panels/FlowTreePanel.tsx`
- Test: `vibex-fronted/src/components/canvas/panels/__tests__/FlowTreePanel.test.tsx`

**Approach:**
- 在 FlowTreePanel 工具栏区域增加「添加连线」图标按钮
- 点击后弹出 `Select` 下拉框（源页面 → 目标页面），确认后调用 `prototypeStore.addEdge()`
- 连接成功后刷新页面树，显示连线列表（每条连线显示为 "页面A → 页面B"）

**Patterns to follow:**
- `vibex-fronted/src/components/canvas/panels/FlowTreePanel.tsx` 现有按钮交互模式

**Test scenarios:**
- Happy path: 点击「添加连线」→ 选择页面 → 确认 → `addEdge` 被调用
- Edge case: 只有一个页面时，连线按钮 disabled 并提示「需要至少两个页面」
- Edge case: 无 pages 时，不渲染连线相关 UI

**Verification:**
- gstack browse: `is visible text="添加连线"`
- unit test: `fireEvent.click(addButton); expect(screen.getByText(/选择源页面/)).toBeInTheDocument()`

---

### E1-U3: ProtoFlowCanvas 连线渲染

**Goal:** React Flow 画布渲染 edges，连线可被选中并删除（Delete 键）。

**Requirements:** E1-AC2, E1-AC3

**Dependencies:** E1-U1

**Files:**
- Modify: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`
- Test: `vibex-fronted/src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx`

**Approach:**
- `ProtoFlowCanvasInner` 中已有 `useEdgesState(storeEdgesCasted)`，只需确保 store → local state 同步正确
- 添加 `onEdgesChange` 处理 edges 选择（`select` 类型变化）
- 添加键盘监听：选中 edge + Delete 键 → 调用 `removeEdge(edgeId)`
- 启用 React Flow 内置 `ConnectionLine` 组件（用户拖拽时显示预览线）

**Patterns to follow:**
- `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx` 现有事件处理模式

**Test scenarios:**
- Happy path: 画布上渲染出 SVG path edge 元素
- Edge case: 大量 edges（>100）时渲染性能，监控 re-render
- Error path: 节点被删除时，相关的 edge 同时从画布消失

**Verification:**
- gstack browse: `is visible [data-testid="proto-edge-*"]` 或 `is visible svg path`
- unit test: 验证 `onEdgesChange` 中 select 事件触发 `removeEdge`

---

## E2: 组件属性面板

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | PropertyPanel 基础框架 + DataTab | ⬜ | — | 双击节点 → 右侧 320px Drawer 展开，显示节点 ID 和类型 |
| E2-U2 | NavigationTab + ResponsiveTab | ⬜ | E2-U1 | Navigation Tab 设置跳转自动生成 edge；Responsive Tab 设置断点规则 |
| E2-U3 | StyleTab | ⬜ | E2-U1 | 样式 Tab 支持基础样式修改（颜色、字体大小等） |

---

### E2-U1: PropertyPanel 基础框架 + DataTab

**Goal:** 新建 `PropertyPanel/`，基于 `ProtoAttrPanel.tsx`（258行）重构。实现 DataTab（修改节点文字/数据）。

**Requirements:** E2-AC1, E2-AC2

**Dependencies:** —

**Files:**
- Create: `vibex-fronted/src/components/canvas/panels/PropertyPanel.tsx`
- Create: `vibex-fronted/src/components/canvas/panels/PropertyPanel/DataTab.tsx`
- Test: `vibex-fronted/src/components/canvas/panels/__tests__/PropertyPanel.test.tsx`
- Style: `vibex-fronted/src/components/canvas/panels/PropertyPanel.module.css`

**Approach:**
- PropertyPanel 为右侧 Drawer，宽度 320px，监听 `selectedNodeId` 变化展开/关闭
- 头部显示节点 ID + 组件类型标签
- Tab 导航（Data/Style/Navigation/Responsive）
- DataTab: 显示 `text`/`label` 输入框，onChange → `updateNode(nodeId, { component: { ...component, label: newValue } })`
- 双击事件在 ProtoFlowCanvas 中通过 `onNodeDoubleClick` 触发 `selectNode`

**Technical design (directional):**
```
// ProtoFlowCanvas.tsx 双击处理
const onNodeDoubleClick = useCallback(
  (_event: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  },
  [selectNode]
);
```

**Patterns to follow:**
- `vibex-fronted/src/components/canvas/messageDrawer/MessageDrawer.tsx` 抽屉交互模式
- `vibex-fronted/src/styles/design-tokens.css` 颜色/间距变量

**Test scenarios:**
- Happy path: `nodeId` 从 null 变为 "NODE_001" → Drawer 展开
- Happy path: DataTab 输入文字 → `updateNode` 被调用
- Edge case: `nodeId` 不存在时（store 中已删除），Drawer 关闭
- Edge case: 快速切换两个节点，Drawer 内容正确切换

**Verification:**
- gstack browse: `is visible [data-testid="property-panel"]`
- unit test: `expect(screen.getByText(/NODE_001/)).toBeInTheDocument()`

---

### E2-U2: NavigationTab + ResponsiveTab

**Goal:** 实现 Navigation Tab（设置跳转自动生成 edge）和 Responsive Tab（设置断点显示规则）。

**Requirements:** E2-AC3, E2-AC4

**Dependencies:** E2-U1

**Files:**
- Create: `vibex-fronted/src/components/canvas/panels/PropertyPanel/NavigationTab.tsx`
- Create: `vibex-fronted/src/components/canvas/panels/PropertyPanel/ResponsiveTab.tsx`
- Modify: `vibex-fronted/src/stores/prototypeStore.ts`（新增 `updateNodeBreakpoints`）
- Test: `vibex-fronted/src/components/canvas/panels/__tests__/PropertyPanel.test.tsx`（扩展）

**Approach:**
- NavigationTab: 下拉选择 `pages` 列表 → 选中后调用 `addEdge(selectedNodeId, targetPageId)`，同时 `updateNode(nodeId, { navigation: { pageId, pageRoute } })`
- ResponsiveTab: 三个 Toggle（手机/平板/桌面）→ 调用 `updateNodeBreakpoints(nodeId, { mobile, tablet, desktop })`
- prototypeStore 扩展 `updateNodeBreakpoints(nodeId, breakpoints)` → 写入 `nodes[i].data.breakpoints`

**Patterns to follow:**
- `vibex-fronted/src/components/canvas/panels/PropertyPanel/DataTab.tsx` 表单控件模式

**Test scenarios:**
- Happy path: NavigationTab 选择页面 → `addEdge` + `updateNode` 被调用
- Happy path: ResponsiveTab 切换 Toggle → `updateNodeBreakpoints` 被调用，store 数据正确
- Edge case: NavigationTab 选择当前页自身 → 提示「不能跳转到自身」
- Edge case: 切换页面后，原有 navigation 数据正确更新

**Verification:**
- unit test: `expect(usePrototypeStore.getState().edges.some(e => e.source === 'NODE_001' && e.target === 'page-2')).toBe(true)`

---

### E2-U3: StyleTab

**Goal:** 实现 Style Tab，支持基础样式修改（颜色、字体大小、间距等）。

**Requirements:** E2-AC2（样式部分）

**Dependencies:** E2-U1

**Files:**
- Create: `vibex-fronted/src/components/canvas/panels/PropertyPanel/StyleTab.tsx`
- Modify: `vibex-fronted/src/components/canvas/panels/PropertyPanel.tsx`（Tab 注册）
- Test: 扩展 `PropertyPanel.test.tsx` StyleTab 测试用例

**Approach:**
- StyleTab: `color` 取色器、`fontSize` 数字输入、`padding`/`margin` 输入框
- onChange → `updateNode(nodeId, { component: { ...component, style: { ...existingStyle, key: value } } })`
- 只支持 `ui-schema.ts` 中定义的组件属性，不做任意样式透传

**Patterns to follow:**
- `design-tokens.css` 变量：使用 `--color-*`、`--spacing-*` 变量

**Test scenarios:**
- Happy path: 修改颜色 → store 节点数据更新
- Edge case: 输入非法值（如负数 fontSize）→ 表单校验提示

**Verification:**
- unit test: `fireEvent.change(colorPicker, { target: { value: '#ff0000' } }); expect(store.nodes[0].data.component.style.color).toBe('#ff0000')`

---

## E3: 响应式断点

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | ProtoEditor 设备切换工具栏 | ⬜ | — | 工具栏显示手机/平板/桌面按钮，点击切换画布宽度 |
| E3-U2 | prototypeStore breakpoint 状态 + 断点自动标记 | ⬜ | E3-U1 | `setBreakpoint(bp)` 方法；特定断点下新增节点自动标记断点规则 |
| E3-U3 | 画布响应式缩放渲染 | ⬜ | E3-U1, E3-U2 | 切换断点后，画布容器宽度缩放，节点应用缩放样式 |

---

### E3-U1: ProtoEditor 设备切换工具栏

**Goal:** ProtoEditor.tsx（323行）工具栏增加设备切换按钮（手机/平板/桌面）。

**Requirements:** E3-AC1, E3-AC2

**Dependencies:** —

**Files:**
- Modify: `vibex-fronted/src/components/prototype/ProtoEditor.tsx`（323行，ProtoEditor 主容器）
- Test: `vibex-fronted/src/components/prototype/__tests__/ProtoEditor.test.tsx`

**Approach:**
- 在 `ProtoEditor.tsx` 工具栏区域增加 `DeviceSwitcher` 组件，用 `// === E3: DeviceSwitcher ===` 注释分区
- 使用 `// === E3: DeviceSwitcher ===` 注释分区
- `DeviceSwitcher` 调用 `prototypeStore.setBreakpoint(bp)` 并渲染三个按钮
- 通过 `NEXT_PUBLIC_E3_ENABLED` feature flag 保护

**Patterns to follow:**
- `vibex-fronted/src/components/canvas/TreeToolbar.tsx` 工具栏按钮模式

**Test scenarios:**
- Happy path: 三个设备按钮可见，各自 aria-label 正确
- Happy path: 点击「手机」→ `setBreakpoint('375')` 被调用
- Edge case: feature flag = false 时，工具栏不渲染设备按钮
- Error path: ProtoEditor 中无 ProtoFlowCanvas 时不崩溃（空值保护）

**Verification:**
- gstack browse: `is visible [aria-label="手机"]` / `[aria-label="平板"]` / `[aria-label="桌面"]`

---

### E3-U2: prototypeStore breakpoint 状态 + 断点自动标记

**Goal:** prototypeStore 新增 `breakpoint` 状态和 `setBreakpoint`/`updateNodeBreakpoints` 方法；`addNode` 在特定断点下自动设置断点规则。

**Requirements:** E3-AC2, E3-AC3

**Dependencies:** E1-U1, E2-U1（共享 prototypeStore）

**Files:**
- Modify: `vibex-fronted/src/stores/prototypeStore.ts`
- Test: 扩展 `vibex-fronted/src/stores/__tests__/prototypeStore.test.ts`

**Approach:**
- 新增 `breakpoint: '375' | '768' | '1024'` state，默认 `'1024'`
- `setBreakpoint(bp)` → 直接 set
- `updateNodeBreakpoints(nodeId, breakpoints)` → `nodes.map` 更新 `nodes[i].data.breakpoints`
- 扩展 `addNode` 方法：判断当前 `get().breakpoint`，自动设置新节点的 `breakpoints` 字段
  - breakpoint = '375' → `{ mobile: true, tablet: false, desktop: false }`
  - breakpoint = '768' → `{ mobile: false, tablet: true, desktop: false }`
  - breakpoint = '1024' → `{ mobile: false, tablet: false, desktop: true }`

**Patterns to follow:**
- `vibex-fronted/src/stores/prototypeStore.ts` 现有 state/action 模式

**Test scenarios:**
- Happy path: `setBreakpoint('375')` → `get().breakpoint === '375'`
- Happy path: 在 '375' 断点下 `addNode` → 新节点 `breakpoints.mobile === true`
- Edge case: `breakpoint` 值非法（字符串非 '375'/'768'/'1024'）→ TypeScript 编译期阻止

**Verification:**
- unit test: `expect(store.getState().breakpoint).toBe('375')` 和节点 `breakpoints` 字段正确

---

### E3-U3: 画布响应式缩放渲染

**Goal:** 切换断点时，画布容器宽度缩放，节点应用响应式样式。

**Requirements:** E3-AC2

**Dependencies:** E3-U1, E3-U2

**Files:**
- Modify: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`（画布容器样式）
- Modify: `vibex-fronted/src/components/prototype/ProtoEditor.tsx`（容器宽度控制）
- Test: 扩展 ProtoEditor Vitest 测试

**Approach:**
- ProtoEditor 中画布容器 `div` 应用动态 width style（`{ width: breakpoint }`）
- `ProtoFlowCanvas` 外层容器监听 `breakpoint` 变化，应用 `transform: scale(ratio)` 缩放
  - ratio = 375 / breakpoint（如 breakpoint='768' → scale(375/768)）
- 节点可见性通过 `nodes[i].data.breakpoints` 控制：在当前断点下 `breakpoints[currentBreakpoint] = false` 时隐藏节点

**Patterns to follow:**
- `vibex-fronted/src/styles/responsive.tsx` 现有断点样式系统

**Test scenarios:**
- Happy path: 切换到 '375' → 画布容器 width = '375px'
- Edge case: 大量节点（>50）在缩放模式下性能，React Flow `fitView` 行为正确

**Verification:**
- gstack browse: `getAttribute [data-testid="canvas-container"] "style"` 包含 `375px`

---

## E4: AI 草图导入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | image-import.ts AI 解析服务 | ⬜ | — | `importFromImage(file)` 调用 AI Vision API，返回 `ImportedComponent[]` |
| E4-U2 | ImportPanel 图片上传 UI + 确认导入 | ⬜ | E4-U1 | 上传图片 → AI 解析 → 显示识别结果 → 确认导入画布 |

---

### E4-U1: image-import.ts AI 解析服务

**Goal:** 新建 `image-import.ts`，扩展 figma-import.ts，实现 `importFromImage(file)` 方法。

**Requirements:** E4-AC2

**Dependencies:** —

**Files:**
- Create: `vibex-fronted/src/services/figma/image-import.ts`
- Test: `vibex-fronted/src/services/figma/__tests__/image-import.test.ts`
- Env: `MINIMAX_API_KEY`（后端通过 llm-provider.ts 注入，不暴露在前端）

**Approach:**
- 将图片转为 base64 → 调用后端 `/api/ai/analyze-image` 代理（复用 llm-provider.ts 的 MiniMax 集成）
- System prompt 要求模型返回 JSON 格式的组件列表（遵循 `ImportedComponent` 类型）
- 解析 API 响应 JSON → 转换为 `ImportedComponent[]`
- 支持超时（30s）和错误处理（API 不可用时返回友好错误）
- 通过 `NEXT_PUBLIC_AI_IMPORT_ENABLED` feature flag 控制

**Technical design (directional):**
```typescript
// image-import.ts 核心结构
export async function importFromImage(file: File): Promise<ImageImportResult> {
  const base64 = await fileToBase64(file);
  // 前端不持有 API key，走后端代理
  const response = await fetch('/api/ai/analyze-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: base64,
      prompt: '识别图片中的 UI 组件结构，返回 JSON 格式的组件列表'
    })
  });
  // parse response → return ImportedComponent[]
}
```

**Patterns to follow:**
- `vibex-fronted/src/services/figma/figma-import.ts` 现有 API 调用模式

**Test scenarios:**
- Happy path: 有效图片文件 → 返回 `components` 数组
- Edge case: 图片过大（>10MB）→ 压缩或提示「图片过大」
- Edge case: 无 API key → 返回错误 `"请配置 AI 服务"`
- Error path: API 500 → 返回 `success: false, error: '识别失败，请重试'`
- Error path: 网络超时（30s）→ 返回超时错误

**Verification:**
- unit test（mock /api/ai/analyze-image）: `expect(result.success).toBe(true)` 且 `result.components.length > 0`

---

### E4-U2: ImportPanel 图片上传 UI + 确认导入

**Goal:** ImportPanel 增加「上传图片」Tab，支持拖拽上传、AI 解析、确认导入。

**Requirements:** E4-AC1, E4-AC3

**Dependencies:** E4-U1

**Files:**
- Modify: `vibex-fronted/src/components/canvas/features/ImportPanel.tsx`
- Test: `vibex-fronted/src/components/canvas/features/__tests__/ImportPanel.test.tsx`

**Approach:**
- ImportPanel 增加第三个 Tab（`image`）
- 图片上传区：拖拽 + 点击上传，接受 `.png, .jpg, .jpeg`
- 上传后显示预览缩略图（200x200）
- 调用 `importFromImage(file)`，显示 loading 状态（"正在识别组件..."）
- 解析完成后列表展示识别到的组件（每个显示为「类型 x 数量」卡片）
- 「确认导入」按钮 → 调用 `prototypeStore.addNodes(parsedComponents)`
- 「重试」按钮在失败时显示

**Patterns to follow:**
- `vibex-fronted/src/components/canvas/features/ImportPanel.tsx` 现有 Tab 切换模式

**Test scenarios:**
- Happy path: 上传 PNG → Loading 状态 → 识别结果列表
- Happy path: 点击「确认导入」→ `addNodes` 被调用，节点出现在画布
- Edge case: 上传非图片文件 → 提示「仅支持 PNG/JPG/JPEG」
- Edge case: AI 返回空列表 → 提示「未识别到组件」
- Error path: 识别失败 → 显示错误 + 重试按钮

**Verification:**
- gstack browse: `is visible text="上传图片"` + `is visible text="正在识别组件..."`
- gstack browse: 导入完成后 `is visible text="成功导入"`

---

## 依赖关系图（Unit 级别）

```
E1-U1 (store edges CRUD)
  ├── E1-U2 (FlowTreePanel 连线 UI)
  └── E1-U3 (Canvas edge 渲染)

E2-U1 (PropertyPanel 基础 + DataTab)
  ├── E2-U2 (NavigationTab + ResponsiveTab) ← E1-U1 完成后可并发
  └── E2-U3 (StyleTab) ← E2-U1 完成后可并发

E3-U1 (ProtoEditor 设备切换工具栏) ← 可与 E1/E2 并发
E3-U2 (prototypeStore breakpoint 扩展) ← 可与 E1-U1 并发
  └── E3-U3 (画布响应式缩放) ← E3-U1 + E3-U2 完成后

E4-U1 (image-import AI 服务) ← 可独立开发
  └── E4-U2 (ImportPanel 图片上传) ← E4-U1 完成后
```

---

## Sprint 排期建议

| Day | Morning | Afternoon |
|-----|---------|-----------|
| Day 1 | E1-U1 + E1-U2 | E1-U3 + E3-U2（并发 prototypeStore 扩展）|
| Day 2 | E2-U1 PropertyPanel 框架 | E2-U2 NavigationTab + ResponsiveTab |
| Day 3 | E2-U3 StyleTab + E3-U1 ProtoEditor 工具栏 | E3-U3 画布缩放 + 全局回归测试 |
| Day 4 | E4-U1 image-import.ts | E4-U2 ImportPanel + gstack browse 验证 |
| Day 5 | 全局回归 + E3/E4 QA | Feature flag 打开 + 最终验证 + 文档更新 |

**说明**: E1 + E2 为 P0，确保 Day 2 前完成；E3/E4 视工期可顺延。
