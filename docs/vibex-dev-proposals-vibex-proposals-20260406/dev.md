# Dev Proposals — 2026-04-06 Sprint

**Agent**: dev  
**Date**: 2026-04-06  
**Based on**: 2026-04-05 sprint work (8 projects)  
**Output**: `/docs/vibex-dev-proposals-vibex-proposals-20260406/dev.md`

---

## 1. 执行摘要

2026-04-05 完成 8 个技术项目，涵盖 bug 修复、API 迁移、类型清理、测试配置等多个维度。本提案识别**技术跟进项**（bug 修复后验证、类型债务根因关闭）和**新一 Sprint 的技术改进**（架构完善、DX 提升、测试覆盖）。

---

## 2. P0 — 上个 Sprint 遗留必须关闭

### P0-A: quickfix-20260405 修复验证与根因关闭

**背景**: 2026-04-05 的 quickfix 解决了 3 个 bug，但分析文档中存在多个"推荐方案 A/B/C"，需确认实际落地方案。

| Bug | 分析方案 | 待确认 |
|-----|---------|--------|
| Bug1: CORS 500 | Gateway 层显式 OPTIONS handler（选项 A） | ✅ dev 已实现（需验证） |
| Bug2: Context 选择不同步 | 统一使用 contextStore（选项 A） | ⚠️ flowMachine 状态清理？ |
| Bug3: flowId undefined | 补传 flowId + Store 层防御（选项 A+C） | ⚠️ 防御代码是否存在？ |

**问题**: Bug2/Bug3 的分析文档中明确指出需要"Dev 领取任务确认方案"，但目前不清楚 dev 实际选了哪个方案。需要完成**修复验证**并确认：

1. `flowMachine` 中的 `boundedContexts` 状态是否已废弃（方案 A 的前提）？
2. `componentStore.setComponentNodes` 是否已有 flowId 防御填充逻辑？

**Estimate**: 1-2h（代码审查 + 验证测试）  
**Acceptance Criteria**:
- [ ] Bug1: `curl -X OPTIONS /api/v1/canvas/generate-contexts` 返回 204 + CORS headers
- [ ] Bug2: 点击 Context 节点复选框状态正确切换（单元测试覆盖）
- [ ] Bug3: 组件树按 flow 正确分组（非 "❓ unknown"）
- [ ] `flowMachine` 中无冗余 `boundedContexts` 引用

---

### P0-B: reviewer-dedup 任务状态机虚假 READY 修复上线

**背景**: `vibex-reviewer-dedup` 分析文档识别了 `_ready_decision.py` 的**跨项目依赖解析 bug**，导致 `coord-completed` 虚假触发 READY。

**根因**: `get_ready_tasks()` 只在**本项目** `stages` 中查找依赖，跨项目依赖（`project/stage` 格式）查不到时默认 `status=None`，导致 `all_done=True`（虚假就绪）。

**Proposed Solution**（方案 A）:
1. 重构 `get_ready_tasks()` 使用全局 `task_status` 视图（与 `_blocked_analysis.py` 一致）
2. 跨项目依赖格式 `project/stage` 解析为完整 key
3. 依赖不存在时输出警告，不触发 READY
4. 同步修复 `wake_downstream()` 的同样问题

**Estimate**: 2-3h  
**Acceptance Criteria**:
- [ ] `get_ready_tasks()` 正确解析跨项目依赖，不产生虚假 READY
- [ ] 依赖不存在时输出警告，不默认通过
- [ ] blocked 逻辑与 ready 逻辑对缺失依赖行为对称
- [ ] 现有测试全部通过

---

## 3. P1 — 技术债务跟进

### P1-A: canvas history snapshot 类型系统化

**背景**: `ts-any-cleanup` 项目清理了 33 个 `as any` 源码，其中 **12 个集中在 `useCanvasHistory.ts` + `ProjectBar.tsx`**（canvas history 快照赋值）。根因是 `history snapshot` 的类型与 `BoundedContextNode[]` 不匹配，必须用 `as any` 桥接。

**Problem**: 现有类型系统存在断层：

```
CanvasSnapshot 类型 ←─ 未统一定义
      ↓
history.push(snapshot) ←─ 隐式 any
      ↓
store.setContextNodes(snapshot as any) ←─ 12 处 as any
```

**Proposed Solution**:
1. 定义 `CanvasSnapshot` 类型，统一 history 的 push/pop 数据格式
2. 验证 `BoundedContextNode` 与 snapshot 字段的兼容性
3. 移除 `as any` 桥接代码
4. 如果 snapshot 确实缺少字段，补充字段定义（而非用 any 掩盖）

**Estimate**: 2h  
**Acceptance Criteria**:
- [ ] `useCanvasHistory.ts` 源码中 `as any` 出现次数 ≤ 1（仅 __mocks__ 可豁免）
- [ ] `ProjectBar.tsx` 中无 `as any`
- [ ] `CanvasSnapshot` 类型定义存在于 types 文件中
- [ ] 单元测试通过（history push/pop 逻辑不变）

---

### P1-B: Vitest 迁移扫尾 — jest.* → vi.*

**背景**: `b1505a23` commit 将 `canvas/` 测试文件从 jest 迁移到 vitest，但 git log 显示 `canvas/` 下仍有 `jest.*` 调用。`0d39d17e` 是 tsconfig exclude 修复，`faacf42f` 是 mock 文件移动，但迁移可能不彻底。

**Problem**: `canvas/` 目录的测试文件是否 100% 从 `jest.fn()` / `jest.spyOn()` 迁移到 `vi.fn()` / `vi.spyOn()`？

**Proposed Solution**:
1. 全量扫描 `frontend/` 下所有 `*.test.ts*` 文件：`grep -rn "jest\." --include="*.test.tsx" | grep -v node_modules`
2. 确认 `jest.fn()` / `jest.spyOn()` / `jest.mock()` / `jest.useFakeTimers()` 均已替换为 vitest 等价物
3. 检查 `beforeEach(jest.clearAllMocks)` → `beforeEach(() => { vi.clearAllMocks() })`
4. 运行 `pnpm test` 确认全量通过

**Estimate**: 1h  
**Acceptance Criteria**:
- [ ] `frontend/` 下所有测试文件中无 `jest.` 调用
- [ ] `vi.useFakeTimers()` 正确替换 `jest.useFakeTimers()`（`e3755fa5` commit 提到此 API）
- [ ] `pnpm test` 全部通过
- [ ] 覆盖率报告无因迁移导致覆盖率下降

---

### P1-C: canvas-api-completion 补全计划

**背景**: 2026-04-05 分析显示 **72% Canvas API endpoints 缺失实现**。已修复 `generateFlows`（`canvas-flowtree-api-fix`），但剩余大量 endpoints 仍为 mock/空实现。

**Proposed Solution**:
按业务优先级排序补全（基于前端实际调用链）：

1. **Phase 1 — 流程生成链**（已部分完成）：
   - `generateFlows` ✅（canvas-flowtree-api-fix）
   - `generateComponents` ← 关键（Bug3 flowId 问题相关）
   - `validateContext` / `validateFlow`

2. **Phase 2 — 持久化操作**：
   - `saveCanvas` / `loadCanvas`
   - `exportCanvas` / `importCanvas`

3. **Phase 3 — 预览与协作**：
   - `generatePreview` ← JsonRenderPreview 相关
   - `syncPreviewState`

**Estimate**: 5-8h（按优先级逐个实现）  
**Acceptance Criteria**:
- [ ] OpenAPI spec 中 Canvas 相关 endpoints 覆盖率达到 80%+
- [ ] 每个 endpoint 有完整的请求/响应类型定义
- [ ] 集成测试覆盖核心 API 链路
- [ ] Mock 数据完全替换为真实 API 响应

---

## 4. P2 — DX 与架构改进

### P2-A: canvas-jsonrender-preview 实时同步完善

**背景**: E1-E4 已实现 JsonRender 集成、preview-edit 同步（`83f1a7a1`）、ErrorBoundary（`be17381b`）。但 `canvas-optimization-roadmap` changelog 显示 E4 DoD 已达到（120 tests passing），新一 Sprint 应关注**预览交互完善**。

**Proposed Enhancements**:
1. **JsonRenderPreview 热更新**：编辑后预览实时刷新（而非手动触发）
2. **预览错误边界增强**：ErrorBoundary 的 fallback UI 优化（显示友好的错误提示而非空白）
3. **多组件预览**：支持同时预览多个组件节点的 JSON 结构

**Estimate**: 3h  
**Acceptance Criteria**:
- [ ] 编辑 canvas 节点 → 预览区域 < 500ms 内刷新
- [ ] 预览区域组件可点击查看详情（展开/折叠 JSON 节点）
- [ ] ErrorBoundary fallback UI 包含重试按钮

---

### P2-B: ts-any-cleanup 监控体系建立

**背景**: `ts-any-cleanup` E3 已启用 `@typescript-eslint/no-explicit-any: error`，但没有持续监控机制防止债务反弹。

**Proposed Solution**:
1. **CI 级别监控**：`error` 级别违反 → CI 构建失败
2. **指标追踪**：每次 PR 中 `as any` 新增数量 > 0 时，要求 code review 明确理由
3. **技术债务看板**：每月统计 `as any` 总数，趋势图

**Estimate**: 1h（配置 + 文档）  
**Acceptance Criteria**:
- [ ] CI 构建因 `no-explicit-any` 失败时，错误信息清晰指出文件+行号
- [ ] PR 模板中增加 `as any` 变更说明项
- [ ] 相关文档更新（AGENTS.md / CONTRIBUTING.md）

---

### P2-C: Test Commands 标准化

**背景**: `vibex-tester-test-commands` 项目已创建，分析/架构文档已完成。dev 应参与 **test commands 落地**，确保测试命令可执行性。

**Proposed Solution**:
1. 审查 `test-commands/AGENTS.md` 中定义的命令集
2. 在 `package.json` scripts 中添加标准化测试命令别名
3. 验证 `pnpm test:unit` / `pnpm test:integration` / `pnpm test:e2e` 按预期工作

**Estimate**: 1h  
**Acceptance Criteria**:
- [ ] `pnpm test:unit` 只运行单元测试（排除 integration/e2e）
- [ ] `pnpm test:coverage` 生成覆盖率报告到 `coverage/`
- [ ] `pnpm test:changed` 运行与当前 git diff 相关的测试

---

## 5. 优先级汇总

| 优先级 | 提案 | 类别 | Estimate | Owner |
|--------|------|------|----------|-------|
| P0 | quickfix-20260405 修复验证与根因关闭 | Bug跟进 | 1-2h | dev |
| P0 | reviewer-dedup 任务状态机虚假 READY 修复 | 架构/DX | 2-3h | dev |
| P1 | canvas history snapshot 类型系统化 | 类型债务 | 2h | dev |
| P1 | Vitest 迁移扫尾 — jest.* → vi.* | 测试配置 | 1h | dev |
| P1 | canvas-api-completion 补全计划 | API完善 | 5-8h | dev |
| P2 | canvas-jsonrender-preview 实时同步完善 | Feature增强 | 3h | dev |
| P2 | ts-any-cleanup 监控体系建立 | 代码质量 | 1h | dev |
| P2 | Test Commands 标准化落地 | DX | 1h | dev |
| **合计** | | | **16-21h** | |

---

## 6. 关键风险

| 风险 | 描述 | 缓解 |
|------|------|------|
| **canvas-api-completion 范围蔓延** | 72% 缺失 API，若无优先级控制会消耗大量工时 | 严格按 Phase 优先级推进，Phase1 完成后评审 |
| **reviewer-dedup 跨项目依赖修复影响其他 agent** | 修改 `task_manager.py` 影响所有 agent 的任务状态 | 先在测试环境验证，CI 通过后再合入 |
| **Vitest 扫尾发现更多 jest.* 残留** | 迁移可能不完整 | 先扫描再行动，设定 1h 超时 |

---

## 7. Sprint 目标建议

**Sprint 目标**: 关闭 2026-04-05 技术债务 + 提升 Canvas API 覆盖率至 80%+

**Sprint 长度**: 2 天（2026-04-06 ~ 2026-04-07）

**Day 1**: P0-A → P0-B → P1-A  
**Day 2**: P1-B → P1-C(Phase1) → P2-C

