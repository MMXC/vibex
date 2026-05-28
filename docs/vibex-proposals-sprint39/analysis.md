**Agent**: coord (heartbeat self-implement)
**日期**: 2026-05-28
**触发**: analyst-review CLI-dispatch ghost — analyst 被自动派发但从未收到 Slack 通知（Slack socket 在派发时不稳定），analyst 输出存在于 `proposals/20260527/analyst.md` 但 analyst-review stage 从未被 agent 执行。coord 自举完成分析。

---

# Analysis — Sprint 39 提案分析

## 概述

analyst 提交了 5 个改进提案（P001-P005），覆盖 i18n 收尾、实时协作、WebSocket、DiffOverlay、Minimap 导航、离线缓存。本分析逐一验证问题真实性、技术可行性、风险。

---

## P001: i18n 收尾 + AI 生成区翻译迁移

**状态**: ✅ Valid + Actionable

**问题真实性**: Sprint38 完成了 i18n 框架安装和 DDSToolbar 试点，但 `src/app/ai/` 目录（Sprint6 AI Coding Agent 产物）因 AGENTS.md 约束未迁移。i18n 框架已验证可用。**问题真实。**

**技术可行性**: 
- `src/app/ai/` 页面使用 Next.js App Router，配置 `next-intl` 的 `untranslated` 钩子即可
- `useTranslations('ai')` API 已在 DDSToolbar 验证
- **风险**: `src/app/` 下组件使用 `useTranslations` 需要每个组件接受 locale 参数，需改造成 `async` Server Component 或传递 locale

**根因**: Sprint6 的 AGENTS.md 禁止手动编辑 `src/app/`，i18n 迁移被推迟；Sprint38 DDSToolbar 试点验证了 API 方案

**建议**: P001 可以作为独立 epic 执行，工作量 ~1-2 人天。建议优先级 **P0**。

---

## P002: 实时协作同步层（WebSocket + 操作广播）

**状态**: ⚠️ Valid but Complex — 需要 Phase2 分 Epic 拆解

**问题真实性**: Sprint38 P002 交付了协作感知 UI（oplog、AI indicator、冲突警告），但缺乏底层同步机制。**问题真实**，这是 VibeX 协作功能的核心缺失。

**技术可行性**:
- **前端**: Zustand store 已支持 oplog，广播改动只需在 `updateNode`/`addNode`/`deleteNode` 时 emit WebSocket 消息
- **后端**: VibeX 使用 Cloudflare Workers，可选 Durable Objects（实时协作状态）或传统 WebSocket 服务器（Fly.io/Railway）
- **冲突解决**: OT（Operational Transformation）复杂度高，建议 Phase1 用 CRDT（Yjs）简化

**根因**: Sprint38 P002 仅交付了前端感知层（无网络同步）；Cloudflare Workers 环境（edge，无状态）与实时 WebSocket 需要架构适配

**风险**:
1. **高风险**: Durable Objects 定价模型（按 CPU 时间）vs WebSocket 长连接成本
2. **中风险**: Yjs/CRDT 引入新依赖，与现有 Zustand store 集成复杂度
3. **低风险**: 多用户状态广播前端实现复杂度可控

**建议**: 拆为 P002-E1（WebSocket 基础连接层）+ P002-E2（canvas 操作 OT 合并）+ P002-E3（用户在线状态 UI）。建议优先级 **P0**。

---

## P003: DiffOverlay 增强 + 评分卡调优

**状态**: ✅ Valid + Incremental

**问题真实性**: 
- 多文件概览缺失：用户需逐个查看代码块，无法获得 session 全貌
- 评分算法简单：仅行数统计，无 token 估算/复杂度分析
- **问题真实**，但对用户核心体验影响相对较小

**技术可行性**:
- DiffOverlay: 只需在 `DiffOverlay.tsx` 增加 tab 切换逻辑
- Token 估算: `@anthropic/token-counter` 或通过 `new Blob([code]).size * 0.75` 近似
- 圈复杂度: 需引入静态分析（escomplex 或近似算法）

**根因**: Sprint38 P003 优先交付 DiffOverlay 基础功能和 AIScoreCard 基础 UI，评分算法细节留作后续优化

**建议**: 独立 epic，~1.5-2 人天。建议优先级 **P1**。

---

## P004: MiniMap 搜索 + 节点高亮导航

**状态**: ✅ Valid + 待验证 MiniMap 当前状态

**问题真实性**: 大型画布（100+ 节点）下 MiniMap 缺乏搜索导航能力，**问题真实**。

**技术可行性**: 
- `DDSFlow.tsx` 已有 `@xyflow/react` 内置 `MiniMap` 组件
- 搜索框 + `useMemo` 过滤节点 + `setViewport` 跳转：标准 React 模式

**⚠️ 待确认**: Sprint38 完成了 P005-E3 MiniMap（import + 基础 render 在 bottom-left）。本提案需确认 MiniMapPanel.tsx 是否已存在以及具体实现范围。

**建议**: 先确认 P005-E3 MiniMap 完成状态，再决定 P004 工作范围。建议优先级 **P1**。

---

## P005: Service Worker 离线缓存 + 加载体验

**状态**: ✅ Valid + Infrastructure

**问题真实性**: 弱网用户体验差，无离线能力，**问题真实**。

**技术可行性**:
- Service Worker: 使用 Workbox（`workbox-webpack-plugin` 或 `workbox-routing`）简化注册
- 缓存策略: Cache-First for 静态资源，Network-First for API
- App Shell: 已有 SplashScreen，可复用
- Lighthouse PWA ≥ 90 需要额外配置（manifest.json, 192x192 icon 等）

**根因**: Sprint6 交付的 Cloudflare Pages 部署默认无 SW 缓存；Sprint38 的主题系统和 i18n 语言包为离线缓存提供了良好资产分割

**建议**: 独立 epic，~2-3 人天。建议优先级 **P1**。

---

## 综合评估

| 提案 | 优先级 | 风险 | 建议 |
|------|--------|------|------|
| P001 i18n 收尾 | **P0** | 低 | 立即开启 |
| P002 WebSocket 协作 | **P0** | 高（后端架构） | Phase1 详细设计后开启 |
| P003 DiffOverlay 增强 | **P1** | 低 | 独立 epic |
| P004 MiniMap 搜索 | **P1** | 低 | 需确认 P005-E3 状态 |
| P005 SW 离线缓存 | **P1** | 中 | 独立 epic |

### Phase1 开启建议

**立即开启**: P001（i18n 收尾）— 工作量小、风险低、用户影响直接。

**Phase1 详细设计后再开启**: P002（WebSocket）— 后端架构决策影响大，建议 PM + Architect 详细评审。

---

## 技术风险摘要

1. **P001**: `src/app/` 的 Server Component i18n 改造需要验证 Next.js App Router 兼容性
2. **P002**: Cloudflare Workers 环境无 WebSocket 原生支持，需额外基础设施；Yjs CRDT 与 Zustand 集成方案待设计
3. **P003**: Token 估算依赖外部库或近似算法，需选型
4. **P004**: 需确认 P005-E3 MiniMap 当前实现范围
5. **P005**: Workbox 与 Next.js 15 App Router Service Worker 注册方式需验证兼容性

---

## 验收标准（来自 analyst 提案，已验证具体可测）

所有提案的验收标准均包含可测试的检查项（TypeScript 编译、vitest 测试、E2E 测试、Lighthouse 评分）。**标准具体可测，无需补充。**
