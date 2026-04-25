# PRD — vibex-sprint3-qa
## Sprint3 原型扩展功能 · QA 需求验证文档

**项目**: vibex-sprint3-qa
**版本**: 1.0
**日期**: 2026-04-25
**状态**: Draft
**作者**: PM
**基于**: analysis.md（Analyst，2026-04-25）
**上游**: vibex-sprint3-prototype-extend（PRD v1.0，2026-04-17）

---

## 执行摘要

### 背景

Sprint3 提案（`vibex-sprint3-prototype-extend`）计划在 Sprint1 原型编辑器基础上增量扩展 4 个 Epic：
- **E1**：页面跳转连线（利用 prototypeStore.edges）
- **E2**：组件属性面板（重构自 ProtoAttrPanel）
- **E3**：响应式断点预览（breakpoint 状态 + 工具栏设备切换）
- **E4**：AI 草图/图片导入（扩展 figma-import 服务）

Analyst 在 `vibex-sprint3-qa/analyze-requirements` 阶段发现**Specs 全空**（E1-E5 规格文件均为 0 bytes），是阻断性缺陷。Architecture 设计已完整（architecture.md，629行），PRD 执行决策明确（选项 A），但规格文档缺失导致 Story 级别验收标准无法追溯。

### 目标

本 PRD 阶段任务：补充 E1-E5 规格文档（specs/），将验收标准从 architecture.md 沉淀为可验证的规格条目，格式符合 `test(...)` / `expect()` 断言风格。

### 成功指标

| 指标 | 目标 |
|------|------|
| Specs 规格文件数量 | E1-E5 共 5 份，每份包含四态定义 + expect() 断言 |
| E1/E2 规格覆盖 | prototypeStore edges CRUD + PropertyPanel 四 Tab 完整覆盖 |
| E3 规格覆盖 | 断点切换 reducer + 工具栏按钮 + 断点标记逻辑 |
| E4 规格覆盖 | importFromImage 流程 + 识别结果确认 + 错误处理 |
| 格式合规率 | 100% Story 含可写 expect() 断言，无模糊验收标准 |

---

## Epic/Story 表格

### Epic 1: 页面跳转连线 — specs/E1-api-chapter.md
> **优先级**: P0 | **工时**: 3-4h | **根因**: prototypeStore.edges 从未激活，FlowTreePanel 无连线 UI

| ID | 功能描述 | 工时 | 验收标准引用 |
|----|---------|------|------------|
| E1.1 | FlowTreePanel「添加连线」按钮，支持选源页面 + 目标页面 | 1h | E1-AC1 |
| E1.2 | ProtoFlowCanvas 渲染可视化连线（箭头指向），支持选中高亮 | 1.5h | E1-AC1 |
| E1.3 | 连线可被选中、删除；Delete 键支持 | 0.5h | E1-AC2 |
| E1.4 | 页面删除时，关联 edges 自动级联清除 | 1h | E1-AC3 |

**验收标准（expect() 断言）**：
```typescript
// E1-AC1
expect(store.edges).toHaveLength(1);
expect(store.edges[0]).toMatchObject({ source: 'page-1', target: 'page-2', type: 'smoothstep' });
expect(canvas.query('[data-edge-id]')).toBeInTheDocument();

// E1-AC2
const edgeId = store.edges[0].id;
store.removeEdge(edgeId);
expect(store.edges).toHaveLength(0);

// E1-AC3
store.addEdge('n1', 'n2');
store.removeNode('n1');
expect(store.edges.filter(e => e.source === 'n1' || e.target === 'n1')).toHaveLength(0);
```

---

### Epic 2: 组件属性面板 — specs/E2-business-rules.md
> **优先级**: P0 | **工时**: 3-4h | **根因**: E1-U4 MockDataPanel 功能有限，缺少四 Tab 统一配置入口

| ID | 功能描述 | 工时 | 验收标准引用 |
|----|---------|------|------------|
| E2.1 | 双击节点 → 右侧 PropertyPanel 展开（320px drawer），显示节点 ID + 类型标签 | 1h | E2-AC1 |
| E2.2 | Style Tab：配置节点样式属性（宽/高/颜色/圆角） | 0.5h | E2-AC2（Style 部分） |
| E2.3 | Data Tab：配置节点数据属性（text/placeholder/value） | 0.5h | E2-AC2（Data 部分） |
| E2.4 | Navigation Tab：设置跳转目标页面，自动生成/更新 edge | 1h | E2-AC3 |
| E2.5 | Responsive Tab：设置断点显示规则（mobile/tablet/desktop 可见性） | 1h | E2-AC4 |

**验收标准（expect() 断言）**：
```typescript
// E2-AC1
expect(screen.getByText(/NODE_001/)).toBeInTheDocument();
expect(screen.getByText(/Button/)).toBeInTheDocument();
expect(panel).toHaveClass('property-panel-drawer');

// E2-AC2 Style
fireEvent.change(screen.getByLabelText('宽度'), { target: { value: '200' } });
expect(node.data.component.styles.width).toBe(200);

// E2-AC2 Data
fireEvent.change(screen.getByLabelText('文字'), { target: { value: '提交' } });
expect(node.data.component.label).toBe('提交');

// E2-AC3 Navigation
fireEvent.change(screen.getByLabelText('跳转页面'), { target: { value: 'page-2' } });
expect(store.edges.some(e => e.source === 'NODE_001' && e.target === 'page-2')).toBe(true);

// E2-AC4 Responsive
fireEvent.click(screen.getByLabelText('仅手机'));
expect(node.data.breakpoints.mobile).toBe(true);
expect(node.data.breakpoints.tablet).toBe(false);
```

---

### Epic 3: 响应式断点预览 — specs/E3-cross-chapter.md
> **优先级**: P1 | **工时**: 2-3h | **根因**: responsive.tsx 与 prototypeStore 隔离，无法在画布中预览真实效果

| ID | 功能描述 | 工时 | 验收标准引用 |
|----|---------|------|------------|
| E3.1 | ProtoEditor 工具栏增加设备切换按钮（📱手机 375px / 📱平板 768px / 🖥️桌面 1024px） | 1h | E3-AC1 |
| E3.2 | 点击设备按钮，画布容器宽度缩放至对应断点，节点应用缩放样式 | 0.5h | E3-AC2 |
| E3.3 | prototypeStore.breakpoint 状态同步更新 | 0.25h | E3-AC2 |
| E3.4 | 在特定断点下新增节点，自动标记断点显示规则 | 0.75h | E3-AC3 |

**验收标准（expect() 断言）**：
```typescript
// E3-AC1
expect(screen.getByLabelText(/手机/)).toBeInTheDocument();
expect(screen.getByLabelText(/平板/)).toBeInTheDocument();
expect(screen.getByLabelText(/桌面/)).toBeInTheDocument();
expect(screen.getByLabelText(/手机/)).toHaveAttribute('aria-pressed', 'true');

// E3-AC2
fireEvent.click(screen.getByLabelText(/手机/));
expect(store.breakpoint).toBe('375');
expect(canvasContainer).toHaveStyle({ width: '375px' });

// E3-AC3
store.setBreakpoint('375');
const newNodeId = store.addNode(sampleComponent, { x: 0, y: 0 });
const newNode = store.nodes.find(n => n.id === newNodeId);
expect(newNode.data.breakpoints.mobile).toBe(true);
expect(newNode.data.breakpoints.tablet).toBe(false);
expect(newNode.data.breakpoints.desktop).toBe(false);
```

---

### Epic 4: AI 草图/图片导入 — specs/E4-export.md
> **优先级**: P2 | **工时**: 3-4h | **根因**: ImportPanel 只支持 JSON/Figma URL，无法从零生成

| ID | 功能描述 | 工时 | 验收标准引用 |
|----|---------|------|------------|
| E4.1 | ImportPanel 增加「上传图片」Tab，支持 PNG/JPG/JPEG 拖拽上传 | 1h | E4-AC1 |
| E4.2 | 上传后 AI Vision API 解析（≤30s），显示 loading → 识别组件列表 | 1h | E4-AC2 |
| E4.3 | 用户确认导入，addNodes() 批量入画布，显示「成功导入 N 个组件」 | 1h | E4-AC3 |
| E4.4 | AI 服务错误时，显示「识别失败，请重试」友好提示 | 0.5h | E4-AC2（错误路径） |

**验收标准（expect() 断言）**：
```typescript
// E4-AC1
expect(screen.getByRole('button', { name: /上传图片/ })).toBeInTheDocument();
const input = screen.getByLabelText(/图片文件/);
expect(input).toHaveAttribute('accept', '.png,.jpg,.jpeg');

// E4-AC2 loading
fireEvent.change(input, { target: { files: [mockFile] } });
expect(screen.getByText(/正在识别组件/)).toBeInTheDocument();

// E4-AC2 success
await waitFor(() => {
  expect(screen.getByText(/Button/)).toBeInTheDocument();
});
expect(screen.getByText(/成功识别 \d+ 个组件/)).toBeInTheDocument();

// E4-AC2 error
server.use(rest.post(apiUrl, (_req, _res, ctx) => ctx.status(500)));
await waitFor(() => {
  expect(screen.getByText(/识别失败/)).toBeInTheDocument();
});
expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();

// E4-AC3
fireEvent.click(screen.getByRole('button', { name: /确认导入/ }));
await waitFor(() => {
  expect(store.nodes.length).toBeGreaterThan(previousCount);
});
expect(screen.getByText(/成功导入 \d+ 个组件/)).toBeInTheDocument();
```

---

## DoD (Definition of Done)

### 全局 DoD（所有 Epic 必须满足）

- [ ] **代码**: 所有新增文件通过 ESLint（零 error，允许 warn）
- [ ] **测试**: 每个 Epic 至少 3 个自动化测试覆盖核心逻辑（Vitest）
- [ ] **Specs**: E1-E5 规格文档完整，E1/E2/E3/E4 每份包含四态定义 + expect() 断言
- [ ] **gstack browse 验证**: 关键 UI 元素可见性断言通过
- [ ] **无回归**: Sprint1 所有功能在 gstack browse 中保持通过

### Epic 级别 DoD

#### E1 DoD
- [ ] `is visible text="添加连线"` 在 FlowTreePanel 中通过
- [ ] 连线创建后画布出现 SVG edge 元素
- [ ] Delete 键可删除选中的连线
- [ ] 删除页面节点后，相关 edges 从 store.edges 中清除
- [ ] `prototypeStore.test.ts` 中 edges CRUD 测试 ≥3 个 case

#### E2 DoD
- [ ] 双击节点，PropertyPanel drawer 展开
- [ ] 四个 Tab 可切换，内容正确渲染
- [ ] Data Tab 修改文字，store 节点实时更新
- [ ] Navigation Tab 设置跳转，自动生成/更新 edge
- [ ] Responsive Tab 设置断点规则，节点 breakpoints 更新
- [ ] `PropertyPanel.test.tsx` 测试 ≥4 个 case

#### E3 DoD
- [ ] 工具栏显示 3 个设备按钮，当前选中高亮
- [ ] 点击设备按钮，画布宽度正确切换
- [ ] `store.breakpoint` 状态与工具栏选中状态同步
- [ ] 在特定断点下新增节点，自动标记断点属性
- [ ] `prototypeStore.test.ts` 断点相关测试 ≥3 个 case

#### E4 DoD
- [ ] ImportPanel 支持图片文件上传（PNG/JPG/JPEG）
- [ ] 上传后显示 loading → 解析结果
- [ ] 确认导入后，节点批量出现在画布
- [ ] AI 服务错误时，显示友好错误提示 + 重试按钮
- [ ] `image-import.test.ts` mock 测试 ≥3 个 case

---

## 本质需求穿透（神技1）

> 每个 Epic 回溯至本质用户目标，防止功能膨胀

| Epic | 表层功能 | 本质需求 | 穿透结论 |
|------|---------|---------|---------|
| E1 | 可视化连线 | 直观看到页面间流向 | 连线只是手段，核心是**页面流向可视化**。若边线不足以传达（复杂页面有多个出口），可扩展为**流向标注**（source/target + 跳转条件文字） |
| E2 | 四 Tab 属性面板 | 快速调整组件属性不依赖开发 | 核心是**所见即所得的配置能力**。Tab 数量不是关键，关键是配置项是否覆盖高频场景（文字/跳转/断点），后续按需扩展 |
| E3 | 设备切换预览 | 开发前验证原型在不同设备上的呈现 | 核心是**断点效果预览**，当前用缩放实现（低精度），未来可升级为真实断点布局重排 |
| E4 | AI 识别草图 | 从零快速生成原型 | 核心是**降低原型创建成本**。AI 识别是手段，若识别率低（当前高风险），设计应支持**半自动模式**（AI 建议 + 用户编辑后再导入） |

---

## 最小可行范围（神技2）

> 每个 Epic 的 MVP 定义，避免 scope creep

| Epic | MVP 范围 | 延后项 |
|------|---------|-------|
| E1 | edges 增删 + 画布渲染 + 级联清除 | 连线样式自定义（虚线/箭头样式）、连线标签、批量连线 |
| E2 | 四 Tab 基本字段（text/width/height/target/breakpoints） | Tab 内高级配置（动画曲线、字体族、响应式规则精细化）、批量属性编辑 |
| E3 | 三个设备按钮切换 + breakpoint 状态 + 新节点自动标记 | 断点布局重排（真实多列布局）、断点预览模式（画布内分割线）、断点历史记录 |
| E4 | 图片上传 + AI 解析（≤30s）+ 批量导入 | 草图编辑后重识别、识别结果手动调整、多图片批量导入 |

---

## 用户情绪地图（神技3）

> 关键页面的用户情绪曲线，确保 MVP 功能在情绪高点覆盖

### 页面：原型编辑器（CanvasPage + ProtoEditor）

```
愉悦度
  ↑                    [D]  [E]
  │   [A]                  批量导入成功  属性配置随手改
  │  首次添加连线                   ↗  工具栏设备切换随手点
  │     ↗                       ↗
  │    ↗                       ↗
──┼─────────────────────────────────────────────────────→ 时间/操作
  │                                    [C]  [B]
  │                                   断点切错    找不到属性面板入口
  │                                  画布缩放乱   双击节点无反应
  └─────────────────────────────────────────────────────
                         挫败点              困惑点
```

| 节点 | 情绪 | 触发条件 | 设计响应 |
|------|------|---------|---------|
| A | ➕ 愉悦 | 首次成功添加连线，画布两点间出现箭头 | 连线创建后自动高亮 1.5s，给予正向反馈 |
| B | ➖ 挫败 | 断点切换后画布缩放异常，节点超出容器 | 断点切换前显示过渡动画，切换失败时回退 |
| C | 😕 困惑 | 找不到属性面板入口，或双击无反应 | 双击节点时，面板入口旁显示脉冲动画引导 |
| D | ➕ 愉悦 | Data Tab 修改文字，画布节点实时同步 | 无需保存按钮，字段失焦即生效 |
| E | 😆 超预期 | AI 导入识别到 10+ 组件，批量入画布 | 成功导入时显示「✨ 已导入 N 个组件」toast |

### Specs 四态定义（关键页面）

#### specs/E1-api-chapter.md — FlowTreePanel 连线模块

**理想态**：FlowTreePanel 正常显示页面树，底部有「添加连线」按钮，点击后出现 source/target 选择模态框，连线列表显示所有 edges，每条可点击选中。

**空状态**：页面树为空或只有 1 个页面时，「添加连线」按钮置灰（`disabled`），提示「至少需要 2 个页面才能添加连线」，连线列表显示空。

**加载态**：选择 source 页面后，target 选择中显示 spinner（`aria-busy="true"`），按钮文案变为「加载页面列表...」。

**错误态**：添加连线失败时，模态框顶部显示红色错误横幅「连线创建失败，请重试」，按钮文案恢复为「添加连线」，store.edges 保持不变。

#### specs/E2-business-rules.md — PropertyPanel 组件

**理想态**：右侧 drawer 展开（宽 320px），头部显示节点 ID + 类型标签，四个 Tab（Style/Data/Navigation/Responsive）可见，当前激活 Tab 高亮。表单控件可交互，字段失焦即生效。

**空状态**：无节点选中时，PropertyPanel drawer 关闭或显示空面板占位（`无选中节点`文字 + 示意图）。

**加载态**：节点数据加载中（异步获取节点详情时），Tab 区域显示 skeleton loader，面板不可编辑。

**错误态**：节点数据更新失败时，失败的字段显示红色边框 + 错误提示文字，面板其他部分保持可交互。

#### specs/E3-cross-chapter.md — ProtoEditor 设备切换工具栏

**理想态**：工具栏右侧显示三个设备按钮（📱手机/📱平板/🖥️桌面），当前选中按钮高亮（`aria-pressed="true"`，背景色区分）。点击后画布宽度平滑缩放至目标断点。

**空状态**：breakpoint 未初始化时（`undefined`），默认桌面按钮高亮，三个按钮均可点击。

**加载态**：断点切换中（可能涉及远程样式计算），按钮显示 spinner，容器宽度暂时保持原值。

**错误态**：断点切换失败（如不支持的断点值），工具栏回退到上一有效状态，显示 toast「断点切换失败，已回退」。

#### specs/E4-export.md — ImportPanel 图片上传模块

**理想态**：「上传图片」Tab 下有拖拽上传区域（支持 PNG/JPG/JPEG），上传预览缩略图（≤200px），下方显示「识别到的组件」列表，每项含图标和文字，右下角「确认导入」按钮。

**空状态**：无图片上传时，上传区域显示虚线边框 + 上传图标 + 「拖拽图片或点击上传」文字，支持点击触发文件选择器。

**加载态**：上传成功后，显示进度指示器（0-100%）+ 「正在识别组件...」文字，不可点击确认导入按钮。

**错误态**：识别失败时，上传区域显示红色错误图标 + 「识别失败，请检查图片后重试」文字，提供「重试」按钮；网络错误显示「网络错误，请检查网络连接」。

---

## 执行决策

- **决策**: 已采纳（Analyst 有条件通过）
- **执行项目**: vibex-sprint3-qa
- **执行日期**: 2026-04-25
- **条件**: 本 PRD 阶段必须补充 E1-E5 规格文档（specs/ 目录），将验收标准从 architecture.md 沉淀为独立规格条目

---

*文档版本: 1.0 | PM | 2026-04-25*
