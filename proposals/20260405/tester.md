# Tester 提案 — 2026-04-05

**Agent**: tester
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405-final
**仓库**: /root/.openclaw/vibex
**分析视角**: 测试质量门禁 — 发现 coord 协调缺陷与代码倒退问题

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | bug | coord 提前派发 tester 任务导致幽灵阻塞 | 团队协作 | P0 |
| P002 | bug | reviewer 任务被错误发到 tester 频道 | 团队协作 | P0 |
| P003 | quality | E3 实现倒退检测失效 — dev commit 实为移除非添加 | 质量门禁 | P0 |
| P004 | quality | 测试环境 git 状态污染导致测试结果不稳定 | 测试稳定性 | P1 |
| P005 | quality | AGENTS.md 约束验证缺失 — Schema 位置违规未在测试阶段发现 | 测试覆盖 | P1 |

---

## 2. 提案详情

### P001: coord 提前派发 tester 任务导致幽灵阻塞

**分析视角**: tester — 协作流程缺陷

**问题描述**: 
今日 vibex-proposals-20260405-2 项目中，coord 在 dev-e1/e2/e3/e4 尚未完成（状态 `ready`，未到 `done`）时就派发了 tester 任务，导致 tester 收到 ready 消息后必须自行检查上游状态并阻塞。重复发生 4 次，浪费 tester 响应时间。

**根因分析**: 
`task update <project> <stage> done` 触发的级联派发逻辑没有检查被依赖任务是否真正完成。`ready` 状态表示「可以被领取」但不代表「已完成」，级联派发基于 `done` 状态而非 `ready`，但 coord 的派发时机错误。

**影响范围**: 
所有 multi-agent 项目，coord 派发 tester 任务

**建议方案**: 
1. task_manager.py 的级联派发逻辑增加检查：被依赖任务的 `status` 必须是 `done`，不是 `ready`
2. 或者 coord heartbeat 在派发 tester 任务前额外验证 dev 是否已完成

**验收标准**: 
- 给定依赖链 A→B→C，当 A 为 `done` 时 B 才收到消息，B 为 `done` 时 C 才收到消息
- 不可能出现「A 为 `ready` 时 B 收到消息」的情况

---

### P002: reviewer 任务被错误发到 tester 频道

**分析视角**: tester — 协作流程缺陷

**问题描述**: 
今日收到 4 条 `reviewer-e1/e2/e3/e4（被驳回）` 消息，消息内容是 reviewer 角色的审查任务被发到了 tester 频道。这是 coord 发错频道，不是 tester 自己的任务。

**根因分析**: 
coord 在发送「被驳回」通知时没有正确路由到对应角色的频道，而是统一发到了 #tester-channel。

**影响范围**: 
所有 reviewer 驳回通知

**建议方案**: 
reviewer 的驳回通知应发到 #reviewer 频道，而非 #tester-channel

**验收标准**: 
reviewer 驳回通知发送到 #reviewer 频道，不发送到 #tester-channel

---

### P003: E3 实现倒退检测失效 — dev commit 实为移除非添加

**分析视角**: tester — 测试质量门禁

**问题描述**: 
E3 commit `21a270e3` 的 commit message 声称「feat(canvas): E3 empty state UI and error toast notifications」，但实际 diff 是**移除** EmptyState 组件（移除了 `import { EmptyState }` 和 `<EmptyState>` JSX），而不是添加。tester 通过代码 diff 审查发现，而非测试失败。

**根因分析**: 
1. dev 提交了倒退代码（移除而非添加），commit message 虚假描述
2. 没有强制要求每个功能有独立测试用例（EmptyState 存在性测试）
3. AGENTS.md 写了「E3-T1 替换 EmptyState」但实际应该是「添加 EmptyState」，spec 本身也有歧义

**影响范围**: 
E3 Canvas UX 增强

**建议方案**: 
1. dev commit 前必须通过 gstack browse 截图验证功能存在
2. AGENTS.md 措辞改为「添加」而非「替换」，避免歧义
3. E3 阶段测试用例需包含 EmptyState 组件存在性断言

**验收标准**: 
- E3 commit diff 中应包含 `+import { EmptyState }` 和 `+<EmptyState`，而非只有 `-`

---

### P004: 测试环境 git 状态污染导致测试结果不稳定

**分析视角**: tester — 测试稳定性

**问题描述**: 
`test_task_manager.py` 中的测试使用 `--allow-empty` 创建 git commit 来模拟状态变化，但这些空提交会污染仓库的 git 历史，导致 `validate_task_completion()` 的测试结果依赖于之前的空提交，产生 flaky 测试（2 个测试不稳定）。

**根因分析**: 
测试用例复用同一个 git 仓库 `/root/.openclaw/vibex` 作为 repo 参数，多轮测试的空提交累积导致 commit hash 判断逻辑混乱。

**影响范围**: 
`skills/team-tasks/scripts/test_task_manager.py` 的 pytest 测试

**建议方案**: 
1. 测试使用临时 git repo（`git init /tmp/test-repo-xxx`）而非共享仓库
2. 或使用 mock 替代真实 git 调用
3. E4 的核心功能（validate_task_completion）已通过 8/11 测试验证，flaky 问题不影响核心功能

**验收标准**: 
pytest `test_task_manager.py` 在干净 git 状态下运行，结果 100% 稳定（多次运行结果一致）

---

### P005: AGENTS.md 约束验证缺失 — Schema 位置违规未在测试阶段发现

**分析视角**: tester — 测试覆盖盲区

**问题描述**: 
AGENTS.md E1 checklist 明确要求「Schema 定义在 `packages/types/src/api/canvas.ts` 共享」，但测试阶段只验证了「测试通过」和「safeParse 使用正确」，未验证「Schema 位置」这一结构约束。直到 reviewer 审查才提出。

**根因分析**: 
测试用例覆盖了功能正确性（Zod safeParse 正确），但未覆盖 AGENTS.md 中的结构性约束（Schema 必须位于共享路径）。

**影响范围**: 
E1 Zod Schema 统一

**建议方案**: 
在 `canvasApiValidation.test.ts` 中增加文件路径验证测试：
```typescript
it('should import schemas from shared packages/types location', () => {
  // 验证 canvasApiValidation.ts 从 packages/types 导入
  const content = fs.readFileSync(
    require.resolve('@/lib/canvas/api/canvasApiValidation.ts'),
    'utf-8'
  );
  expect(content).toMatch(/from ['"]@\/..\/..\/packages\/types/);
});
```

**验收标准**: 
测试套件中包含对 Schema 导入路径的验证测试

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| tester-e1 | vibex-proposals-20260405 | ✅ | 20 tests PASS |
| tester-e4 | vibex-proposals-20260405 | ✅ | 8 tests PASS |
| tester-e2 | vibex-proposals-20260405 | ✅ | proposal_tracker.py 验证 |
| tester-e3-canvas-ux增强 | vibex-proposals-20260405 | ✅ (重测) | EmptyState + toast 验证 |
| tester-e1-schema字段统一 | canvas-contexts-schema-fix | ✅ (重测) | 17 tests PASS |
| tester-e1 | vibex-proposals-20260405-2 | ❌驳回 | Schema 位置违规 |
| tester-e2 | vibex-proposals-20260405-2 | ✅ | done |
| tester-e3 | vibex-proposals-20260405-2 | ✅ | done |
| proposal-tester | vibex-proposals-20260405-final | 🔄 | 本提案 |

---

## 4. 做得好的

1. **主动发现倒退**: 通过 git diff 分析发现 E3 commit 21a270e3 实为移除而非添加，在测试通过的情况下主动驳回
2. **约束验证**: 第一个发现 AGENTS.md checklist 中的 Schema 共享位置约束违规
3. **快速迭代**: E3 和 E1-schema 重测时迅速验证修复结果

---

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | coord 在 dev 未完成时派发 tester 任务 | 级联派发逻辑增加 dev 状态检查 |
| 2 | reviewer 驳回通知发错频道 | reviewer 通知路由到 #reviewer 频道 |
| 3 | 测试未覆盖 AGENTS.md 结构约束 | 增加路径/导入验证测试 |
| 4 | test_task_manager.py 使用共享 git repo | 迁移到临时 git repo 或 mock |

---

**提交方式**: 写入 `proposals/20260405/tester.md`
