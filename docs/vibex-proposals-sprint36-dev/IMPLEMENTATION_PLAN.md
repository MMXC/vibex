# VibeX Sprint 36 — IMPLEMENTATION_PLAN

**版本**: v1.0
**日期**: 2026-05-11
**Agent**: architect
**仓库**: /root/.openclaw/vibex

---

## 1. Epic 总览

| Epic | 名称 | Stories | 核心交付 | 估计工时 |
|------|------|---------|----------|----------|
| E1 | 多人协作 MVP | S1.1~S1.3 | RemoteCursor 挂载 + useRealtimeSync 集成 + Presence E2E | 3-5d |
| E2 | 模板市场 MVP | S2.1~S2.2 | Marketplace API + Dashboard Industry Filter | 2-3d |
| E3 | MCP DoD CI Gate | S3.1 | CI Gate 生成工具索引 | 0.5d |
| E4 | 撤销重做 Toolbar 补全 | S4.1 | DDSToolbar Undo/Redo 按钮 | 0.5d |
| E5 | Design Review E2E 补全 | S5.1~S5.2 | 降级路径 E2E + 三 Tab 验证 | 1d |

---

## 2. Story 清单（Unit Index）

### E1 — 多人协作 MVP

#### S1.1: RemoteCursor 挂载
- **实现文件**: `vibex-fronted/src/pages/DDSCanvasPage.tsx`
- **实现内容**:
  - 在 `DDSCanvasPage.tsx` 中引入 `<RemoteCursor />` 组件
  - 条件守卫: `isFirebaseConfigured()` — 仅在 Firebase 已配置时渲染
  - 展示所有在线用户头像 + 名称（四态: 理想态/空状态/加载态/错误态）
- **DoD 检查清单**:
  - [ ] `<RemoteCursor />` 存在于 render 输出
  - [ ] `isFirebaseConfigured()` 条件守卫
  - [ ] 四态定义完整（RemoteCursor + PresenceAvatars）

#### S1.2: useRealtimeSync 集成
- **实现文件**: `vibex-fronted/src/pages/DDSCanvasPage.tsx`
- **实现内容**:
  - 调用 `useRealtimeSync({ projectId, userId })` hook
  - Firebase RTDB last-write-wins 同步策略
  - `remoteCursors` 数组驱动 RemoteCursor 渲染
- **DoD 检查清单**:
  - [ ] `useRealtimeSync` 在 DDSCanvasPage 中被调用（import + JSX 引用）
  - [ ] `remoteCursors` 非空时渲染 RemoteCursor，单人时不渲染
  - [ ] TypeScript 类型检查通过

#### S1.3: Presence E2E 测试
- **实现文件**: `vibex-fronted/e2e/presence-mvp.spec.ts`
- **实现内容**:
  - E2E 测试覆盖: 远程用户光标可见 + PresenceAvatars 显示用户名
  - Firebase mock 模式运行
  - RemoteCursor 位置更新延迟 < 3s
- **DoD 检查清单**:
  - [ ] Firebase mock 模式下 E2E 测试通过
  - [ ] RemoteCursor 位置更新延迟验证

---

### E2 — 模板市场 MVP

#### S2.1: Marketplace API + 静态数据
- **实现文件**: `vibex-fronted/src/app/api/marketplace/templates/route.ts`
- **实现内容**:
  - `GET /api/marketplace/templates` — 返回模板列表
  - 静态 JSON 数据源（`/data/templates.json`）
  - 字段: `id`, `name`, `description`, `thumbnail`, `category`, `tags`
- **DoD 检查清单**:
  - [ ] API route 响应 200 且返回模板列表
  - [ ] `templates-market.spec.ts` 测试覆盖

#### S2.2: Dashboard Industry Filter
- **实现文件**: `vibex-fronted/src/app/dashboard/templates/page.tsx`
- **实现内容**:
  - 模板市场 Dashboard 页面
  - Industry 维度筛选器
  - 模板卡片展示
- **DoD 检查清单**:
  - [ ] Dashboard 模板页 Industry Filter 功能可用

---

### E3 — MCP DoD CI Gate

#### S3.1: Tool Index CI 验证
- **实现文件**: `vibex-workbench/tools/generate-tool-index.ts`
- **实现内容**:
  - `generate-tool-index.ts` — 扫描 tools/ 目录生成工具索引
  - CI 验证: 每次 PR 检查 tools/ 索引完整性
  - 输出: `tool-index.json`（含 tool name/description/path/mcp_capabilities）
- **DoD 检查清单**:
  - [ ] `generate-tool-index.ts` 可执行
  - [ ] CI pipeline 包含 tool-index 验证 step

---

### E4 — 撤销重做 Toolbar 补全

#### S4.1: DDSToolbar Undo/Redo 按钮
- **实现文件**: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`
- **实现内容**:
  - DDSToolbar 组件中增加 Undo/Redo 按钮
  - 调用 `history.undo()` / `history.redo()`
  - 按钮状态: enabled/disabled（根据历史记录）
- **DoD 检查清单**:
  - [ ] Undo 按钮点击回退最近操作
  - [ ] Redo 按钮点击重做撤销操作
  - [ ] 按钮 disabled 状态正确

---

### E5 — Design Review E2E 补全

#### S5.1: 降级路径 E2E 测试
- **实现文件**: `vibex-fronted/e2e/design-review-degradation.spec.ts`
- **实现内容**:
  - 覆盖设计评审降级路径（Firebase 未配置时）
  - 验证降级后 UI 正常展示
- **DoD 检查清单**:
  - [ ] `design-review-degradation.spec.ts` 全测试通过

#### S5.2: 评审结果三 Tab E2E 验证
- **实现文件**: `vibex-fronted/e2e/design-review-tabs.spec.ts`
- **实现内容**:
  - 评审结果页三 Tab: Comments / Suggestions / Approved
  - Tab 切换和内容展示验证
- **DoD 检查清单**:
  - [ ] 三 Tab E2E 测试全通过

---

## 3. 实现顺序

```
Week 1 (Day 1)
├── E3 (0.5d) — CI Gate 独立，不影响其他 Epic
└── E4 (0.5d) — DDSToolbar Undo/Redo 最小，快速验收

Week 1 (Day 1-3)
└── E2 (2-3d) — 模板市场 MVP (backend API + frontend Dashboard)
    ├── S2.1: Marketplace API + 静态数据
    └── S2.2: Dashboard Industry Filter

Week 1-2 (Day 3-7)
└── E1 (3-5d) — 多人协作 MVP（核心功能）
    ├── S1.1: RemoteCursor 挂载
    ├── S1.2: useRealtimeSync 集成
    └── S1.3: Presence E2E 测试

Week 2 (Day 5-7)
└── E5 (1d) — Design Review E2E 补全
    ├── S5.1: 降级路径 E2E 测试
    └── S5.2: 评审结果三 Tab E2E 验证
```

---

## 4. 依赖关系

- E1 → E2 → E3 串行（按 Sprint 计划）
- E4 独立（与 E1/E2/E3 并行）
- E5 并行（不依赖 E1-E4，可独立完成）

---

## 5. 验收标准

每个 Epic 的 DoD 检查清单必须全部完成才算 Epic 完成。
Coord-decision 验证时对照 Unit Index 逐项检查。
