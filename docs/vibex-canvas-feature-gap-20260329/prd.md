# VibeX 画布页功能完善 PRD

> **项目**: vibex-canvas-feature-gap-20260329  
> **状态**: Draft → Ready for Review  
> **版本**: v0.1.0  
> **日期**: 2026-03-29  
> **Owner**: PM Agent  
> **关联文档**: `requirements-analysis.md` · `analysis.md` · `DESIGN.md (v1.1)`

---

## 0. 执行摘要

VibeX 三树画布（限界上下文 / 业务流程 / 组件树）是产品差异化核心，代码已完整实现但未部署生产，且缺乏用户创作必需的基础能力。本 PRD 覆盖 **P0–P3** 共 4 个优先级、18 个功能点，按「先让画布跑起来 → 再补核心体验 → 最后完善生态」的节奏分阶段实施。

### 核心决策建议

> **优先持久化，而非追赶 Figma 协作功能**
>
> VibeX 的护城河是 DDD 三树建模（竞品中独一无二），而非实时多人协作。在资源有限的情况下：
> - **先做**：部署 + 持久化 + Undo/Redo + 搜索/快捷键（让单个用户用得爽）
> - **后做**：协作、Freehand、模板市场（这些 Figma/Miro 做了很多年，ROI 低）
> - **不做**：完全跟随 Figma 的协作功能（40-60h 投入，稀释差异化定位）
>
> 三树结构 + AI 生成 + 级联状态 = VibeX 的 10x 价值主张，持久化是让这个价值主张真正落地的第一步。

---

## 1. P0 — 解除阻塞（让画布可用）

> **目标**: 画布页上线 + 数据不丢 + 视觉统一

### P0-F1: 画布页生产部署

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p0-f1-deploy` |
| **背景** | `/canvas` 源代码完整、三套画布实现（CardTree / FlowCanvas / MermaidCanvas）均已就绪，但生产环境返回 404。用户无法访问核心交互页面，整个产品价值无法触达。 |
| **用户价值** | 解锁产品核心路径；让用户真正用上 VibeX 三树建模能力。 |
| **实现方案** | 1. 检查 Next.js 构建配置（`next.config.js` 路由 / `output: 'export'` 兼容性）<br>2. 确认 Vercel 部署配置（`vercel.json` 环境变量）<br>3. 部署并验证 `/canvas`、`/flow`、`/editor` 所有页面 200 OK<br>4. 回归测试：落地页画布预览 → 点击跳转 `/canvas` 全链路 |
| **验收标准** | `Given 用户访问 https://vibex.app/canvas When 页面加载完成 Then canvas 三栏布局正常渲染，无 404/500`<br>`Given 用户在首页点击「打开画布」 When 跳转完成 Then 画布页面正常展示，不丢失首页已生成的数据` |
| **预估工时** | 0.5h |
| **依赖** | 无 |
| **技术风险** | 低 — 纯部署问题，已有构建产物 |

---

### P0-F2: 数据持久化

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p0-f2-persistence` |
| **背景** | 当前画布数据存储在 Zustand 内存 store，刷新页面或切换 Tab 后所有节点、状态、关系连线全部丢失。Figma/Miro 的核心体验基石就是云端持久化——用户默认信任数据不会丢失。 |
| **用户价值** | 刷新不丢数据，减少用户焦虑；关闭浏览器后再次访问可继续工作；为后续版本历史提供基础设施。 |
| **实现方案** | **两层持久化策略（Fallback 链）**:<br><br>**Layer 1 — localStorage 热缓存**<br>`src/store/canvasStore.ts` 中接入 Zustand `persist` middleware，`partialize` 排除瞬时状态。<br><br>**Layer 2 — API 持久化（后台异步）**<br>调用 `canvasApi.saveProject(projectId, state)`，节流 2s 一次，避免频繁请求。<br><br>**Layer 3 — 加载时合取**<br>页面加载优先读 localStorage（毫秒级），再静默拉取 API 数据对比，有冲突以 API 为准并提示用户。 |
| **验收标准** | `Given 用户在画布中创建了多个节点 When 用户刷新页面（F5）Then 所有节点、状态、关系连线完整保留（误差 ≤ 1 个操作）`<br>`Given 用户创建节点后等待 2.5s When 检查 Network 面板 Then 存在 POST /api/canvas/projects/{id} 请求（API 持久化）`<br>`Given 用户离线创建大量节点 When 网络恢复后重新加载 Then localStorage 数据通过 API 同步` |
| **预估工时** | 8-12h |
| **依赖** | `canvas-p0-f1-deploy`（API 需先上线） |
| **技术风险** | 中 — 冲突处理策略需明确定义；大量节点（>500）localStorage 配额风险 |

---

### P0-F3: CardTreeNode 深色主题迁移

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p0-f3-theme-consistency` |
| **背景** | `CardTreeNode` 组件使用白底灰边样式，与画布整体深色赛博朋克主题割裂。视觉不统一影响用户沉浸感。设计文档 `DESIGN.md v1.1` 节 6.5 已定义迁移方案但未实施。 |
| **用户价值** | 视觉体验统一、专业感增强；降低认知负荷。 |
| **实现方案** | 按 `DESIGN.md v1.1` 节 6.5 实施：背景改为 `--color-canvas-bg`，边框改为 `1px solid var(--color-border)`，文本统一为 `--color-text-primary`，检查所有子组件继承正确变量，覆盖 Storybook/Chromatic 截图基线。 |
| **验收标准** | `Given 画布页面渲染（深色模式） When 观察 CardTreeNode 组件 Then 背景色为深色（与 --color-canvas-bg 一致） And 边框色为 --color-border And 无白底组件出现` |
| **预估工时** | 4-6h |
| **依赖** | 无 |
| **技术风险** | 低 — 纯 CSS 变量迁移，已有 DESIGN.md 指导 |

---

## 2. P1 — 核心体验（让画布好用）

> **目标**: 撤销/搜索/快捷键，让用户能高效操作画布

### P1-F4: Undo/Redo

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p1-f4-undo-redo` |
| **背景** | Undo/Redo 是所有创作工具的基石功能。用户在建模过程中误操作（如误删节点、错误确认状态）后无法回退。竞品 Excalidraw/Miro/Figma 无一例外标配。 |
| **用户价值** | 消除操作恐惧，鼓励用户大胆尝试；减少「不敢点」的焦虑感。 |
| **实现方案** | Zustand 自定义历史栈 middleware：`past/future` 数组 + `recordAction()` 方法。记录时机：节点增删改、状态变更、关系连线变化（节流 300ms）。历史深度 max 50 步，超出丢弃最旧记录。三树独立历史（互不干扰）。ProjectBar 添加 Undo/Redo 按钮。 |
| **验收标准** | `Given 用户创建了一个节点又删除 When 用户按 Ctrl+Z Then 节点恢复到创建后的状态`<br>`Given 用户连续操作 60 次（超过历史深度） When 用户按 Ctrl+Z Then 可回退最近 50 步，第 51 步无法恢复`<br>`Given 无可撤销操作 When 观察 ProjectBar Undo 按钮 Then 按钮处于 disabled 状态` |
| **预估工时** | 6-8h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 中 — 拖拽过程中历史栈爆炸，需节流防抖 |

---

### P1-F5: 搜索与节点过滤

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p1-f5-search` |
| **背景** | DDD 建模项目节点数量随业务复杂度线性增长（50-200+ 节点）。无搜索时用户在大量节点中滚动定位，体验类似在没有目录的书中找章节。 |
| **用户价值** | 大型项目节点秒级定位；支持模糊匹配，降低记忆负担。 |
| **实现方案** | ProjectBar 右侧搜索图标，`/` 快捷键触发。使用 `fuse.js` 模糊匹配（threshold 0.3）合并三树所有节点。搜索结果列表显示节点路径（如「电商域 → 下单流程 → OrderForm」），点击跳转目标节点并高亮脉冲动画。`↑↓` 切换结果，`Esc` 关闭。 |
| **验收标准** | `Given 用户输入「order」 When 搜索结果包含 OrderForm、OrderService 等 Then 匹配关键词高亮显示`<br>`Given 用户点击搜索结果「OrderForm」 When 跳转完成 Then 目标节点可见且有高亮脉冲动画`<br>`Given 用户焦点在画布区域按 / 键 When 无需鼠标操作 Then 搜索 Dialog 自动弹出` |
| **预估工时** | 3-4h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 低 — fuse.js 已广泛使用；结果列表虚拟化待 P2 优化 |

---

### P1-F6: 快捷键系统

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p1-f6-shortcuts` |
| **背景** | 快捷键是专业用户效率倍增器。Cursor/Claude Code/Figma 均提供丰富的键盘操作，习惯快捷键的用户在切换工具时若缺失会有强烈失落感。VibeX 当前完全无快捷键支持。 |
| **用户价值** | 专业用户效率提升 30-50%（减少手离开键盘的时间）；与主流工具体验对齐。 |
| **实现方案** | 绑定映射（参考 Excalidraw + Figma 惯例）: `Cmd+Z` Undo、`Cmd+Shift+Z` Redo、`/` 搜索、`Cmd+S` 保存、`N` 新建节点、`Del` 删除、`Enter` 确认/编辑、`Esc` 取消、`?` 快捷键面板、`Cmd+E` 展开/折叠面板。实现：`useKeyboardShortcuts` hook，基于 `react-hotkeys-hook`。焦点在输入框时跳过画布快捷键。`?` 键触发快捷键提示浮层。 |
| **验收标准** | `Given 用户在输入节点名称（textarea 聚焦） When 用户按 / 键 Then 搜索 Dialog 不弹出（不干扰输入）`<br>`Given 用户按 ? 键 When 快捷键提示面板弹出 Then 显示所有可用快捷键列表`<br>`Given 所有快捷键均已注册 When 按下任意快捷键 Then 对应功能正确执行` |
| **预估工时** | 4-6h |
| **依赖** | `canvas-p1-f4-undo-redo`（复用 Undo/Redo 实现） |
| **技术风险** | 中 — Mac/Windows 快捷键差异（Cmd vs Ctrl）；与浏览器内置快捷键冲突 |

---

### P1-F7: 节点拖拽排序

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p1-f7-drag-sort` |
| **背景** | 三树建模顺序影响业务语义。当前节点顺序固定，用户无法调整。代码中已接入 `@dnd-kit/sortable`，但未完整集成到 FlowCanvas 三树面板。 |
| **用户价值** | 调整节点展示顺序，提升语义可读性；允许用户按业务优先级排列节点。 |
| **实现方案** | 在三棵树中接入 `@dnd-kit/sortable`：`SortableContext` + `verticalListSortingStrategy`。每个节点包装 `useSortable` hook，`onDragEnd` 更新 store 中节点顺序，拖拽时显示 `DragOverlay`。拖拽结束触发 `recordAction` 纳入 Undo 历史。 |
| **验收标准** | `Given 用户在任意树面板中 When 长按并拖动节点到新位置 Then 拖拽过程中显示占位符 And 释放后节点在新位置渲染 And 节点顺序变更触发 Undo 历史记录`<br>`Given 用户拖拽节点后 When 刷新页面 Then 拖拽后的顺序保留（持久化）` |
| **预估工时** | 6-8h |
| **依赖** | `canvas-p1-f4-undo-redo` |
| **技术风险** | 中 — 三树拖拽状态与 ReactFlow 内部状态可能冲突，需隔离 |

---

### P1-F8: 原型预览连接

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p1-f8-prototype-link` |
| **背景** | 画布 Phase 4 生成组件树，Phase 5 生成原型队列。用户无法从组件树节点直接跳转到 `/editor` 查看/编辑对应组件原型。「需求 → 原型」闭环断裂。 |
| **用户价值** | 「需求 → 模型 → 原型」闭环完整；减少用户寻找路径，增强产品内聚感。 |
| **实现方案** | 在 `ComponentTreeNode` 添加「预览」图标按钮，路由跳转 `/editor?componentId={node.id}`，`/editor` 页面读取参数加载对应组件数据。 |
| **验收标准** | `Given 用户在 ComponentTree 中 When 点击某组件节点的预览图标 Then 路由跳转 /editor?componentId={id} And /editor 页面加载并显示该组件的原型`<br>`Given 用户无 componentId 参数访问 /editor Then 显示组件列表（兼容原有行为）` |
| **预估工时** | 4-6h |
| **依赖** | `canvas-p0-f1-deploy` |
| **技术风险** | 低 — 纯路由跳转，需确认 editor 页面支持按 ID 加载 |

---

## 3. P2 — 完善体验（让画布专业）

> **目标**: 导出/模板/版本历史，让画布可用于生产工作流

### P2-F9: 多格式导出

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f9-export` |
| **背景** | 用户完成 DDD 建模后需要导出成果用于汇报、存档或传递给下游工具。当前完全没有导出能力，用户只能截图或复制文本——从建模到生产的最后一公里断裂。 |
| **用户价值** | 建模成果可用于团队汇报；支持 JSON 导出供代码生成工具消费。 |
| **实现方案** | 支持格式：JSON（最高优先）、PNG/SVG（画布截图）、Markdown（三树结构化描述）。JSON 使用 `downloadJSON()`，PNG/SVG 使用 `html-to-image` 库（`toPng`/`toSvg`），Markdown 使用模板引擎生成。ProjectBar 添加「导出」菜单按钮。 |
| **验收标准** | `Given 用户点击 ProjectBar「导出」按钮 When 弹出导出菜单（JSON / PNG / SVG / Markdown） Then 所有格式均可导出并下载文件`<br>`Given 用户导出 PNG Then 图片清晰，无截断，包含完整三栏布局` |
| **预估工时** | 8-12h |
| **依赖** | `canvas-p0-f1-deploy` |
| **技术风险** | 中 — SVG 中文渲染依赖字体嵌入；大量节点 PNG 性能 |

---

### P2-F10: 需求模板库

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f10-templates` |
| **背景** | 从零开始输入需求对用户有较高门槛。Figma/Miro/Excalidraw 均通过模板市场降低启动成本。VibeX 如果能从预设的行业模板快速填充三树结构，用户激活率和首次成功建模率会显著提升。 |
| **用户价值** | 新用户 30 秒内看到完整建模效果（wow moment）；行业模板降低 DDD 建模学习门槛。 |
| **实现方案** | 模板存储在 `/public/templates/` 目录（JSON 文件）。预设模板：电商平台（`e-commerce`）、SaaS 管理后台（`saas`）、社交应用（`social`）。Phase 1 入口添加「使用模板」按钮，弹出模板卡片网格，选择后自动填充三树数据。 |
| **验收标准** | `Given 用户在 Phase 1 需求输入页 When 点击「使用模板」 Then 显示模板卡片列表（电商/SaaS/社交等）`<br>`Given 用户选择「电商平台」模板 When 三树自动填充对应数据 Then 用户可在此基础上编辑修改` |
| **预估工时** | 6-8h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 低 — 纯前端 JSON 加载，无需后端 |

---

### P2-F11: 版本历史

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f11-version-history` |
| **背景** | 企业用户需要追溯建模变更历史（审计、合规、团队协作基础）。当前画布无版本概念，误操作后只能靠 Undo（有限步数）。版本历史是企业级产品的标配能力，也是后续协作功能的基础设施。 |
| **用户价值** | 任意时刻可回滚到历史版本；变更历史可追溯，增强建模信心。 |
| **实现方案** | API 侧存储快照，触发时机：用户手动点击「保存版本」、每次 AI 生成完成后自动创建快照、重要操作（批量确认/删除 > 3 个节点）。ProjectBar 添加「历史」按钮，弹出侧边抽屉列出快照列表，支持预览和回滚。 |
| **验收标准** | `Given 用户完成 AI 生成（Phase 2/3/4） When 系统自动创建快照 Then 用户可在版本历史中看到该快照`<br>`Given 用户在版本历史中点击某个历史快照 When 点击「恢复此版本」 Then 画布恢复到该快照状态（当前未保存工作将丢失警告）` |
| **预估工时** | 8-12h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 中 — 快照存储占用 API 容量；大量历史时面板性能 |

---

### P2-F12: MiniMap 导航

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f12-minimap` |
| **背景** | FlowCanvas 三树在大屏显示器上节点可能超出视口，MiniMap 提供全局导航概览。CardTree 已有 MiniMap prop 未激活，FlowCanvas 完全缺失。 |
| **用户价值** | 大型项目中秒级定位；全局结构一目了然。 |
| **实现方案** | 激活 ReactFlow 内置 `MiniMap` 组件，为三栏各自配置一个 MiniMap（每个 TreePanel 底部），响应式隐藏（< 768px）。`nodeColor` 回调根据节点类型着色。 |
| **验收标准** | `Given 用户在 FlowCanvas 三栏布局下 When 三栏均有节点 Then 每个 TreePanel 底部显示对应 MiniMap And 点击 MiniMap 区域跳转视图中心`<br>`Given 移动端访问画布（< 768px） Then MiniMap 隐藏` |
| **预估工时** | 2-3h |
| **依赖** | `canvas-p0-f1-deploy` |
| **技术风险** | 低 — ReactFlow 内置组件，激活即可 |

---

### P2-F13: 节点关系连线扩展

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f13-relationship-lines` |
| **背景** | 当前仅 Context 树节点间有 `RelationshipEdge` 关系连线。Flow 树和 Component 树节点之间的关联未可视化。Figma/Miro 的连接线是其协作价值的核心。 |
| **用户价值** | 三树间的关联关系可视化，减少认知负担；更清晰地理解 DDD 模型全貌。 |
| **实现方案** | 节点数据模型添加 `relationships: { targetId: string, type: string }[]` 字段。Flow 树和 Component 树引入 `RelationshipEdge` 组件复用。连线样式区分类型：实线（包含）、虚线（引用）、点线（依赖）。 |
| **验收标准** | `Given Flow 树中两个流程节点有父子关系 Then 显示连接线（带箭头）`<br>`Given Component 树中组件有 API 调用关系 Then 显示虚线连接` |
| **预估工时** | 6-10h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 中 — 连线过多时视觉混乱，需优先级/聚类策略 |

---

### P2-F14: 画布缩放控制

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p2-f14-zoom` |
| **背景** | 用户在大型 DDD 项目中需要放大查看细节、缩小看全貌。当前 FlowCanvas 三栏固定布局无法缩放。Excalidraw/Miro/Figma 均标配缩放。 |
| **用户价值** | 细节查看与全局概览兼得；适配不同屏幕尺寸和工作场景。 |
| **实现方案** | 激活 ReactFlow `Controls` 组件（放大/缩小/适应屏幕），添加鼠标滚轮缩放支持，缩放状态持久化到 store。 |
| **验收标准** | `Given 用户在 FlowCanvas When 点击放大/缩小按钮 Then 画布缩放级别变化`<br>`Given 用户点击 Fit View Then 所有节点适应屏幕并居中显示` |
| **预估工时** | 3-4h |
| **依赖** | `canvas-p0-f1-deploy` |
| **技术风险** | 低 — ReactFlow 内置功能 |

---

## 4. P3 — 生态扩展（长期规划）

> **目标**: 离线、设计系统、AI 增强，为企业化铺路

### P3-F15: 离线模式

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p3-f15-offline` |
| **背景** | 用户在飞机、高铁、网络不稳定场景下无法使用画布。Claude Code 原生离线支持，Excalidraw 也有离线模式。VibeX 若支持离线建模，用户场景从「在线工具」升级为「随身建模工具」。 |
| **用户价值** | 无网络场景可用；本地操作即时响应（无网络延迟）。 |
| **实现方案** | Service Worker 缓存（Workbox `CacheFirst`）+ IndexedDB 暂存离线操作队列，网络恢复后自动同步（冲突优先使用 API 数据）。离线状态 Banner 提示。 |
| **验收标准** | `Given 应用已加载且在线 When 网络断开 Then 显示「离线模式」Banner And 用户可继续在画布进行所有操作`<br>`Given 离线期间用户创建/修改了节点 When 网络恢复 Then 离线操作自动同步到服务器` |
| **预估工时** | 12-16h |
| **依赖** | `canvas-p0-f2-persistence`、`canvas-p2-f11-version-history` |
| **技术风险** | 高 — 冲突解决策略复杂；IndexedDB 配额管理 |

---

### P3-F16: 设计系统集成

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p3-f16-design-system` |
| **背景** | VibeX 组件树生成组件规范，但组件属性面板缺乏设计 Token 支持。Figma 的设计系统是其设计师用户留存的关键。VibeX 若集成设计系统，可吸引设计-开发协同场景。 |
| **用户价值** | 组件属性面板支持 Design Tokens；建模结果可直接映射到代码设计系统。 |
| **实现方案** | 定义 VibeX Design Token（`/src/styles/design-tokens.css`），ComponentTree 节点属性面板展示 Token 映射，导出 JSON 时包含 Token 引用。 |
| **验收标准** | `Given 用户在 ComponentTree 节点属性面板 When 查看组件样式属性 Then 显示 Design Token 引用（如 --color-primary）而非硬编码值` |
| **预估工时** | 8-10h |
| **依赖** | `canvas-p2-f11-version-history` |
| **技术风险** | 中 — 需要设计团队参与 Token 规范定义 |

---

### P3-F17: 协作评论

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p3-f17-comments` |
| **背景** | 团队建模需要讨论节点语义、业务规则。Figma/Miro 的评论功能让协作成为可能。VibeX 三树是团队决策的核心，评论是协作的基础。 |
| **用户价值** | 团队成员可在节点上留评论讨论；建模决策有迹可循。 |
| **实现方案** | 评论数据模型：`{ id, nodeId, userId, content, createdAt }`。节点添加评论气泡图标，显示未读评论数。点击展开评论列表（侧边抽屉或 popover），API 持久化评论数据。 |
| **验收标准** | `Given 用户点击节点评论图标 When 评论面板打开 Then 可添加/查看/删除评论`<br>`Given 有未读评论的节点 Then 节点显示评论气泡计数` |
| **预估工时** | 8-12h |
| **依赖** | `canvas-p0-f2-persistence` |
| **技术风险** | 中 — 实时评论通知需要 WebSocket 或轮询 |

---

### P3-F18: AI 实时反馈

| 字段 | 内容 |
|------|------|
| **Feature ID** | `canvas-p3-f18-ai-realtime` |
| **背景** | 当前 AI 生成是「全量完成后一次性展示」。Cursor 的内联建议、Figma AI 的实时辅助让用户感受 AI 与工具的无缝融合。VibeX 三树是 AI 生成密集型场景，实时反馈能显著提升生成体验。 |
| **用户价值** | AI 生成过程中实时看到节点生成（stream 体验）；减少等待焦虑，增强生成过程可理解性。 |
| **实现方案** | 改造 `canvasSseApi.ts` 支持逐节点 SSE 流（每个节点生成完即渲染）。前端监听 SSE 事件，增量更新 store + 树渲染，节点生成动画（淡入 + 脉冲高亮），错误节点特殊标记 + 错误信息展示。 |
| **验收标准** | `Given 用户启动 AI 生成 When 节点逐个生成 Then 每个节点生成完即出现在对应树中（无需等待全部完成）`<br>`Given 生成过程中出现错误 Then 错误节点显示 error 状态 And 其他节点继续生成` |
| **预估工时** | 10-15h |
| **依赖** | `canvas-p0-f1-deploy` |
| **技术风险** | 高 — SSE 流式更新与现有批量更新逻辑冲突；节点顺序保持 |

---

## 5. 实施路线图

| 阶段 | 内容 | 累计工时 | 预计周期 |
|------|------|---------|---------|
| **Phase 0** | P0-F1 画布部署 | 0.5h | 1 day |
| **Phase 1** | P0-F2 持久化 + P0-F3 主题迁移 | 12-18h | 2 days |
| **Phase 2** | P1-F4 Undo/Redo + P1-F6 快捷键 | 10-14h | 2 days |
| **Phase 3** | P1-F5 搜索 + P1-F7 拖拽 + P1-F8 原型连接 | 13-18h | 2 days |
| **Phase 4** | P2-F9 导出 + P2-F12 MiniMap + P2-F14 Zoom | 13-19h | 2 days |
| **Phase 5** | P2-F10 模板库 + P2-F11 版本历史 + P2-F13 关系连线 | 20-30h | 3 days |
| **Phase 6** | P3 生态扩展（离线/设计系统/评论/AI） | 38-53h | 长期规划 |

**总体预估工时**: P0 12.5-18.5h | P1 23-32h | P2 33-49h | P3 38-53h

---

## 6. DoD（Definition of Done）

每个功能完成的充要条件：

- [ ] 代码实现完成并通过 Code Review
- [ ] 所有验收标准对应的 expect() 测试或 Playwright E2E 测试通过
- [ ] 视觉验收（截图对比）通过
- [ ] 回归测试通过（不破坏已有功能）
- [ ] 文档更新（DESIGN.md、CHANGELOG.md）

---

*本文档由 PM Agent 生成 | 2026-03-29*
