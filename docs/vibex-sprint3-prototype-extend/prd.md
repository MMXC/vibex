# PRD — vibex-sprint3-prototype-extend
# Vibex Sprint3 原型扩展功能 PRD

**项目**: vibex-sprint3-prototype-extend
**版本**: 1.0
**日期**: 2026-04-17
**状态**: Draft
**作者**: PM
**基于**: analysis.md (Analyst, 2026-04-17)

---

## 执行决策

| 字段 | 内容 |
|------|------|
| **决策** | 推荐（选项 A — 最小增量扩展） |
| **执行项目** | vibex-sprint3-prototype-extend |
| **执行日期** | 待定 |
| **技术方案** | 充分利用 Sprint1 已有资产，在 prototypeStore 基础上增量开发 |
| **优先级建议** | E1 + E2 = P0，优先完成；E3 = P1；E4 = P2 可延后 |

---

## 1. 用户故事

### US-E1: 页面跳转连线
**作为** 设计人员/产品经理
**我想要** 在原型画布上用可视化连线表达页面 A → 页面 B 的跳转关系
**以便** 直观看到页面间的流向，无需手动描述跳转逻辑

**背景**: 当前 FlowTreePanel 只显示页面列表，无法直观看到页面间的流向。prototypeStore 的 `edges` 数组存在但从未被 UI 填充。

---

### US-E2: 组件属性面板
**作为** 设计师/产品经理
**我想要** 选中画布节点后，在右侧属性面板中配置所有属性（样式/数据/导航/响应式），所见即所得
**以便** 快速调整组件属性而不依赖开发人员

**背景**: E1-U4 的 Mock 数据 tab 功能有限，缺少对导航、样式、响应式的统一配置入口。需要重构 MockDataPanel 为完整的 PropertyPanel。

---

### US-E3: 响应式断点预览
**作为** 前端开发者
**我想要** 在原型画布中预览页面在不同断点（375px/768px/1024px）下的效果
**以便** 在开发前验证原型在不同设备上的呈现

**背景**: 当前 responsive.tsx 是独立样式系统，与 prototypeStore 完全隔离，无法在画布中预览真实效果。

---

### US-E4: AI 草图/图片导入
**作为** 设计师/非技术用户
**我想要** 上传手绘草图或设计截图，AI 自动识别组件结构并导入画布
**以便** 从零快速生成原型，无需手动逐个添加组件

**背景**: 当前 ImportPanel 只支持 JSON/Figma URL，用户无法从零开始。figma-import.ts 服务存在，可扩展增加图像识别能力。

---

## 2. 功能列表（Epic & User Story Mapping）

### E1: 页面跳转连线（Epic 1）
> **优先级**: P0 | **工时**: 3-4h

| ID | 功能描述 | 类型 |
|----|---------|------|
| E1-U1 | FlowTreePanel 增加「添加连线」按钮，支持选择源页面和目标页面 | Feature |
| E1-U2 | 画布（ProtoFlowCanvas）渲染节点间可视化连线，支持选中和高亮 | Feature |
| E1-U3 | 连线可被选中、删除；页面删除时相关 edge 自动清除 | Feature |

---

### E2: 组件属性面板（Epic 2）
> **优先级**: P0 | **工时**: 3-4h

| ID | 功能描述 | 类型 |
|----|---------|------|
| E2-U1 | 双击画布节点 → 右侧 PropertyPanel 打开，显示节点 ID、类型、基本属性 | Feature |
| E2-U2 | PropertyPanel 分 Tab：样式（Style）、数据（Data）、导航（Navigation）、响应式（Responsive） | Feature |

---

### E3: 响应式断点（Epic 3）
> **优先级**: P1 | **工时**: 2-3h

| ID | 功能描述 | 类型 |
|----|---------|------|
| E3-U1 | CanvasPage 工具栏增加设备切换按钮（手机/平板/桌面），点击后画布缩放至对应宽度 | Feature |
| E3-U2 | 在特定断点下新增组件时，自动标记该节点的断点显示规则 | Feature |

---

### E4: AI 草图导入（Epic 4）
> **优先级**: P2 | **工时**: 3-4h

| ID | 功能描述 | 类型 |
|----|---------|------|
| E4-U1 | ImportPanel 增加「上传图片」入口，支持 PNG/JPG，触发 AI 识别 pipeline | Feature |
| E4-U2 | AI 解析后显示「识别到的组件」列表，用户确认后批量导入画布 | Feature |

---

## 3. 验收标准

### E1: 页面跳转连线

#### E1-AC1: 添加连线
- **Input**: 在 FlowTreePanel 点击「添加连线」按钮 → 选择源页面节点 → 选择目标页面节点
- **Expected Output**: 
  - prototypeStore.edges 中新增一条 `{ id, source, target, type: 'smoothstep' }` 记录
  - 画布上两点之间出现可视化连线（箭头指向目标）
  - FlowTreePanel 中连线列表同步更新
- **页面集成标注**: `FlowTreePanel.tsx`（创建 edge），`ProtoFlowCanvas.tsx`（渲染 edge），`prototypeStore.ts`（edges 状态）

#### E1-AC2: 选中并删除连线
- **Input**: 点击画布上的连线 → 连线高亮 → 点击删除按钮或按 Delete 键
- **Expected Output**: 
  - 该 edge 从 prototypeStore.edges 中移除
  - 画布上连线消失
  - FlowTreePanel 连线列表同步移除
- **页面集成标注**: `ProtoFlowCanvas.tsx`（edge 选择），`prototypeStore.ts`（edges 更新）

#### E1-AC3: 页面删除时相关 edge 自动清除
- **Input**: 删除某个页面节点（调用 prototypeStore.removeNode）
- **Expected Output**: 
  - 该节点及其所有 source/target 关联的 edges 均被清除
  - 画布上相关连线消失
  - `expect(prototypeStore.edges.filter(e => e.source === nodeId || e.target === nodeId)).toHaveLength(0)`
- **页面集成标注**: `prototypeStore.ts`（removeNode 逻辑扩展）

---

### E2: 组件属性面板

#### E2-AC1: 双击节点打开属性面板
- **Input**: 双击画布中的任意节点
- **Expected Output**: 
  - 右侧 PropertyPanel 展开（宽 320px drawer）
  - 面板头部显示节点 ID 和类型标签（如 `NODE_001 / Button`）
  - `expect(screen.queryByText(/NODE_001/)).toBeInTheDocument()`
- **页面集成标注**: `ProtoFlowCanvas.tsx`（双击事件），`PropertyPanel.tsx`（新建，重构自 MockDataPanel.tsx）

#### E2-AC2: 修改文字属性，画布节点实时更新
- **Input**: 在 PropertyPanel 的 Data Tab 输入框中修改 `text` 字段 → 按 Enter 或失焦
- **Expected Output**: 
  - 画布对应节点的 label/text 属性实时更新
  - `expect(store.nodes.find(n => n.id === 'NODE_001').data.text).toBe('new value')`
- **页面集成标注**: `PropertyPanel.tsx`（输入控件），`prototypeStore.ts`（节点数据更新）

#### E2-AC3: 导航 Tab 设置页面跳转 target
- **Input**: 切换到 Navigation Tab → 选择 target 页面下拉框
- **Expected Output**: 
  - 选中节点的 `navigation.target` 字段更新
  - 同时在 prototypeStore.edges 中生成或更新对应 edge
- **页面集成标注**: `PropertyPanel.tsx`（Navigation Tab），`prototypeStore.ts`（edges 联动）

#### E2-AC4: 响应式 Tab 设置断点显示规则
- **Input**: 切换到 Responsive Tab → 选择断点可见性（手机/平板/桌面）
- **Expected Output**: 
  - 选中节点的 `breakpoints` 字段更新（如 `{ mobile: true, tablet: false, desktop: true }`）
  - `expect(store.nodes.find(n => n.id === 'NODE_001').breakpoints.mobile).toBe(true)`
- **页面集成标注**: `PropertyPanel.tsx`（Responsive Tab），`prototypeStore.ts`（断点数据）

---

### E3: 响应式断点

#### E3-AC1: 设备切换工具栏按钮
- **Input**: 访问 CanvasPage，查看工具栏区域
- **Expected Output**: 
  - 工具栏显示 3 个设备按钮：📱 手机（375px）、📱 平板（768px）、🖥️ 桌面（1024px）
  - 当前选中设备按钮高亮
  - `expect(screen.getByLabelText(/手机/)).toBeInTheDocument()`
- **页面集成标注**: `CanvasPage.tsx`（工具栏区域，911行文件，分区修改）

#### E3-AC2: 切换断点，画布宽度缩放
- **Input**: 点击「手机」按钮
- **Expected Output**: 
  - 画布容器宽度缩放至 375px
  - 节点组件应用 responsive 缩放样式
  - prototypeStore.breakpoint 字段更新为 `'375'`
  - `expect(store.breakpoint).toBe('375')`
- **页面集成标注**: `CanvasPage.tsx`（断点切换逻辑），`responsive.tsx`（缩放样式），`prototypeStore.ts`（breakpoint 状态）

#### E3-AC3: 特定断点下新增组件自动标记
- **Input**: 在 375px（手机）断点下，从组件库拖拽新组件到画布
- **Expected Output**: 
  - 新节点自动设置 `breakpoints: { mobile: true, tablet: false, desktop: false }`
  - `expect(newNode.breakpoints.mobile).toBe(true)`
  - `expect(newNode.breakpoints.tablet).toBe(false)`
- **页面集成标注**: `prototypeStore.ts`（addNode 逻辑扩展），`ProtoFlowCanvas.tsx`（拖拽新建节点）

---

### E4: AI 草图导入

#### E4-AC1: 上传图片入口
- **Input**: 打开 ImportPanel，点击「上传图片」Tab，支持拖拽或点击上传 PNG/JPG/JPEG 文件
- **Expected Output**: 
  - 文件选择器接受 `.png, .jpg, .jpeg` 格式
  - 上传后显示图片预览缩略图（200x200 内）
  - `expect(screen.getByRole('button', { name: /上传图片/ })).toBeInTheDocument()`
- **页面集成标注**: `ImportPanel.tsx`（图片上传 Tab），`services/figma/figma-import.ts`（文件处理）

#### E4-AC2: AI 解析并显示识别组件列表
- **Input**: 上传图片后，AI Vision API 开始解析（显示 loading 状态，≤30s 内返回）
- **Expected Output**: 
  - Loading 状态显示「正在识别组件...」
  - 解析完成后，列表展示识别到的组件（如「Button x2」「Input x1」「Card x1」）
  - 每个组件可预览图标和文字
  - 错误时显示「识别失败，请重试」并提供重试按钮
- **页面集成标注**: `services/figma/figma-import.ts`（新增 `importFromImage()` 方法），`ImportPanel.tsx`（解析结果展示）

#### E4-AC3: 确认导入，组件批量入画布
- **Input**: 在识别结果列表中点击「确认导入」按钮
- **Expected Output**: 
  - 识别到的 ComponentNode 数组通过 `prototypeStore.addNodes()` 批量导入
  - 画布自动平铺显示所有新节点
  - 导入完成后显示「成功导入 N 个组件」
  - `expect(store.nodes.length).toBeGreaterThan(previousCount)`
- **页面集成标注**: `prototypeStore.ts`（新增 `addNodes()` 方法），`ProtoFlowCanvas.tsx`（节点渲染）

---

## 4. 优先级矩阵（RICE 评分）

| Epic | Reach（季度用户数） | Impact（用户影响度） | Confidence（置信度） | Effort（人周） | **RICE** | **优先级** |
|------|-------------------|--------------------|--------------------|---------------|---------|---------|
| E1 页面跳转连线 | 20 | 1.0（高） | 80% | 0.15（3-4h） | 20 × 1.0 × 80% ÷ 0.15 = **106.7** | **P0** |
| E2 组件属性面板 | 20 | 1.0（高） | 80% | 0.15（3-4h） | 20 × 1.0 × 80% ÷ 0.15 = **106.7** | **P0** |
| E3 响应式断点 | 15 | 0.5（中） | 70% | 0.10（2-3h） | 15 × 0.5 × 70% ÷ 0.10 = **52.5** | **P1** |
| E4 AI草图导入 | 10 | 0.5（中） | 50%（AI 质量不确定） | 0.15（3-4h） | 10 × 0.5 × 50% ÷ 0.15 = **16.7** | **P2** |

**说明**:
- Reach 假设目标用户为设计团队（5人）× 每季度 4 个项目
- E4 Confidence 较低，因 AI 识别质量不可控，缓释策略为设计为「辅助建议」模式
- E1 和 E2 RICE 分数相同，并列 P0，同步开发

---

## 5. 依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                     Sprint1 现有资产                         │
├─────────────────────────────────────────────────────────────┤
│  prototypeStore.ts  ──── 核心状态（nodes, edges, breakpoint）│
│  ProtoFlowCanvas.tsx ─── 画布渲染（React Flow）              │
│  FlowTreePanel.tsx   ─── 路由树面板                          │
│  MockDataPanel.tsx   ─── 属性面板前身（待重构）              │
│  ImportPanel.tsx     ─── 导入面板（待扩展）                  │
│  responsive.tsx      ─── 断点样式系统                        │
│  services/figma/    ─── Figma 导入服务（待扩展）             │
│    figma-import.ts                                      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬──────────────┐
              ▼               ▼               ▼              ▼
         ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
         │   E1    │    │   E2    │    │   E3    │    │   E4    │
         │页面跳转连线│    │属性面板   │    │响应式断点│    │AI导入   │
         │(P0)     │    │(P0)     │    │(P1)     │    │(P2)     │
         └────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
              │               │               │               │
              ▼               ▼               ▼               ▼
    FlowTreePanel   PropertyPanel    CanvasPage      figma-import.ts
    (add edge)     (rebuild from    (toolbar +        (importFromImage)
                     MockDataPanel)  breakpoint)         + ImportPanel
```

### 关键依赖链路

| 依赖方向 | 类型 | 说明 |
|---------|------|------|
| prototypeStore → E1-U1~E1-U3 | 强依赖 | edges 数组需在 prototypeStore 中定义并暴露 addEdge/removeEdge 方法 |
| prototypeStore → E2-U1~E2-U2 | 强依赖 | 节点选中状态和属性更新依赖 prototypeStore |
| prototypeStore → E3-U1~E3-U2 | 强依赖 | breakpoint 字段需在 prototypeStore 中定义 |
| prototypeStore → E4-U1~E4-U2 | 强依赖 | addNodes() 方法需在 prototypeStore 中新增 |
| CanvasPage → E3-U1 | 中依赖 | CanvasPage（911行）工具栏分区修改，需用 feature flag 保护 |
| figma-import.ts → E4-U1~E4-U2 | 中依赖 | 需扩展 importFromImage()，新增 AI Vision API 调用 |
| AI 服务 API → E4 | 外部依赖 | 需确认使用 GPT-4o Vision 或其他服务（**TBD**） |

---

## 6. Definition of Done

### Sprint3 全局 DoD

- [ ] **代码**: 所有新增文件通过 ESLint（零 error，允许 warn）
- [ ] **测试**: 每个 Epic 至少有一个自动化测试覆盖核心逻辑
  - E1: `edges` 增删逻辑的 unit test（≥3 cases）
  - E2: 属性面板表单更新的 unit test（≥3 cases）
  - E3: 断点切换 reducer 的 unit test（≥3 cases）
  - E4: `importFromImage()` mock 测试（AI 返回结构解析）
- [ ] **验证**: gstack browse 自动化测试
  - [ ] ImportPanel 图片上传入口可见（E4）
  - [ ] PropertyPanel 四个 Tab 可切换（E2）
  - [ ] 设备切换按钮存在且可点击（E3）
  - [ ] 页面加载无 console.error（`BROWSE_SERVER_SCRIPT` + `is visible` 断言）
- [ ] **文档**: 更新 `docs/` 目录下相关文档
  - [ ] 更新 `docs/prd/vibex-sprint3-prototype-extend/` 目录结构说明（TBD）
  - [ ] 新增 `PropertyPanel.tsx` API 说明（TBD）
  - [ ] 新增 `figma-import.ts` AI 导入 API 说明（TBD）
- [ ] **发布**: feature flag 控制，渐进上线
- [ ] **无回归**: Sprint1 所有功能在 gstack browse 测试中保持通过

### Epic 级别 DoD

#### E1 DoD
- [ ] FlowTreePanel「添加连线」按钮可见且可交互
- [ ] 连线创建后画布上正确渲染（React Flow edge）
- [ ] 连线可被选中并删除
- [ ] 页面节点删除后，相关 edges 自动清除
- [ ] 单元测试覆盖 edges CRUD 操作

#### E2 DoD
- [ ] 双击节点，PropertyPanel 展开并显示节点信息
- [ ] Data Tab 修改文字，画布节点实时更新
- [ ] Navigation Tab 设置 target，自动生成/更新 edge
- [ ] Responsive Tab 设置断点规则，节点属性正确更新
- [ ] 单元测试覆盖属性更新逻辑

#### E3 DoD
- [ ] CanvasPage 工具栏显示手机/平板/桌面切换按钮
- [ ] 点击设备按钮，画布宽度正确切换（375/768/1024px）
- [ ] prototypeStore.breakpoint 状态正确更新
- [ ] 在特定断点下新增节点，自动标记断点属性
- [ ] 单元测试覆盖断点 reducer

#### E4 DoD
- [ ] ImportPanel 支持 PNG/JPG/JPEG 上传
- [ ] 上传后显示 loading → 解析结果列表
- [ ] 确认导入后，节点批量出现在画布
- [ ] AI 服务不可用时，显示友好错误提示
- [ ] mock 测试覆盖 AI 解析结果结构

---

## 7. Sprint 范围与排期

### 总工时估算
> 基于 analysis.md 选项 A 工期分析

| Epic | 功能 | 估算工时 | 实际工时（待填） | 开发者 |
|------|------|---------|---------------|-------|
| E1 页面跳转连线 | E1-U1 添加连线 UI | 1.5h | | |
| E1 页面跳转连线 | E1-U2 画布连线渲染 | 1.5h | | |
| E1 页面跳转连线 | E1-U3 连线删除与级联清除 | 1h | | |
| **E1 小计** | | **3-4h** | | |
| E2 组件属性面板 | E2-U1 PropertyPanel 基础（重构 MockDataPanel） | 2h | | |
| E2 组件属性面板 | E2-U2 四 Tab 实现（样式/数据/导航/响应式） | 2h | | |
| **E2 小计** | | **3-4h** | | |
| E3 响应式断点 | E3-U1 设备切换工具栏 | 1.5h | | |
| E3 响应式断点 | E3-U2 断点自动标记 | 1h | | |
| **E3 小计** | | **2-3h** | | |
| E4 AI 草图导入 | E4-U1 图片上传 + AI 解析 | 2h | | |
| E4 AI 草图导入 | E4-U2 识别结果确认导入 | 1.5h | | |
| **E4 小计** | | **3-4h** | | |
| **合计** | | **11-15h** | | |

### Sprint 排期建议

假设 Sprint 周期为 2 周（10 个工作日，每天 1.5h 投入）：

| Day | 上午 | 下午 |
|-----|------|------|
| Day 1 | E1-U1 + E1-U2（页面跳转连线） | E1-U3 + PR review |
| Day 2 | E2-U1（PropertyPanel 重构） | E2-U2 Tab 实现 |
| Day 3 | E2 收尾 + QA 测试 | E3-U1 设备切换工具栏 |
| Day 4 | E3-U2 断点标记 + E3 QA | E4-U1 图片上传 + AI pipeline |
| Day 5 | E4-U2 确认导入 + E4 QA | 全局回归测试 + gstack browse 验证 |

**说明**: 
- E1 + E2 为 P0，确保在 Day 3 前完成
- E3 为 P1，Day 3-4 专注
- E4 为 P2，若工期紧张可延至下个 Sprint
- CanvasPage.tsx（911行）修改需分区进行，每次修改后用 gstack browse 验证

---

## 附录

### TBD 项（待确认）

| 项 | 说明 | 负责人 |
|----|------|-------|
| AI 服务提供商 | 使用 GPT-4o Vision 还是其他服务 | 待定 |
| AI API Key | 是否已有可用的 AI 服务凭证 | 待定 |
| CanvasPage 分区策略 | 具体在哪些行区间插入设备切换工具栏 | Architect |
| PropertyPanel 交互规范 | Tab 切换动画、字段校验规则 | Design |
| E4 识别准确率 SLO | AI 识别失败率可接受阈值 | Product |

### 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `stores/prototypeStore.ts` | 新增 edges、breakpoint 状态，addEdge/removeEdge/addNodes 方法 |
| 新建 | `components/PropertyPanel.tsx` | 重构自 MockDataPanel.tsx |
| 修改 | `components/FlowTreePanel.tsx` | 增加「添加连线」UI |
| 修改 | `components/ProtoFlowCanvas.tsx` | edge 可视化渲染、双击事件 |
| 修改 | `pages/CanvasPage.tsx` | 设备切换工具栏（911行，分区修改） |
| 修改 | `features/ImportPanel.tsx` | 增加「上传图片」Tab |
| 新建 | `services/figma/image-import.ts` | 扩展自 figma-import.ts，新增 importFromImage() |
| 修改 | `lib/prototypes/responsive.tsx` | 与 prototypeStore 断点数据集成 |
