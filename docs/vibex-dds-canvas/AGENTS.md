# AGENTS.md — VibeX DDS Canvas

> **项目**: vibex-dds-canvas  
> **日期**: 2026-04-14

---

## 1. 开发约束

### 1.1 Store

- **DDSCanvasStore 是独立 store**，不复用 `designStore`
- Store 仅管理 Canvas 相关状态（卡片、章节、draft 状态）
- 导航/项目元数据走 `navigationStore`

### 1.2 卡片组件

- 三种卡片类型：`user-story` / `bounded-context` / `flow-step`（PRD §0 决策 2）
- **必须依赖** `reactflow` 包（~40KB gzip）
- `CardRenderer.tsx` 是分发器，根据 `type` 渲染对应组件
- React Flow `nodes`/`edges`/`viewport` 存在 `DDSCanvasStore` 中

### 1.3 AI Draft

- **复用** `llm-provider.ts`，不新建 LLM 集成
- 用户输入在传给 LLM 前必须转义（防止 Prompt 注入）
- 乐观 UI：用户点击"生成"后立即显示 loading，不等待

### 1.4 API

- API 路由：`/api/v1/dds/...`（与 specs/api-card-crud.md 完全对齐）
- 所有 API 错误使用 `apiError()` (来自 `lib/api-error.ts`)
- 卡片数据存 JSON 字符串，解析在 service 层做

---

## 2. 文件结构

```
前端:
  components/dds/cards/         # 卡片组件
  components/dds/canvas/       # Canvas 布局
  components/dds/ai-draft/    # AI Draft
  components/dds/toolbar/     # 工具栏
  stores/ddsCanvasStore.ts    # Zustand store
  services/api/dds.ts          # API client
  app/design/dds-canvas/     # 页面路由

后端:
  routes/v1/dds/cards.ts    # 卡片 CRUD (对齐 specs/api-card-crud.md)
  routes/v1/canvas/chapters.ts # 章节 CRUD
  services/dds/              # DDS 业务逻辑
  migrations/002_add_dds_canvas.sql # DB schema
```

---

## 3. 测试要求

| Epic | 测试类型 | 覆盖率 |
|------|---------|--------|
| E1 | Unit (Store actions) | > 80% |
| E2 | Snapshot (3 种卡片) | 100% |
| E3 | E2E (Draft 完整流程) | 关键路径 |
| E4 | API integration | > 70% |

---

## 4. CI 门控

无新增 CI 门控（复用现有 tsc/test/lint）。

---

## 5. 参考文档

- PRD: `docs/vibex-dds-canvas/prd.md`
- Specs: `docs/vibex-dds-canvas/specs/`
- API Spec: `docs/vibex-dds-canvas/specs/api-card-crud.md`
- Schema Spec: `docs/vibex-dds-canvas/specs/schema-card-types.md`
- AI Flow: `docs/vibex-dds-canvas/specs/ai-draft-flow.md`

---

*Architect Agent | 2026-04-14*
