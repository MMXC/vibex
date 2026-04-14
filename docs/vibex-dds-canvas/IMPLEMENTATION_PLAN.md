# Implementation Plan: VibeX DDS Canvas

> **项目**: vibex-dds-canvas  
> **日期**: 2026-04-14  
> **总工时**: 40h

---

## Overview

6 个 Epic，AI 卡片生成 + scroll-snap 画布 + 三种卡片类型 + CRUD API。

---

## Implementation Units

- [ ] **Unit 1: DDSCanvasStore (E1)**

**Goal:** 实现 Zustand store，覆盖所有 canvas 状态。

**Dependencies:** None

**Files:**
- Create: `vibex-fronted/src/stores/ddsCanvasStore.ts`
- Test: `vibex-fronted/src/stores/__tests__/ddsCanvasStore.test.ts`

**Approach:**
- 按 specs/dds-canvas-state.md §2.1 定义实现
- Zustand persist 可选（用户习惯而定）

**Verification:**
- 所有 actions 有对应 reducer 测试

---

- [ ] **Unit 2: 三种卡片类型 (E1)**

**Goal:** 实现 Requirement / Acceptance / Constraint 三种卡片组件。

**Dependencies:** Unit 1

**Files:**
- Create: `vibex-fronted/src/components/dds/cards/RequirementCard.tsx`
- Create: `vibex-fronted/src/components/dds/cards/AcceptanceCard.tsx`
- Create: `vibex-fronted/src/components/dds/cards/ConstraintCard.tsx`
- Create: `vibex-fronted/src/components/dds/cards/CardRenderer.tsx` (分发器)
- Create: `vibex-fronted/src/components/dds/cards/CardRenderer.test.tsx`

**Verification:**
- snapshot 测试通过
- 三种类型正确渲染

---

- [ ] **Unit 3: Horizontal Scroll Canvas (E2)**

**Goal:** 实现横向 scroll-snap 布局。

**Dependencies:** Unit 2

**Files:**
- Create: `vibex-fronted/src/components/dds/canvas/DDSCanvas.tsx`
- Create: `vibex-fronted/src/components/dds/canvas/DDSCanvas.module.css`
- Create: `vibex-fronted/src/components/dds/canvas/ChapterPanel.tsx`

**Verification:**
- scroll-snap 行为流畅
- 章节切换正常

---

- [ ] **Unit 4: AI Draft Flow (E3)**

**Goal:** 实现 AI 生成卡片流程（输入 → 预览 → 编辑 → 接受）。

**Dependencies:** Unit 3

**Files:**
- Create: `vibex-fronted/src/components/dds/ai-draft/AIDraftModal.tsx`
- Create: `vibex-fronted/src/components/dds/ai-draft/DraftPreview.tsx`
- Create: `vibex-fronted/src/components/dds/ai-draft/DraftPreview.test.tsx`
- Create: `vibex-fronted/src/components/dds/toolbar/DDSToolbar.tsx`

**Approach:**
- 状态机实现 (IDLE → LOADING → SUCCESS → USER_EDITING → ACCEPTED/CANCEL/RETRY)
- LLM 调用复用现有 llm-provider.ts

**Technical design:**
```typescript
// 状态机
const DRAFT_STATES = {
  IDLE: { trigger: 'input', next: 'LOADING' },
  LOADING: { trigger: 'complete', next: 'SUCCESS' },
  SUCCESS: {
    trigger: 'accept', next: 'ACCEPTED',
    trigger: 'edit', next: 'USER_EDITING',
    trigger: 'retry', next: 'LOADING',
    trigger: 'cancel', next: 'IDLE'
  },
  USER_EDITING: {
    trigger: 'accept', next: 'ACCEPTED',
    trigger: 'retry', next: 'LOADING',
    trigger: 'cancel', next: 'IDLE'
  },
  ACCEPTED: { trigger: 'reset', next: 'IDLE' }
};
```

**Verification:**
- 完整流程 E2E 测试通过

---

- [ ] **Unit 5: Backend CRUD API (E4)**

**Goal:** 实现卡片和章节的 CRUD API。

**Dependencies:** None

**Files:**
- Create: `vibex-backend/src/routes/v1/dds/cards.ts`
- Create: `vibex-backend/src/routes/v1/canvas/chapters.ts`
- Create: `vibex-backend/migrations/002_add_dds_canvas.sql`
- Test: `vibex-backend/src/__tests__/canvas-cards.test.ts`

**Approach:**
- D1 migrations 先执行
- REST API 实现 CRUD
- 权限检查：仅项目成员可操作

**Verification:**
- CRUD API 测试通过
- 权限检查正确

---

- [ ] **Unit 6: 前端 API Client (E4)**

**Goal:** 前端 API 调用封装。

**Dependencies:** Unit 5

**Files:**
- Create: `vibex-fronted/src/services/api/dds.ts`
- Modify: `vibex-fronted/src/stores/ddsCanvasStore.ts` (连接 API)

**Verification:**
- API 调用测试通过

---

- [ ] **Unit 7: Route & Page (E1-E4)**

**Goal:** 集成到前端路由。

**Dependencies:** Units 1-6

**Files:**
- Create: `vibex-fronted/src/app/design/dds-canvas/page.tsx`
- Modify: `vibex-fronted/src/components/navigation/ProjectNav.tsx`

**Verification:**
- 页面正常加载
- 导航入口正常

---

## Dependencies

```
Unit 1 (Store) ─→ Unit 2 (Cards) ─→ Unit 3 (Canvas)
                                         ↓
Unit 5 (Backend) ─→ Unit 6 (API Client) ─┘
                    ↓
Unit 4 (AI Draft) ── 并行
         ↓
Unit 7 (Route)
```

---

## Verification Criteria

| Epic | 验收标准 |
|------|---------|
| E1 | Store actions + card rendering |
| E2 | Scroll-snap流畅, 章节切换正常 |
| E3 | AI Draft 完整流程 |
| E4 | CRUD API 端到端 |

---

## Risks

| Risk | Mitigation |
|------|------------|
| AI Draft LLM 输出格式不稳定 | 严格 JSON 解析 + 降级处理 |
| D1 JSON 解析性能 | 卡片数量 < 500 时无问题 |
| 与现有 Canvas 路由冲突 | 单独 /dds-canvas 路由，不替代现有 |

---

*Implementation Plan | Architect Agent | 2026-04-14*
