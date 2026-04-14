# PRD: VibeX 详细设计画布（Detailed Design Canvas）

**Project**: vibex-dds-canvas
**Stage**: create-prd
**PM**: PM Agent
**Date**: 2026-04-14
**Status**: Draft

---

## 执行决策
- **决策**: 有条件采纳（MVP 范围已明确，见下方）
- **执行项目**: vibex-dds-canvas
- **执行日期**: 待 Architect 评审后确认

---

## 0. 前置澄清（来自 Analyst 驳回红线的 PM 决策）

Analyst 指出了 4 个驳回红线：缺少 MVP 定义 / 章节无上限 / card schema 未定义 / AI 交互模糊。作为 PM，在写 PRD 前先给出决策：

### 决策 1: MVP 章节固定为 3 个

| 章节 | 内容 | 选择理由 |
|------|------|---------|
| 需求分析 | 用户故事卡片（树图）| 与现有 confirm 页需求输入对应，复用数据模型 |
| 上下文分析 | 限界上下文卡片树图 | 与现有 BoundedContextTree 直接对应，技术风险最低 |
| 领域流程 | 流程卡片 DAG 图 | 与现有 BusinessFlowTree 直接对应，React Flow DAG 已有基础设施 |

**排除理由**：
- 数据结构（领域模型）：与"上下文"高度重叠，合一处理
- 接口设计：需要独立的 schema 设计，超出 MVP 范围
- 非功能需求：纯文本内容，不需要 DAG 图
- "PRD 预览"：本质是 read-only 聚合视图，不是画布功能

### 决策 2: 卡片 JSON Schema 基础结构

```typescript
// 所有卡片的基础 schema
interface BaseCard {
  id: string;          // UUID
  type: CardType;     // 'user-story' | 'bounded-context' | 'flow-step'
  title: string;      // 卡片标题（用户可见）
  createdAt: string;  // ISO timestamp
  updatedAt: string;
}

// 用户故事卡片（需求分析章节）
interface UserStoryCard extends BaseCard {
  type: 'user-story';
  role: string;       // 作为[角色]
  action: string;     // 我想要[行为]
  benefit: string;    // 以便于[收益]
  priority?: 'high' | 'medium' | 'low';
  children?: string[]; // 子卡片 ID（树关系）
}

// 限界上下文卡片（上下文分析章节）
interface BoundedContextCard extends BaseCard {
  type: 'bounded-context';
  name: string;       // 上下文名称
  description: string;
  children?: string[]; // 子域 ID
  relations?: {        // DAG 关系
    targetId: string;
    relationType: 'upstream' | 'downstream' | 'anticorruption';
  }[];
}

// 流程步骤卡片（领域流程章节）
interface FlowStepCard extends BaseCard {
  type: 'flow-step';
  stepName: string;
  actor?: string;
  preCondition?: string;
  postCondition?: string;
  nextSteps?: string[];   // DAG 后续步骤 ID
}

// 章节容器
interface Chapter {
  id: string;
  type: 'requirement' | 'context' | 'flow';
  cards: BaseCard[];
}
```

### 决策 3: AI → 卡片交互：Draft 模式

**问题**：Analyst 说"AI 先生成文本，确认后产出卡片"操作路径不清晰。

**PM 决策**：
1. 用户在 AI 对话区输入自然语言需求
2. AI 返回**结构化卡片预览**（非纯文本），显示 JSON 卡片内容
3. 用户看到预览 → 选择接受（插入画布）或编辑后接受
4. 卡片插入画布后，用户可进一步拖拽调整关系

```
用户: "做一个电商系统"
  ↓
AI 返回: [UserStoryCard 预览 {role: "买家", action: "下单购买", benefit: "快速完成交易"}]
  ↓
用户点击 "接受" 或 "编辑后接受"
  ↓
卡片插入当前章节画布
```

---

## 1. 执行摘要

### 背景

VibeX 当前是线性流程（需求输入 → AI 生成 → 原型），各工程文档章节（需求/上下文/流程）离散管理，无法可视化编辑和关联。本需求为 Vibex 创建**详细设计画布**（Detailed Design Canvas），将所有软件工程文档章节整合到交互式横向多面板画布中。

**本质**：将 VibeX 从"一次性生成器"升级为"软件工程全流程文档化管理平台"。

### 目标

| 目标 | 指标 |
|------|------|
| Dashboard 项目菜单分离 | 点击项目后，显示"原型画布"和"详细设计画布"两个入口 |
| 三章节画布可用 | 需求/上下文/流程三章节画布各自渲染 DAG/树卡片图 |
| 卡片 JSON 持久化 | 刷新后卡片状态保留 |
| AI 生成卡片 | AI 对话 → 结构化卡片预览 → 接受插入画布 |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| DDS 画布首次加载时间 | < 3s（3 个面板懒加载）|
| 卡片创建 → 刷新 → 卡片存在 | 100% |
| AI 生成卡片接受率 | ≥ 70%（5 个测试场景）|
| 奏折布局默认状态 | 左侧折收起 + 中间展开 + 右侧折收起 |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1.1 | Dashboard 入口分离 | 项目菜单增加"原型画布"和"详细设计画布"两个入口 | V1 | 1h |
| F2.1 | DDS 页面路由 | `/app/dds-canvas/page.tsx` 基础路由搭建 | V1 | 1h |
| F2.2 | 奏折横向布局 | CSS scroll-snap 实现 2 收起 + 1 展开布局 | V2 | 2h |
| F2.3 | 面板状态管理 | 每个面板独立加载状态，URL 记录当前展开章节 | V2 | 1h |
| F3.1 | 需求分析章节 | 用户故事卡片树图（React Flow）| V4 | 3h |
| F3.2 | 上下文分析章节 | 限界上下文卡片树图（React Flow）| V4 | 3h |
| F3.3 | 领域流程章节 | 流程卡片 DAG 图（React Flow）| V4 | 3h |
| F4.1 | 工具栏 | 重新生成/全选/下一步/全屏推开 | V5 | 2h |
| F5.1 | AI 对话区 | 画布下方 ChatDrawer | V6 | 2h |
| F5.2 | AI → 卡片生成 | AI 回复结构化卡片预览 → 用户接受/编辑 → 插入画布 | V6 | 4h |
| F5.3 | 卡片微调 | 勾选卡片 → AI 微调选中的卡片内容 | V6 | 2h |
| F6.1 | 卡片持久化 | 所有卡片 CRUD 操作持久化到后端 | V7 | 3h |
| F6.2 | 刷新状态保持 | 刷新页面后卡片和布局状态完整恢复 | V7 | 1h |
| F7.1 | PRD 预览 | Read-only 聚合视图，汇总三个章节内容 | V8 | 2h |
| **合计** | | | | **30h** |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 描述 | 工时 | 优先级 | Stories |
|------|------|------|--------|---------|
| E1 | 入口与路由 | 1h | P0 | S1.1 |
| E2 | 奏折布局框架 | 4h | P0 | S2.1, S2.2, S2.3 |
| E3 | 三章节画布 | 9h | P0 | S3.1, S3.2, S3.3 |
| E4 | 工具栏 | 2h | P1 | S4.1 |
| E5 | AI 对话区 | 8h | P1 | S5.1, S5.2, S5.3 |
| E6 | 数据持久化 | 4h | P1 | S6.1, S6.2 |
| E7 | PRD 预览 | 2h | P2 | S7.1 |

**总工时**: 30h（含 3h 缓冲）

---

### Epic 1: 入口与路由（P0）

#### Story S1.1: Dashboard 入口分离

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 原型画布入口 | 现有 Canvas 入口保留 | `expect(link.href).toContain('/canvas')` | 【需页面集成 /dashboard】 |
| F1.1.1 | DDS 画布入口 | 项目详情菜单增加"详细设计画布"链接 | `expect(ddsLink.href).toContain('/dds-canvas')` | 【需页面集成 /dashboard】 |
| F1.1.2 | 入口区分 | 两个入口有明显区分（DDS 不叫"原型画布"）| `expect(labelText).not.toBe('原型画布')` | 【需页面集成 /dashboard】 |

**DoD**: 点击项目后，Dashboard 显示"原型画布"和"详细设计画布"两个入口。

---

### Epic 2: 奏折布局框架（P0）

**目标**: 实现横向奏折布局（2收起 + 1展开 + 鼠标滑动切换）。

#### Story S2.1: DDS 页面路由

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.1 | /dds-canvas 路由 | `/app/dds-canvas/page.tsx` 页面存在且可访问 | `expect(page.status).toBe(200)` | 【需页面集成 /dds-canvas】 |
| F2.1.1 | URL 参数 | URL 支持 `?chapter=requirement` 参数直接跳转 | `expect(urlJump).toWork()` | 【需页面集成 /dds-canvas】 |
| F2.1.2 | 项目 ID 验证 | projectId 无效时显示引导 UI | `expect(guideUI).toBeVisible()` | 【需页面集成 /dds-canvas】 |

**DoD**: `/dds-canvas?projectId=xxx` 可正常访问。

#### Story S2.2: 奏折横向布局

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.2 | CSS scroll-snap 布局 | 3 个面板横向排列，scroll-snap 对齐 | `expect(scrollSnap).toBe('x mandatory')` | 【需页面集成 /dds-canvas】 |
| F2.2.1 | 默认状态 | 加载后：左侧收起 + 中间展开 + 右侧收起 | `expect(expandCount).toBe(1)` | 【需页面集成 /dds-canvas】 |
| F2.2.2 | 收起面板宽度 | 收起面板宽度固定（如 80px 缩略图）| `expect(collapsedWidth).toBe(80)` | 【需页面集成 /dds-canvas】 |
| F2.2.3 | 展开面板占满 | 展开面板占满视口宽度 | `expect(expandedWidth).toBe('100vw')` | 【需页面集成 /dds-canvas】 |

**DoD**: 默认显示 2收起 + 1展开，最左/最右各保留 1 折不可展开。

#### Story S2.3: 面板状态管理

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F2.3 | 鼠标滑动切换 | 按住鼠标左右滑动，松开后 snap 到最近面板 | `expect(swipeSnap).toWork()` | 【需页面集成 /dds-canvas】 |
| F2.3.1 | URL 同步 | 展开面板变化时，URL 参数同步更新 | `expect(urlSync).toWork()` | 【需页面集成 /dds-canvas】 |
| F2.3.2 | 全屏推开 | 工具栏"全屏推开"按钮横铺整个视口 | `expect(fullscreen).toWork()` | 【需页面集成 /dds-canvas】 |

**DoD**: 滑动切换流畅，URL 同步正确。

---

### Epic 3: 三章节画布（P0）

**目标**: 每个展开面板内渲染对应章节的 React Flow 卡片图。

#### Story S3.1: 需求分析章节（用户故事卡片树）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.1 | React Flow 画布 | 用户故事卡片以树图形式渲染 | `expect(flowNodes.length).toBeGreaterThan(0)` | 【需页面集成 /dds-canvas】 |
| F3.1.1 | 用户故事节点 | 每个节点显示：role / action / benefit | `expect(nodeContent).toContain('role')` | 【需页面集成 /dds-canvas】 |
| F3.1.2 | 树结构连线 | 子卡片连接父卡片（树边）| `expect(edges.length).toBeGreaterThan(0)` | 【需页面集成 /dds-canvas】 |
| F3.1.3 | 卡片拖拽创建 | 工具栏"新建卡片"拖拽到画布创建 | `expect(createCard).toWork()` | 【需页面集成 /dds-canvas】 |

**DoD**: 需求分析章节渲染用户故事树图，支持创建和连线。

#### Story S3.2: 上下文分析章节（限界上下文卡片树）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.2 | 限界上下文树 | 上下文卡片以树图形式渲染 | `expect(contextTree).toRender()` | 【需页面集成 /dds-canvas】 |
| F3.2.1 | 上下游关系 | 上下文之间可设置上下游关系（树边）| `expect(upstreamEdge).toBeDefined()` | 【需页面集成 /dds-canvas】 |
| F3.2.2 | 上下文描述 | 每个上下文显示名称和描述 | `expect(contextCard).toContain('name')` | 【需页面集成 /dds-canvas】 |

**DoD**: 上下文分析章节渲染限界上下文树，支持关系连线。

#### Story S3.3: 领域流程章节（流程卡片 DAG）

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F3.3 | 流程步骤 DAG | 流程卡片以 DAG 图形式渲染 | `expect(dagNodes.length).toBeGreaterThan(0)` | 【需页面集成 /dds-canvas】 |
| F3.3.1 | DAG 边 | 支持多个后续步骤（DAG 而非树）| `expect(multipleNextSteps).toBe(true)` | 【需页面集成 /dds-canvas】 |
| F3.3.2 | 步骤信息 | 每个步骤显示：stepName / actor / pre/post condition | `expect(stepCard).toContain('stepName')` | 【需页面集成 /dds-canvas】 |

**DoD**: 领域流程章节渲染 DAG 图，支持多后续步骤。

---

### Epic 4: 工具栏（P1）

#### Story S4.1: 画布工具栏

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F4.1 | 重新生成 | 工具栏重新生成按钮，触发当前章节 AI 重新生成 | `expect(retryButton).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F4.1.1 | 全选 | 选中当前章节所有卡片 | `expect(selectAllButton).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F4.1.2 | 下一步 | 跳转到下一个章节（流程章节 → 上下文章节）| `expect(nextChapterButton).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F4.1.3 | 全屏推开 | 画布全屏横铺，body scroll 禁用 | `expect(fullscreenToggle).toBeVisible()` | 【需页面集成 /dds-canvas】 |

**DoD**: 4 个工具栏按钮均存在且对应 handler 可调用。

---

### Epic 5: AI 对话区（P1）

**目标**: 画布下方 AI 对话区，Draft 模式生成卡片。

#### Story S5.1: AI ChatDrawer

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.1 | ChatDrawer 组件 | 画布下方抽屉式 AI 对话区 | `expect(chatDrawer).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F5.1.1 | 收起/展开 | 抽屉可收起（只显示输入框）和展开（显示对话历史）| `expect(toggle).toWork()` | 【需页面集成 /dds-canvas】 |
| F5.1.2 | 对话历史 | 对话历史可滚动查看 | `expect(historyScroll).toWork()` | 【需页面集成 /dds-canvas】 |

**DoD**: ChatDrawer 组件可用，收起/展开正常。

#### Story S5.2: AI → 卡片 Draft 模式

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.2 | 卡片预览 | AI 回复显示结构化卡片预览（非纯文本）| `expect(cardPreview).toBeVisible())` | 【需页面集成 /dds-canvas】 |
| F5.2.1 | 接受卡片 | 用户点击"接受"→ 卡片插入当前章节画布 | `expect(acceptButton).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F5.2.2 | 编辑后接受 | 用户编辑预览内容后接受 | `expect(editAccept).toWork()` | 【需页面集成 /dds-canvas】 |
| F5.2.3 | 拒绝重试 | 用户可拒绝预览，重新输入 | `expect(retryButton).toBeVisible()` | 【需页面集成 /dds-canvas】 |

**DoD**: AI 回复结构化卡片预览 → 接受 → 卡片插入画布。

#### Story S5.3: 卡片微调

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F5.3 | 勾选卡片 | 画布上勾选多个卡片 | `expect(checkboxSelect).toWork()` | 【需页面集成 /dds-canvas】 |
| F5.3.1 | AI 微调指令 | 选中卡片后，AI 对话区输入微调指令 | `expect(refineInput).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F5.3.2 | 微调结果预览 | AI 返回修改后的卡片预览 | `expect(refinedPreview).toBeVisible()` | 【需页面集成 /dds-canvas】 |

**DoD**: 勾选卡片 → AI 微调 → 预览 → 接受更新。

---

### Epic 6: 数据持久化（P1）

#### Story S6.1: 卡片 CRUD API

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.1 | 创建卡片 | POST /api/v1/dds/cards → 持久化卡片 | `expect(createCard.status).toBe(201)` | 否 |
| F6.1.1 | 更新卡片 | PUT /api/v1/dds/cards/:id → 更新卡片内容 | `expect(updateCard.status).toBe(200)` | 否 |
| F6.1.2 | 删除卡片 | DELETE /api/v1/dds/cards/:id | `expect(deleteCard.status).toBe(204)` | 否 |
| F6.1.3 | 关系更新 | PUT /api/v1/dds/cards/:id/relations → 更新边关系 | `expect(updateRelations.status).toBe(200)` | 否 |
| F6.1.4 | 章节加载 | GET /api/v1/dds/chapters/:chapterId/cards → 加载章节所有卡片 | `expect(loadCards.status).toBe(200)` | 否 |

**DoD**: 卡片 CRUD 和关系更新 API 全部可用。

#### Story S6.2: 刷新状态保持

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F6.2 | 刷新卡片保持 | 创建卡片 → 刷新 → 卡片仍然存在 | `expect(persistAfterRefresh).toBe(true)` | 【需页面集成 /dds-canvas】 |
| F6.2.1 | 布局状态保持 | 展开的面板和节点位置刷新后保持 | `expect(layoutPersist).toBe(true)` | 【需页面集成 /dds-canvas】 |

**DoD**: 刷新页面后卡片状态完整恢复。

---

### Epic 7: PRD 预览（P2）

#### Story S7.1: Read-only 聚合视图

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F7.1 | PRD 预览面板 | 点击工具栏"预览"→ 显示三个章节内容的只读聚合视图 | `expect(previewPanel).toBeVisible()` | 【需页面集成 /dds-canvas】 |
| F7.1.1 | 章节标题 | 预览包含三个章节的标题 | `expect(preview).toContainAll(['需求分析', '上下文分析', '领域流程'])` | 【需页面集成 /dds-canvas】 |
| F7.1.2 | 卡片数量 | 预览显示每个章节的卡片数量 | `expect(cardCountDisplay).toBeDefined()` | 【需页面集成 /dds-canvas】 |
| F7.1.3 | 导出下载 | 预览支持导出为 Markdown 文件 | `expect(exportMarkdown).toWork()` | 【需页面集成 /dds-canvas】 |

**DoD**: PRD 预览面板显示三章节汇总，支持导出。

---

## 4. 验收标准汇总

| ID | Given | When | Then | 优先级 |
|----|-------|------|------|--------|
| AC1 | 点击 Dashboard 项目 | 选择菜单 | 显示"原型画布"和"详细设计画布"两个入口 | P0 |
| AC2 | 访问 /dds-canvas | 页面加载 | 默认 2 收起 + 1 展开（中间）| P0 |
| AC3 | 鼠标按住左右滑动 | 松开 | snap 到最近面板 | P0 |
| AC4 | 需求分析章节展开 | 查看画布 | 渲染用户故事树图，节点可拖拽 | P0 |
| AC5 | 上下文分析章节展开 | 查看画布 | 渲染限界上下文树，支持上下游连线 | P0 |
| AC6 | 领域流程章节展开 | 查看画布 | 渲染 DAG 图，支持多后续步骤 | P0 |
| AC7 | AI 输入需求 | 发送 | 返回结构化卡片预览 | P1 |
| AC8 | 点击"接受"卡片预览 | 操作 | 卡片插入当前章节画布 | P1 |
| AC9 | 勾选卡片 + 微调指令 | 发送 | AI 返回修改后卡片预览 | P1 |
| AC10 | 创建卡片后刷新 | 刷新页面 | 卡片仍然存在 | P1 |
| AC11 | 工具栏按钮 | 点击各按钮 | 对应 handler 被调用 | P1 |
| AC12 | 点击 PRD 预览 | 操作 | 显示三章节只读汇总，支持导出 | P2 |

---

## 5. DoD (Definition of Done)

### E1 完成标准
- [ ] Dashboard 项目菜单显示两个入口（原型画布 + 详细设计画布）
- [ ] DDS 入口链接正确（`/dds-canvas?projectId=xxx`）

### E2 完成标准
- [ ] 3 个面板横向排列，CSS scroll-snap 生效
- [ ] 默认状态：左侧收起 + 中间展开 + 右侧收起
- [ ] 收起面板宽度 80px，展开面板占满视口
- [ ] URL 参数随面板切换同步更新

### E3 完成标准
- [ ] 需求分析章节：用户故事树图，role/action/benefit 显示正确
- [ ] 上下文分析章节：限界上下文树，上下游关系连线正确
- [ ] 领域流程章节：DAG 图，支持多后续步骤

### E4 完成标准
- [ ] 工具栏 4 个按钮均存在且可点击

### E5 完成标准
- [ ] AI 回复显示结构化卡片预览（非纯文本）
- [ ] "接受"操作将卡片插入画布
- [ ] 勾选卡片 + 微调 → 预览更新

### E6 完成标准
- [ ] 卡片 CRUD API 全部可用（201/200/204）
- [ ] 刷新后卡片状态保持
- [ ] 刷新后展开面板位置保持

### E7 完成标准
- [ ] PRD 预览面板显示三个章节汇总
- [ ] Markdown 导出功能可用

---

## 6. 规格文件（Specs）

| 文件 | 内容 |
|------|------|
| `specs/schema-card-types.md` | 三种卡片的 JSON Schema 详细定义 |
| `specs/layout-scroll-snap.md` | 奏折横向布局 CSS 规格 |
| `specs/ai-draft-flow.md` | AI Draft 模式交互流程规格 |
| `specs/api-card-crud.md` | 卡片 CRUD API 接口规格 |
| `specs/dds-canvas-state.md` | Zustand store 设计规格 |

---

*PRD Version: 1.0*
*Created by: PM Agent*
*Last Updated: 2026-04-14*
