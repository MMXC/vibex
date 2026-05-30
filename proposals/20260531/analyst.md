# Sprint 45 提案分析

> **Agent**: coord (heartbeat self-implement)
> **日期**: 2026-05-31
> **触发**: analyst CLI-dispatch ghost — analyst 派发后 8h+ 无输出，coord 自举完成 Sprint45 提案分析，基于 Sprint44 (E1-E5) 交付成果识别下一批高优先级功能增强。
> **方法**: 审查 CHANGELOG + 代码缺口分析 + 用户体验优先级

---

## 背景：Sprint44 交付成果

| Epic | 名称 | 状态 | 关键产出 |
|------|------|------|---------|
| E1 | AI 多轮会话管理 | ✅ | IndexedDB 持久化、分支管理、流式进度 |
| E2 | 画布模板分类+收藏 | ✅ | inferCategory、Favorites Star、分类筛选 |
| E3 | 协作节点锁定 | ✅ | 🔒锁overlay、presenceStore lock/unlock |
| E4 | 撤销历史面板 | ✅ | selectiveUndo、HistoryPanel 侧边栏 |
| E5 | 移动端触控 | ✅ | pinch-to-zoom、双指平移、双击选中 |

**已验证技术基础**：
- AI Session → IndexedDB 持久化链路打通
- Presence → WebSocket 实时同步已集成
- Canvas → History/Camera/Undo 基础设施完整
- Touch → gesture hook 已建立

---

## P001 (P0) — AI 断线重连 + 流式可靠性增强

### 问题描述
当前 AI 流式响应（E1/E2 SSE）在网络波动时直接失败，用户丢失 session 内容。无重试机制、无恢复能力、流式中断后 UI 卡死。

### 根因分析
- `useStreamingAgent.ts` 使用 `AbortController` 但无 retry/backoff
- SSE 连接断开后 `agentStore` 状态未清理（status 卡在 `streaming`）
- `AgentFeedbackPanel` 在中断后无降级文案
- IndexedDB session 内容与当前流内容可能不一致

### 技术可行性
**高** — 已有基础设施完整，只需：
1. `retry` 逻辑封装（exponential backoff, max 3次）
2. `agentStore` 增 `error`/`retrying` 状态
3. `AgentFeedbackPanel` 增重连提示文案（i18n key）
4. 断连时保留已有 chunk 到 IndexedDB

**风险**：SSE 不可重入（已完成部分流可能被重复追加）。需 dedup 机制（sessionId + timestamp）。

### DoD
- [ ] `useStreamingAgent` 支持 `maxRetries` 参数 + exponential backoff
- [ ] `agentStore` 新增 `retrying` 状态，UI 显示重连中
- [ ] 重试 3 次耗尽后：UI 显示「连接失败，可手动重试」+ i18n key `aiStreamFailed`
- [ ] 断连时已接收 chunk 写入 IndexedDB（不丢失内容）
- [ ] Vitest: 覆盖断连/重试场景（mock SSE close event）
- [ ] E2E: `ai-reconnect.spec.ts` 验证断线 → 重连 → 完整内容

---

## P002 (P0) — Presence 协作光标 + 实时用户列表

### 问题描述
Sprint43/44 的 presence 系统实现了节点锁定（E3），但协作者之间看不到彼此的光标位置和用户名。用户不知道谁在画布的哪个位置操作。

### 根因分析
- `presenceStore` 只有 `lockedNodes` 状态，无 `cursors` 状态
- `RemoteCursor` 组件（Sprint42 Firebase 版）已被移除，未迁移到 WebSocket 版
- WebSocket presence 消息只处理 lock/unlock，未广播 cursor 位置

### 技术可行性
**高** — WebSocket 基础设施已就绪（Sprint43 集成完成）：
1. `presenceStore` 扩增 `cursors: Map<userId, {x,y,name,color}>`
2. 新增 `handleCursorMoveMessage` 处理 `cursor_move` 事件
3. `RemoteCursor.tsx` 组件重建（从 git history 找回或重写）
4. `DDSCanvasPage` 集成 `RemoteCursor` 渲染层

**风险**：高频 cursor_move 消息可能引发性能问题。需 throttle（100ms）。

### DoD
- [ ] `presenceStore` 新增 `cursors` 状态 + `updateCursor` action
- [ ] WebSocket handler 处理 `cursor_move` 消息类型
- [ ] `RemoteCursor.tsx` 组件：用户名标签 + 彩色光标 + 淡出动画
- [ ] `DDSCanvasPage.tsx` 渲染所有远程光标
- [ ] Throttle cursor 广播至 100ms 间隔
- [ ] Vitest: `presenceStore` cursor 状态测试
- [ ] dual-CHANGELOG 更新

---

## P003 (P1) — 画布 MiniMap + 视口导航控件

### 问题描述
大画布场景下，用户无法快速定位当前视口位置。缺少全局缩略图导航（Sprint39 PRD 提过但未实现）。

### 根因分析
- `@xyflow/react ^12.10.1` 内置 `MiniMap` 组件，但 DDSFlow 未集成
- `Controls` 组件（内置）也未集成
- Sprint39 PRD 描述过 MiniMap，architecture-review 确认为「待实施」

### 技术可行性
**高** — 内置组件，无需安装额外包：
1. `DDSFlow.tsx` 导入 `MiniMap, Controls, Background` 从 `@xyflow/react`
2. 添加 MiniMap 位置配置（右下角，150×100px）
3. `Background` 组件添加网格背景
4. `Controls` 添加缩放/适应屏幕按钮

**风险**：MiniMap 需要遍历所有节点计算边界，大画布可能有性能影响。需 `proactiveUpdate` 优化。

### DoD
- [ ] `DDSFlow.tsx` 集成 `MiniMap`（右下角 150×100px，深色主题）
- [ ] `DDSFlow.tsx` 集成 `Controls`（左下角，缩放+适应）
- [ ] `DDSFlow.tsx` 集成 `Background`（网格，点状）
- [ ] MiniMap 点击跳转视口
- [ ] Vitest: MiniMap 渲染测试（snapshot 或 render 测试）
- [ ] dual-CHANGELOG 更新

---

## P004 (P1) — 模板版本管理 + 导入/导出

### 问题描述
用户创建的工作流模板无法版本化、更新后无法追溯历史。模板只能「替换」无法「对比」。也没有模板的导入/导出功能。

### 根因分析
- `RequirementTemplate` 接口无 `version`/`createdAt`/`updatedAt` 字段
- `templateStore` 无版本历史存储
- 无模板序列化（JSON export/import）能力
- Sprint44 E2 只做了分类+favorites，未涉及版本

### 技术可行性
**中** — 需要扩展存储模型：
1. `RequirementTemplate` 增 `version: number`、`createdAt`、`updatedAt`
2. `templateStore` 增 `templateHistory: Map<id, Template[]>`（最多保留 5 个版本）
3. `TemplateGallery` 增「版本历史」按钮（展开抽屉）
4. 新增 `exportTemplate(id)` → JSON download
5. 新增 `importTemplate(json)` → upload + merge

**风险**：版本冲突（多人同时编辑同一模板）。MVP 阶段只做单人版本历史，云端同步留给后续 Sprint。

### DoD
- [ ] `RequirementTemplate` 增 version/createdAt/updatedAt 字段
- [ ] `templateStore` 增 `saveTemplateVersion(id)` + `getTemplateHistory(id)`
- [ ] `TemplateGallery` 增「历史」按钮 → 展开侧边栏显示版本列表
- [ ] `exportTemplate` → `Blob` download（JSON）
- [ ] `importTemplate` → file input + parse + merge
- [ ] Vitest: `templateStore` version 相关测试
- [ ] dual-CHANGELOG 更新

---

## P005 (P2) — 画布快照分享 + 公开链接

### 问题描述
用户需要将当前画布状态分享给未登录用户（如汇报、反馈收集）。目前只能截图或导出 PNG，无「公开只读链接」功能。

### 根因分析
- 无 snapshot 存储机制（画布状态 → 静态 JSON）
- 无公开链接生成 API
- 无匿名访问的只读渲染模式

### 技术可行性
**中** — 需要后端支持 snapshot 存储：
1. `POST /api/snapshot` — 接收当前画布 JSON，生成唯一 ID，存入 D1
2. `GET /api/snapshot/:id` — 返回画布 JSON
3. `src/app/snapshot/[id]/page.tsx` — 公开只读渲染页（无编辑工具栏）
4. 分享按钮 → 复制链接 `https://vibex-app.pages.dev/snapshot/{id}`

**风险**：数据持久化 + 匿名滥用。需要 rate limit 或 token 验证。MVP 阶段限制快照数量（每个用户最多 10 个）。

### DoD
- [ ] `POST /api/snapshot` — 存储画布 JSON 到 D1，返回 snapshot ID
- [ ] `GET /api/snapshot/:id` — 读取并返回画布 JSON
- [ ] `/snapshot/[id]/page.tsx` — 公开只读渲染（无 toolbar，无编辑）
- [ ] `ShareButton` → 「复制分享链接」功能（Clipboard API）
- [ ] 路由守卫：未登录用户只能看 snapshot，不能创建
- [ ] Vitest: API route 测试
- [ ] dual-CHANGELOG 更新

---

## 优先级汇总

| 提案 | 优先级 | 工作量 | 依赖 Sprint44 |
|------|--------|--------|-------------|
| P001 AI断线重连 | P0 | 中 | E1 流式基础 |
| P002 Presence光标 | P0 | 中 | E3 lock 基础设施 |
| P003 MiniMap | P1 | 小 | 独立功能 |
| P004 模板版本 | P1 | 中 | E2 favorites 基础 |
| P005 快照分享 | P2 | 中 | 需后端 D1 |

**建议 Sprint45 Epic 分配**：
- E1: P001 (AI重连)
- E2: P002 (Presence光标)
- E3: P003 (MiniMap)
- E4: P004 (模板版本)
- E5: P005 (快照分享)

**风险项**：P001 涉及流式 SSE 可靠性（复杂），P005 涉及后端存储（工作量较大）。建议各预留 1.5× 时间。
