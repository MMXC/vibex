# VibeX Sprint 28 QA — 实施计划

**Agent**: architect
**日期**: 2026-05-08
**项目**: vibex-proposals-sprint28-qa
**Sprint 周期**: 2026-05-08（1 天紧急 QA）
**团队规模**: 1-2 人

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint28-qa
- **执行日期**: 2026-05-08

---

## 1. Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E01: 实时协作整合 QA | E01-Q1 ~ E01-Q3 | 0/3 | E01-Q1 |
| E02: 性能优化 QA | E02-Q1 ~ E02-Q3 | 0/3 | E02-Q1 |
| E03: AI 解析 QA | E03-Q1 ~ E03-Q2 | 0/2 | E03-Q1 |
| E04: 模板 CRUD QA | E04-Q1 ~ E04-Q2 | 0/2 | E04-Q1 |
| E05: PRD→Canvas QA | E05-Q1 ~ E05-Q2 | 0/2 | E05-Q1 |
| E06: ErrorBoundary QA | E06-Q1 ~ E06-Q2 | 0/2 | E06-Q1 |
| E07: MCP Server QA | E07-Q1 ~ E07-Q2 | 0/2 | E07-Q1 |

---

## 2. Sprint Overview

### 2.1 优先级排序

| 优先级 | 判断标准 | Epic |
|--------|---------|------|
| **P0** | 影响 Sprint 验收阻塞项 | E01/E02（Layer 1 编译失败即阻塞）|
| **P1** | 功能完整性验证 | E03/E04/E05（代码+交互双重验证）|
| **P2** | 非阻塞项 | E06/E07（已有单元测试覆盖）|

### 2.2 日历表（1 天）

| 时间段 | 任务 | Epic | 验证方法 | 预计工时 |
|--------|------|------|---------|---------|
| 02:00-02:30 | E07-Q1 API health endpoint | E07 | curl + supertest | 0.5h |
| 02:30-03:30 | E01-Q1 PresenceLayer + E06-Q1 ErrorBoundary | E01/E06 | 代码审查 + gstack /qa | 1h |
| 03:30-04:30 | E02-Q1 react-window 虚拟化 | E02 | 代码审查 + gstack /canary | 1h |
| 04:30-05:30 | E03-Q1 /api/ai/clarify + E04-Q1 模板 CRUD | E03/E04 | 代码审查 + API test | 1h |
| 05:30-06:00 | E05-Q1 from-prd API | E05 | 代码审查 + API test | 0.5h |
| 06:00-06:30 | Layer 1 汇总报告 | - | tsc --noEmit + vitest | 0.5h |

**总工期**: ~5h（含 buffer）

---

## 3. Epic QA 详细步骤

---

## E01: 实时协作整合 QA

**工期**: 1h | **优先级**: P0 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E01-Q1 | PresenceLayer CanvasPage 集成 | ⬜ | — | gstack /qa 断言 PresenceAvatars 可见 |
| E01-Q2 | useRealtimeSync hook 验证 | ⬜ | — | 代码审查：RTDB read/write + 降级路径 |
| E01-Q3 | E2E presence-mvp.spec.ts 通过 | ⬜ | E01-Q2 | 179行文件存在且执行通过 |

### E01-Q1 详细说明

**验证步骤**:
1. 启动 vibex-frontend：`cd vibex-fronted && pnpm dev`
2. 访问 `/canvas/test-project-id`（若无测试项目，创建临时项目）
3. 执行 gstack /qa 断言：
   ```javascript
   await expect(page.locator('[data-testid="presence-avatars"]')).toBeVisible();
   ```
4. 检查 Firebase 配置状态（降级态）：
   - 若 `.env` 有 FIREBASE_DATABASE_URL → 理想态验证
   - 若无 → 降级态：PresenceAvatars 显示"仅您"或空状态，无 console.error

---

## E02: 性能优化 QA

**工期**: 1h | **优先级**: P0 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E02-Q1 | react-window FixedSizeList 验证 | ⬜ | — | 代码审查：rowHeight=120 const |
| E02-Q2 | React.memo 包裹子组件 | ⬜ | — | 代码审查：CardItem wrapped |
| E02-Q3 | 性能基准 Lighthouse ≥85 | ⬜ | E02-Q1 | gstack /canary DDSCanvasPage |

### E02-Q1 详细说明

**验证步骤**:
1. 代码审查 `ChapterPanel.tsx`:
   ```bash
   grep -n "rowHeight" ChapterPanel.tsx
   # 期望: rowHeight: 120（固定常量，非变量）
   ```
2. 代码审查 `CardItem.tsx`:
   ```bash
   grep -n "React.memo" src/components/...
   # 期望: export default React.memo(CardItem)
   ```
3. gstack /canary DDSCanvasPage:
   ```
   Lighthouse Performance Score ≥ 85
   DOM nodes ~20（虚拟化生效）
   ```

---

## E03: AI 辅助需求解析 QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E03-Q1 | /api/ai/clarify API 验证 | ⬜ | — | POST → 200，timeout 降级 |
| E03-Q2 | Vitest 19/19 通过 | ⬜ | E03-Q1 | vitest run |

### E03-Q1 详细说明

**验证步骤**:
1. 代码审查 `/api/ai/clarify/route.ts`:
   - POST handler 返回 200
   - `AbortSignal.timeout(30_000)` 存在
   - ruleEngine 降级路径存在（无 API Key 时）
2. API 测试：
   ```bash
   # 无 API Key → guidance 不阻断
   curl -X POST http://localhost:3000/api/ai/clarify \
     -H "Content-Type: application/json" \
     -d '{"requirement":"test"}'
   # 期望: 200 + guidance（非 500）
   ```

---

## E04: 模板 API 完整 CRUD QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E04-Q1 | API CRUD 响应码验证 | ⬜ | — | POST→201, GET→200, DELETE→204 |
| E04-Q2 | Vitest 31/31 通过 | ⬜ | E04-Q1 | vitest run |

### E04-Q1 详细说明

**验证步骤**:
1. 代码审查 `app/api/v1/templates/route.ts`:
   - POST: 201
   - GET: 200
   - DELETE: 204
2. 代码审查 `app/api/v1/templates/[id]/route.ts`:
   - GET: 200/404
   - PATCH: 200
   - DELETE: 200
3. `cd vibex-backend && npx vitest run --reporter=verbose`

---

## E05: PRD → Canvas 自动流程 QA

**工期**: 0.5h | **优先级**: P1 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E05-Q1 | from-prd API + 单向同步验证 | ⬜ | — | POST→200, nodes.length>0, 无回写 |
| E05-Q2 | Vitest 21/21 通过 | ⬜ | E05-Q1 | vitest run |

### E05-Q1 详细说明

**验证步骤**:
1. 代码审查 `/api/v1/canvas/from-prd/route.ts`:
   - POST handler 返回 200
   - 生成 nodes: Chapter → 左栏, Step → 中栏, Requirement → 右栏
2. 确认单向同步（PRD→Canvas）：
   - 搜索 canvas→prd write，无回写路径
3. API 测试：
   ```bash
   curl -X POST http://localhost:3000/api/v1/canvas/from-prd \
     -H "Content-Type: application/json" \
     -d '{"prdContent":"# Chapter1\n## Step1\n- Req1"}'
   # 期望: 200 + {nodes: [{type:"context",...}, {type:"flow",...}, {type:"design",...}]}
   ```

---

## E06: Canvas 错误边界完善 QA

**工期**: 0.5h | **优先级**: P2 | **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E06-Q1 | TreeErrorBoundary DDSCanvasPage 包裹验证 | ⬜ | — | 代码审查 + gstack /qa |
| E06-Q2 | 重试不触发 reload | ⬜ | E06-Q1 | 代码审查：resetErrorBoundary |

### E06-Q1 详细说明

**验证步骤**:
1. 代码审查 `DDSCanvasPage.tsx`:
   ```bash
   grep -n "TreeErrorBoundary" DDSCanvasPage.tsx
   # 期望: 约 line 493 附近，外层包裹
   ```
2. 代码审查 `TreeErrorBoundary` component:
   - Fallback 含 "重试" 按钮
   - onClick = resetErrorBoundary（不触发 reload）
3. gstack /qa 错误态验证：
   ```javascript
   // 模拟组件渲染错误（通过 inject script）
   await page.evaluate(() => {
     window.__test_error_boundary = true;
   });
   await page.reload();
   await expect(page.getByText(/重试/i)).toBeVisible();
   ```

---

## E07: MCP Server 集成完善 QA

**工期**: 0.5h | **优先级**: P0（最先执行）| **依赖**: 无

### Unit Index

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E07-Q1 | GET /api/mcp/health API 验证 | ⬜ | — | 200 + {status, timestamp, service} |
| E07-Q2 | Vitest 8/8 通过 | ⬜ | E07-Q1 | vitest run |

### E07-Q1 详细说明

**验证步骤**:
1. 启动 backend：`cd vibex-backend && pnpm dev`
2. curl 验证：
   ```bash
   curl -s http://localhost:3000/api/mcp/health | jq .
   # 期望:
   # {
   #   "status": "ok",
   #   "timestamp": "2026-05-07T...",
   #   "service": "vibex-mcp"
   # }
   ```
3. timestamp ISO 8601 验证：
   ```bash
   curl -s http://localhost:3000/api/mcp/health | jq -e '.timestamp | test("^\\d{4}-\\d{2}-\\d{2}T")'
   # 期望: true
   ```

---

## 4. 关键里程碑

| 里程碑 | 时间 | 验收标准 |
|--------|------|----------|
| M1: Layer 1 编译通过 | 02:00-02:30 | tsc --noEmit 0 errors + vitest 全绿 |
| M2: API 层验证 | 02:30-03:00 | E07 health + E03 clarify + E05 from-prd 通过 |
| M3: 代码审查完成 | 04:00-05:30 | 所有 Epic 代码文件存在且逻辑正确 |
| M4: gstack 交互验证 | 05:30-06:30 | E01/E02/E04/E06 页面断言通过 |
| M5: 最终报告 | 06:30 | QA report + P0/P1 问题记录 |

---

## 5. 验收标准速查表

| Epic | 验证项 | 验收标准 | 验证方法 |
|------|--------|---------|----------|
| E01 | PresenceLayer 集成 | CanvasPage 顶部 PresenceAvatars 可见 | gstack /qa |
| E01 | RTDB 降级 | Firebase 未配置 → 无 console.error | 代码审查 |
| E02 | react-window 虚拟化 | rowHeight=120 const，CardItem memo | 代码审查 |
| E02 | Lighthouse 性能 | Performance Score ≥ 85 | gstack /canary |
| E03 | AI clarify API | POST → 200，timeout 降级 | API test |
| E03 | Vitest | 19/19 passing | exec |
| E04 | 模板 CRUD API | POST→201, GET→200, DELETE→204 | 代码审查 |
| E04 | Vitest | 31/31 passing | exec |
| E05 | from-prd API | nodes.length>0，PRD→Canvas 单向 | 代码审查 + API test |
| E05 | Vitest | 21/21 passing | exec |
| E06 | ErrorBoundary | DDSCanvasPage 外层包裹 | 代码审查 |
| E06 | 重试逻辑 | resetErrorBoundary，无 reload | 代码审查 |
| E06 | Vitest | 12/12 passing | exec |
| E07 | health endpoint | {status, timestamp, service} | curl |
| E07 | Vitest | 8/8 passing | exec |

---

*本文件由 architect 定义 Sprint 28 QA 实施计划，指导 tester 阶段执行。*