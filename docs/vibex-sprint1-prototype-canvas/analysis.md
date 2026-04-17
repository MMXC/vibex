# 需求分析报告 — vibex-sprint1-prototype-canvas

**项目**: vibex-sprint1-prototype-canvas
**角色**: Analyst
**日期**: 2026-04-17
**主题**: 可视化原型画布（拖拽布局 + Mock数据 + 路由树 + JSON导出）
**状态**: ⚠️ 有条件推荐（需澄清 Mock数据边界）

---

## 执行决策

- **决策**: 有条件推荐
- **执行项目**: vibex-sprint1-prototype-canvas
- **执行日期**: 待定
- **备注**: Mock数据需求边界模糊，需 PM 在 Sprint 开始前确认"Mock数据的来源和使用场景"

---

## 0. Research 结果摘要

### 历史经验（Learnings）

| 经验 | 内容 | 与本需求关联 |
|------|------|-------------|
| `learnings/canvas-testing-strategy.md` | Canvas hooks 测试策略；hook 与 API 集成需先验证接口匹配性 | ⚠️ 新增 prototype hook 应遵循同一策略 |
| `learnings/canvas-api-completion.md` | Canvas Flows CRUD + Snapshot API 已实现；导入导出 schema 设计需考虑向后兼容 | ✅ UI Schema 已有完整导出格式，与 Snapshot 兼容 |
| `learnings/canvas-cors-preflight-500.md` | CORS preflight 问题修复经验 | ✅ API 层无 CORS 风险 |

**关键教训**: 新增任何 hook 应先建立 mockStore 测试策略，避免 mockStore 过于简化导致测试失真（见 `learnings/canvas-testing-strategy.md`）。

### Git History 分析

| 区域 | 现状 | 说明 |
|------|------|------|
| `lib/prototypes/ui-schema.ts` | ✅ 完整实现 | 包含 UIComponent/UIPage/UISchema 完整类型、validation、CRUD 操作、默认组件库（10 个） |
| `services/api/modules/prototype.ts` | ✅ 部分实现 | Prototype API 模块（getSnapshot/create/update/delete）已有基础设施 |
| `components/prototype/PrototypeExporter.tsx` | ✅ 已有导出组件 | ExportMenu 可复用或扩展 |
| `/app/prototype/editor/` | ⚠️ 目录存在，文件少 | 拖拽编辑器尚未完整实现 |
| `lib/prototypes/renderer.ts` | ✅ 有子模块拆分 | renderer/types, renderer/style-utils, renderer/theme-resolver |

**无发现踩坑**: prototype 相关代码库较新，历史包袱少。

---

## 1. 业务场景分析

### 要解决的核心问题

**本质**: 将 DDD 建模产出的限界上下文、业务流程、组件树，转化为可交互的可视化原型，并支持 Mock数据绑定、页面路由可视化、JSON导出。

现有系统已有：
- DDD Canvas（三树：上下文/流程/组件）
- UI Schema（完整的数据模型）
- 原型编辑器骨架（`/app/prototype/editor/`）

缺失：
- **拖拽布局编辑器**: 将 UI Schema 组件拖入画布并布局
- **Mock数据绑定**: 给组件绑定 Mock 数据源
- **路由树可视化**: 展示多页面之间的导航关系
- **JSON导出增强**: 导出包含 Mock数据绑定和路由关系

### 目标用户

| 用户 | 场景 |
|------|------|
| PM | 快速生成可交互原型，向团队演示需求 |
| 前端工程师 | 参照原型和 Mock数据开始开发 |
| 全栈工程师 | 导出 JSON 供后端或其他工具使用 |

### JTBD

| # | JTBD | 优先级 |
|---|------|--------|
| J1 | 我要通过拖拽将 UI 组件放到画布上，生成页面布局 | 🔴 P0 |
| J2 | 我要给组件绑定 Mock数据（列表数据、表单数据等），看到渲染效果 | 🟠 P1 |
| J3 | 我要看到页面之间的导航关系（路由树），知道原型有多少页面 | 🟠 P1 |
| J4 | 我要把整个原型导出为 JSON，供其他工具使用或存档 | 🟡 P2 |

---

## 2. 需求澄清要求

⚠️ **以下边界模糊，必须在 Sprint 开始前确认**:

### Mock数据（MVP 边界）

**模糊点**: "Mock数据"可以理解为多种实现路径：

| 方案 | 描述 | 工作量差异 |
|------|------|-----------|
| A: 组件内嵌 Mock | 每个组件内声明静态 Mock props（如 `data = [{name: 'Alice'}]`） | 0.5h |
| B: 独立 Mock Store | 全局 Mock 数据源，组件按 ID 引用 | 2h |
| C: JSON 导入 Mock | 从外部 JSON 文件导入 Mock 数据集 | 1.5h |

**推荐**: 方案 A（内嵌 Mock）作为 MVP，方案 B/C 作为后续迭代。**必须 PM 确认，否则无法估算工时**。

### 路由树（边界）

**模糊点**: "路由树"的展示形式：

| 方案 | 描述 |
|------|------|
| A: 页面列表视图 | 简单列表，展示所有页面 route |
| B: 树形视图 | 展示页面层级关系（父/子路由） |
| C: 完整 DAG | 展示页面间所有导航关系（含条件路由） |

**推荐**: 方案 A 作为 MVP（Sprint 1 先做最基础的页面导航列表）。

---

## 3. 技术方案

### 3.1 拖拽布局编辑器

#### 推荐方案: 复用 React Flow + 现有 UI Schema

**架构**:
```
UI Schema (lib/prototypes/ui-schema.ts)
    ↓ 已有完整类型定义
PrototypeCanvas (components/prototype/PrototypeCanvas.tsx) [新建]
    ↓ 使用 React Flow
DragDropCanvas (react-flow + 自定义节点) [新建]
    ↓ 存储在 Zustand prototypeStore
prototypeStore (stores/prototypeStore.ts) [扩展]
```

**关键设计决策**:

1. **组件来源**: 使用 `DEFAULT_COMPONENTS`（10 个默认组件）+ Canvas 三树产出的组件节点
2. **布局算法**: MVP 使用自由拖拽（无自动布局算法），后续迭代考虑 dagre/elk
3. **节点数据**: React Flow 自定义节点使用 `UIComponent` 作为 data payload

```typescript
// 自定义 React Flow 节点
interface ProtoNodeData {
  component: UIComponent;       // 来自 UI Schema
  mockData?: MockDataBinding;   // 可选 Mock 数据绑定
}
```

#### 驳回方案: 从零实现拖拽

**驳回理由**: `react-flow` 已在 Canvas 使用，有成熟模式；从零实现拖拽引擎工作量大且风险高。

---

### 3.2 Mock数据绑定

#### MVP 方案: 组件内嵌 Mock（方案 A）

```typescript
// Mock数据内嵌在组件实例中
interface ProtoNodeData {
  component: UIComponent;
  mockData?: {
    // 组件级内嵌 Mock
    data?: Record<string, any>;
    source?: 'inline' | 'store' | 'imported';
  };
}
```

**用户交互**: 在组件属性面板中提供 "Mock数据" tab，允许用户输入/编辑 Mock JSON。

**扩展路径**（不包含在 MVP）:
- 方案 B: 全局 Mock Store (`useMockDataStore`)
- 方案 C: JSON 文件导入 (`import MockDataSet from './mocks/users.json'`)

---

### 3.3 路由树

#### MVP 方案: 简单页面列表（方案 A）

```typescript
// UIPage.route 已在 UI Schema 中定义
// 路由树 = 所有 UIPage 的 route 列表 + 依赖关系推导
interface RoutingTree {
  pages: Array<{
    pageId: string;
    route: string;
    parentRoute?: string;  // 从 route 路径推导（如 /users/:id 的 parent 是 /users）
  }>;
}
```

**UI**: 左侧抽屉展示页面列表，点击页面可跳转到画布上的对应节点。

---

### 3.4 JSON导出增强

**已有基础设施**:
- `PrototypeExporter.tsx` (components/prototype/)
- ExportMenu (components/canvas/features/ExportMenu.tsx) — 已支持 PNG/SVG/JSON
- UI Schema 有 `cloneUISchema()`、`findComponentById()`、`addComponentToPage()`、`removeComponentFromPage()`

**增强点**: 现有导出仅导出 UI Schema 结构，需**增强包含 Mock数据绑定和路由关系**：

```typescript
// 增强后的导出格式
interface EnhancedPrototypeExport {
  version: '2.0';              // 版本升级，兼容 v1.0
  schema: UISchema;            // 现有 UI Schema
  routingTree: RoutingTree;    // 新增：路由树
  mockDataBindings: MockDataBinding[]; // 新增：Mock数据绑定
  exportedAt: string;
  metadata: {
    author?: string;
    projectId?: string;
  };
}
```

**向后兼容**: 导出的 JSON 可以导入到 v1.0 系统（忽略 v2.0 额外字段）。

---

## 4. 可行性评估

| 功能 | 可行性 | 技术难度 | 依赖 | 工时估算 |
|------|--------|---------|------|---------|
| 拖拽布局编辑器 | ✅ 高 | 中 | React Flow（已有）| 4h |
| Mock数据绑定（MVP） | ✅ 高 | 低 | UI Schema（已有）| 1h |
| 路由树（MVP） | ✅ 高 | 低 | UI Schema（已有）| 1h |
| JSON导出增强 | ✅ 高 | 低 | UI Schema + ExportMenu（已有）| 1.5h |
| UI Schema 组件库完善 | ✅ 高 | 低 | 已有 10 个组件 | 0.5h |

**总工时**: 8h（MVP，含 buffer）

---

## 5. 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解 |
|------|--------|------|------|------|
| PM 未澄清 Mock数据边界 | 高 | 中 | 🔴 高 | 驳回：要求 PM Sprint 前确认方案 A/B/C |
| React Flow 自定义节点与 UI Schema 类型不匹配 | 低 | 高 | 🟢 低 | 先定义 `ProtoNodeData` 接口，再开发 |
| Mock数据量大导致 JSON 导出超过 Canvas 的 5MB 限制 | 中 | 低 | 🟡 中 | 导出前检查大小，超限给出警告 |
| prototypeStore 与 canvasStore 数据共享策略不明 | 中 | 中 | 🟡 中 | prototype 作为独立 store，通过 projectId 关联 |

---

## 6. 验收标准（具体可测试）

### V1 — 拖拽布局
- [ ] 从组件面板拖拽组件到画布，画布上显示对应节点（React Flow 自定义节点）
- [ ] 拖入的节点数据为有效的 `UIComponent`（可通过 `validateUIComponent()` 验证）
- [ ] 双击节点打开属性面板，可编辑 props
- [ ] 节点可拖动定位，位置随拖动更新

### V2 — Mock数据绑定
- [ ] 组件属性面板中有 "Mock数据" tab
- [ ] 输入 Mock JSON 后，画布上组件显示对应 Mock 数据（如列表渲染）
- [ ] Mock数据随组件实例保存（刷新页面后保留）

### V3 — 路由树
- [ ] 侧边抽屉显示项目中所有页面的 route 列表
- [ ] 点击 route 列表项，画布跳转到对应节点
- [ ] route 变化时（添加/删除页面）路由树自动更新

### V4 — JSON导出增强
- [ ] 导出 JSON 包含 `version: '2.0'`、`routingTree`、`mockDataBindings` 字段
- [ ] 导出的 JSON 可被 `validateUISchema()` 验证通过
- [ ] 导出的 JSON 可重新导入，数据无损（round-trip，含 Mock数据）

### V5 — 组件库
- [ ] 拖拽面板显示 10 个默认组件（Button/Input/Card/Container/Header/Navigation/Modal/Table/Form/Image）
- [ ] 每个组件拖入画布后渲染为正确的 UI（通过 screenshot 对比）

---

## 7. 驳回条件

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Mock数据边界未澄清 | ⚠️ 警告 | 影响工时估算准确性 |
| 需求模糊无法实现 | ✅ 通过 | 四个功能点均可描述清楚 |
| 未执行 Research | ✅ 通过 | git history + learnings 分析已完成 |

---

*Analyst Agent | 2026-04-17*
