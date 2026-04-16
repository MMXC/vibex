# 需求分析：vibex-dds-canvas Sprint 2（Phase 1）

> **分析方**: Analyst Agent
> **分析日期**: 2026-04-16
> **主题**: DDS Canvas Sprint 2 需求分析 — 接续 Epic1 交付，进入 Epic2-6 核心功能开发
> **关联项目**: vibex-dds-canvas-s2/analyze-requirements

---

## 执行决策

- **决策**: 有条件通过（需明确 MVP 出口标准 + 技术边界）
- **执行项目**: vibex-dds-canvas-s2
- **执行日期**: 待 Architect 评审后确认

---

## 0. Research 结果

### 0.1 历史经验（docs/learnings/）

| Learnings 文档 | 核心教训 | 与 Sprint 2 的关联 |
|---|---|---|
| `canvas-api-completion` | Hono route 顺序敏感（`/latest` 必须在 `/:id` 之前）；Snapshot testing 适合结构化 JSON API | DDS CRUD API 设计时需标注 route 优先级，覆盖边界路径 |
| `canvas-testing-strategy` | mockStore 过简导致测试通过但运行报错；Vitest/Jest 语法混用破坏 vi.mock；边界条件覆盖比集成测试更重要 | Sprint 2 所有 hooks（useDDSCanvasFlow/useDDSAPI）必须有真 store mock，禁用 Jest 语法 |
| `canvas-cors-preflight-500` | （通过 git history 补充，见下）| |
| `react-hydration-fix` | 尚未读 — hydrate 问题是 Next.js + Zustand 组合的经典坑，DDS 复用现有 canvas 模式时需警惕 | canvas-store-migration 库可能与 DDSCanvasStore 共享问题 |
| `vibex-e2e-test-fix` | E2E 测试的 mock 策略关键教训 | 复用 `setupDDSMocks()` 模式（dds-canvas-e2e.spec.ts 已验证）|

### 0.2 Git History 分析

| 提交 | 内容 | 与 Sprint 2 的关联 |
|---|---|---|
| `51327329` | Canvas: POST /project handler for DDD canvas creation | DDS 项目创建流程复用此 handler |
| `384ff637` | fix(dds): remove catch-all API route, rely on `_redirects` | API proxy 策略已确定，Sprint 2 后端路由遵循此模式 |
| `bc79740e` + revert `03c1a89a` | dds-build standalone mode 启用后 revert | 部署配置需注意，standalone build 有问题 |
| `cfb780c4` | feat(e6): canvas store rehydration hook | **三树持久化模式已验证**，可复用 rehydration 思路到 DDSCanvasStore |
| `8ea96dcf` | fix(e6): use vi.hoisted() 修复 TDZ error | Vitest TDZ 问题已知，避免在 DDSCanvasStore 测试中重蹈 |
| `dab897c0` | feat(E4): three-tree serialization and project loader | 序列化模式可直接迁移到 DDSCanvasStore 的章节持久化 |
| `fe958041` | fix(bug1 DDS API 404) | API proxy 修复已完成，Sprint 2 路由稳定 |
| `2217a658` | fix(bug1): DDS API proxy 404 fix | 同上 |

**关键教训（Sprint 2 必须遵循）**：

1. **Route 顺序**: Hono 路由 `GET /latest` 必须放在 `GET /:id` 之前
2. **Standalone build**: `dds-build` 的 standalone 模式被 revert，不能用
3. **TDZ in Vitest**: 所有 Zustand store 测试必须用 `vi.hoisted()` 避免 temporal dead zone
4. **Rehydration 模式**: `useRehydrateCanvasStores` hook 模式可直接迁移到 DDSCanvasStore
5. **Mock 真实性**: DDS API hook 测试不能用硬编码 mock 对象，需 `vi.mock` + `mockReturnValue`

### 0.3 当前代码状态

| 模块 | 状态 | 代码位置 |
|---|---|---|
| DDSCanvasPage + Route | ✅ 已交付 | `app/design/dds-canvas/page.tsx` |
| DDSCanvasStore | ✅ 已交付 | `stores/dds/DDSCanvasStore.ts`（30 tests）|
| useDDSCanvasFlow | ✅ 已交付 | `hooks/dds/useDDSCanvasFlow.ts`（9 tests）|
| useDDSAPI | ✅ 已交付 | `hooks/dds/useDDSAPI.ts` |
| Card Components | ✅ 已交付（RequirementCard）| `components/dds/cards/` |
| DDSScrollContainer | ✅ 已交付（19 tests）| `components/dds/canvas/` |
| DDSPanel | ✅ 已交付 | `components/dds/canvas/` |
| DDSThumbNav | ✅ 已交付 | `components/dds/canvas/` |
| DDSToolbar | ✅ 已交付（14 tests）| `components/dds/toolbar/` |
| AIDraftDrawer | ✅ 已交付（20 tests）| `components/dds/ai-draft/` |
| CardPreview | ✅ 已交付（15 tests）| `components/dds/ai-draft/` |
| Backend CRUD API | ✅ 已交付 | `routes/v1/dds/cards.ts` 等 |
| D1 Schema | ✅ 已交付 | `prisma/migrations/005_dds_tables.sql` |
| E2E Test Suite | ✅ 已交付 | `e2e/dds-canvas-e2e.spec.ts`（522 行）|

**结论**：Sprint 1 Epic1-7 代码全部交付但标记为 `[Unreleased]`。Sprint 2 核心工作是 **QA 验收 + 修复 + PRD 预览完善**，不是从零开发。

---

## 1. 业务场景分析

### 1.1 Sprint 1 交付物验收状态

根据 changelog，所有 7 个 Epic 的代码均已写完但未发布。Sprint 2 的业务场景是：

**将 DDS Canvas 从"已开发完成"状态推进到"可发布"状态。**

这包含三类工作：
1. **QA 验收**：E2E 测试套件（Epic6）需要端到端验证所有功能
2. **缺陷修复**：E2E 运行中发现的 bug 需要逐个修复
3. **PRD 预览完善**：Epic7（PRD 预览 + 导出）可能尚未充分开发

### 1.2 目标用户（与 Sprint 1 一致）

| 用户 | Sprint 2 关注点 |
|---|---|
| 产品经理 | PRD 预览 + 导出是否满足文档交付需求 |
| 架构师 | 三章节画布的 DAG/树图是否准确可编辑 |
| 全栈工程师 | 数据持久化是否稳定，API 响应是否符合预期 |

### 1.3 核心 JTBD（Sprint 2 优先级调整）

| # | JTBD | Sprint 1 | Sprint 2 |
|---|---|---|---|
| JTBD-1 | 查看和管理一个项目的所有工程文档章节 | ✅ 已开发 | 需要 QA 验证稳定性 |
| JTBD-2 | 通过 AI 对话生成各章节内容 | ✅ 已开发 | E2E 验收 AI Draft 流程 |
| JTBD-3 | 可视化编辑卡片之间的关系（树/DAG）| ✅ 已开发 | 关系编辑 E2E 覆盖 |
| JTBD-4 | **三章节卡片持久化 + 刷新保持** | ⚠️ 代码已写 | **需要 E2E 验证** |
| JTBD-5 | PRD 预览汇总 + 导出 | ⚠️ Epic7 标注为 P2 | **需要确认完成度** |

---

## 2. 技术方案选项

### 方案 A（推荐）：E2E 驱动修复 + PRD 预览完善

**思路**：以 `dds-canvas-e2e.spec.ts`（522 行，Epic6）为质量门，将 E2E 测试跑通，发现一个问题修一个，直到 E2E 100% 通过。

**具体工作**：
1. 运行 `pnpm test:e2e -- tests/e2e/dds-canvas-e2e.spec.ts`
2. 逐个修复 E2E 失败项（从 F25 CRUD → F26 AI Draft → F27 面板导航）
3. 完善 Epic7 PRD 预览（MD 导出）
4. 端到端验收后发布

**优点**：
- 质量有保障，E2E 是最接近用户真实操作的测试
- 已有 522 行 E2E 测试代码，是宝贵的测试资产
- 渐进式修复，每次 commit 可验证

**缺点**：
- E2E 不稳定（网络/时序），可能需要反复调试
- 如果 E2E 设计本身有问题（如 mock 策略不当），修复成本高

### 方案 B：单元测试覆盖优先 + 渐进集成

**思路**：在 E2E 之前，先确保所有 hooks/components 单元测试 100% 通过，建立信心后再跑 E2E。

**优点**：测试稳定，运行快，定位问题精确
**缺点**：单元测试通过不等于集成可用，跨层问题（store↔API↔React Flow）会被遗漏

### 方案 A + B 结合（推荐）

先用方案 A 运行 E2E，遇到问题后用方案 B 定位具体模块，修复后回到方案 A 验证。

---

## 3. 可行性评估

### 3.1 技术可行性

| 需求 | Sprint 1 状态 | Sprint 2 工作 | 可行性 |
|---|---|---|---|
| 奏折横向布局 | ✅ 代码交付 | E2E 验证 scroll-snap 流畅性 | ✅ 高 |
| 三章节画布 | ✅ 代码交付 | E2E 验证 DAG/树图渲染 | ✅ 高 |
| 工具栏 | ✅ 代码交付（14 tests）| E2E 验证 4 按钮 handlers | ✅ 高 |
| AI 对话区 | ✅ 代码交付（20+15 tests）| E2E 验证 Draft 流程 | ✅ 高（有 522 行测试基础）|
| 数据持久化 | ✅ 代码交付 | E2E 验证 CRUD + 刷新保持 | ✅ 高 |
| PRD 预览导出 | ⚠️ Epic7 P2 标注 | 需确认完成度，可能需要补完 | ⚠️ 中 |

**结论**：技术可行性高。主要工作量在 QA 验证和缺陷修复，而非新功能开发。

### 3.2 风险矩阵

| 风险 | 类型 | 影响 | 可能性 | 缓解 |
|---|---|---|---|---|
| E2E 测试本身有设计缺陷（mock 策略/sleep 时序）| 质量 | 高 | 中 | 先跑 E2E 看实际失败模式，不要预判 |
| PRD 预览导出完成度低，需补完开发 | 范围 | 中 | 中 | 先评估 Epic7 实际代码状态再定 |
| DDSCanvasStore rehydration 与现有 Zustand skipHydration 机制冲突 | 技术 | 高 | 中 | 复用 `useRehydrateCanvasStores` 模式（dab897c0 已验证）|
| Backend D1 schema 迁移未执行，API 联调失败 | 部署 | 高 | 低 | Sprint 2 第一步执行 `pnpm --filter vibex-backend db:migrate` |
| `@xyflow/react` v12 类型问题（Epic1 注：等待修复）| 技术 | 中 | 低 | 确认当前版本类型是否已修复 |
| React Flow 节点 > 100 时性能下降 | 性能 | 中 | 低 | 监控，> 100 nodes 时启用虚拟化 |

### 3.3 工期估算

| 工作项 | 工时估算 | 备注 |
|---|---|---|
| E2E 测试运行 + 问题定位 | 4h | 运行 + 分析失败原因 |
| E2E 缺陷修复（按失败项计）| 4-8h | CRUD/AI Draft/面板导航各 1-2h |
| Epic7 PRD 预览评估 + 完善 | 2-4h | 确认导出功能完成度 |
| D1 迁移验证 + API 联调 | 2h | 确认 migration 已执行 |
| 端到端回归测试 | 2h | 全部 E2E 重新跑 |
| **合计** | **14-20h** | |

> 注：基于"代码已写完"假设，实际工期取决于 E2E 失败数量。预期 14-20h（含缓冲 20%）。

---

## 4. 初步风险识别

### 🔴 高风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| E2E 设计本身不稳定（dds-canvas-e2e.spec.ts 522 行）| 质量门失效 | Sprint 2 第一件事：实际运行 E2E，看失败率。如果 > 50% 失败，需要重构测试而非盲目修功能 |
| Zustand skipHydration 已知问题（`canvas-project-creation.spec.ts` blocked by this）| 持久化验收失败 | 检查 `useRehydrateCanvasStores` 是否已处理 skipHydration |

### 🟠 中风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| PRD 预览（Epic7）P2 标注，完成度可能不足 | 范围缺失 | Sprint 2 启动后第一件事：检查 `PRDPreview.tsx` 实际代码，有则评估，无则补完 |
| 三个树组件（BoundedContextTree/BusinessFlowTree/ComponentTree）与 DDS 三章节的 schema 对齐未验证 | 数据模型错位 | Sprint 2 需要对齐 spec/schema-card-types.md 与现有树组件的字段映射 |

### 🟡 低风险

| 风险 | 影响 | 处理 |
|---|---|---|
| `standalone` build 被 revert，不能独立部署 DDS | 部署 | 使用标准 Next.js deployment，不要 standalone |
| E2E mock 依赖 `setupDDSMocks()` 内部实现的 API mock | 测试可靠性 | 如果 API 行为变了，E2E 会静默假通过——需要偶尔跑真实 API |

---

## 5. 驳回红线检查

| 红线 | Sprint 1 状态 | Sprint 2 是否解决 |
|---|---|---|
| 缺少 MVP 定义 | ✅ Sprint 1 已明确 3 个章节（MVP = 需求/上下文/流程）| ✅ 不适用 |
| 章节无上限 | ✅ 已通过 MVP 固定 | ✅ 不适用 |
| 卡片 schema 未定义 | ✅ `specs/schema-card-types.md` 已交付 | ⚠️ 需对齐现有树组件字段 |
| AI 确认交互模糊 | ✅ Draft 模式已设计并实现 | ✅ 不适用 |

**唯一剩余红线**：卡片 schema 与现有三树组件的字段对齐未经验证。

---

## 6. 验收标准（Sprint 2 专项）

| # | 验收标准 | 测试方式 | 优先级 |
|---|---|---|---|
| S2-V1 | E2E 测试套件全部通过（dds-canvas-e2e.spec.ts F25+F26+F27）| `pnpm test:e2e -- tests/e2e/dds-canvas-e2e.spec.ts` | 🔴 P0 |
| S2-V2 | 卡片 CRUD E2E：创建→读取→更新→删除 完整链路 | E2E TC-F25-* | 🔴 P0 |
| S2-V3 | AI Draft E2E：输入→预览→接受→卡片出现 | E2E TC-F26-* | 🔴 P0 |
| S2-V4 | 面板导航 E2E：滑动切换→URL 同步→全屏推开 | E2E TC-F27-* | 🔴 P0 |
| S2-V5 | PRD 预览面板：显示三章节汇总 | E2E 或 UI 测试 | 🟠 P1 |
| S2-V6 | Markdown 导出：点击导出→下载 .md 文件 | E2E 或 UI 测试 | 🟠 P1 |
| S2-V7 | D1 migration 已执行：`dds_chapters` / `dds_cards` / `dds_edges` 表存在 | `wrangler d1 execute` 验证 | 🟠 P1 |
| S2-V8 | DDSCanvasStore rehydration：刷新页面后节点位置保持 | E2E TC-F25-refresh | 🟡 P2 |

---

## 7. Sprint 2 启动 Checklist

- [ ] **第一步**：运行 E2E 测试，记录失败率和失败类型
  ```bash
  pnpm test:e2e -- tests/e2e/dds-canvas-e2e.spec.ts
  ```
- [ ] **第二步**：检查 Epic7（PRD 预览）实际代码状态
  ```bash
  find ./vibex-fronted/src -name "*PRDPreview*" -o -name "*export*" | grep dds
  ```
- [ ] **第三步**：验证 D1 migration
  ```bash
  cd vibex-backend && pnpm db:migrate
  ```
- [ ] **第四步**：检查 `@xyflow/react` v12 类型是否已修复
- [ ] **第五步**：对齐 schema-card-types.md 与现有树组件字段映射

---

## 8. 与原始 PRD 的差异分析

Sprint 1 的 analysis.md（2026-04-14）提出的驳回红线，Sprint 2 评估如下：

| 原始红线 | 解决状态 |
|---|---|
| MVP 定义缺失 | ✅ 已解决（Sprint 1 PRD 明确定义 3 个章节）|
| 章节无上限 | ✅ 已解决 |
| 卡片 schema 未定义 | ✅ 已交付 specs/schema-card-types.md |
| AI 确认交互模糊 | ✅ Draft 模式已实现 |

**Sprint 2 的新增关注点**：原始 analysis.md 的风险（范围无边界、AI 质量不稳定）已通过 Sprint 1 的 MVP 固定和 Draft 模式设计得到缓解。当前主要风险是 **QA 验证缺失** 和 **PRD 预览完成度不确认**。

---

*Analyst Agent | 2026-04-16*
