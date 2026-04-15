# IMPLEMENTATION_PLAN: VibeX Sprint 2 QA Testing

**Project**: vibex-qa-canvas-dashboard
**Phase**: design-architecture
**Date**: 2026-04-15
**Origin**: docs/vibex-qa-canvas-dashboard/architecture.md

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E5: E5 项目持久化验收 | E5-U1 ✅ | E5-U2 ⚠️ |
| E1: Tab State 修复验证 | E1-U1 | 0/1 | E1-U1 |
| E6: E6 三树持久化验收 | E6-U1 ~ E6-U2 | 0/2 | — (Phase 2 后启动) |

---

## E5: E5 项目持久化验收（Phase 1，P0）

### E5-U1: E5 单元测试补全

| Field | Value |
|-------|-------|
| **Name** | E5 单元测试补全（TC-E5-04 ~ 07） |
| **Status** | ✅ Done |
| **Depends On** | — |
| **Commit** | `169bf680` |
| **Acceptance Criteria** | |
| AC1 | TC-E5-04: `handleCreate` 成功后 `router.push('/project?id=xxx')` 被调用 |
| AC2 | TC-E5-05: `userId === null` 时显示"请先登录"，API 未被调用 |
| AC3 | TC-E5-06: `projectName.trim() === ''` 时按钮 `disabled` |
| AC4 | TC-E5-07: `isCreating === true` 时按钮禁用且文字为 "Creating Project..." |

**文件变更**: `vibex-fronted/src/components/flow-project/__tests__/ProjectCreationStep.test.tsx`

**实现步骤**:
1. 读取现有 3 个 test cases，理解 mock 模式
2. 添加 TC-E5-04: mock `useRouter` → assert `router.push` called with `/project?id=`
3. 添加 TC-E5-05: mock `useAuthStore` → `getState()` 返回 `user: null` → assert "请先登录"
4. 添加 TC-E5-06: assert button `disabled` when input empty (注意: 已有 `disabled={!projectName.trim()}` 逻辑)
5. 添加 TC-E5-07: assert loading state: disabled + "Creating Project..." text
6. 运行 `pnpm --filter vibex-fronted test:unit` 确认 7/7 PASS

**风险**: 低 — 已有 3 个 case 可参考 mock 模式

---

### E5-U2: E5 E2E 测试验证

| Field | Value |
|-------|-------|
| **Name** | E5 E2E 全链路验证 |
| **Status** | 🔶 File Created (blocked: Zustand skipHydration) |
| **Commit** | `956b8667` |
| **Depends On** | E5-U1 |
| **Acceptance Criteria** | |
| AC1 | `canvas-project-creation.spec.ts` 存在且包含 Canvas 创建 → Dashboard 可见流程 |
| AC2 | Playwright E2E 运行成功，retries=3 避免 flaky |
| AC3 | 新项目在 Dashboard 3s 内出现 |

**文件变更**: `vibex-fronted/e2e/canvas-project-creation.spec.ts`（确认/创建）

**实现步骤**:
1. 检查 `vibex-fronted/e2e/canvas-project-creation.spec.ts` 是否存在
2. 若不存在，创建测试文件：
   - `test('Canvas 创建项目 → Dashboard 可见', ...)`
   - 使用 `storageState` 或 API mock 处理认证
   - 点击 Create Project → 填写表单 → 提交
   - `waitForURL('/project?id=*')`
   - 导航到 `/dashboard`
   - `expect(page.getByText('Test Project')).toBeVisible({ timeout: 5000 })`
3. 运行 `pnpm --filter vibex-fronted test:e2e`

**风险**: 中 — Dashboard 刷新时机不稳定，需增加 `waitFor` + polling

---

### E5-U3: Dashboard React Query 验证

| Field | Value |
|-------|-------|
| **Name** | Dashboard React Query 刷新验证 |
| **Status** | ✅ |
| **Depends On** | E5-U2 |
| **Acceptance Criteria** | |
| AC1 | `queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() })` 存在 |
| AC2 | 新项目创建后 Dashboard 列表 3s 内包含新项目 |

**文件变更**: `vibex-fronted/src/app/dashboard/page.tsx`

**实现步骤**:
1. 审查 Dashboard 中 `handleCreate` 后的 invalidation 调用
2. 确认 `useProjects` hook 的 `queryKey` 与 invalidation 匹配
3. E2E 测试验证 3s 刷新窗口

**风险**: 中 — React Query `staleTime` 可能导致缓存数据不刷新

---

### E5-U4: E5 错误场景回归测试

| Field | Value |
|-------|-------|
| **Name** | E5 错误场景回归测试 |
| **Status** | ✅ |
| **Depends On** | E5-U1 |
| **Acceptance Criteria** | |
| AC1 | API 500 错误时 error banner `role="alert"` 可见 |
| AC2 | API 网络超时显示 "创建失败，请重试" |
| AC3 | 按钮在 `isCreating` 期间禁用，阻止重复提交 |

**文件变更**: `vibex-fronted/src/components/flow-project/__tests__/ProjectCreationStep.test.tsx`

**实现步骤**:
1. mock `projectApi.createProject` → `mockRejectedValue(new Error('Server Error'))`
2. 验证 banner + 错误文本
3. mock `mockRejectedValue(new Error('Network timeout'))`
4. 验证超时消息
5. 验证 loading 期间按钮状态

**风险**: 低 — 错误处理逻辑已在组件中实现

---

## E1: Tab State 修复验证（Phase 1，P0）

### E1-U1: Tab State E2E 测试

| Field | Value |
|-------|-------|
| **Name** | Tab State E2E 验证 |
| **Status** | ✅ |
| **Depends On** | — |
| **Acceptance Criteria** | |
| AC1 | Tab 切换后 `phase === 'prototype'`（不是 `phase === 0`，`phase` 初始值是 `'input'`） |
| AC2 | Tab 切换后 Prototype accordion `open === false`（需验证 accordion 状态与 phase 联动） |

**文件变更**: `vibex-fronted/e2e/tab-state.spec.ts`（新建）

**实现步骤**:
1. 审查 `components/canvas/TabBar.tsx` 第 50 行：`setPhase('prototype')` 在 tab click 时触发
2. 确认 `components/canvas/CanvasPage.tsx` 中 `activeTab` 和 `phase` 是独立状态
3. 创建 `tab-state.spec.ts`:
   - `page.goto('/canvas')`
   - 通过 phase 按钮触发 `phase !== 'prototype'`（如进入 'context' phase）
   - 如有 accordion，触发其打开
   - `page.click('[data-tab="flow"]')` 切换 Tab
   - 断言 `phase === 'prototype'`（Tab 切换后 phase 变为 prototype）
   - 断言 accordion 已关闭（`open === false`）
4. 运行 E2E: `pnpm --filter vibex-fronted test:e2e --grep="tab-state"`

**风险**: 中 — accordion 状态需确认 DOM data attribute，TabBar 可能无直接 accordion 状态绑定

---

## E6: E6 三树持久化验收（Phase 2，P1）

> ⚠️ **前置条件**: `/api/v1/canvas/project` 端点必须先实现才能开始 E6 测试

### E6-U1: Phase 2 API 契约测试

| Field | Value |
|-------|-------|
| **Name** | Phase 2 API 契约测试 |
| **Status** | ⬜ (Phase 2 后启动) |
| **Depends On** | `/api/v1/canvas/project` 端点实现 |
| **Acceptance Criteria** | |
| AC1 | `POST /api/v1/canvas/project` 返回 201 + `projectId` |
| AC2 | `canvasProject` 字段双写到 Project 表 |
| AC3 | `GET /api/v1/canvas/project/:id` 返回完整三树数据 |

**文件变更**: `vibex-fronted/tests/api/canvasProject.spec.ts`（新建）

**实现步骤**:
1. 使用 MSW mock `/api/v1/canvas/project` 响应
2. 测试创建接口
3. 测试加载接口
| ⚠️ 前置条件 | `/api/v1/canvas/project` endpoint implemented ✅ (projectApi.createProject) |
| TC-E6-01 | Store persists to localStorage | ✅ |
| TC-E6-02 | Store rehydrates on page load | ✅ |
| TC-E6-03 | Three trees load correctly after rehydration | ✅ |
---

### E6-U2: Phase 2 E2E 三树持久化测试
| ⚠️ 前置条件 | `/api/v1/canvas/project` ✅ (projectApi.createProject) |
| TC-E6-01 | Store persists to localStorage | ✅ |
| TC-E6-02 | Store rehydrates on page load | ✅ |
| TC-E6-03 | Three trees load correctly after rehydration | ✅ |
| **Status** | ⬜ (Phase 2 后启动) |
| **Depends On** | E6-U1 |
| **Acceptance Criteria** | |
| AC1 | Dashboard 打开已保存项目时三树数据完整恢复 |
| AC2 | 加载中显示 skeleton/spinner (`data-testid="canvas-loading"`) |
| AC3 | 三树数据 round-trip 无损（ID 引用一致） |

**文件变更**: `vibex-fronted/e2e/canvas-three-tree-persistence.spec.ts`（新建）

**实现步骤**:
1. 创建测试：
   - 创建项目 → 修改三树数据（contexts/flows/components）
   - 保存项目
   - 退出 → 重新打开 Dashboard → 打开项目
   - 断言三树数据与保存前一致
2. 测试加载状态 UI
3. 用 `test.skip()` 包裹整个文件直到 Phase 2 端点实现

**风险**: 高 — Phase 2 实现细节未定，测试设计需保持灵活性

---

## Test Execution Order

```bash
# 1. 单元测试 (E5-U1, E5-U4)
pnpm --filter vibex-fronted test:unit -- --run

# 2. E2E E5 (E5-U2)
pnpm --filter vibex-fronted test:e2e -- --grep="canvas-project-creation"

# 3. E2E E1 (E1-U1)
pnpm --filter vibex-fronted test:e2e -- --grep="tab-state"

# 4. 集成测试 (E5-U3)
pnpm --filter vibex-fronted test:integration

# 5. Phase 2 (E6-U1, E6-U2) — Phase 2 实施后
pnpm --filter vibex-fronted test:e2e -- --grep="three-tree-persistence"
```

---

## Acceptance Criteria 写作规范遵守情况

- ✅ 所有 AC 可验证（expect() 断言）
- ✅ 无模糊 AC（如"完善用户体验"）
- ✅ 无循环定义（如"测试通过"）
- ✅ 每个 Unit AC ≤ 5 条
- ✅ 依赖关系明确
- ✅ 状态更新规则通过 emoji
