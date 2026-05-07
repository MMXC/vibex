# VibeX Sprint 30 — 实施计划

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint30
**Sprint 周期**: 2026-05-08 ~ 2026-05-20（2 周）
**团队规模**: 2 人
**总工期**: 38h（不含 P005 方案 A）/ 44h（含 P005 方案 A）| 预算 60h

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint30
- **执行日期**: 2026-05-08

---

## 1. Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E01: ProtoPreview 实时联动 | E01-U1 ~ E01-U4 | 3/4 ✅ | E01-U3（Unit tests 待执行）|
| E02: 项目导入/导出 | E02-U1 ~ E02-U4 | 4/4 ✅ | — |
| E03: E2E 测试补全 | E03-U1 ~ E03-U2 | 0/2 | E03-U1 |
| E04: Spec 补全 | E04-U1 ~ E04-U2 | 0/2 | E04-U1 |
| E05: Presence 层增强 | E05-U1 ~ E05-U2 | 0/2 | E05-U1 |

---

## 2. Sprint Overview

### 2.1 优先级排序依据

| 优先级 | 判断标准 | Epic |
|--------|---------|------|
| **P0** | 无外部依赖，核心交互，用户高频使用 | E01（组件树→预览联动）、E02（项目持久化）|
| **P1** | 无外部依赖，测试/文档完整性 | E03（E2E CI 卡口）、E04（文档补全）|
| **P2** | 依赖 Firebase RTDB，未就绪则降级 | E05（实时协作感知）|

### 2.2 Week 1 日历表（5 工作日 = 25h/人 = 50h 团队容量）

| 日期 | Day | 主要任务 | Epic | 负责人 | 预计工时 |
|------|-----|---------|------|--------|---------|
| 05-08（周四）| Day 1 AM | E01-U1 ProtoPreview subscription + 200ms debounce | E01 | Dev A | 3h |
| 05-08（周四）| Day 1 PM | E02-U1 导出 API GET /api/projects/:id/export | E02 | Dev B | 2h |
| 05-09（周五）| Day 2 AM | E01-U2 Props 热更新 + data-rebuild=false | E01 | Dev A | 2h |
| 05-09（周五）| Day 2 PM | E02-U2 导入 API POST /api/projects/import | E02 | Dev B | 2h |
| 05-10（周六）| Day 3 AM | E01-U3 Unit tests + E2E 热更新延迟测试 | E01 | Dev A | 2h |
| 05-10（周六）| Day 3 PM | E02-U3 Zod schema 校验 + error codes | E02 | Dev B | 2h |
| 05-11（周日）| Day 4 AM | E03-U1 share-notification.spec.ts ShareBadge | E03 | Dev A | 3h |
| 05-11（周日）| Day 4 PM | E04-U1 E04-template-crud.md spec 补全 | E04 | Dev B | 2h |

**Week 1 完工**: E01(5h) + E02(6h) + E03(3h) + E04(2h) = **16h** ✅ 在容量内

### 2.3 Week 2 日历表（5 工作日 = 25h/人 = 50h 团队容量）

| 日期 | Day | 主要任务 | Epic | 负责人 | 预计工时 |
|------|-----|---------|------|--------|---------|
| 05-12（周一）| Day 5 AM | E03-U2 ShareToTeamModal E2E + CI 卡口配置 | E03 | Dev A | 3h |
| 05-12（周一）| Day 5 PM | E04-U2 S29-E01-notification.md spec 补全 | E04 | Dev B | 2h |
| 05-13（周二）| Day 6 AM | E05-U1 Firebase RTDB 状态验证（S10 子任务）| E05 | Dev A | 1h |
| 05-13（周二）| Day 6 PM | E05-U2 Presence UI 增强（方案A或方案B）| E05 | Dev A | 3h |
| 05-14（周三）| Day 7 | E02-U4 Dashboard 集成（导出按钮 + 导入 Modal）| E02 | Dev B | 3h |
| 05-15（周四）| Day 8 | 全量 E2E 测试 + 集成验证 | - | Dev A+B | 4h |
| 05-16（周五）| Day 9 | Sprint 收尾：PR review + 文档更新 + Retro | - | Dev A+B | 3h |
| 05-17（周六）| Day 10 | 预留 buffer + 紧急修复 | - | - | 3h |

**Week 2 完工**: E03(3h) + E04(2h) + E05(4h) + E02-U4(3h) + 验证收尾(7h) = **19h** ✅ 在容量内

### 2.4 工期汇总

| Epic | 标题 | 工期 | 占比 | 依赖 |
|------|------|------|------|------|
| E01 | ProtoPreview 实时联动 | 7h | 18% | 无 |
| E02 | 项目导入/导出 | 9h | 24% | 无 |
| E03 | E2E 测试补全 | 6h | 16% | 无（ShareBadge 已有代码）|
| E04 | Spec 补全 | 4h | 11% | 无 |
| E05 | Presence 层增强 | 4h（方案B）/ 10h（方案A）| 11% | P005 阻塞于 RTDB 状态 |
| **合计** | **不含 P005** | **26h** | 100% | |
| **合计** | **含 P005 方案A** | **30h** | 100% | |

**Sprint 30 工期完成率预计**: 26h / 60h = 43%（✅ 在 90% 目标范围内）
**Buffer**: 30h 富余，足够处理 P005 方案 A 或突发问题

---

## 3. Epic 实施顺序与步骤

---

## E01: ProtoPreview 实时联动

**工期**: 7h | **优先级**: P0 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E01-U1 | componentStore subscription + debounce | ✅ | — | ProtoPreviewPanel + useShallow 订阅 selectedNodeId；debounce.ts 新建 |
| E01-U2 | Props 热更新 + rebuild flag | ✅ | E01-U1 | ProtoPreviewContent memo + data-rebuild="false" |
| E01-U3 | Unit tests + E2E 延迟测试 | ⬜ | E01-U2 | 待 Vitest + Playwright 测试 |
| E01-U4 | 未选中 placeholder | ✅ | E01-U1 | data-testid="proto-preview-placeholder" + SVG 图标

### E01-U1 详细说明

**文件变更**:
- `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx` — 增加 useShallow subscription
- `vibex-fronted/src/utils/debounce.ts` — 新建或使用 lodash debounce

**实现步骤**:
1. 在 ProtoFlowCanvas 中导入 `useShallow` from `zustand/react/shallow`
2. 在 ProtoPreview 子组件中添加 `const { selectedIds } = useComponentStore(useShallow(s => ({ selectedIds: s.selectedIds })))`
3. 从 selectedIds 取首个 nodeId，从 componentStore.nodes 获取节点数据
4. 传入 ProtoPreview 渲染
5. 使用 debounce(200ms) 包装 updateNodeProps 调用

**风险**: 需确认 ProtoFlowCanvas 中 ProtoPreview 作为子组件还是独立面板。如果是独立面板，需要调整调用路径。

---

## E02: 项目导入/导出

**工期**: 9h | **优先级**: P0 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E02-U1 | 导出 API GET /api/projects/:id/export | ✅ | — | GET /api/projects/:id/export → v1.0 JSON，聚合 uiNodes/FlowData/Pages/Requirements |
| E02-U2 | 导入 API POST /api/projects/import | ✅ | — | POST /api/projects/import → Zod 校验 → Prisma → 201 + 新项目 |
| E02-U3 | Zod schema 校验 + error codes | ✅ | E02-U1, E02-U2 | VibexExportSchema + validateExportJson() + 7个 error codes |
| E02-U4 | Dashboard 集成（导出按钮 + 导入 Modal）| ⬜ | E02-U1, E02-U2 | 待 E02-U4 开发阶段（Day 7）|

### E02-U1 详细说明

**文件变更**:
- `vibex-backend/src/app/api/projects/[id]/export/route.ts` — 新建
- `vibex-backend/src/lib/schemas/vibex.ts` — 新建 Zod schema
- `vibex-backend/src/lib/services/projectExporter.ts` — 新建聚合服务

**实现步骤**:
1. 创建 `lib/schemas/vibex.ts` — Zod schema（version, project, trees, exportedAt, exportedBy）
2. 创建 `lib/services/projectExporter.ts` — 从 Prisma 聚合 project + componentTree + prototypeTree + contextTree
3. 创建 `app/api/projects/[id]/export/route.ts` — GET handler
4. 实现权限检查：userId === ownerId 或 collaborator
5. 返回 `{ version: "1.0", project, trees, exportedAt, exportedBy }`

**风险**: 确认 contextStore / prototypeStore 数据如何持久化（Prisma 或 localStorage）。如果是 localStorage，需要在导出时从客户端读取。

---

## E03: E2E 测试补全

**工期**: 6h | **优先级**: P1 | **依赖**: 无（ShareBadge + ShareToTeamModal 组件已有代码）

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E03-U1 | share-notification.spec.ts ShareBadge 测试 | ⬜ | — | TC-S06-01~04 全部通过，badge 数字正确 |
| E03-U2 | ShareToTeamModal E2E + CI 卡口配置 | ⬜ | — | TC-S07-01~04 全部通过；CI e2e:ci exit non-zero |

### E03-U1 详细说明

**文件变更**:
- `vibex-fronted/tests/e2e/share-notification.spec.ts` — 新建

**实现步骤**:
1. 创建 `tests/e2e/share-notification.spec.ts`
2. 实现 TC-S06-01: 分享后 badge +N
3. 实现 TC-S06-02: 无未读时 badge 隐藏
4. 实现 TC-S06-03: ≥100 未读显示 99+
5. 实现 TC-S06-04: 多人分享累计
6. 配置 `playwright.config.ts` — `retries: 2` for CI, `workers: 2` for CI

**风险**: 无，ShareBadge 组件已有代码，只需补充测试。

---

## E04: Spec 补全

**工期**: 4h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E04-U1 | E04-template-crud.md spec 补全 | ⬜ | — | API 字段定义 + 错误码矩阵完整 |
| E04-U2 | S29-E01-notification.md spec 补全 | ⬜ | — | 通知触发时机 + 降级策略完整 |

### E04-U1 详细说明

**文件变更**:
- `docs/vibex-proposals-sprint28/specs/E04-template-crud.md` — 新建（Sprint 28 遗漏）
- `docs/vibex-proposals-sprint29/specs/E01-notification.md` — 新建（Sprint 29 遗漏）

**实现步骤**:
1. 基于 E04 spec（已存在于 `specs/E04-template-crud.md`）补充缺失的 API 字段定义
2. 补充错误码矩阵（400/401/403/404/422/500）
3. 创建 `docs/vibex-proposals-sprint29/specs/E01-notification.md`
4. 定义通知类型（SHARE_INVITE/SHARE_TO_TEAM/COMMENT_MENTION/PROJECT_UPDATE）
5. 定义降级策略（RTDB 失败 → DB 持久化兜底）

**风险**: 低，纯文档工作。

---

## E05: Presence 层增强

**工期**: 4h（方案B）/ 10h（方案A）| **优先级**: P2 | **依赖**: S10 子任务先验证 Firebase RTDB 状态

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E05-U1 | Firebase RTDB 状态验证（S10 子任务）| ⬜ | — | 确认 useRealtimeSync.ts 就绪或为 mock |
| E05-U2 | Presence UI 增强（方案A 或方案B）| ⬜ | E05-U1 | RTDB 就绪 → 方案A；未就绪 → 方案B（仅 UI mock）|

### E05-U1 详细说明

**验证步骤**:
1. 检查 `hooks/useRealtimeSync.ts` 是否存在且包含真实 RTDB 读写
2. 检查 `.env*` 是否配置 FIREBASE_DATABASE_URL + FIREBASE_API_KEY
3. 若 useRealtimeSync 仅 mock 数据 → 方案B（UI mock 增强）
4. 若 useRealtimeSync 有真实 RTDB 集成 → 方案A（节点级别 presence）

**决策规则**:
- RTDB 就绪 → E05-U2 执行方案 A（Firebase presence，10h）
- RTDB 未就绪 → E05-U2 执行方案 B（仅 UI mock，4h）
- Canvas 编辑不受 Firebase 配置影响（静默降级）

---

## 4. 关键里程碑

| 里程碑 | 日期 | 验收标准 |
|--------|------|----------|
| M1: ProtoPreview 热更新 | Day 1-3 | E01-U1+U2 完成，≤200ms 热更新，rebuild=false |
| M2: 项目导入/导出 API | Day 2-4 | E02-U1+U2 完成，v1.0 JSON 导出/导入，error codes 覆盖 |
| M3: E2E 测试补全 | Day 4-5 | E03-U1+U2 完成，share-notification.spec.ts 通过 |
| M4: Spec 补全 | Day 4-5 | E04-U1+U2 完成，test -f 验证通过 |
| M5: Presence 层 | Day 6 | E05-U1 验证完成，E05-U2 方案确定 |
| M6: Dashboard 集成 | Day 7 | E02-U4 完成，导出按钮 + 导入 Modal 可用 |
| M7: Sprint 验收 | Day 9-10 | 所有 Epic DoD 通过，TS 编译 0 errors |

---

## 5. 依赖关系图

```
E01-U1 (ProtoPreview subscription)
  └─ E01-U2 (Props 热更新)
      └─ E01-U3 (Unit tests + E2E)
          └─ E01-U4 (placeholder)

E02-U1 (Export API) ←→ E02-U2 (Import API)
  └─ E02-U3 (Zod schema) ←→ E02-U3 (Zod schema)
      └─ E02-U4 (Dashboard UI)

E03-U1 (ShareBadge E2E) ←→ E03-U2 (ShareToTeamModal E2E)
  └─ CI 卡口配置

E04-U1 (E04 spec) ←→ E04-U2 (S29 spec)
  └─ 无下游依赖

E05-U1 (RTDB 状态验证) → E05-U2 (方案A或方案B)
  └─ 无阻塞 Canvas 编辑
```

---

## 6. 风险缓解

| ID | 风险 | 可能性 | 影响 | 缓解措施 |
|----|------|--------|------|----------|
| R1 | 热更新导致 ProtoFlowCanvas 性能下降 | 低 | 中 | 200ms debounce + React.memo |
| R2 | 导出大文件（>5MB）超时 | 中 | 低 | 流式下载 + 进度提示（前端 Toast）|
| R3 | E2E 测试 flaky | 中 | 中 | playwright retry=2，失败隔离 |
| R4 | Firebase RTDB 未落地，E05 阻塞 | 高 | 高 | S10 子任务先验证；方案B（UI mock）兜底 |
| R5 | localStorage 数据导出完整性 | 低 | 高 | 确认三个 store 数据持久化方式（Prisma/localStorage）|

---

## 7. 验收标准速查表

| Epic | 功能点 | 验收标准（摘要） | 验证命令 |
|------|--------|-----------------|----------|
| E01 | ProtoPreview 热更新 | 选中节点 ≤200ms 渲染，rebuild=false | `npm run test:e2e -- protopreview` |
| E01 | Props 热更新 | 修改 props 无白屏，rebuild=false | Vitest unit test |
| E02 | Export API | GET → 200 + v1.0 JSON + Content-Disposition | `curl localhost:3000/api/projects/:id/export` |
| E02 | Import API | POST → 201 + 新项目出现 Dashboard | API test + E2E |
| E02 | 文件校验 | INVALID_JSON/INVALID_VERSION → 422 | `curl -X POST /api/projects/import -d '{}'` |
| E03 | ShareBadge E2E | TC-S06-01~04 全部通过 | `npm run test:e2e -- share-notification` |
| E03 | CI 卡口 | e2e:ci exit non-zero → PR blocked | GitHub Actions status |
| E04 | Spec 补全 | E04 + S29 specs 存在且内容完整 | `test -f docs/vibex-proposals-sprint28/specs/E04-template-crud.md` |
| E05 | RTDB 降级 | Firebase 未配置 → 静默降级，Canvas 可用 | gstack /qa CanvasPage |

---

*本文件由 architect 基于 PRD（prd.md）+ Analyst 报告（analysis.md）产出。*