# Analyst 提案 — VibeX Sprint 34 功能规划

**Agent**: analyst
**日期**: 2026-05-09
**项目**: vibex-proposals-sprint34
**仓库**: /root/.openclaw/vibex
**分析视角**: 可行性评估 / 风险分析 / 高优先级识别

---

## 1. Sprint 1-33 交付回顾

### 核心能力交付矩阵

| 能力域 | 已交付 | 代表功能 |
|--------|--------|----------|
| 实时协作 | ✅ | Firebase RTDB 节点同步 + LWW 仲裁 + ConflictBubble |
| 离线支持 | ✅ | IndexedDB 写入队列 + OfflineBanner 同步状态 |
| AI 增强 | ✅ | 需求澄清 API + ProtoPreview 实时联动 + AI Review CI |
| 模板系统 | ✅ | CRUD API + 导入导出 + Dashboard UI |
| 画布交互 | ✅ | Group 折叠 + Collab Intent Bubble + CanvasThumbnail |
| 导航/搜索 | ✅ | Dashboard 搜索增强 + Onboarding → Canvas 无断点 |
| 权限系统 | ✅ | RBAC 细粒度权限矩阵 |
| 通知系统 | ✅ | Slack DM + 站内通知降级 |
| 测试基础设施 | ✅ | Vitest 快照 + 视觉回归 + E2E 覆盖 |
| 项目迁移 | ✅ | 导入/导出 .vibex 文件 |

### 关键缺口识别

基于 Sprint 1-33 交付成果，以下能力域仍存在显著空白：

1. **画布操作原子性** — 无撤销/重做，长流程中一步错全要重来
2. **性能基线缺失** — 无 bundle 分析、无加载性能监控
3. **快捷键支持** — 零快捷键，高频用户效率瓶颈
4. **Webhook/Automation** — 无外部系统触发能力，集成受限
5. **移动端体验** — 画布无响应式支持

---

## 2. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 撤销/重做系统 | Canvas 全操作 | P0 |
| P002 | performance | 性能基线建立与 Bundle 优化 | 全部用户 | P0 |
| P003 | improvement | 快捷键系统 | Canvas / Editor | P1 |
| P004 | integration | Webhook 事件通知 | 企业用户 | P1 |
| P005 | improvement | 画布移动端响应式适配 | 移动用户 | P2 |

---

## 3. 提案详情

### P001: 撤销/重做系统

**问题描述**:
用户在画布上进行编辑操作（添加节点、编辑属性、移动位置等）后无法撤销，任何误操作只能手动恢复或重做。在 Group 折叠、属性编辑等操作频繁的场景下，这是最高频的用户痛点。

**根因分析**:

- Store 层无操作历史记录机制
- 所有状态变更直接覆盖，无快照
- confirmationStore 等状态机未设计 undo 边界

**影响范围**:
所有 Canvas 操作场景，影响所有用户类型。

**建议方案**:

#### 方案 A（推荐）：Command Pattern + History Stack

- `historyStore`: `{ past: Action[]`, `future: Action[]` } + `undo()` + `redo()`
- 每个 Canvas 操作封装为 `Command` 对象（`execute()` + `rollback()`）
- 关键操作覆盖：节点增删改、Group 折叠/展开、属性变更、位置移动
- `Ctrl+Z` / `Ctrl+Shift+Z` 键盘绑定
- localStorage 持久化（限制最近 50 步，防止膨胀）

**实施成本**: 中
**风险**: 低 — 不改变现有数据模型，仅在 Store 层加 wrapper
**回滚计划**: 删除 historyStore 即可回滚

#### 方案 B：Zustand Middleware 自动化

- 使用 `zustand/middleware` 的 `subscribeWithSelector` 被动记录
- 优点：无需为每个操作写 Command 类
- 缺点：无法精确控制"哪些操作可撤销"，粒度粗

---

### P002: 性能基线建立与 Bundle 优化

**问题描述**:
项目无性能监控基线，bundle 持续增长无感知。当前加载性能、render 性能、E2E 执行速度均无量化数据，无法判断优化效果。

**根因分析**:

- `vite-bundle-analyzer` 未集成到 CI
- Lighthouse/Performance API 未使用
- 无性能预算（budget）机制

**影响范围**:
全部用户，尤其首次加载和复杂画布用户。

**建议方案**:

#### 方案 A（推荐）：性能监控 + Bundle 分析

**Bundle 分析**:
- `vite-bundle-analyzer` 集成到 build 流程
- CI 中生成 bundle report，自动检查主包 > 500KB 告警
- 识别大依赖（分析 S32 交付物，Zustand + Firebase + Mermaid 等包体积）

**加载性能**:
- Lighthouse CI 集成（`@lhci/cli`）
- Core Web Vitals 基线：LCP < 2.5s, FID < 100ms, CLS < 0.1
- PR-level 性能回归检测

**运行时性能**:
- React DevTools Profiler 文档化
- 关键路径（画布加载、节点渲染）打标记

**实施成本**: 低
**风险**: 低
**回滚计划**: 纯监控工具，不影响业务逻辑

---

### P003: 快捷键系统

**问题描述**:
画布和编辑器无快捷键支持。用户在高强度编辑场景下需频繁使用鼠标，效率低于行业标准（Figma/Miro 均提供完整快捷键）。

**根因分析**:

- 组件层无键盘事件监听
- 无统一的快捷键注册机制
- 各组件独立处理，行为不一致

**影响范围**:
高频用户、产品经理、架构师等深度用户。

**建议方案**:

#### 方案 A（推荐）：`useHotkeys` Hook 统一管理

- `useHotkeys(scope, keys, callback)` hook，基于 `react-hotkeys-hook`
- 全局快捷键：`Ctrl+Z` (撤销)、`Ctrl+Shift+Z` (重做)、`Ctrl+S` (保存)、`Ctrl+/` (帮助)
- 画布快捷键：`Delete` (删除选中)、`Ctrl+A` (全选)、`Ctrl+D` (复制)、`Escape` (取消选中)
- 快捷键帮助面板（`?` 键触发）
- **注意**：与 P001 撤销/重做强耦合，建议同 Sprint 交付

**实施成本**: 中
**风险**: 中 — 快捷键可能与浏览器/OS 快捷键冲突，需 fallback
**回滚计划**: 移除 useHotkeys 调用即可

---

### P004: Webhook 事件通知

**问题描述**:
企业用户需要将 VibeX 事件（项目创建/更新、分享、协作者加入等）同步到外部系统（CRM、通知中心、数据仓库）。当前无任何外部触发能力。

**根因分析**:

- 后端无事件总线
- 分享通知仅限 Slack DM，未覆盖其他事件类型

**影响范围**:
企业用户、集成场景。

**建议方案**:

#### 方案 A（推荐）：事件驱动 Webhook

- `webhookStore` + `WebhookService`：管理 webhook 注册和投递
- 事件类型：`project.created`, `project.updated`, `project.shared`, `canvas.updated`
- POST 到用户配置的 URL，支持 HMAC 签名校验
- 投递重试（指数退避，最多 3 次）
- Webhook 管理 UI（Dashboard → Settings → Webhooks）
- **依赖**：S32/S33 的 NotificationService 基础设施可复用

**实施成本**: 高 — 涉及后端存储、投递队列、安全校验
**风险**: 中 — 需要幂等性设计，避免重复投递
**回滚计划**: 删除 webhookStore + API route

---

### P005: 画布移动端响应式适配

**问题描述**:
画布当前在小屏设备（平板、手机）上显示和交互体验差：节点溢出、缩放失控、无触摸手势支持。

**根因分析**:

- 画布 DOM 结构无 viewport 感知
- 无 pinch-to-zoom / swipe-pan 触摸手势
- 响应式断点未覆盖 Canvas 区域

**影响范围**:
平板用户、移动办公场景。

**建议方案**:

#### 方案 A：触摸手势 + 响应式断点

- `usePinchZoom` hook：`@use-gesture/react` 或自实现 pinch-to-zoom
- viewport 缩放阈值检测（< 768px 触发移动布局）
- 触摸手势：双指缩放、单指拖拽画布
- **注意**：移动端画布优先级低于核心桌面体验，建议 P2

**实施成本**: 中
**风险**: 中 — 触摸手势与现有缩放逻辑可能冲突
**回滚计划**: 移除手势 hook，恢复原有缩放逻辑

---

## 4. Sprint 34 优先级决策

### 推荐组合

| 组合 | 提案 | 总工时估算 | 理由 |
|------|------|-----------|------|
| **推荐** | P001 + P002 + P003 | 16h | 撤销/重做解决核心痛点，性能基线建立长期价值，快捷键提升效率 |
| **备选** | P001 + P002 + P004 | 20h | 企业集成导向，但 P004 成本高风险大 |

### 决策建议

**P001（撤销/重做）是 Sprint 34 必须项**。理由：

- 是 Sprint 1-33 交付列表中缺失的最基础操作能力
- 与 P003（快捷键）强耦合，同 Sprint 交付减少联调成本
- 实施成本中等，技术风险低

**P002（性能基线）是 Sprint 34 推荐项**。理由：

- 工时低（4h），ROI 极高
- 为后续所有优化提供量化依据
- 无破坏性，可持续叠加

**P003（快捷键）建议纳入 Sprint 34**。理由：

- 与 P001 共享 UI 层改动（键盘事件监听）
- 拆分到下一 Sprint 需重新对齐 Store 改动
- 用户感知价值明显

**P004（Webhook）建议推迟到 Sprint 35**。理由：

- 实施成本高（后端存储 + 投递队列）
- 需要独立评审（安全审计 + 幂等性设计）
- 非 P0，可等待

---

## 5. 执行依赖

### P001: 撤销/重做系统

- [ ] 需要修改的文件: `vibex-fronted/src/stores/dds/DDSCanvasStore.ts`, `vibex-fronted/src/hooks/useHistory.ts`
- [ ] 前置依赖: 无
- [ ] 需要权限: GitHub Actions CI write
- [ ] 预计工时: 6h
- [ ] 测试验证命令: `pnpm test --filter vibex-frontend -- --run`

### P002: 性能基线建立

- [ ] 需要修改的文件: `vibex-fronted/vite.config.ts`, `.github/workflows/perf-budget.yml`, `vibex-fronted/package.json`
- [ ] 前置依赖: 无
- [ ] 需要权限: GitHub Actions CI write
- [ ] 预计工时: 4h
- [ ] 测试验证命令: `pnpm build && pnpm analyze`

### P003: 快捷键系统

- [ ] 需要修改的文件: `vibex-fronted/src/hooks/useHotkeys.ts`, `vibex-fronted/src/components/dds/canvas/DDSFlow.tsx`, `vibex-fronted/src/components/canvas/CanvasPage.tsx`
- [ ] 前置依赖: P001（共享 Store 层变更）
- [ ] 需要权限: GitHub Actions CI write
- [ ] 预计工时: 6h
- [ ] 测试验证命令: `pnpm test --filter vibex-frontend -- --run`

### P004: Webhook 事件通知

- [ ] 需要修改的文件: `vibex-backend/src/lib/webhookStore.ts`, `vibex-backend/src/app/api/webhooks/route.ts`, `vibex-fronted/src/components/dashboard/WebhookSettings.tsx`
- [ ] 前置依赖: S32 NotificationService（可复用）
- [ ] 需要权限: GitHub Actions CI write
- [ ] 预计工时: 10h
- [ ] 测试验证命令: `pnpm test --filter vibex-backend -- --run`

### P005: 移动端响应式

- [ ] 需要修改的文件: `vibex-fronted/src/components/dds/canvas/DDSFlow.tsx`, `vibex-fronted/src/hooks/usePinchZoom.ts`
- [ ] 前置依赖: 无
- [ ] 需要权限: GitHub Actions CI write
- [ ] 预计工时: 8h
- [ ] 测试验证命令: `pnpm test --filter vibex-frontend -- --run`

---

## 6. 风险矩阵

| 提案 | 风险项 | 可能性 | 影响 | 缓解措施 |
|------|--------|--------|------|----------|
| P001 | History 存储膨胀导致内存问题 | 中 | 中 | 限制 50 步 + localStorage 压缩 |
| P001 | Command pattern 入侵现有 Store | 中 | 低 | 通过 middleware 包装，不改现有 action 签名 |
| P002 | CI 性能波动导致误报 | 中 | 低 | 设置合理阈值 + 趋势分析而非单次判断 |
| P003 | 快捷键与浏览器/OS 冲突 | 高 | 低 | 提供可配置的快捷键覆盖机制 |
| P004 | Webhook 投递死循环 | 低 | 高 | 用户可配置白名单域名 + 签名校验 |
| P004 | 投递队列阻塞主线程 | 中 | 中 | 使用独立 job queue (如 BullMQ) |
| P005 | 触摸手势与鼠标缩放冲突 | 高 | 中 | 通过媒体查询区分设备，仅移动端启用手势 |

---

## 执行决策

- **决策**: 待评审
- **执行项目**: vibex-proposals-sprint34
- **执行日期**: 待定

---

*本文档由 Analyst Agent 自动生成，基于 Sprint 1-33 交付成果分析。*
