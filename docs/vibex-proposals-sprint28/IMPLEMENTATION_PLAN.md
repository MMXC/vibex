# VibeX Sprint 28 — 实施计划

**Agent**: architect
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint28
**Sprint 周期**: 2026-05-07 ~ 2026-05-16（2 周）
**团队规模**: 2 人
**总工期**: 24.5h / 60h（预算使用率 41%）

---

## 1. Sprint Overview

### 1.1 优先级排序依据

| 优先级 | 判断标准 | Epic |
|--------|---------|------|
| **P0** | 无外部依赖，且为其他 Epic 基础或性能关键路径 | E01（实时协作）、E02（性能优化）|
| **P1** | 无外部依赖，功能核心 | E03（AI 解析）、E04（模板 CRUD）、E05（PRD→Canvas）|
| **P2** | 锦上添花，可延后 | E06（错误边界）、E07（MCP 完善）|

**排序逻辑**: P0 无阻塞先做 → P1 核心功能 → P2 完善增强。E01 最复杂放在 Week 2 冲刺。

### 1.2 Week 1 日历表（5 工作日 = 25h/人 = 50h 团队容量）

| 日期 | Day | 主要任务 | Epic | 负责人 | 预计工时 |
|------|-----|---------|------|--------|---------|
| 05-07（周四）| Day 1 AM | P002 E02 虚拟化列表（S02.1）| E02 | Dev A | 2h |
| 05-07（周四）| Day 1 PM | P004 E04 CRUD API + Dashboard UI（S04.1 + S04.2）| E04 | Dev B | 1.5h |
| 05-08（周五）| Day 2 AM | P002 E02 Memo 优化（S02.2）| E02 | Dev A | 1.5h |
| 05-08（周五）| Day 2 PM | P004 E04 模板导入/导出（S04.3）| E04 | Dev B | 0.5h |
| 05-09（周六）| Day 3 | P006 E06 DDSCanvasPage ErrorBoundary（S06.1）| E06 | Dev A | 2h |
| 05-10（周日）| Day 4 | P005 E05 PRD → Canvas API + 按钮（S05.1 + S05.2）| E05 | Dev B | 4h |
| 05-11（周一）| Day 5 | P003 E03 API + ClarifyAI + 降级路径（S03.1 + S03.2 + S03.3）| E03 | Dev A | 3.5h |

**Week 1 完工**: E02(3.5h) + E04(3.5h) + E06(2h) + E05(4h) + E03(3.5h) = **16.5h** ✅ 在容量内

### 1.3 Week 2 日历表（5 工作日 = 25h/人 = 50h 团队容量）

| 日期 | Day | 主要任务 | Epic | 负责人 | 预计工时 |
|------|-----|---------|------|--------|---------|
| 05-12（周二）| Day 6 | P001 E01 PresenceLayer 合并（S01.1）+ mock Firebase | E01 | Dev A | 1.5h |
| 05-12（周二）| Day 6 | P001 E01 useRealtimeSync hook（S01.2 前半）| E01 | Dev B | 1.5h |
| 05-13（周三）| Day 7 | P001 E01 useRealtimeSync 集成 + Firebase 连接（S01.2 后半 + S01.3）| E01 | Dev A+B | 2.5h |
| 05-14（周四）| Day 8 | P001 E01 集成测试（presence-mvp.spec.ts）+ P007 E07 MCP（S07.1 + S07.2）| E01 + E07 | Dev A | 1.5h + 2.5h |
| 05-15（周五）| Day 9 | 全量 E2E 测试 + Lighthouse 验证 + 性能测试 | - | Dev A+B | 4h |
| 05-16（周六）| Day 10 | Sprint 收尾：PR review + 文档更新 + Retro | - | Dev A+B | 2h |

**Week 2 完工**: E01(5.5h) + E07(2.5h) = **8h** + 验证/收尾 6h = **14h** ✅ 在容量内

### 1.4 工期汇总

| Epic | 标题 | 工期 | 占比 |
|------|------|------|------|
| E01 | 实时协作整合 | 5.5h | 22% |
| E02 | Design Output 性能优化 | 3.5h | 14% |
| E03 | AI 辅助需求解析 | 3.5h | 14% |
| E04 | 模板 API 完整 CRUD | 3.5h | 14% |
| E05 | PRD → Canvas 自动流程 | 4.0h | 16% |
| E06 | Canvas 错误边界完善 | 2.0h | 8% |
| E07 | MCP Server 集成完善 | 2.5h | 10% |
| **合计** | | **24.5h** | 100% |

**Sprint 28 工期完成率预计**: 24.5h / 60h = 41%（✅ 在 90% 目标范围内）

---

## 2. Epic 实施顺序与步骤

---

### E01: 实时协作整合
**工期**: 5.5h | **优先级**: P0 | **依赖**: Firebase 凭证（S01.3），S01.1 为 S01.2 前置

#### 开发步骤

**S01.1: PresenceLayer 合并到 CanvasPage**（1.5h）
1. 修改 `pages/canvas/[id].tsx`（或 `CanvasPage.tsx`）：导入 `PresenceLayer` 和 `usePresence`，在三栏容器上方渲染 `<PresenceLayer />`
2. 修改 `hooks/usePresence.ts`：确保 hook 导出格式正确，初始化用户在线状态
3. 修改 `.env.staging`：添加占位 FIREBASE_* 变量（凭证申请后可替换）
4. 单元测试：`tests/unit/usePresence.spec.ts` — 验证 presence state = "online"

**S01.2: 实时节点同步**（2.5h）
1. 新建 `hooks/useRealtimeSync.ts`：实现 Firebase RTDB `onValue` 监听 + `updateNode` 写操作
2. 修改 `pages/canvas/[id].tsx`：集成 `useRealtimeSync(projectId)`，消费 `nodes` 数组
3. 修改 `lib/firebase/presence.ts`：确认 RTDB 结构 `/projects/{projectId}/nodes/{nodeId}` 正确
4. 单元测试：`tests/unit/useRealtimeSync.spec.ts` — 模拟 Firebase 读写，验证 last-write-wins
5. E2E 测试：`tests/e2e/presence-mvp.spec.ts` — 更新以覆盖完整流程

**S01.3: Firebase 凭证配置**（1.5h）
1. 向 Firebase Console 申请 staging 项目凭证（或使用现有项目）
2. 替换 `.env.staging` 中的 FIREBASE_* 占位值为真实值
3. 验证：`firebase.database().ref().once('value')` 成功，无 console.error

#### 验收门控
- [ ] `expect(CanvasPage rendered, PresenceLayer mounted)`
- [ ] `expect(presence state === "online" after render)`
- [ ] `expect(user avatar visible at top-right corner)`
- [ ] `expect(useRealtimeSync defined and exported)`
- [ ] `expect(node update received within 500ms after Firebase write)`
- [ ] `expect(conflict resolved by last-write-wins)`
- [ ] `expect(env.staging contains all required FIREBASE_* vars)`
- [ ] `expect(Firebase connection established without console.error)`
- [ ] `tsc --noEmit` exits 0
- [ ] `presence-mvp.spec.ts` passes

---

### E02: Design Output 性能优化
**工期**: 3.5h | **优先级**: P0 | **依赖**: 无

#### 开发步骤

**S02.1: 虚拟化列表**（2h）
1. 安装依赖：`npm install react-window && npm install --save-dev @types/react-window`
2. 修改 `components/canvas/DDSCanvasPage.tsx`：
   - 导入 `FixedSizeList` from `react-window`
   - 用 `FixedSizeList` 替换 `{nodes.map(...)}` 循环，设置 `itemSize={120}`
   - 用 `ResizeObserver` 获取容器高度
3. 修改 `components/canvas/DesignCard.tsx`：确保高度固定，适配虚拟化
4. E2E 测试：`tests/e2e/dds-performance.spec.ts` — 300 节点 DOM 节点数验证

**S02.2: Memo 优化**（1.5h）
1. 修改 `components/canvas/DesignCard.tsx`：`React.memo` 包裹 + `useMemo` 处理 metadata 解析
2. 修改 `components/canvas/DDSCanvasPage.tsx`：子组件 memo 化，昂贵计算用 `useMemo`
3. 性能验证：Lighthouse CI `Performance Score >= 85`

#### 验收门控
- [ ] `expect(react-window imported in DDSCanvasPage)`
- [ ] `expect(FixedSizeList renders with itemCount === nodes.length)`
- [ ] `expect(DOM node count ~20 for 300-item list (not ~300))`
- [ ] `expect(all child components wrapped with React.memo)`
- [ ] `expect(useMemo used for expensive computations)`
- [ ] `expect(no visual jump during scroll)`
- [ ] `lighthouse_performance >= 85`
- [ ] `expect(300-node render time < 200ms)`
- [ ] `tsc --noEmit` exits 0

---

### E03: AI 辅助需求解析
**工期**: 3.5h | **优先级**: P1 | **依赖**: 无（L1 API key 可后补）

#### 开发步骤

**S03.1: /api/ai/clarify Endpoint**（1.5h）
1. 新建 `pages/api/ai/clarify.ts`：POST handler，调用 LLM API（超时 30s），返回结构化 JSON
2. 新建 `lib/ai/ruleEngine.ts`（降级规则引擎）：无 key 或超时 30s 时降级为正则+关键词匹配
3. 单元测试：`tests/unit/ai/clarify.spec.ts` — happy path + timeout + no-key 场景

**S03.2: ClarifyAI 组件**（1h）
1. 新建 `components/onboarding/ClarifyAI.tsx`：显示 AI 解析预览，支持用户编辑 + 确认
2. 新建 `hooks/useClarifyAI.ts`：封装 API 调用 + loading 状态
3. 修改 `components/onboarding/ClarifyStep.tsx`：集成 `ClarifyAI` 组件
4. E2E 测试：`tests/e2e/onboarding-ai.spec.ts` — Onboarding AI 流程

**S03.3: 降级路径**（1h，与 S03.1/S03.2 并行）
1. 在 `pages/api/ai/clarify.ts` 中实现超时 30s 降级
2. 在 `components/onboarding/ClarifyAI.tsx` 中实现无 key 时显示引导文案
3. 手动验证：无 key 时 Onboarding 不阻断，可正常跳转到 PreviewStep

#### 验收门控
- [ ] `expect(POST /api/ai/clarify returns 200)`
- [ ] `expect(response.body.structured contains fields)`
- [ ] `expect(timeout 30s fallback to rule engine, no error thrown)`
- [ ] `expect(no API key shows guidance message, no error thrown)`
- [ ] `expect(ClarifyAI.tsx renders in ClarifyStep)`
- [ ] `expect(AI result displayed as structured preview)`
- [ ] `expect(user can edit/confirm result)`
- [ ] `expect(Onboarding flow continues regardless of AI result)`
- [ ] `tsc --noEmit` exits 0

---

### E04: 模板 API 完整 CRUD
**工期**: 3.5h | **优先级**: P1 | **依赖**: 无

#### 开发步骤

**S04.1: POST/PUT/DELETE API**（1.5h）
1. 修改 `pages/api/v1/templates/index.ts`：添加 POST handler，返回 201
2. 修改 `pages/api/v1/templates/[id].ts`：添加 PUT handler（200）和 DELETE handler（200）
3. 确认 `GET /api/v1/templates` 已存在（代码验证已通过）
4. 单元测试：`tests/unit/api/templates-crud.spec.ts` — 覆盖 201/200/404 响应码

**S04.2: 模板 Dashboard UI**（1.5h）
1. 新建 `pages/dashboard/templates.tsx`：模板列表页，包含"新建模板"按钮
2. 新建 `components/templates/TemplateCard.tsx`：单个模板卡片，含编辑/删除按钮
3. 新建 `components/templates/TemplateModal.tsx`：新建/编辑弹窗
4. 修改 `pages/dashboard/index.tsx`：在导航中新增"模板"入口
5. E2E 测试：`tests/e2e/templates-crud.spec.ts` — CRUD 全链路

**S04.3: 模板导入/导出**（0.5h）
1. 在 `pages/dashboard/templates.tsx` 中添加"导出 JSON"按钮（download）和"导入 JSON"按钮（upload + parse）
2. 修改 API：导出 GET 返回模板 JSON，导入 POST 解析 JSON body
3. 单元测试：`tests/unit/api/templates-import-export.spec.ts` — valid + invalid JSON

#### 验收门控
- [ ] `expect(POST /api/v1/templates returns 201)`
- [ ] `expect(PUT /api/v1/templates/:id returns 200, fields updated)`
- [ ] `expect(DELETE /api/v1/templates/:id returns 200, subsequent GET returns 404)`
- [ ] `expect(/dashboard/templates accessible, returns 200)`
- [ ] `expect(template list displays created templates)`
- [ ] `expect(create/edit/delete buttons functional)`
- [ ] `expect(export downloads valid JSON file)`
- [ ] `expect(import parses JSON and creates template)`
- [ ] `expect(invalid JSON shows error message, no crash)`
- [ ] `tsc --noEmit` exits 0

---

### E05: PRD → Canvas 自动流程
**工期**: 4h | **优先级**: P1 | **依赖**: 无（MVP 只支持单层 chapter）

#### 开发步骤

**S05.1: /api/canvas/from-prd Endpoint**（2h）
1. 新建 `pages/api/canvas/from-prd.ts`：POST handler，解析 PRDDocument JSON
2. 实现映射逻辑：
   - PRDChapter → 左栏 `context` type 节点
   - PRDStep → 中栏 `flow` type 节点
   - PRDRequirement → 右栏 `design` type 节点
   - 构建 edges 数组（chapter → step → requirement）
3. MVP 约束：只处理单层 chapter，不处理嵌套
4. 单元测试：`tests/unit/api/prd-canvas-mapping.spec.ts` — 覆盖单 chapter + 3 steps + 5 requirements

**S05.2: PRD Editor 一键生成**（2h）
1. 修改 `app/editor/page.tsx`（或 `pages/editor/index.tsx`）：在工具栏添加"生成 Canvas"按钮
2. 实现按钮点击 handler：POST `/api/canvas/from-prd`，获取 nodes + edges
3. 实现 Canvas 三栏填充逻辑（调用 CanvasPage 三栏的 update API 或直接操作状态）
4. 实现 debounce 1s 的双向同步（PRD 变更触发 Canvas 更新）
5. E2E 测试：`tests/e2e/prd-canvas-mapping.spec.ts` — PRD → Canvas 往返

#### 验收门控
- [ ] `expect(POST /api/canvas/from-prd returns 200)`
- [ ] `expect(response.nodes.leftPanel.length === prd.chapters.length)`
- [ ] `expect(response.nodes.centerPanel.length === total steps)`
- [ ] `expect(response.nodes.rightPanel.length === total requirements)`
- [ ] `expect(response.edges.length > 0)`
- [ ] `expect("生成 Canvas" button visible in PRD Editor toolbar)`
- [ ] `expect(button click triggers POST /api/canvas/from-prd)`
- [ ] `expect(canvas left panel auto-populated after generation)`
- [ ] `expect(PRD change triggers canvas update within 1s)`
- [ ] `expect(toast "Canvas 已生成" shown after success)`
- [ ] `tsc --noEmit` exits 0

---

### E06: Canvas 错误边界完善
**工期**: 2h | **优先级**: P2 | **依赖**: 无

#### 开发步骤

**S06.1: DDSCanvasPage ErrorBoundary**（2h）
1. 确认 `components/panels/TreeErrorBoundary.tsx` 已存在
2. 修改 `components/canvas/DDSCanvasPage.tsx`：在外层包裹 `ErrorBoundary` 或 `TreeErrorBoundary`
3. 确认 Fallback UI 包含"渲染失败"文本 + "重试"按钮
4. 验证 `pages/canvas/[id].tsx`（CanvasPage）中 DDSCanvasPage 渲染时，模拟 `throw new Error()` 能触发 Fallback
5. 手动测试：点击"重试"按钮后组件恢复，不触发整页刷新

#### 验收门控
- [ ] `expect(DDSCanvasPage wrapped in ErrorBoundary)`
- [ ] `expect(simulated throw shows fallback UI with "重试" button)`
- [ ] `expect(click retry restores component without full page reload)`
- [ ] `expect(Fallback contains "渲染失败" text)`
- [ ] `tsc --noEmit` exits 0

---

### E07: MCP Server 集成完善
**工期**: 2.5h | **优先级**: P2 | **依赖**: 无

#### 开发步骤

**S07.1: 健康检查 Endpoint**（1h）
1. 新建 `pages/api/mcp/health.ts`：GET handler，返回 `{ status: "ok", timestamp: "..." }`
2. 单元测试：`tests/unit/api/mcp-health.spec.ts`

**S07.2: MCP 集成测试套件**（1.5h）
1. 新建 `tests/e2e/mcp-integration.spec.ts`：覆盖健康检查 + MCP 协议调用
2. 修改 `docs/mcp-claude-desktop-setup.md`：简化配置步骤（可选）

#### 验收门控
- [ ] `expect(GET /api/mcp/health returns 200)`
- [ ] `expect(response.body.status === "ok")`
- [ ] `expect(response.body.timestamp is valid ISO string)`
- [ ] `expect(mcp-integration.spec.ts passes)`
- [ ] `tsc --noEmit` exits 0

---

## 3. File/Module Changes（文件改动清单）

### 新建文件
```
hooks/useRealtimeSync.ts              # E01 实时节点同步
components/onboarding/ClarifyAI.tsx     # E03 AI 解析 UI
hooks/useClarifyAI.ts                  # E03 AI 解析 hook
pages/api/ai/clarify.ts               # E03 AI 解析 API
lib/ai/ruleEngine.ts                  # E03 规则引擎降级
pages/api/canvas/from-prd.ts          # E05 PRD → Canvas API
components/templates/TemplateCard.tsx  # E04 模板卡片
components/templates/TemplateModal.tsx  # E04 模板编辑弹窗
pages/dashboard/templates.tsx           # E04 模板管理页
pages/api/mcp/health.ts                # E07 MCP 健康检查
tests/unit/useRealtimeSync.spec.ts    # E01 单元测试
tests/unit/ai/clarify.spec.ts         # E03 单元测试
tests/unit/api/prd-canvas-mapping.spec.ts  # E05 单元测试
tests/unit/api/templates-crud.spec.ts  # E04 单元测试
tests/unit/api/templates-import-export.spec.ts  # E04 导入导出测试
tests/unit/api/mcp-health.spec.ts      # E07 单元测试
tests/e2e/dds-performance.spec.ts     # E02 性能 E2E
tests/e2e/prd-canvas-mapping.spec.ts   # E05 E2E
tests/e2e/mcp-integration.spec.ts     # E07 E2E
```

### 修改文件
```
.env.staging                          # E01 Firebase 凭证
pages/canvas/[id].tsx                 # E01 PresenceLayer 集成
components/canvas/DDSCanvasPage.tsx   # E02 虚拟化 + E06 ErrorBoundary
components/canvas/DesignCard.tsx     # E02 React.memo 优化
package.json                          # E02 react-window 依赖
components/onboarding/ClarifyStep.tsx # E03 ClarifyAI 集成
pages/api/v1/templates/index.ts      # E04 POST 端点
pages/api/v1/templates/[id].ts       # E04 PUT/DELETE 端点
app/editor/page.tsx                   # E05 生成 Canvas 按钮
pages/dashboard/index.tsx             # E04 导航入口
```

---

## 4. Test Coverage Plan

### 4.1 单元测试文件清单

| 文件 | 覆盖 Epic | 关键测试用例 |
|------|----------|-------------|
| `tests/unit/usePresence.spec.ts` | E01 | presence state = online, avatar 可见 |
| `tests/unit/useRealtimeSync.spec.ts` | E01 | Firebase 读写, last-write-wins 冲突 |
| `tests/unit/ai/clarify.spec.ts` | E03 | happy path, timeout 30s, no-key 降级 |
| `tests/unit/api/templates-crud.spec.ts` | E04 | 201/200/404 响应码 |
| `tests/unit/api/templates-import-export.spec.ts` | E04 | valid JSON, invalid JSON error |
| `tests/unit/api/prd-canvas-mapping.spec.ts` | E05 | 单 chapter + 3 steps 映射正确性 |
| `tests/unit/api/mcp-health.spec.ts` | E07 | status ok, valid ISO timestamp |

**覆盖率目标**: > 80%（所有 API endpoints + hooks 100%）

### 4.2 E2E 测试文件清单

| 文件 | 覆盖 Epic | 关键场景 |
|------|----------|---------|
| `tests/e2e/presence-mvp.spec.ts` | E01 | PresenceLayer 渲染, 多人在线, 节点同步 |
| `tests/e2e/dds-performance.spec.ts` | E02 | 300 节点 DOM ~20, Lighthouse >= 85 |
| `tests/e2e/onboarding-ai.spec.ts` | E03 | Onboarding AI 流程, 无 key 降级 |
| `tests/e2e/templates-crud.spec.ts` | E04 | CRUD 全链路, /dashboard/templates |
| `tests/e2e/prd-canvas-mapping.spec.ts` | E05 | PRD → Canvas 往返, 一键生成 |
| `tests/e2e/errorboundary.spec.ts` | E06 | DDSCanvasPage Fallback + 重试 |
| `tests/e2e/mcp-integration.spec.ts` | E07 | MCP 健康检查, 协议调用 |

**通过率目标**: 100%

---

## 5. Risk Mitigation（风险缓解表）

| ID | 风险描述 | 影响 | 概率 | 缓解措施 | 触发条件 | 负责人 |
|----|---------|------|------|---------|---------|--------|
| **R1** | Firebase 凭证申请延迟 | 高 | 中 | Day 1 启动申请，并行开发 S01.1（mock Firebase 数据）| 凭证 > 3 天未到位 | Dev A |
| **R2** | LLM API key 高概率缺失 | 中 | 高 | 先实现降级路径（S03.3），无 key 不阻断 Onboarding| API key 配置缺失 | Dev A |
| **R3** | PRD → Canvas 映射规则复杂 | 中 | 中 | MVP 只支持单层 chapter（不处理嵌套），从简单场景开始| 映射逻辑 > 2h 未完成 | Dev B |
| **R4** | E01/E02 worktree 合并冲突 | 中 | 低 | 尽早合并到 main，充分自测后再合并| 同一文件多人修改 | Dev A+B |
| **R5** | 多人同时编辑节点冲突覆盖 | 高 | 低 | last-write-wins（时间戳比较），不用 CRDT| 同时在线用户 > 1 | Dev A |
| **R6** | DDSCanvasPage ErrorBoundary 边界条件 | 低 | 低 | 充分测试 fallback 渲染，包括异步组件崩溃| 边缘 case 触发 | Dev A |

---

## 6. Sprint DoD（全 Sprint）

- [ ] 24.5h 内完成所有 Epic（工期完成率 >= 90%）
- [ ] TS 编译 0 errors（`tsc --noEmit` exit 0）
- [ ] 所有 E2E 测试通过（100% pass rate）
- [ ] Lighthouse Performance Score >= 85（Design Output）
- [ ] DDSCanvasPage 渲染时间 < 200ms（300 nodes）
- [ ] 所有 PR review 通过并合并到 main
- [ ] Sprint Retro 完成

---

---

## Epic 实现状态

### E01: 实时协作整合 🔄

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S01.1 PresenceLayer 合并 | CanvasPage 已集成 | ✅ | `usePresence` 已挂载 |
| S01.2 useRealtimeSync | `hooks/useRealtimeSync.ts` + `lib/firebase/firebaseRTDB.ts` | ✅ 已创建 | Firebase RTDB SSE + last-write-wins |
| S01.3 Firebase 凭证 | `.env.staging` | ⚠️ 待配置 | 凭证申请后替换占位值 |

**Commit**: `7a54204f2` | **验证**: `tsc --noEmit` 退出 0

---

### E02: Design Output 性能优化

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S02.1 虚拟化列表 | `ChapterPanel.tsx` | ✅ | react-window List，rowHeight=120 固定常量 |
| S02.2 Memo 优化 | `ChapterPanel.tsx` | ✅ | CardItem React.memo，selectedIndex useMemo |
| S02.3 加载进度指示器 | `ProtoEditor.tsx` | ✅ | >200 节点显示加载 |

**Commit**: `6be17473d` | **验证**: `pnpm tsc --noEmit` ✅ TS 0 errors

---

### E03: AI 辅助需求解析

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S03.1 /api/ai/clarify | `src/app/api/ai/clarify/route.ts` | ✅ | LLM + ruleEngine 降级，30s timeout |
| S03.2 ClarifyAI 组件 | `src/hooks/useClarifyAI.ts` + ClarifyStep.tsx | ✅ | hook 封装 + ClarifyStep 集成 |
| S03.3 降级路径 | `src/lib/ai/ruleEngine.ts` | ✅ | 正则+关键词降级，不阻断 Onboarding |

**Commit**: `feat(E03): AI 辅助需求解析 — /api/ai/clarify + ruleEngine + useClarifyAI hook` | **验证**: `tsc --noEmit` ✅, vitest 19/19 ✅

### E04: 模板 API 完整 CRUD

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S04.1 POST/PUT/DELETE | `src/app/api/v1/templates/route.ts` + `[id]/route.ts` | ✅ | 共享 templateStore，201/200/404/403 |
| S04.2 模板 Dashboard UI | `src/app/dashboard/templates/page.tsx` | ✅ | CRUD 列表 + 新建 + 编辑 + 删除 |
| S04.3 导入/导出 | `route.ts` export + import + UI | ✅ | 导出 JSON + 导入 JSON |

**Commit**: `feat(E04): 模板 API 完整 CRUD — shared templateStore + unit tests + E2E` | **验证**: `tsc --noEmit` ✅, jest 31/31 ✅

### E05: PRD → Canvas 自动流程

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S05.1 /api/canvas/from-prd | `src/app/api/v1/canvas/from-prd/route.ts` | ✅ | Chapter→左栏, Step→中栏, Req→右栏, 21 unit tests |
| S05.2 生成 Canvas 按钮 | `src/app/prd-editor/page.tsx` | ✅ | PRD Editor + 生成 Canvas 按钮 + 结果预览 |

**Commit**: `feat(E05): PRD → Canvas — from-prd API + PRD Editor + unit tests` | **验证**: `tsc --noEmit` ✅, jest 21/21 ✅

### E06: Canvas 错误边界完善

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S06.1 ErrorBoundary | `DDSCanvasPage.tsx` + `__tests__/DDSCanvasPage.test.tsx` | ✅ | TreeErrorBoundary 包裹，渲染失败显示「渲染失败」+ 重试按钮 |

**Commit**: `feat(E06): Canvas ErrorBoundary — TreeErrorBoundary on DDSCanvasPage` | **验证**: `tsc --noEmit` ✅, vitest 12/12 ✅

### E07: MCP Server 集成完善

| 步骤 | 文件 | 状态 | 备注 |
|------|------|------|------|
| S07.1 健康检查 | | ❌ |  |
| S07.2 集成测试 | | ❌ |  |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint28
- **执行日期**: 2026-05-07

---

*本计划由 architect 基于 PRD（prd.md）+ Analyst 评审报告（analysis.md）+ Epic 详细规格产出。*
