# Analysis: VibeX 三树并行卡片画布重构

**项目**: vibex-canvas-redesign-20260325  
**分析人**: Analyst  
**日期**: 2026-03-25  
**依据**: `/root/.openclaw/vibex/docs/gstack/vibex-fullstack-export-20260325.md`

---

## 1. 业务场景分析

### 核心价值主张
VibeX 是一个 AI 原型生成平台，用户通过自然语言描述需求，系统逐步生成：限界上下文 → 业务流程 → 组件树 → 可运行原型。

### 目标用户
- 产品经理：快速验证产品概念
- 独立开发者：低成本快速出原型
- 创业团队：验证市场需求

### 核心痛点
| 痛点 | 当前状态 | 目标状态 |
|------|---------|---------|
| 多步骤分散在多个页面 | chat、design/*、domain 等 6+ 页面 | 单页内三树并行 |
| 阶段切换不透明 | 跳转页面，不知进度 | 顶部进度条 + 阶段激活高亮 |
| 修改需重走全流程 | 改上下文要重新开始 | 任意阶段可逆，级联更新下游 |
| 看不到组件到原型的映射 | 组件树和生成结果无关联 | 组件树 → 原型生成队列一一对应 |

### 阶段模型（JTBD）

| JTBD | 阶段 | 用户动作 |
|------|------|---------|
| JTBD-1: 快速定义需求边界 | 需求澄清阶段 | 输入需求 → AI 生成限界上下文树 → 逐个确认 |
| JTBD-2: 确认业务流程 | 流程确认阶段 | 查看业务流程 → 调整步骤 → 确认 |
| JTBD-3: 预览组件结构 | 组件确认阶段 | 查看组件树 → 确认每个页面的卡片 |
| JTBD-4: 生成可运行原型 | 原型阶段 | 创建项目 → 查看生成队列 → 微调 → 导出 |

---

## 2. 技术方案选项

### 选项 A：渐进增强（保留现有路由，改造 HomePage）

**思路**：保持现有 `chat`、`design/*`、`domain`、`prototype` 等路由不变，核心改动聚焦在 **HomePage**，将三树并行卡片画布作为新的主交互区。

**保留组件**：
- `CardTreeView.tsx` → 重写为三树并行的 `ParallelCardTreeCanvas`
- `CardTreeRenderer.tsx` → 作为渲染引擎保留，扩展为支持多树同步

**新增组件**：
- `ParallelCardTreeCanvas` — 三树容器，管理激活状态和布局
- `PhaseProgressBar` — 顶部阶段进度条
- `TreePanel` — 单个树的可折叠面板
- `PrototypeQueue` — 原型生成队列管理
- `GenerationQueuePanel` — 生成状态管理

**改造页面**：
- `app/page.tsx` (HomePage) — 主画布，单页内完成全流程
- `app/editor/page.tsx` — 保留，用于微调
- `app/export/page.tsx` — 保留导出功能

**优点**：
- 风险低，现有路由全部兼容
- 可以逐步迁移，不是大爆炸重写
- 组件复用率高

**缺点**：
- 遗留代码（chat/dialogue 等）仍存在，增加维护成本
- 三树并行的布局复杂性集中在一个页面

---

### 选项 B：全新单页画布（推荐）

**思路**：将整个 VibeX 主流程收敛到一个页面 `app/canvas/page.tsx`，彻底重构为三树并行画布。现有 `chat`、`design/*` 等路由降级为「旧版」入口或直接废弃。

**新增组件**：
- `CanvasPage` — 新主页面，三树并行 + 阶段进度 + 原型队列
- `BoundedContextTree` — 限界上下文树（全新）
- `BusinessFlowTree` — 业务流程树（全新）
- `ComponentTree` — 组件树（全新，基于现有 `CardTreeRenderer` 重写）
- `PhaseProgressBar` — 阶段进度条
- `PrototypeQueue` — 原型生成队列
- `TreePanel` — 统一的面板容器（支持激活/暗淡/折叠状态）
- `CascadeUpdateManager` — 级联更新管理（上游变更触发下游刷新）

**保留组件**：
- `CardTreeRenderer` — 核心渲染引擎，仅做数据适配（支持三种节点类型）
- `VisualizationPlatform` — 基础可视化框架
- `prototype-tuner/PrototypeTuner` — 微调功能
- `prototype/PrototypeExporter` — 导出功能
- 所有 `ui/*` 基础组件

**废弃/折叠组件**：
- `app/chat/page.tsx` → 折叠，功能迁移到 canvas
- `app/design/*` → 折叠，功能迁移到 canvas
- `app/domain/page.tsx` → 折叠，功能迁移到 canvas
- `homepage/` 下大部分组件 → 废弃，HomePage 降级

**优点**：
- 架构清晰，无历史包袱
- 用户体验流畅，单页完成全流程
- 画布逻辑内聚，易于维护

**缺点**：
- 重构面广，测试量大
- 需要完整的端到端测试覆盖

---

### 推荐方案

**选项 B**。理由：
1. 设计文档明确指出「画布是主操作区」，选项 A 的渐进增强无法真正实现「单页三树并行」
2. 现有 `homepage/` 组件已经过多次迭代，代码质量参差不齐，重写优于改造
3. 核心渲染引擎 `CardTreeRenderer` 和 `ui/*` 基础组件已经足够健壮，可以复用

---

## 3. 技术风险识别

| 风险 | 等级 | 缓解方案 |
|------|------|---------|
| **画布性能**：三树同时渲染大量节点可能卡顿 | 高 | 虚拟化列表（react-window）；按阶段懒加载非激活树 |
| **状态管理复杂性**：三树 + 阶段 + 队列状态同步 | 高 | 使用 Zustand 或 Jotai，划分状态 slice（treeSlice/phaseSlice/queueSlice）|
| **级联更新逻辑**：修改上游后下游需重新确认，容易遗漏 | 高 | 实现 `CascadeUpdateManager`，自动标记下游节点为 pending |
| **实时进度推送**：原型生成队列需要实时状态更新 | 中 | 使用 SSE 或 WebSocket；降级为 5s 轮询 |
| **导出格式变更**：从当前导出模式改为 zip 下载 | 中 | 后端需要新增 zip 打包逻辑 |
| **Checkpoint 机制**：卡片确认状态的持久化 | 中 | localStorage 存储 checkpoint + 后端同步 |
| **Open Question #1**：画布技术选型（自研/React Flow/dagre+D3）| 中 | 建议基于现有 Mermaid/D3 可视化能力自研，使用 dagre 做布局计算 + SVG 渲染 |
| **Open Question #5**：三树布局（横向三列 vs 纵向分组）| 低 | MVP 推荐横向三列（符合设计文档），响应式下折叠为 tab 切换 |

---

## 4. 可行性评估

### 现有能力
- ✅ `CardTreeRenderer` — 树形结构渲染引擎，支持节点类型扩展
- ✅ `ui/*` — 完善的基础组件库（Button, Card, Tabs, Modal 等）
- ✅ `VisualizationPlatform` — 可视化框架，支持多种视图切换
- ✅ `PrototypeExporter` — 已有导出能力基础
- ✅ `PrototypeTuner` — 已有微调能力基础

### 缺口
- ❌ 三树并行布局容器
- ❌ 阶段状态管理器
- ❌ 级联更新逻辑
- ❌ 原型生成队列管理（含实时进度）
- ❌ 导出 zip 打包逻辑（后端）

### MVP 可行性：**可行**
MVP 目标（需求录入 → 三树确认 → 创建项目 → 原型队列 → 导出）所需的核心能力大部分已具备，缺口主要集中在状态管理层和队列管理，技术实现路径清晰。

---

## 5. 验收标准

### 功能验收

| ID | 验收条件 | 测试方法 |
|----|---------|---------|
| AC-01 | 用户在 HomePage 输入需求，系统生成限界上下文树，节点数量 ≥ 1 | 手动测试：输入测试需求，验证树生成 |
| AC-02 | 限界上下文确认后，业务流程树自动生成并高亮激活 | 手动测试：确认所有上下文节点，检查流程树状态 |
| AC-03 | 任意阶段点击"编辑"可解锁该层，重新生成后级联更新下游 | 手动测试：修改上下文 → 验证流程树刷新为 pending |
| AC-04 | 三树全确认后，"创建项目"按钮可用 | 手动测试：确认所有树，检查按钮状态 |
| AC-05 | 原型生成队列显示各页面状态（等待中/生成中/完成/错误）| 手动测试：触发生成，检查队列状态 |
| AC-06 | 单个页面可重生成，不影响其他页面 | 手动测试：点击单页重生成，验证其他页状态不变 |
| AC-07 | 所有页面完成后，可导出为 zip，包含完整 Next.js 项目 | 手动测试：导出 zip，解压后 `npm run dev` 可启动 |
| AC-08 | 阶段进度条准确反映当前阶段 | 手动测试：在各阶段截图对比进度条 |
| AC-09 | 未确认节点显示黄色边框，确认后变为绿色 | 手动测试：观察节点样式变化 |
| AC-10 | TypeScript 编译 0 error | 自动化：`cd vibex-fronted && pnpm tsc --noEmit` |

### 非功能验收

| ID | 验收条件 | 测试方法 |
|----|---------|---------|
| NF-01 | 三树同时渲染 ≤ 100 个节点时，页面响应时间 < 500ms | 性能测试：打开浏览器 DevTools Performance |
| NF-02 | 生成队列轮询间隔 5s，不阻塞主流程 | 手动测试：触发生成后进行其他操作，无卡顿 |

---

## 6. 关键 Open Questions（待决策）

| # | 问题 | 建议方案 | 决策者 |
|---|------|---------|--------|
| OQ-1 | 画布技术选型：自研 vs React Flow vs dagre+D3 | 推荐 dagre 做布局 + SVG/D3 做渲染，复用现有可视化能力 | Architect |
| OQ-2 | 导出格式：zip 下载 vs GitHub 直接推送 | MVP 采用 zip 下载；GitHub 推送作为二期功能 | PM |
| OQ-3 | 画布状态持久化：localStorage vs 后端 | MVP localStorage；二期加入后端同步 | Architect |
| OQ-4 | 实时进度：SSE vs 轮询 | MVP 5s 轮询；二期升级 SSE | Architect |
| OQ-5 | 三树布局：横向三列 vs 纵向分组 | 横向三列（MVP），响应式下折叠为 Tab | Designer |
