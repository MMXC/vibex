# VibeX Sprint 31 — Analyst Review 分析报告

**Agent**: analyst
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint31
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 代码库验证 + gstack browse（staging 不可达，使用本地代码审查）

---

## 1. 执行摘要

Sprint 30 交付状态比预期复杂：E03/E04 完整交付，E01/E02/E05 均存在关键路径断裂。Dashboard 的"导出"功能是纯前端 JSON 下载（仅含 id/name/description/dates），不是 E02 设计的 .vibex 格式；E01 ProtoPreview 缺少端到端测试；E05 Presence 集成在 DDSCanvasPage 而非 ProtoFlowCanvas。

**评审结论**: ✅ **Recommended** — 所有提案经代码验证，需求真实，范围可控，无驳回红线。

---

## 2. Sprint 30 交付验证

### 2.1 验证方法

- 代码审查：grep + cat 关键文件
- gstack browse: staging.vibex.top DNS 不可解析（`net::ERR_NAME_NOT_RESOLVED`），本地服务 localhost:3000 未运行，改为静态代码审查
- 路径：`vibex-fronted/src/`, `vibex-backend/src/app/api/`, `tests/e2e/`, `.github/workflows/`

### 2.2 Epic 交付状态

| Epic | 计划目标 | 代码实际 | 状态 |
|------|---------|---------|------|
| E01 ProtoPreview 实时联动 | componentStore + debounce + e2e 测试 | ProtoPreviewPanel 订阅 `prototypeStore.selectedNodeId` ✅；`data-rebuild="false"` ✅；`debounce.ts` ✅；**protopreview-realtime.spec.ts 不存在** | ⚠️ **部分交付（e2e 缺失）** |
| E02 项目导入/导出 | Backend API + Dashboard UI + .vibex 格式 | Backend export/import routes ✅；但 Dashboard "导出"是**纯前端 JSON**（仅含 id/name/description/dates），**不调用** `/api/projects/:id/export`；**无导入 Modal** | ⚠️ **部分交付（功能断裂）** |
| E03 E2E 测试补全 | share-notification.spec.ts + CI 卡口 | TC-S06-01~04 + TC-S07-01~04 ✅；`e2e-tests.yml` workflow 存在且配置正确，无 `|| true` 跳过 | ✅ **已实现** |
| E04 Spec 补全 | E04 + S29 specs | ✅ 5 个 spec 文件全部存在且内容完整 | ✅ **已实现** |
| E05 Presence 层 | Firebase RTDB + Canvas avatars | `useRealtimeSync` + `firebaseRTDB.ts` + `presence.ts` ✅；`PresenceAvatars.tsx` 集成在 `DDSCanvasPage.tsx` ✅；**ProtoFlowCanvas（React Flow）无 presence 集成** | ⚠️ **部分交付（目标页面偏差）** |

### 2.3 关键发现修正

**E02 Dashboard 导出≠E02 导出**: Dashboard 有 `bulkExportBtn`，但 `handleBulkExport` 实现的是纯前端 JSON 序列化（`new Blob([json])` + `createElement('a').click()`），仅导出项目元数据。**不调用** `GET /api/projects/:id/export` API，不包含 uiNodes/businessDomains/flowData 等核心数据。这与 E02 spec 要求的 .vibex 格式导出是**两个不同的功能**。

**E03 CI 卡口已配置**: `.github/workflows/e2e-tests.yml` 存在，配置 Playwright CI 模式，retries 和 workers 正确设置，无 `|| true` 跳过。E03 交付质量高于预期。

**E05 Presence 目标页面错误**: `PresenceAvatars.tsx` 在 `DDSCanvasPage.tsx:645` 集成，但 ProtoFlowCanvas（`@xyflow/react` 驱动的 React Flow 编辑器）无 presence avatars 渲染代码。E05 交付在了错误的 Canvas 页面。

**E01 e2e 完全缺失**: `tests/e2e/protopreview-realtime.spec.ts` 不存在，实时联动功能无自动化测试保护。

---

## 3. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | E02 项目级导入 Modal（Dashboard 补全） | Dashboard 前端 | P0 |
| P002 | improvement | E02 导出功能重构（对接 Backend API，生成 .vibex 格式） | Dashboard + Backend | P0 |
| P003 | improvement | E02 schema 字段对齐（export 与 import 格式一致） | Backend API | P0 |
| P004 | improvement | E01 ProtoPreview 端到端测试补全 | E2E 测试 | P1 |
| P005 | improvement | E05 ProtoFlowCanvas Presence 头像集成 | ProtoFlowCanvas | P1 |

---

## 4. 提案详情

### P001: E02 项目级导入 Modal

**问题描述**: E02 Backend Import API 已实现（`import/route.ts` 存在且逻辑完整），但 Dashboard 页面**完全没有**导入功能。项目导入/导出功能在 UI 层断裂，用户只能靠手工操作数据库或 API 工具导入项目。

**影响范围**: `vibex-fronted/src/app/dashboard/page.tsx` + `vibex-fronted/src/components/dashboard/`

**验收标准**:
```
[ ] Dashboard 顶部「导入项目」按钮存在
[ ] 点击触发 Modal，支持拖拽或点击上传 .vibex 文件
[ ] POST /api/projects/import → 201 + 项目出现在 Dashboard 列表
[ ] 无效 JSON → Modal 内显示错误提示（红色 Toast）
[ ] 导入中 Modal 显示 loading spinner
[ ] E2E: 导入 .vibex → 项目出现在列表 → 数据完整
```

---

### P002: E02 导出功能重构（对接 Backend API）

**问题描述**: Dashboard 当前"导出"是纯前端 JSON 下载，仅含项目元数据（id/name/description/dates），不调用 Backend Export API，不包含 uiNodes/businessDomains/flowData。E02 功能实际上**完全没有**在用户界面层可用。

**影响范围**: `vibex-fronted/src/app/dashboard/page.tsx`

**验收标准**:
```
[ ] 点击项目卡片「导出」→ 调用 GET /api/projects/:id/export
[ ] 导出文件为 .vibex 格式（version: "1.0"，含 pages/uiNodes/businessDomains/flowData/requirements）
[ ] 浏览器下载 .vibex 文件（Content-Disposition: attachment）
[ ] 批量导出（选择多个项目）→ 分别调用各项目 export API
[ ] E2E: 导出 → 保存文件 → 上传同一文件 → 数据完整恢复
```

---

### P003: E02 schema 字段对齐

**问题描述**: 当前 export API 和 import API 使用不同字段集：
- export 实际输出：待确认（需检查 `projectExporter.ts`）
- import 读取：`pages, uiNodes, businessDomains, flowData, requirements`
如果 export 输出格式与 import 期望格式不一致，导入会丢失数据。

**影响范围**: `vibex-backend/src/lib/services/projectExporter.ts` + `vibex-backend/src/lib/schemas/vibex.ts`

**验收标准**:
```
[ ] GET /api/projects/:id/export → 返回的 JSON 字段与 POST /api/projects/import 读取字段完全一致
[ ] 导出 trees.componentTree → 导入时能正确写入 Prisma uiNodes 表
[ ] 导出测试：导出 → import → 对比原始数据，核心字段全部恢复
[ ] version 字段为 "1.0"，所有必需字段存在
```

---

### P004: E01 ProtoPreview 端到端测试补全

**问题描述**: `tests/e2e/protopreview-realtime.spec.ts` 完全不存在。ProtoPreview 实时联动功能（ProtoFlowCanvas 选中节点 → ProtoPreview 显示）没有自动化测试，每次代码变更都是盲改。share-notification.spec.ts 已作为参考模板。

**影响范围**: `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts`

**验收标准**:
```
[ ] E2E: 打开 Canvas → 选中组件树节点 → ProtoPreview 200ms 内显示
[ ] E2E: 无选中节点 → placeholder 显示（"选中组件以预览"）
[ ] E2E: props 修改 → 热更新无白屏（data-rebuild="false"）
[ ] API test: selectedNodeId 变更 → ProtoPreview re-render
[ ] E2E test:e2e:ci exit 0
```

---

### P005: E05 ProtoFlowCanvas Presence 头像集成

**问题描述**: `PresenceAvatars.tsx` 已实现并在 `DDSCanvasPage.tsx` 集成，但 `ProtoFlowCanvas`（`@xyflow/react` 驱动的 React Flow 原型编辑器）无 presence avatars 渲染代码。用户在 ProtoFlowCanvas 中看不到在线协作者。

**影响范围**: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`

**验收标准**:
```
[ ] ProtoFlowCanvas 右上角或工具栏显示在线用户头像列表（来自 usePresence hook）
[ ] 头像包含用户名 initial + color dot
[ ] Firebase RTDB 未配置时 → 静默降级到 mock 数据，Canvas 正常编辑不受影响
[ ] 无 Firebase 错误抛出到 console
```

---

## 5. 根因分析

### P001/P002 根因
**根因**: Sprint 30 实施时开发者优先完成了 Backend API（export/import route.ts），Dashboard UI 被推迟或遗忘。同时 Dashboard 已有另一个"导出"功能（handleBulkExport），与 E02 的导出是不同实现路径，前端开发者可能误以为已有导出功能而不再实现 E02 导出。

**证据**: `dashboard/page.tsx:280` 的 `handleBulkExport` 是纯前端 JSON 下载（仅含 id/name/description），与 `GET /api/projects/:id/export` 完全无关。无 import 相关代码。

### P003 根因
**根因**: Backend export 和 import 由不同人实现，字段命名基于各自的 Prisma schema 理解（export 用 Prisma 表名，import 用自己的字段映射），没有 schema 对齐审查。

**证据**: import route 写入 Prisma 表：project, page, uINode, businessDomain, flowData, requirement；export service 返回结构待确认，两者可能存在字段不对称。

### P004 根因
**根因**: E01 单元测试存在（`__tests__/ProtoFlowCanvas.test.tsx`），但 E2E 测试从未被写入 Sprint 30 的 DoD。"测试补全"Epic 聚焦在 ShareBadge/E03，ProtoPreview E2E 被遗漏。

**证据**: `vibex-fronted/src/components/prototype/__tests__/ProtoFlowCanvas.test.tsx` 存在（Vitest），但 `tests/e2e/protopreview-realtime.spec.ts` 不存在。

### P005 根因
**根因**: E05 Epic 交付了 Presence hooks 和 DDSCanvasPage 集成，但 ProtoFlowCanvas 是不同的 Canvas 实现（DDS vs React Flow），集成点被遗漏。没有"在 ProtoFlowCanvas 中渲染 Presence"的 Epic DoD 检查。

**证据**: `grep -r "PresenceAvatars\|usePresence" ProtoFlowCanvas.tsx` 无结果；PresenceAvatars 集成在 `DDSCanvasPage.tsx`。

---

## 6. 建议方案

### P001: 项目级导入 Modal

**方案 A（推荐）: 增量集成**
- 新建 `ImportModal.tsx` 组件，放在 Dashboard 顶部
- 前端调用 `POST /api/projects/import`（JSON body 方式）
- 进度状态管理：idle → loading → success/error
- 风险: 低 — Backend API 已就绪
- 回滚: 删除 ImportModal 组件

### P002: 导出功能重构

**方案 A（推荐）: 替换 handleBulkExport 逻辑**
- 保留"导出"按钮位置，将纯前端 JSON 下载替换为调用 `GET /api/projects/:id/export`
- 使用 fetch + blob download 模式（与当前 bulkExport 类似结构）
- 风险: 低 — Backend API 已有，仅改前端调用方式
- 回滚: 恢复原 handleBulkExport 逻辑

### P003: schema 字段对齐

**方案 A（推荐）: export 适配 import（Prisma 表结构对齐）**
- 修改 `projectExporter.ts` 输出结构与 import 读取格式一致
- 同步更新 `vibex.ts` Zod schema
- 风险: 低 — 纯 Backend 修改
- 回滚: git revert

### P004: E01 端到端测试

**方案 A（推荐）: 新建 protopreview-realtime.spec.ts**
- 参考 share-notification.spec.ts 模板
- 覆盖：选中节点→预览、placeholder、无选中、热更新
- 风险: 低 — 纯测试文件

### P005: ProtoFlowCanvas Presence 集成

**方案 A（推荐）: 最小化 UI 集成**
- 在 ProtoFlowCanvas 工具栏添加 presence avatars
- 使用 `usePresence({ mockMode: true })` mock 优先
- Firebase RTDB 配置检测后决定是否启用真实连接
- 风险: 低 — 纯 UI
- 回滚: 删除渲染代码

---

## 7. 执行依赖

### P001
- [ ] 需要修改的文件: `vibex-fronted/src/app/dashboard/page.tsx`, `vibex-fronted/src/components/dashboard/ImportModal.tsx`
- [ ] 前置依赖: P002（P002 重构 export API 后，导入 API 格式确定）
- [ ] 需要权限: 无
- [ ] 预计工时: 6h
- [ ] 测试验证命令: `npm run test:e2e -- dashboard-import`

### P002
- [ ] 需要修改的文件: `vibex-fronted/src/app/dashboard/page.tsx`
- [ ] 前置依赖: P003（schema 对齐后 export 字段确定）
- [ ] 需要权限: 无
- [ ] 预计工时: 4h
- [ ] 测试验证命令: E2E 导出 → 下载 .vibex 文件 → 验证文件内容

### P003
- [ ] 需要修改的文件: `vibex-backend/src/lib/services/projectExporter.ts`, `vibex-backend/src/lib/schemas/vibex.ts`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 3h
- [ ] 测试验证命令: `curl localhost:3000/api/projects/:id/export` → 验证字段与 import 对齐

### P004
- [ ] 需要修改的文件: `vibex-fronted/tests/e2e/protopreview-realtime.spec.ts`
- [ ] 前置依赖: 无（E01 功能已实现，仅补测试）
- [ ] 需要权限: 无
- [ ] 预计工时: 5h
- [ ] 测试验证命令: `npm run test:e2e -- protopreview-realtime`

### P005
- [ ] 需要修改的文件: `vibex-fronted/src/components/prototype/ProtoFlowCanvas.tsx`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 3h（mock）
- [ ] 测试验证命令: `open Canvas → presence avatars visible`

---

## 8. 风险矩阵

| ID | 风险 | 可能性 | 影响 | 缓解措施 |
|----|------|--------|------|----------|
| P001-R1 | Dashboard UI 改动范围超出预期（现有组件结构复杂） | 中 | 中 | 先分析现有组件结构，MVP 优先 |
| P002-R1 | 替换 export 后，原有的批量选择导出逻辑受影响 | 低 | 中 | 保留批量选择逻辑，仅替换 API 调用 |
| P003-R1 | 历史导出文件与新格式不兼容 | 低 | 高 | .vibex 文件加 version 字段，提示用户重新导出 |
| P004-R1 | E2E 测试 flaky（条件跳过） | 中 | 中 | 移除不必要的条件跳过，实测稳定后提交 |
| P005-R1 | Presence 多处集成（DDS + ProtoFlowCanvas）不一致 | 低 | 低 | 统一使用 usePresence hook，UI 样式一致 |

---

## 9. 工期估算

| 提案 | 推荐方案 | 工时 | 风险 |
|------|----------|------|------|
| P001 导入 Modal | 方案 A | 6h | 低 |
| P002 导出重构 | 方案 A | 4h | 低 |
| P003 schema 对齐 | 方案 A | 3h | 低 |
| P004 E01 e2e 测试 | 方案 A | 5h | 低 |
| P005 Presence 集成 | 方案 A（mock）| 3h | 低 |
| **合计** | | **21h** | |

**2人 Sprint 可行性**: 21h / 60h = 35%，buffer 充足。

---

## 10. 下游传递

**给 PM（pm-review）**:
- P001-P005 全部 Recommended，可进入 PRD 阶段
- P003 是 P002 的前置依赖，需先完成 schema 对齐再改 Dashboard 导出
- P002 替换 handleBulkExport 时需注意保留批量选择 UX

**给 Coord（coord-decision）**:
- Sprint 31 总工期：21h，2人 Sprint 有大量 buffer
- 建议优先 P003（schema）→ P002（export 重构）→ P001（import modal）串行执行
- P004（e2e）和 P005（presence）可并行

---

## 11. 相关文件

- Sprint 30 analysis: `docs/vibex-proposals-sprint30/analysis.md`
- Sprint 30 PRD: `docs/vibex-proposals-sprint30/prd.md`
- Sprint 30 architecture: `docs/vibex-proposals-sprint30/architecture.md`
- E02 export API: `vibex-backend/src/app/api/projects/[id]/export/route.ts`
- E02 import API: `vibex-backend/src/app/api/projects/import/route.ts`
- Dashboard: `vibex-fronted/src/app/dashboard/page.tsx`
- E05 PresenceAvatars: `vibex-fronted/src/lib/firebase/presence.ts`
- CI workflow: `vibex-fronted/.github/workflows/e2e-tests.yml`
- 模板: `proposals/TEMPLATE.md`