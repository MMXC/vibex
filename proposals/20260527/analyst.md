**Agent**: analyst
**日期**: 2026-05-28
**项目**: vibex-proposals-sprint39
**仓库**: /root/.openclaw/vibex
**分析视角**: 基于 Sprint 1-38 交付成果，识别下一批高优先级功能增强

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | i18n 收尾 + AI 生成区翻译迁移 | 所有用户 | P0 |
| P002 | improvement | 实时协作同步层（WebSocket + 操作广播） | 团队用户 | P0 |
| P003 | improvement | DiffOverlay 增强 + 评分卡调优 | AI 用户 | P1 |
| P004 | improvement | MiniMap 搜索 + 节点高亮导航 | 大型画布用户 | P1 |
| P005 | improvement | Service Worker 离线缓存 + 加载体验 | 弱网用户 | P1 |

---

## 2. 提案详情

### P001: i18n 收尾 + AI 生成区翻译迁移

**问题描述**:

Sprint 38 完成了 i18n 框架安装、DDSToolbar 试点、Settings 语言切换 UI、以及大部分 UI 组件的文本迁移。但 `src/app/` 下的 AI 生成相关页面（Sprint 6 的 AI Coding Agent 集成产物）因 AGENTS.md 禁止手动编辑 `src/app/`，文本仍硬编码为英文。AI 生成区（代码预览、生成进度、错误提示、确认弹窗）是用户最高频使用的功能，却完全没有本地化。

**影响范围**:

- AI Coding Agent 用户（中英文用户）
- `src/app/ai/` 目录下的所有页面和组件
- `src/components/agent/` 下的 AI 相关组件

**验收标准**:

- [ ] `src/app/ai/` 下所有页面文本使用 `useTranslations('ai')` 获取（零硬编码英文）
- [ ] AI 生成进度提示（`Generating...` / `正在生成...`）、成功/失败提示全部 i18n 化
- [ ] DiffOverlay（已存在）按钮和标签 i18n 化
- [ ] AIScoreCard（已存在）UI 文本 i18n 化
- [ ] `zh.json` 和 `en.json` 的 `ai` 命名空间覆盖上述所有场景
- [ ] `pnpm exec tsc --noEmit` TypeScript 编译通过
- [ ] `pnpm build` 构建通过

**工作量估算**: 1-2 人天

---

### P002: 实时协作同步层（WebSocket + 操作广播）

**问题描述**:

Sprint 38 P002 完成了"协作感知"的前端 UI 层（oplog 记录、AI indicator、冲突警告、Ctrl+H overlay），但底层缺乏实时同步机制。当前画布状态变更仅存储在本地 Zustand store，团队成员之间无法感知彼此的操作。Sprint 6 的 AI Coding Agent 也仅是单用户反馈回路，多人协作场景下 AI 修改对其他成员完全不可见。

**影响范围**:

- 团队协作场景（多人同时在线）
- AI Agent + 人类用户混合场景
- `src/lib/canvas/stores/` 下所有 canvas store

**根因分析**:

- **根因**: 缺乏 WebSocket 协作层；canvas store 无广播机制；无共享状态同步协议
- **证据**: 所有 store 仅 localStorage 持久化，无网络同步；`businessFlowStore.updateNode` 直接覆盖，无冲突解决

**验收标准**:

- [ ] 架构设计文档（`docs/vibex-proposals-sprint39/architecture.md`）包含 WebSocket 协议设计
- [ ] `CollaborationProvider` React context 实现（WebSocket 连接管理）
- [ ] canvas store 操作广播：每次 `updateNode` / `addNode` / `deleteNode` 通过 WebSocket 广播
- [ ] 远程操作接收：WebSocket 消息 → 合并到本地 store（OT 合并策略）
- [ ] 用户在线状态显示：Canvas 页面显示在线用户头像列表
- [ ] 连接状态指示器（Connected / Reconnecting / Offline）
- [ ] 后端 WebSocket 端点文档（Cloudflare Workers Durable Objects 或类似）

**工作量估算**: 3-5 人天

---

### P003: DiffOverlay 增强 + 评分卡调优

**问题描述**:

Sprint 38 P003 交付了 DiffOverlay UI（approve/reject 按钮、error banner）和 AIScoreCard（3 维度评分），但存在以下遗留问题：
1. DiffOverlay 仅支持行级 diff，不支持文件级概览（多个代码块时只能逐个查看）
2. AIScoreCard 的评分算法过于简单（基于行数统计），缺乏实际代码质量洞察
3. DiffOverlay 和 AIScoreCard 无历史记录，评分数据无法跨 session 对比

**影响范围**:

- AI Coding Agent 用户
- `src/components/agent/DiffOverlay.tsx`、`src/components/AIScoreCard/`

**验收标准**:

- [ ] DiffOverlay 多文件概览模式：session 包含多个 codeBlock 时，显示文件列表 tab，点击切换
- [ ] AIScoreCard 评分算法增强：引入 token count 估算（`@anthropic/token-counter` 或近似）、圈复杂度估算（基于 diff 统计）、测试覆盖率关联
- [ ] 历史评分趋势：Settings 页面 AI Scores 面板支持时间序列图（ASCII sparkline 或简易 SVG chart）
- [ ] DiffOverlay 支持"复制 diff 为 JSON"（方便分享审查）
- [ ] `pnpm exec tsc --noEmit` TypeScript 编译通过

**工作量估算**: 1.5-2.5 人天

---

### P004: MiniMap 搜索 + 节点高亮导航

**问题描述**:

Sprint 38 P005-E3 已完成 MiniMap 基础功能（左面板折叠、点击跳转、viewport 边框）。但大型画布（100+ 节点）场景下，MiniMap 缺乏搜索导航能力：用户无法通过节点名称/类型快速定位，MiniMap 仅提供视觉缩略图而非导航工具。

**影响范围**:

- 大型画布用户（100+ 节点）
- `src/components/dds/MiniMapPanel.tsx`

**验收标准**:

- [ ] MiniMapPanel 顶部搜索框：输入节点名称/ID 实时过滤 MiniMap 上的节点高亮
- [ ] MiniMap 点击高亮：搜索结果点击 → 节点在 MiniMap 上高亮闪烁 + Flow canvas `setViewport` 跳转到节点位置
- [ ] 节点类型颜色过滤：MiniMap 支持按类型（Context / Component / ExternalService）过滤显示
- [ ] MiniMap 缩放控制：+/- 按钮调节 MiniMap 显示比例（0.25x - 1x）
- [ ] 节点计数 badge：MiniMap 角落显示总节点数
- [ ] vitest 测试覆盖

**工作量估算**: 1-2 人天

---

### P005: Service Worker 离线缓存 + 加载体验

**问题描述**:

当前 VibeX 前端每次访问都从 Cloudflare Pages 完整加载资源。对于弱网用户（移动网络、地铁等），首屏加载慢且无离线能力。Sprint 38 交付的主题系统（CSS 变量驱动）和 i18n（语言包动态导入）都为离线缓存提供了良好的资产分割基础，但尚未建立 Service Worker 缓存策略。

**影响范围**:

- 弱网/离线场景用户
- 所有 Canvas 页面（SplashScreen 体验）
- 主题文件、i18n 语言包（天然适合 CDN 缓存）

**验收标准**:

- [ ] Service Worker 注册（`src/sw.ts`），使用 Workbox 或原生 SW API
- [ ] 运行时缓存策略：静态资源（JS/CSS/字体）Cache-First，API 响应 Network-First
- [ ] App Shell 缓存：SplashScreen、骨架屏在无网络时可用
- [ ] 离线状态检测：`useOnlineStatus` hook（监听 `navigator.onLine` + `online`/`offline` 事件）
- [ ] OfflineBanner.tsx（已有）：在离线时显示当前页面仍可交互（本地状态），但远程操作不可用
- [ ] 语言包预缓存：已选择的语言包（en/zh）在首次加载后缓存，后续启动无需网络
- [ ] Lighthouse PWA 评分 ≥ 90

**工作量估算**: 2-3 人天
