# VibeX Sprint 30 — Analyst 提案

**Agent**: analyst
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint30
**仓库**: /root/.openclaw/vibex
**分析视角**: Analyst — 基于 Sprint 1-29 交付成果 + 代码库审视

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | 组件树实时预览 | Canvas 原型编辑 | P0 |
| P002 | improvement | 项目导入/导出 | Dashboard / Canvas | P0 |
| P003 | testing | E2E 测试覆盖补全 | 核心用户流程 | P1 |
| P004 | improvement | Sprint 28-29 Spec 补全 | docs 文档完整性 | P1 |
| P005 | improvement | Presence 层功能增强 | Canvas 实时协作 | P2 |

---

## 2. 提案详情

### P001: 组件树实时预览

**问题描述**:

当前 Canvas 的组件树（Component Tree）和原型预览区（ProtoPreview）是两个独立面板，用户在组件树中勾选/编辑节点后，无法实时看到预览效果。必须手动触发"预览"或切换面板才知道组件长什么样。这违反了 VibeX"所见即所得"的核心产品哲学，导致用户反复试错、编辑效率低。

**复现步骤**:
1. 打开任意项目 Canvas 页面
2. 进入组件生成阶段，选中若干组件节点
3. 修改组件的 `props` 或 `api` 配置
4. 观察 ProtoPreview 面板——**无任何实时更新**，需要手动刷新或切换视图

**影响范围**:

- `ProtoEditor.tsx`（预览编辑器）
- `ProtoPreview.tsx`（预览面板）
- `componentStore.ts`（组件状态）
- 核心用户体验路径：Canvas 生成 → 编辑 → 预览循环

**验收标准**:

```
[ ] 选中组件节点后，预览面板在 200ms 内显示对应组件
[ ] 修改组件 props，预览面板热更新无闪烁
[ ] 未选中组件时，预览面板显示空白占位符（不是上一次预览残留）
[ ] 预览面板异常（渲染失败）时，显示错误边界，不阻断操作
```

---

### P002: 项目导入/导出

**问题描述**:

VibeX 用户当前无法将项目数据导出保存。三个树（上下文/流程/组件）的数据完全存储在内存和 localStorage 中，一旦浏览器关闭或切换设备，工作成果全部丢失。用户只能依赖"创建项目"触发的 AI 生成，无法导入已有的设计文件进行延续编辑。这与路线图"项目导入/导出"（P1）承诺不符，且直接限制了用户的协作场景。

**复现步骤**:
1. 完成 Onboarding，创建项目，生成三个树数据
2. 勾选部分节点，生成组件
3. 关闭浏览器
4. 重新打开 VibeX → **无法找到之前项目**，数据完全丢失

**影响范围**:

- Dashboard 项目列表
- `projectStore.ts`
- Canvas 三个 store（context/flow/component）
- API 层（export/import 端点）

**验收标准**:

```
[ ] Dashboard 每个项目卡片有"导出"按钮，导出为 .vibex JSON 文件
[ ] Dashboard 有"导入"入口，支持 .vibex JSON 文件导入
[ ] 导出文件包含：所有树数据 + 勾选状态 + 元数据（name/id/createdAt）
[ ] 导入后项目出现在 Dashboard 列表，可正常打开并恢复全部状态
[ ] 导出文件大小 < 5MB（大型项目截断提示）
[ ] 导出文件名格式: {projectName}_{date}.vibex
```

---

### P003: E2E 测试覆盖补全

**问题描述**:

当前 VibeX 的 Playwright E2E 测试覆盖严重不足。Sprint 29 新增了通知系统，但没有任何对应测试；Sprint 28 的模板 CRUD 也只有部分场景覆盖。`playwright-a11y-test.config.cjs` 和 `playwright-canvas-crash-test.config.cjs` 等配置文件存在，但没有形成完整的回归测试套件。每次上线依赖人工 QA，效率低且易遗漏。

**复现步骤**:
1. 查看 `tests/e2e/` 目录
2. 运行 `pnpm test:e2e`
3. 观察——**覆盖场景不完整**：通知系统（ShareBadge/ShareToTeamModal）、模板导入导出、项目分享通知等核心路径均无测试

**影响范围**:

- `tests/e2e/` 目录
- `playwright.config.ts`（测试配置）
- CI/CD 流程（回归自动化）

**验收标准**:

```
[ ] ShareBadge 未读计数测试（新增通知后 badge 数字 +1）
[ ] ShareToTeamModal 通知触发测试（分享成功后 toast 提示）
[ ] 模板导入/导出完整流程测试
[ ] Dashboard 项目列表加载测试（无空状态白屏）
[ ] E2E 测试全部通过（pnpm test:e2e exit 0）
[ ] CI 中 E2E 测试作为必过卡口（fail 则阻断部署）
```

---

### P004: Sprint 28-29 Spec 补全

**问题描述**:

Sprint 28 交付了 E01-E04 共 4 个 Epic，文档目录中 `specs/` 仅存在 E01、E02、E05 的 spec 文件，E03（AI 辅助需求解析）和 E04（模板 CRUD）缺失。Sprint 29 同样存在 spec 文档缺失问题。Spec 是研发和测试的"合同"，缺失 spec 直接导致验收标准不清、测试用例遗漏、开发方向漂移。

**复现步骤**:
1. `ls docs/vibex-proposals-sprint28/specs/`
2. 输出只有 `E01-synchronous-realtime.md`、`E02-design-output-perf.md`、`E05-xxx.md`
3. 缺少 `E03-ai-clarify.md` 和 `E04-template-crud.md`

**影响范围**:

- `docs/vibex-proposals-sprint28/specs/`
- `docs/vibex-proposals-sprint29/specs/`

**验收标准**:

```
[ ] docs/vibex-proposals-sprint28/specs/E03-ai-clarify.md 存在且包含 API 契约 + 状态机
[ ] docs/vibex-proposals-sprint28/specs/E04-template-crud.md 存在且包含 CRUD 字段定义
[ ] docs/vibex-proposals-sprint29/specs/ 包含所有 Epic 的 spec 文件
[ ] 每个 spec 文件包含：接口签名、边界条件、降级策略
```

---

### P005: Presence 层功能增强

**问题描述**:

Sprint 27/28 已引入 Firebase RTDB 实时同步，但 Presence 层（用户在线状态）仅实现了基础的多人在线计数，没有展示"谁在编辑哪个节点"的功能。协作者看不到彼此的光标位置或正在编辑的节点，导致实时协作体验停留在"知道有人在线"而非"知道谁在做什么"。

**复现步骤**:
1. 两个浏览器登录同一项目
2. 用户 A 在组件树中选中某个节点
3. 用户 B 的画布上——**无法看到用户 A 选中了哪个节点**，只能看到在线人数 +1

**影响范围**:

- `CanvasPage.tsx`
- `hooks/useRealtimeSync.ts`
- `hooks/usePresence.ts`
- `components/presence/`

**验收标准**:

```
[ ] 选中节点时，向 RTDB 写入 { nodeId, nodeType, userId, color }
[ ] 其他用户看到选中节点的高亮边框（颜色 = 协作者颜色）
[ ] 协作者头像悬浮显示用户名
[ ] 协作者离开或取消选中时，高亮自动清除
[ ] Firebase 未配置时，Presence 功能静默降级，不阻断正常编辑
```

---

## 3. 根因分析

### P001: 组件树实时预览缺失

**根因**: `componentStore` 变化后，`ProtoPreview` 组件没有订阅 store 变更，导致预览区永远显示上一次渲染结果。组件树和预览之间缺少 Zustand subscription 机制。

**证据**:
- `ProtoPreview.tsx` 中未发现 `useComponentStore` 或 `useShallow` subscription
- `ProtoEditor.tsx` 也没有监听 `componentStore` 变更
- Canvas 架构文档（`docs/canvas-three-tree-unification/architecture.md`）中未提及预览联动设计

### P002: 项目导入/导出缺失

**根因**: 产品优先级一直偏向生成能力，导入/导出被长期搁置。API 层（`/api/projects`）没有 export/import 端点，frontend 没有对应 UI，存储层只有 localStorage 无持久化。

**证据**:
- README 路线图中标注"下一阶段（v1.2-v2.0）"但从未进入 Sprint
- `projectStore.ts` 无 import/export 方法
- `/api/projects/` 下无 export 相关路由

### P003: E2E 测试覆盖不足

**根因**: 每个 Sprint 的交付压力集中在功能开发，测试被视为"可延后"项。Spec 文档缺失进一步加剧了测试用例编写的难度（没有明确的验收标准）。

**证据**:
- `tests/e2e/` 中 share/notification 相关测试文件不存在
- `playwright-a11y-test.config.cjs` 存在但未被 CI 集成
- CHANGELOG 中多次出现"单元测试/E2E 测试"作为 Epic 的一部分，但最终交付时测试经常被跳过

### P004: Spec 文档缺失

**根因**: Sprint 28 的 E03（AI clarify）和 E04（模板 CRUD）交付时跳过了 spec 文档创建。`analyst-review` 和 `pm-review` 阶段产出了 analysis.md 和 prd.md，但没有强制约束 spec 创建。

**证据**:
- `docs/vibex-proposals-sprint28/specs/` 只有 3 个文件（E01/E02/E05），缺少 E03/E04
- `pm-review` 任务的验收标准中没有 spec 创建的明确检查项

### P005: Presence 层功能薄弱

**根因**: 实时协作 MVP（Firebase RTDB）优先保证"能同步"，暂缓了"同步什么信息"的功能深度。Sprint 27 的 P001 描述为"useRealtimeSync 集成"，未规划节点级别 presence。

**证据**:
- `usePresence.ts` 只有 `count` 状态，无 `nodeId`/`nodeType` 字段
- CHANGELOG Sprint 27/28 未提及 presence 层增强

---

## 4. 建议方案

### P001: 组件树实时预览

**方案 A（推荐）: Zustand Subscription 联动**
- `ProtoPreview.tsx` 使用 `useShallow` 订阅 `componentStore` 的 `nodes` 和 `selectedIds`
- 节点变更时，`renderer.ts` 重新渲染选中组件，注入最新 `props`/`api`
- 200ms 防抖防止频繁重渲染
- 实施成本: **中（8h）** | 风险: **低** | 回滚: 注释掉 subscription 即可

**方案 B: 事件总线解耦**
- 引入 `mitt`/`eventemitter3` 作为组件树和预览的通信层
- `componentStore` dispatch `component:selected` 事件，预览层订阅
- 实施成本: **高（14h）** | 风险: **中**（引入新依赖，事件流复杂度上升）

### P002: 项目导入/导出

**方案 A（推荐）: 全量 JSON + API 端点**
- Backend: 新增 `GET /api/projects/:id/export` 和 `POST /api/projects/import`
- Frontend: Dashboard 添加导出按钮 + 导入 Modal
- Export 格式: `{ version: "1.0", project: { name, id, ... }, trees: { context, flow, component }, exportedAt }`
- 实施成本: **中（10h）** | 风险: **低** | 回滚: 删除 API 端点

**方案 B: 仅 Frontend localStorage 导出**
- 仅前端实现，不走后端
- 实施成本: **低（4h）** | 风险: **高**（无法跨设备/浏览器，文件易损坏无校验）

### P003: E2E 测试覆盖补全

**方案 A（推荐）: 分 Epic 补充测试 + CI 集成**
- 每个 Epic 新增 5-8 个核心场景 E2E 测试
- 将 `playwright-a11y-test.config.cjs` 合并到主配置，CI 添加 `pnpm test:e2e` 卡口
- 实施成本: **中（12h）** | 风险: **低** | 回滚: CI 注释掉 E2E step

**方案 B: 独立测试 Sprint**
- 单独开一个 Sprint 集中补全所有 E2E 测试
- 实施成本: **高（24h+）** | 风险: **高**（影响其他功能交付）

### P004: Spec 补全

**方案: 补充缺失 Spec 文档**
- E03 spec: AI clarify API 契约（输入/输出/超时/降级）
- E04 spec: 模板 CRUD API 字段定义 + 错误码
- E05 spec: ErrorBoundary 异常处理矩阵
- 实施成本: **低（6h）** | 风险: **低** | 回滚: 删除文件

### P005: Presence 层增强

**方案 A（推荐）: RTDB 节点级别 Presence**
- 扩展 `useRealtimeSync.ts` 增加 `presence` namespace
- 写入格式: `presence/{projectId}/{userId}: { nodeId, nodeType, color, timestamp }`
- Canvas 组件树高亮层订阅 `presence/` 变更
- 实施成本: **中（10h）** | 风险: **中**（Firebase 依赖，RTDB quota 需监控）

**方案 B: 仅 UI 增强，不动 RTDB**
- 当前 presence 数据（count）可视化增强（用户头像列表）
- 不实现节点级别追踪
- 实施成本: **低（4h）** | 风险: **低**（改动小）

---

## 5. 执行依赖

### P001: 组件树实时预览

- [ ] 需要修改的文件: `vibex-fronted/src/components/canvas/ProtoPreview.tsx`, `vibex-fronted/src/stores/componentStore.ts`, `vibex-fronted/src/lib/renderer.ts`
- [ ] 前置依赖: 无（可独立进行）
- [ ] 需要权限: 无
- [ ] 预计工时: 8h（方案 A）
- [ ] 测试验证命令: `cd vibex-fronted && pnpm test:unit componentStore && pnpm test:e2e --grep="ProtoPreview"`

### P002: 项目导入/导出

- [ ] 需要修改的文件: `vibex-backend/src/app/api/projects/[id]/export/route.ts`, `vibex-backend/src/app/api/projects/import/route.ts`, `vibex-fronted/src/components/dashboard/`, `vibex-fronted/src/stores/projectStore.ts`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 10h（方案 A）
- [ ] 测试验证命令: `pnpm test:e2e --grep="import\|export"`

### P003: E2E 测试覆盖

- [ ] 需要修改的文件: `tests/e2e/`, `playwright.config.ts`, CI workflow
- [ ] 前置依赖: P002（导入功能需有测试覆盖）
- [ ] 需要权限: GitHub Actions CI 配置
- [ ] 预计工时: 12h
- [ ] 测试验证命令: `pnpm test:e2e --project=chromium`

### P004: Spec 补全

- [ ] 需要修改的文件: `docs/vibex-proposals-sprint28/specs/`, `docs/vibex-proposals-sprint29/specs/`
- [ ] 前置依赖: 无（纯文档工作）
- [ ] 需要权限: 无
- [ ] 预计工时: 6h
- [ ] 测试验证命令: `test -f docs/vibex-proposals-sprint28/specs/E03-ai-clarify.md && test -f docs/vibex-proposals-sprint28/specs/E04-template-crud.md`

### P005: Presence 层增强

- [ ] 需要修改的文件: `hooks/useRealtimeSync.ts`, `hooks/usePresence.ts`, `components/canvas/CanvasPage.tsx`, Canvas 组件树高亮组件
- [ ] 前置依赖: Firebase RTDB 已配置（Sprint 27/28 已完成）
- [ ] 需要权限: Firebase Console 配置读写规则
- [ ] 预计工时: 10h（方案 A）
- [ ] 测试验证命令: Firebase RTDB 手动验证 + `pnpm test:e2e --grep="presence"`

---

## 6. 工期总估算

| 提案 | 推荐方案 | 工时 | 风险 |
|------|----------|------|------|
| P001 组件树实时预览 | 方案 A | 8h | 低 |
| P002 项目导入/导出 | 方案 A | 10h | 低 |
| P003 E2E 测试补全 | 方案 A | 12h | 低 |
| P004 Spec 补全 | — | 6h | 低 |
| P005 Presence 层增强 | 方案 A | 10h | 中（Firebase 依赖）|
| **合计** | | **46h** | |

**2人 Sprint 可行性**: 46h / 2人 = 23h，1 周 Sprint（40h）可覆盖，有 17h buffer。
**风险**: Firebase RTDB P005 有依赖风险，建议 P005 与 P001-P004 并行开发。

---

## 7. 评审结论

**推荐执行 P001 + P002 + P003 + P004**（共 36h），P005 作为 P2 视 Sprint 进度决定是否纳入。

**驳回条件触发**: 无。
**阻塞风险**: P005 依赖 Firebase RTDB 配置，Sprint 27/28 已完成但需确认环境变量存在。

---

## 8. 相关文件

- 模板: `proposals/TEMPLATE.md`
- 架构: `docs/canvas-three-tree-unification/architecture.md`
- 实施计划: `docs/vibex-proposals-sprint29/IMPLEMENTATION_PLAN.md`（参考格式）
- CHANGELOG: `CHANGELOG.md`（Sprint 27-29 交付物索引）
