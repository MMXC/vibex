**Agent**: hermes (coord heartbeat self-implement)
**日期**: 2026-05-28
**项目**: vibex-proposals-sprint39
**触发**: pm-review CLI-dispatch ghost — pm agent was never notified (updatedBy=cli, Slack socket instability during dispatch window), coord self-implemented prd.md

---

## 功能列表

| ID | 标题 | 类别 | 优先级 | 页面集成 |
|----|------|------|--------|----------|
| P001 | i18n 收尾：AI 生成区翻译迁移 | improvement | P0 | Settings, DDSToolbar, `src/app/ai/` 页面 |
| P002 | 实时协作同步层（WebSocket + 操作广播） | improvement | P0 | DDSCanvasPage, 全局 store |
| P003 | DiffOverlay 增强 + 评分卡调优 | improvement | P1 | DDSCanvasPage, DiffOverlay 组件 |
| P004 | MiniMap 搜索 + 节点高亮导航 | improvement | P1 | DDSCanvasPage, DDSFlow 画布 |
| P005 | Service Worker 离线缓存 + 加载体验 | improvement | P1 | 全局 App Shell |

---

## 功能详设

### P001: i18n 收尾：AI 生成区翻译迁移

**关联提案**: analysis.md §P001

**问题背景**: Sprint38 完成了 i18n 框架安装和 DDSToolbar 试点，但 `src/app/ai/` 目录（Sprint6 AI Coding Agent 产物）因 AGENTS.md 约束未迁移。

**DoD (Definition of Done)**:
- [ ] `src/app/ai/` 页面使用 `useTranslations('ai')()` 替换所有硬编码中文按钮/标签/提示文本
- [ ] `src/i18n/messages/en.json` 包含 `ai.*` key 完整翻译
- [ ] `src/i18n/messages/zh.json` 包含 `ai.*` key 完整翻译
- [ ] Next.js App Router `src/app/ai/` 页面接受 `locale` 参数（Server Component 改造验证）
- [ ] `next-intl` 中间件正确处理 `Accept-Language` header 自动检测
- [ ] 语言偏好持久化到 `userPreferencesStore.locale`（Settings UI 复用 S38）
- [ ] `pnpm exec tsc --noEmit` 成功，无 i18n key 缺失类型错误
- [ ] `pnpm build` 成功，无类型错误
- [ ] 手动验证：`/en/ai` 页面显示英文，`/zh/ai` 页面显示中文

**页面集成**:
- 修改文件: `vibex-fronted/src/app/ai/page.tsx` (或 `ai/.../page.tsx`)，`vibex-fronted/src/components/DDSToolbar/DDSToolbar.tsx`
- 新增翻译: `vibex-fronted/src/i18n/messages/en.json` (ai namespace), `vibex-fronted/src/i18n/messages/zh.json` (ai namespace)

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | `src/app/ai/` i18n 迁移 + App Router 兼容性验证 | 2h |

**实现文件**:
- Modified: `vibex-fronted/src/app/ai/.../page.tsx` (需确认实际文件结构)
- Modified: `vibex-fronted/src/i18n/messages/en.json`, `vibex-fronted/src/i18n/messages/zh.json`

---

### Epic E1: i18n 收尾 + AI 生成区翻译迁移

**DoD checklist** (dev agent):
1. 找到 `src/app/ai/` 下所有页面文件：`find vibex-fronted/src/app -name "*.tsx" | xargs grep -l "生成\|AI\|开始\|暂停\|停止\|重试\|导出"`
2. 替换所有硬编码中文为 `useTranslations('ai')('key')` 调用
3. 补充 `en.json` 和 `zh.json` 的 `ai.*` namespace
4. 验证 App Router Server Component 兼容性（如需，改为 Client Component 并传 locale）
5. `pnpm exec tsc --noEmit` 通过 ✅
6. `pnpm build` 成功 ✅
7. 更新 dual-CHANGELOG（root + frontend）

**DoD checklist** (tester agent):
1. vitest: `src/i18n/` 相关测试文件通过
2. E2E: `/en/ai` 和 `/zh/ai` 页面语言切换验证

**DoD checklist** (reviewer agent):
1. `src/app/ai/` 所有硬编码中文已移除 ✅
2. `i18n/messages/en.json` 和 `zh.json` 包含完整 ai namespace ✅
3. TypeScript 编译通过 ✅
4. CHANGELOG 双文件已更新 ✅

---

### P002: 实时协作同步层（WebSocket + 操作广播）

**关联提案**: analysis.md §P002

**问题背景**: Sprint38 P002 交付了协作感知 UI（oplog、AI indicator、冲突警告），但缺乏底层同步机制。本提案引入 WebSocket 实时同步。

**DoD (Definition of Done)**:
- [ ] WebSocket 连接层：与 VibeX 后端 (`api.vibex.top`) 建立 WebSocket 连接，复用现有认证 token
- [ ] `useCollaboration` hook: `connect()`, `disconnect()`, `broadcast(action)`, `onRemoteAction(callback)`
- [ ] `businessFlowStore` 的 `oplog` 通过 WebSocket 广播到其他用户
- [ ] 远程用户操作通过 `onRemoteAction` 触发本地 store 更新（节点增删改）
- [ ] 用户在线状态：DDSToolbar 显示在线用户头像列表（`/api/collaboration/users` REST 轮询）
- [ ] 冲突检测：同一 `nodeId` 在 1s 内两次写入 → 本地 Toast "⚠️ 冲突检测到"
- [ ] `git diff vibex-fronted/src/app/ai/` 无未同步本地改动
- [ ] `pnpm test` 全部通过

**⚠️ 架构决策待定**: Cloudflare Workers 环境无 WebSocket 原生支持。方案 A: 传统 WebSocket 服务器（Fly.io/Railway）；方案 B: Cloudflare Durable Objects。Architect 在 `architecture.md` 中决策。

**页面集成**:
- 新文件: `vibex-fronted/src/lib/collaboration/useCollaboration.ts`, `vibex-fronted/src/lib/collaboration/websocket.ts`
- 修改文件: `vibex-fronted/src/stores/businessFlowStore.ts` (broadcast bridge)
- 新增 UI: `vibex-fronted/src/components/OnlineUsers/OnlineUsers.tsx`

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | WebSocket 基础连接层 + useCollaboration hook | 3h |
| E2 | canvas 操作 OT 合并 + 冲突检测 | 2h |
| E3 | 用户在线状态 UI | 1h |

---

### Epic E1: WebSocket 基础连接层

**DoD checklist** (dev agent):
1. WebSocket 客户端初始化（`new WebSocket(url)`，URL 来自环境变量）
2. `useCollaboration.ts` hook: `connect()`, `disconnect()`, `broadcast(type, payload)`, `subscribe(handler)`
3. 自动重连逻辑（指数退避，max 3 次）
4. Store bridge: 在 `businessFlowStore` 的 `updateNode`/`addNode`/`deleteNode` 时调用 `broadcast()`
5. `pnpm exec tsc --noEmit` 通过 ✅
6. CHANGELOG 更新 ✅

**DoD checklist** (tester agent):
1. vitest: `useCollaboration.test.ts` mock WebSocket 测试
2. E2E: 两浏览器窗口同时编辑，验证操作同步

**DoD checklist** (reviewer agent):
1. WebSocket 重连逻辑存在 ✅
2. store 操作已 bridged 到 broadcast ✅
3. TypeScript 编译通过 ✅

---

### Epic E2: canvas 操作 OT 合并 + 冲突检测

**DoD checklist** (dev agent):
1. 收到远程 `updateNode` 时，检查本地 `oplog` 最近 1s 内是否有同 `nodeId` 的写入
2. 冲突时：本地 Toast 显示"⚠️ 与用户 X 的修改冲突"，节点边框变黄
3. 冲突版本保留在 `confirmationStore.conflictSnapshots`
4. `pnpm exec tsc --noEmit` 通过 ✅
5. CHANGELOG 更新 ✅

---

### Epic E3: 用户在线状态 UI

**DoD checklist** (dev agent):
1. `GET /api/collaboration/users` 返回在线用户列表 `[{userId, name, avatar}]`
2. DDSToolbar 右下角显示在线用户头像堆叠（最多 3 个 + `+N`）
3. 用户下线时从列表移除（WebSocket close 或轮询超时）
4. `pnpm exec tsc --noEmit` 通过 ✅
5. CHANGELOG 更新 ✅

---

### P003: DiffOverlay 增强 + 评分卡调优

**关联提案**: analysis.md §P003

**问题背景**: Sprint38 P003 交付了 DiffOverlay 基础功能和 AIScoreCard 基础 UI，但多文件概览缺失、评分算法简单。

**DoD (Definition of Done)**:
- [ ] DiffOverlay 多文件 tab 切换：每个 tab 显示一个文件 diff，tab 标签为文件名
- [ ] 评分卡 Token 估算：`@anthropic/token-counter` 或 `new Blob([code]).size * 0.75` 近似，标注 "(~N tokens)"
- [ ] 圈复杂度估算：使用 `halstead complexity` 或等效近似，显示在评分卡
- [ ] AIScoreCard 展示: 代码行数 + Token 估算 + 复杂度评分 + 总评分
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] `pnpm test` 全部通过（vitest）

**页面集成**:
- 修改文件: `vibex-fronted/src/components/DiffOverlay/DiffOverlay.tsx`, `vibex-fronted/src/components/AIScoreCard/AIScoreCard.tsx`

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | DiffOverlay 多文件 tab + Token 估算 | 1.5h |
| E2 | 评分卡复杂度指标 | 1h |

---

### Epic E1: DiffOverlay 多文件 tab + Token 估算

**DoD checklist** (dev agent):
1. DiffOverlay 增加 `files: DiffFile[]` state 和 `activeTab` state
2. 每个文件一个 tab，tab label = 文件名
3. 切换 tab 时显示对应文件的 diff 内容
4. Token 估算显示在文件概览区
5. `pnpm exec tsc --noEmit` 通过 ✅
6. CHANGELOG 更新 ✅

---

### Epic E2: 评分卡复杂度指标

**DoD checklist** (dev agent):
1. AIScoreCard 显示 "代码行数: N 行"
2. AIScoreCard 显示 "Token 估算: ~M tokens"
3. AIScoreCard 显示 "复杂度评分: X/10"（基于圈复杂度近似）
4. 总评分 = 行数分 * 0.4 + Token分 * 0.3 + 复杂度分 * 0.3
5. `pnpm exec tsc --noEmit` 通过 ✅
6. CHANGELOG 更新 ✅

---

### P004: MiniMap 搜索 + 节点高亮导航

**关联提案**: analysis.md §P004

**⚠️ 当前状态**: Sprint38 P005-E3 已将 `@xyflow/react` 内置 `MiniMap` 组件 import 并静态渲染在 `DDSFlow.tsx` 底部左侧。本提案需在现有 MiniMap 基础上添加搜索导航功能。

**DoD (Definition of Done)**:
- [ ] MiniMap 搜索框：DDSCanvasPage 左侧面板（或 MiniMap 附近）增加 `搜索节点...` 输入框
- [ ] 搜索过滤：`useMemo` 过滤 `nodes` 中 `label` 包含搜索词的节点
- [ ] MiniMap 高亮：匹配节点在 MiniMap 中高亮显示（红色或蓝色矩形）
- [ ] 点击 MiniMap 节点：`setViewport` 跳转到该节点
- [ ] MiniMap viewport 边框：当前视口区域用虚线矩形标注在 MiniMap 上
- [ ] 搜索无结果时 MiniMap 显示全部节点
- [ ] `pnpm exec tsc --noEmit` 成功
- [ ] E2E: 搜索关键词，MiniMap 高亮 + 视口跳转成功

**页面集成**:
- 修改文件: `vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx` (MiniMap panel), `vibex-fronted/src/components/DDSCanvas/DDSCanvasPage.tsx` (搜索框)
- 新文件: `vibex-fronted/src/hooks/useMiniMapSearch.ts`

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | MiniMap 搜索框 + 节点高亮 + 视口边框 | 2h |

---

### Epic E1: MiniMap 搜索 + 节点高亮 + 视口边框

**DoD checklist** (dev agent):
1. `useMiniMapSearch.ts`: `searchTerm`, `highlightedNodes`, `filteredViewport` state
2. DDSCanvasPage 增加搜索输入框（复用现有 UI 组件风格）
3. MiniMap `nodeColor` prop：根据节点是否在 `highlightedNodes` 动态设置颜色
4. MiniMap `onClick`: 调用 `fitView()` 或 `setViewport` 跳转到节点
5. MiniMap viewport border: `@xyflow/react` `ViewportPortal` + SVG `<rect>` 标注当前视口范围
6. `pnpm exec tsc --noEmit` 通过 ✅
7. CHANGELOG 更新 ✅

**⚠️ 验证**: `grep -n "MiniMap" vibex-fronted/src/components/DDSCanvas/DDSFlow.tsx` 确认 MiniMap import 和 render 位置后再实现。

---

### P005: Service Worker 离线缓存 + 加载体验

**关联提案**: analysis.md §P005

**问题背景**: 弱网用户体验差，无离线能力。Sprint38 主题系统和 i18n 语言包为离线缓存提供了良好资产分割。

**DoD (Definition of Done)**:
- [ ] Service Worker 注册：`src/app/layout.tsx` 注册 SW（使用 Workbox `registerRoute`）
- [ ] 静态资源缓存策略：Cache-First for JS/CSS/图片，`StaleWhileRevalidate` for fonts
- [ ] 语言包离线缓存：`/i18n/messages/zh.json` 和 `en.json` 缓存到 Cache Storage
- [ ] App Shell: SplashScreen 复用（Sprint6 已有），离线时显示"离线模式"提示
- [ ] 离线 API 降级：`/api/*` 请求失败时返回 cached data 或 `null`（不崩溃）
- [ ] `src/manifest.json` 存在且包含 `name`, `short_name`, `icons: [192, 512]`
- [ ] Lighthouse PWA 评分 ≥ 70（首次）→ ≥ 90（目标）
- [ ] `pnpm build` 成功（Workbox 插件注入 SW）

**⚠️ 兼容性问题**: Workbox 与 Next.js 15 App Router Service Worker 注册方式需验证。参考 `next-pwa` 或手动 `navigator.serviceWorker.register('/sw.js')`。

**页面集成**:
- 新文件: `vibex-fronted/public/sw.js` (Workbox generated), `vibex-fronted/public/workbox-*.js`
- 修改文件: `vibex-fronted/src/app/layout.tsx` (SW 注册), `vibex-fronted/public/manifest.json`

**Epic 拆分**:
| Epic | 内容 | 预估 |
|------|------|------|
| E1 | Service Worker 注册 + 静态资源缓存 | 2h |
| E2 | 语言包 + API 降级离线 | 1h |
| E3 | manifest.json + PWA 图标 + Lighthouse 优化 | 1h |

---

### Epic E1: Service Worker 注册 + 静态资源缓存

**DoD checklist** (dev agent):
1. `public/sw.js` 存在（Workbox build 输出）
2. `layout.tsx` 客户端组件中调用 `navigator.serviceWorker.register('/sw.js')`
3. Workbox 配置: `CacheFirst` for `/static/*`, `StaleWhileRevalidate` for fonts
4. SW 激活日志：`console.log('[SW] Registered')` 在 browser console
5. 离线验证：DevTools → Network → Offline → 刷新页面，资源仍加载
6. `pnpm build` 成功 ✅
7. CHANGELOG 更新 ✅

---

### Epic E2: 语言包 + API 降级离线

**DoD checklist** (dev agent):
1. 语言包缓存：`workbox.precaching.precacheAndRoute([...])` 包含 `/i18n/messages/*.json`
2. API 降级：`fetch('/api/...')` 包装器，失败时返回 `Cache.match()` 或 `{ offline: true }`
3. 离线指示器：Store 增加 `isOffline` state，DDSToolbar 显示"📴 离线" badge
4. `pnpm exec tsc --noEmit` 通过 ✅
5. CHANGELOG 更新 ✅

---

### Epic E3: manifest.json + PWA 图标 + Lighthouse 优化

**DoD checklist** (dev agent):
1. `public/manifest.json` 包含: `name`, `short_name`, `start_url: '/'`, `display: 'standalone'`, `icons: [192, 512]`
2. SVG icon 生成 `icon-192.png` 和 `icon-512.png`（或使用内联 SVG 转 PNG）
3. `<link rel="manifest">` 在 `layout.tsx` 的 `<head>`
4. Lighthouse PWA ≥ 70（目标 90）
5. `pnpm build` 成功 ✅
6. CHANGELOG 更新 ✅

---

## Phase2 Epic DoD 总览

| Epic | 内容 | 测试验收 |
|------|------|----------|
| P001-E1 | i18n AI 页面迁移 | vitest i18n + E2E 语言切换 |
| P002-E1 | WebSocket 连接层 | vitest useCollaboration |
| P002-E2 | OT 冲突检测 | vitest + E2E 双窗口 |
| P002-E3 | 在线用户 UI | vitest + 手动验证 |
| P003-E1 | DiffOverlay 多文件 tab | vitest DiffOverlay |
| P003-E2 | 评分卡复杂度指标 | vitest AIScoreCard |
| P004-E1 | MiniMap 搜索 + 视口边框 | vitest + E2E |
| P005-E1 | Service Worker 注册 | 手动 DevTools 离线验证 |
| P005-E2 | 语言包 + API 降级 | 手动离线测试 |
| P005-E3 | manifest.json + PWA | Lighthouse ≥ 70 |

---

## 技术约束（所有 Epic 通用）

- 禁止在 `src/app/` 下使用内联 `style={{}}` 定义颜色/间距/字体
- 禁止 commit 无 Epic 标识的 message（格式: `feat(S39-P00X-EY): ...`）
- 所有 Epic 变更必须更新 dual-CHANGELOG（`vibex-fronted/CHANGELOG.md` + `/root/.openclaw/vibex/CHANGELOG.md`）
- `pnpm exec tsc --noEmit` 必须通过后才能提 PR
- 使用 `@xyflow/react` 内置组件（MiniMap, Controls, Background, Panel），无需安装额外 npm 包
