# VibeX Sprint 36 — Architecture

**版本**: v1.0
**日期**: 2026-05-11
**Agent**: architect
**仓库**: /root/.openclaw/vibex

---

## 1. Sprint 目标

Sprint 36 是 Feature Proposal 项目，包含 5 个独立 Epic：

1. **E1: 多人协作 MVP** — RemoteCursor 实时协作 + Firebase Presence
2. **E2: 模板市场 MVP** — 模板市场 API + Dashboard 筛选
3. **E3: MCP DoD CI Gate** — 工具索引自动化生成
4. **E4: 撤销重做 Toolbar** — DDSToolbar 交互完善
5. **E5: Design Review E2E** — 设计评审流程 E2E 测试覆盖

---

## 2. 技术架构总览

```
vibex-fronted (Next.js)
├── E1: 多人协作
│   ├── Firebase Realtime Database (last-write-wins sync)
│   ├── RemoteCursor (条件渲染 via isFirebaseConfigured)
│   ├── useRealtimeSync hook (projectId, userId)
│   └── PresenceAvatars (四态: 理想态/空状态/加载态/错误态)
│
├── E2: 模板市场
│   ├── API: GET /api/marketplace/templates (静态 JSON)
│   ├── Dashboard: /dashboard/templates/page.tsx
│   └── Industry Filter (前端筛选)
│
├── E4: DDSToolbar
│   ├── history.undo() / history.redo()
│   └── Undo/Redo 按钮 disabled 状态管理
│
└── E5: E2E 测试
    ├── presence-mvp.spec.ts (E1)
    ├── templates-market.spec.ts (E2)
    ├── design-review-degradation.spec.ts (E5)
    └── design-review-tabs.spec.ts (E5)

vibex-workbench (Go)
└── E3: MCP CI Gate
    └── tools/generate-tool-index.ts → tool-index.json
```

---

## 3. Epic 详细架构

### E1: 多人协作 MVP
- **同步策略**: Firebase RTDB last-write-wins
- **条件守卫**: `isFirebaseConfigured()` — 降级方案
- **组件**: RemoteCursor + PresenceAvatars
- **Hook**: `useRealtimeSync({ projectId, userId })`
- **测试**: Firebase mock 模式 E2E

### E2: 模板市场 MVP
- **数据源**: 静态 JSON (`/data/templates.json`)
- **API 路由**: `/api/marketplace/templates`
- **前端**: Dashboard 模板页 + Industry Filter
- **测试**: `templates-market.spec.ts`

### E3: MCP DoD CI Gate
- **工作区**: `/root/vibex-workbench` (独立于主仓库)
- **工具**: `generate-tool-index.ts`
- **CI 集成**: GitHub Actions / 手动 `pnpm generate:tool-index`
- **输出**: `tool-index.json`（tool name/description/path/mcp_capabilities）

### E4: 撤销重做 Toolbar
- **组件**: `DDSToolbar.tsx`
- **API**: `history.undo()` / `history.redo()`
- **状态**: 按钮 enabled/disabled 根据历史记录

### E5: Design Review E2E
- **测试文件**: `design-review-degradation.spec.ts`, `design-review-tabs.spec.ts`
- **覆盖场景**: 降级路径 + 三 Tab 切换

---

## 4. 依赖关系图

```
E3 ──┐
E4 ──┼── E2 ── E1
E5 ──┴────────── (E5 独立)
```

- E3 和 E4 可立即并行开发（无依赖）
- E2 完成后触发 E1（共享 DDSCanvasPage）
- E5 独立，可在任意时间完成

---

## 5. 文件变更摘要

| Epic | 文件变更 | 类型 |
|------|----------|------|
| E1 | `DDSCanvasPage.tsx` | 修改 |
| E1 | `presence-mvp.spec.ts` | 新增 |
| E2 | `route.ts` (marketplace API) | 新增 |
| E2 | `dashboard/templates/page.tsx` | 新增 |
| E2 | `templates-market.spec.ts` | 新增 |
| E3 | `tools/generate-tool-index.ts` | 新增 |
| E3 | `tool-index.json` | 生成 |
| E4 | `DDSToolbar.tsx` | 修改 |
| E5 | `design-review-degradation.spec.ts` | 新增 |
| E5 | `design-review-tabs.spec.ts` | 新增 |
