# 需求分析报告 — vibex-sprint2-spec-canvas

**项目**: vibex-sprint2-spec-canvas
**角色**: Analyst
**日期**: 2026-04-17
**主题**: Spec Canvas — 详细设计规范画布（多章节卡片 + 横向滚奏 + AI草稿）
**状态**: ✅ 推荐（有条件）

---

## 执行决策

- **决策**: 推荐
- **执行项目**: vibex-sprint2-spec-canvas
- **执行日期**: 待定
- **备注**: 与 `vibex-sprint2-20260415`（E1-E4：Tab State/VersionHistory/Import-Export/Persistence）并行推进，两者是不同维度的功能，前者优化现有 Canvas，后者构建新 Spec Canvas

---

## 0. 与 `vibex-sprint2-20260415` 的关系

| 项目 | 范围 | 关系 |
|------|------|------|
| `vibex-sprint2-20260415` | 现有 Canvas 功能增强（Tab State/版本历史/导入导出/持久化） | 并行独立 |
| `vibex-sprint2-spec-canvas` | Spec Canvas 新功能（多章节卡片/横向滚奏/AI草稿） | 并行独立 |

两个项目可以同时进行，**无依赖关系**，共享 React Flow 和 Zustand 技术栈。

---

## 1. 业务场景分析

### 要解决的核心问题

**本质**: 为 VibeX 构建详细设计规范画布（Spec Canvas），将工程文档（需求/上下文/流程）从离散文件转化为结构化卡片，支持 AI 辅助生成，并通过横向滚奏布局管理多章节。

**与 Prototype Canvas（Sprint 1）的区别**:

| 维度 | Prototype Canvas | Spec Canvas |
|------|-----------------|-------------|
| 目的 | 生成可交互 UI 原型 | 管理工程设计文档 |
| 内容 | UI 组件（Button/Input/...） | 设计卡片（UserStory/BC/FlowStep） |
| 布局 | 拖拽自由布局 | 横向滚奏（ScrollSnap） |
| 数据绑定 | Mock数据 | 卡片关系（DAG） |
| 受众 | PM / 前端 | 全栈 / 架构师 |

### 目标用户

| 用户 | 场景 |
|------|------|
| 产品经理 | 在"需求分析"章节维护用户故事卡片 |
| 架构师 | 在"上下文分析"章节查看/编辑限界上下文 |
| 全栈工程师 | 在"领域流程"章节查看/编辑流程步骤 DAG |

### JTBD

| # | JTBD | 优先级 |
|---|------|--------|
| J1 | 我要在 Spec Canvas 中看到 3 个章节（需求分析/上下文/流程） | 🔴 P0 |
| J2 | 我要在每个章节内编辑卡片（添加/修改/删除） | 🔴 P0 |
| J3 | 我要通过 AI 生成卡片内容（点击"AI 草稿"） | 🟠 P1 |
| J4 | 我要在横向滑动切换章节（滚奏体验） | 🟠 P1 |
| J5 | 我要看到章节之间的卡片关系（节点边 DAG） | 🟡 P2 |

---

## 2. 技术方案

### 2.1 整体架构

基于 `vibex-dds-canvas` 已有分析，Spec Canvas 采用以下架构：

```
/app/design/dds-canvas/page.tsx        (已存在：路由入口)
    ↓
DDSCanvasPage                          (已存在：主组件)
    ↓
┌──────────────────────────────────────┐
│ DDSToolbar                            │  工具栏（已存在）
│ DDSScrollContainer → DDSFlow → CardRenderer │  画布主体
│ AIDraftDrawer                         │  AI 草稿抽屉
└──────────────────────────────────────┘
    ↓
DDSCanvasStore (Zustand)               (已存在：状态管理)
    ↓
DDS API (Cloudflare Workers)            (部分存在)
    ↓
D1 Database (dds_cards / dds_chapters)  (部分存在)
```

### 2.2 三种卡片类型

**已有 PM 定义的 schema（来自 `vibex-dds-canvas/prd.md`）**:

```typescript
// 基础卡片
interface BaseCard {
  id: string;
  type: 'user-story' | 'bounded-context' | 'flow-step';
  title: string;
  createdAt: string;
  updatedAt: string;
}

// 用户故事卡片（需求分析章节）
interface UserStoryCard extends BaseCard {
  type: 'user-story';
  role: string;       // 作为[角色]
  action: string;     // 我想要[行为]
  benefit: string;    // 以便于[收益]
  priority?: 'high' | 'medium' | 'low';
  children?: string[];
}

// 限界上下文卡片（上下文分析章节）
interface BoundedContextCard extends BaseCard {
  type: 'bounded-context';
  // 扩展字段待定义
}

// 流程步骤卡片（领域流程章节）
interface FlowStepCard extends BaseCard {
  type: 'flow-step';
  stepNumber?: number;
  // 扩展字段待定义
}
```

### 2.3 横向滚奏布局

**技术方案**: React Resizable Panels + CSS scroll-snap

```typescript
// 已存在 mock: react-resizable-panels
// 使用 HorizontalScrollContainer 实现滚奏
interface ScrollLayout {
  type: 'horizontal-snap';
  chapters: ChapterType[];  // ['requirement', 'context', 'flow']
  activeChapter: number;   // 当前展开章节索引
}
```

**状态管理**: `DDSCanvasStore` 已有 `chapter` 状态（`ddsChapterActions`）。

### 2.4 AI 草稿生成

**技术方案**: 复用现有 AI chat 模式（`AIDraftDrawer` 组件已存在）

```typescript
// AI 生成流程
用户点击"AI 草稿" 
  → AIDraftDrawer 打开
  → 输入提示词
  → AI 返回卡片内容 JSON
  → 用户预览/编辑
  → 点击"确认" → 卡片写入 DDSCanvasStore
```

### 2.5 章节间卡片关系（DAG）

**方案**: React Flow 已有边（edges）渲染能力，复用 `DDSFlow.tsx`

```typescript
interface ChapterEdge {
  id: string;
  source: string;   // 卡片 ID
  target: string;   // 卡片 ID
  sourceChapter: ChapterType;
  targetChapter: ChapterType;
  type?: 'default' | 'navigation';
}
```

---

## 3. 可行性评估

| 功能 | 可行性 | 技术难度 | 现状 | 工时估算 |
|------|--------|---------|------|---------|
| 三章节卡片编辑 | ✅ 高 | 低 | DDSCanvasPage 已存在，card schema 已定义 | 2h |
| 横向滚奏 UI | ✅ 高 | 低 | DDSScrollContainer 已存在 | 1h |
| AI 草稿生成 | ✅ 高 | 中 | AIDraftDrawer 已存在，需验证 API 集成 | 2h |
| 章节间 DAG 关系 | ✅ 高 | 中 | React Flow edges 已支持 | 3h |
| D1 数据库持久化 | ⚠️ 中 | 中 | 部分 schema 已有，需验证 migration | 2h |
| 单元测试覆盖 | ✅ 高 | 低 | 可复用 Canvas 测试策略 | 1h |

**总工时**: 11h（MVP，含 buffer）

---

## 4. 风险矩阵

| 风险 | 可能性 | 影响 | 等级 | 缓解 |
|------|--------|------|------|------|
| DDSCanvasPage 内部 API 调用未完成 | 中 | 高 | 🟡 中 | 先写 mock 数据验证 UI，API 后接入 |
| AI 草稿 API 接口与现有 chat API 不一致 | 中 | 中 | 🟡 中 | 先验证 `useDDSAPI` hook 与 API 匹配性 |
| D1 migration 在生产失败 | 低 | 高 | 🟡 中 | staging 验证 + rollback 脚本 |
| 滚奏布局在移动端体验差 | 低 | 低 | 🟢 低 | MVP 专注桌面，移动端暂时不优化 |
| Card schema 扩展字段不足 | 中 | 中 | 🟡 中 | MVP 使用基础字段，扩展字段后续迭代 |

---

## 5. 与 Sprint 1 (Prototype Canvas) 的共享资产

| 共享资产 | 复用方式 |
|---------|---------|
| React Flow | 两者都用 React Flow 渲染 DAG/节点，可共享自定义节点组件 |
| Zustand stores | DDSCanvasStore（Spec）/ prototypeStore（Prototype）各自独立，但共享模式 |
| UI Schema types | UIComponent / UIPage 可被两者共用 |
| Export infrastructure | ExportMenu 可扩展支持两种 Canvas 的导出 |
| Testing patterns | Canvas hooks 测试策略可直接复用 |

**技术协同效应**: 两个 Canvas 共用 React Flow + Zustand 技术栈，减少学习成本和维护成本。

---

## 6. 验收标准（具体可测试）

### V1 — 三章节卡片
- [ ] `/design/dds-canvas?projectId=X` 加载后显示 3 个章节面板
- [ ] 每个章节可添加/编辑/删除卡片
- [ ] 卡片数据符合对应 schema（UserStoryCard/BoundedContextCard/FlowStepCard）
- [ ] 卡片数据持久化到 D1（验证 DB 记录）

### V2 — 横向滚奏
- [ ] 鼠标拖动切换章节（scroll-snap 吸附）
- [ ] URL 同步当前章节（`?chapter=requirement` 等）
- [ ] 工具栏显示当前章节名称

### V3 — AI 草稿生成
- [ ] 点击工具栏"AI 草稿"按钮，AIDraftDrawer 打开
- [ ] 输入提示词后，AI 返回卡片内容
- [ ] 点击"确认"后，卡片写入当前章节

### V4 — 章节间 DAG
- [ ] 在"需求分析"卡片上添加指向"上下文"卡片的边
- [ ] 在 React Flow 画布上正确渲染边
- [ ] 边随卡片拖动更新位置

### V5 — 持久化
- [ ] 刷新页面后，卡片状态从 D1 恢复
- [ ] D1 migration 在 staging 通过

---

## 7. 驳回条件检查

| 检查项 | 状态 | 说明 |
|--------|------|------|
| Card schema 未定义 | ✅ 已通过 | PM 已在 `vibex-dds-canvas/prd.md` 定义基础 schema |
| 章节无上限 | ✅ 已通过 | MVP 固定为 3 个章节 |
| AI 交互模糊 | ⚠️ 警告 | AIDraftDrawer 已存在，但与 DDS API 的集成需验证 |
| 未执行 Research | ✅ 通过 | learnings + git history 分析已完成 |

---

## 8. 执行建议

**Sprint 2 内两个项目可并行**:

```
Sprint 2
├── vibex-sprint2-20260415    E1-E4（Canvas 增强）
│   └── 主要改动: CanvasPage.tsx, canvasStore
└── vibex-sprint2-spec-canvas  新 Spec Canvas
    └── 主要改动: dds-canvas/*, DDSCanvasStore
```

**技术评审建议**: 由于两个项目并行，Architect 应评审 spec-canvas 的 React Flow 节点类型与 Canvas 三树节点的差异，确保数据模型对齐。

---

*Analyst Agent | 2026-04-17*
