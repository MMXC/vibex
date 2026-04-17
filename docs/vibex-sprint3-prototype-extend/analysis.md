# 需求分析报告 — vibex-sprint3-prototype-extend

**项目**: vibex-sprint3-prototype-extend
**角色**: Analyst
**日期**: 2026-04-17
**状态**: Draft

---

## 执行摘要

Sprint3 在 Sprint1 prototype-canvas 基础上扩展 4 个功能：页面跳转连线、响应式断点、组件属性面板、草图/图片AI导入。技术难度中，核心依赖是 React Flow edges API 和 prototypeStore 已有数据模型。prototypeStore 已完成可复用，figma-import.ts 已存在可扩展，responsive.tsx 已建立断点系统。

**结论: Recommended** — 4 个功能技术可行，prototypeStore 可复用，Sprint1 基础稳固。

---

## 1. 业务场分析

### 1.1 Sprint1 成就（现有基础）

| 功能 | 状态 | 文件 |
|------|------|------|
| React Flow 拖拽画布 | ✅ 已上线 | ProtoFlowCanvas.tsx |
| prototypeStore 状态管理 | ✅ 已上线 | stores/prototypeStore.ts |
| 路由树（三树布局） | ✅ 已上线 | FlowTreePanel.tsx |
| Mock 数据绑定面板 | ✅ 已上线 | MockDataPanel.tsx |
| ImportPanel 导入面板 | ✅ 已上线 | features/ImportPanel.tsx |
| 组件库（10个组件） | ✅ 已上线 | lib/prototypes/ui-schema.ts |
| JSON 导出增强 | ✅ 已上线 | features/ExportMenu.tsx |

**关键发现**: prototypeStore 的 `nodes` 和 `edges`（React Flow）数组已存在，但 `edges` 从未被 UI 填充——这是页面跳转连线的天然切入点。

### 1.2 Sprint3 四个新功能定位

| 功能 | 当前状态 | Sprint3 增量 |
|------|------|------|
| 页面跳转连线 | 路由树仅显示列表，无视觉连接线 | 增加可视化的 edges 连线 + 连线编辑 UI |
| 响应式断点 | responsive.tsx 独立系统，未接入 prototypeStore | 将断点数据模型接入 prototypeStore，画布支持多尺寸预览 |
| 组件属性面板 | E1-U4 Mock 数据 tab 存在，属性面板基础可用 | 扩展为完整的属性面板（含样式/事件/响应式/导航） |
| 草图/图片AI导入 | figma-import.ts 服务存在（仅 Figma URL 解析），未接入 prototypeStore | 增加图像→组件结构 AI 识别 pipeline |

---

## 2. Jobs-To-Be-Done (JTBD)

### JTBD-1: 设计人员用视觉连线表达页面跳转（P0）
- **用户**: 设计人员/产品经理
- **目标**: 在原型画布上用连线表达页面 A → 页面 B 的跳转关系
- **根因**: 当前路由树只是列表，无法直观看到页面间的流向
- **本质**: 将 `prototypeStore.edges` 激活，提供连线创建 + 编辑 + 删除的 UI

### JTBD-2: 前端开发者验证原型在不同设备上的效果（P1）
- **用户**: 前端开发者
- **目标**: 在原型画布中预览页面在不同断点（375px/768px/1024px）下的效果
- **根因**: 当前 responsive.tsx 是样式系统，与 prototypeStore 完全隔离，无法在画布中预览
- **本质**: 在 prototypeStore 增加断点数据模型，画布增加尺寸预览模式

### JTBD-3: 设计师快速配置组件属性而不依赖开发（P0）
- **用户**: 设计师/产品经理
- **目标**: 选中画布节点后，在属性面板中修改所有属性（样式/文字/链接/响应式），所见即所得
- **根因**: E1-U4 的 Mock 数据 tab 功能有限，缺少对导航、样式、响应式的统一配置入口
- **本质**: 重构/扩展 MockDataPanel 为完整的 PropertyPanel（Tabs: 样式/数据/导航/响应式）

### JTBD-4: 非技术用户导入草图快速生成原型（P2）
- **用户**: 设计师/非技术用户
- **目标**: 上传手绘草图或设计截图，AI 自动识别组件结构并导入画布
- **根因**: 当前 ImportPanel 只支持 JSON/Figma URL，用户无法从零开始
- **本质**: 增加 AI 图像识别 pipeline，调用外部 AI 服务（如 GPT-4o Vision），将图像解析为组件节点

---

## 3. 技术方案选项

### 选项 A: 最小增量扩展（推荐）

**思路**: 充分利用 Sprint1 已有资产，在 prototypeStore 基础上增量开发。

| 功能 | 技术方案 | 关键文件 |
|------|---------|---------|
| 页面跳转连线 | React Flow `edges` API，在 FlowTreePanel 增加"添加连线"按钮，在 CanvasPage 增加可视化连线编辑 | prototypeStore（已有 edges）、FlowTreePanel.tsx |
| 响应式断点 | 在 prototypeStore 增加 `breakpoint` 字段（'375'\|'768'\|'1024'），CanvasPage 增加设备尺寸切换工具栏，组件节点响应式缩放 | prototypeStore.ts、CanvasPage.tsx、responsive.tsx |
| 组件属性面板 | 重构 MockDataPanel 为 PropertyPanel，增加 Tabs（样式/数据/导航/响应式），每个 Tab 对应一个子面板 | PropertyPanel.tsx（重构 MockDataPanel.tsx） |
| 草图/图片AI导入 | 扩展 figma-import.ts，新增 `importFromImage(file)` 方法，调用 AI Vision API，解析为 `ComponentNode[]`，通过 prototypeStore.addNode 批量导入 | services/figma/figma-import.ts、ImportPanel.tsx |

**优点**: 复用现有架构，改动范围可控，Sprint1 工程师可快速上手
**缺点**: 响应式断点需要协调 CanvasPage 布局重构，连线编辑 UX 需要仔细设计

### 选项 B: 全新交互范式

**思路**: 用独立 Modal/全屏工具替代增量面板，追求更专业的 UX。

| 功能 | 技术方案 | 关键文件 |
|------|---------|---------|
| 页面跳转连线 | 使用 React Flow 的 `ConnectionLine` + 自定义 `EdgeTypes`，提供拖拽式连线创建 | ProtoFlowCanvas.tsx |
| 响应式断点 | 独立"设备预览模式"（全屏 Modal），与主画布分离 | DevicePreviewModal.tsx |
| 组件属性面板 | 右侧 Drawer 布局，完全独立于现有 MockDataPanel | PropertyDrawer.tsx（新建） |
| 草图/图片AI导入 | 独立的 AI 导入 Wizard（多步骤 Modal） | AIImportWizard.tsx（新建） |

**优点**: UX 更专业，功能边界清晰
**缺点**: 工作量显著增加（~2x），需要重新设计大量 UI 组件，Sprint 内可能无法完成

---

## 4. 可行性评估

| 维度 | 评估 | 说明 |
|------|------|------|
| 复杂度 | 中 | 页面跳转连线和属性面板是纯前端工程；AI 导入是 API + AI pipeline |
| 工期 | 10-14h（推荐选项 A） | 页面跳转连线 3-4h、属性面板 3-4h、响应式断点 2-3h、AI导入 3-4h |
| 依赖 | AI 服务 API key | 图像识别依赖外部 AI 服务，需确认 API 来源 |
| 风险 | 中低 | 响应式断点涉及 CanvasPage 布局重构（911行文件），需要仔细处理 |

### 关键依赖分析

| 依赖项 | 类型 | 影响 | 说明 |
|--------|------|------|------|
| prototypeStore | 已有代码 | 无 | 已完成，可直接扩展 edges 和 breakpoint 字段 |
| React Flow | 依赖库 | 无 | Sprint1 已使用，API 稳定 |
| figma-import.ts | 已有代码 | 低 | 需扩展 `importFromImage()` 方法 |
| responsive.tsx | 已有代码 | 低 | 需与 prototypeStore 集成断点数据 |
| AI 服务 | 外部 API | 中 | 需要确认是 GPT-4o Vision 还是其他服务 |
| CanvasPage.tsx | 已有代码（911行） | 中 | 布局重构风险点，需分区修改避免破坏现有功能 |

---

## 5. 风险矩阵

| 风险 | 可能性 | 影响 | 缓释方案 |
|------|--------|------|---------|
| CanvasPage.tsx 布局重构破坏现有功能 | 中 | 高 | 分区修改，用 feature flag 保护；每次修改后用 gstack browse 验证 |
| AI 图像识别结果质量不可控 | 高 | 中 | 设计为"辅助建议"而非"自动完成"，用户可编辑后再导入 |
| React Flow edges 与现有拖拽事件冲突 | 中 | 中 | edges 只在 FlowTreePanel 管理，与 ProtoFlowCanvas 的节点拖拽完全分离 |
| AI 服务 API 成本/延迟 | 高 | 低 | 设计异步导入，UI 显示 loading 状态，支持取消 |
| 响应式断点与现有组件样式冲突 | 低 | 中 | 优先覆盖，不修改原组件内部样式 |

---

## 6. 工期估算（选项 A）

| 功能 | Epic | Units | 工时 | 优先 |
|------|------|-------|------|------|
| 页面跳转连线 | E1 | E1-U1~E1-U3 | 3-4h | P0 |
| 组件属性面板 | E2 | E2-U1~E2-U2 | 3-4h | P0 |
| 响应式断点 | E3 | E3-U1~E3-U2 | 2-3h | P1 |
| 草图/图片AI导入 | E4 | E4-U1~E4-U2 | 3-4h | P2 |
| **合计** | | | **11-15h** | |

**建议**: P0 两个 Epic 可在 Sprint3 完成；E3+E4 视工期可顺延。

---

## 7. 验收标准

### Sprint3 整体验收

- [ ] prototypeStore 包含 edges 和 breakpoint 状态
- [ ] 页面跳转连线可在 FlowTreePanel 创建和删除
- [ ] 画布显示节点间可视化连线
- [ ] 属性面板支持节点样式/数据/导航/响应式四个 Tab
- [ ] 响应式断点切换在画布中生效（节点缩放）
- [ ] AI 导入 pipeline 可处理图片并输出节点（即使不完美）
- [ ] gstack browse 验证：所有新 UI 无 console.error

### 页面跳转连线验收

- [ ] E1-AC1: 在 FlowTreePanel 点击"添加连线"→选择源页面→选择目标页面→画布出现 edge
- [ ] E1-AC2: 点击 edge 可选中并删除
- [ ] E1-AC3: 页面删除时相关 edge 自动清除

### 组件属性面板验收

- [ ] E2-AC1: 双击画布节点 → 右侧面板打开，显示节点 ID 和类型
- [ ] E2-AC2: 修改文字属性 → 画布节点实时更新
- [ ] E2-AC3: 切换到"导航"Tab → 可设置页面跳转 target
- [ ] E2-AC4: 切换到"响应式"Tab → 可设置该节点的断点显示规则

### 响应式断点验收

- [ ] E3-AC1: CanvasPage 工具栏显示设备切换按钮（手机/平板/桌面）
- [ ] E3-AC2: 点击"手机"→画布宽度缩放至 375px 预览
- [ ] E3-AC3: 在 375px 模式下新增的组件自动标记为"仅移动端"

### AI 导入验收

- [ ] E4-AC1: ImportPanel 显示"上传图片"入口（支持 PNG/JPG）
- [ ] E4-AC2: 上传图片后，AI 解析并显示"识别到的组件"列表
- [ ] E4-AC3: 用户确认后，识别结果导入画布成为节点

---

## 8. 执行决策

- **决策**: 推荐（选项 A）
- **执行项目**: vibex-sprint3-prototype-extend
- **执行日期**: 待定
- **建议**: E1（页面跳转连线）和 E2（属性面板）为 P0，优先完成；E3（响应式断点）为 P1；E4（AI导入）为 P2 可延后
