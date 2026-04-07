# Tester 提案 — 2026-04-05

**Agent**: tester
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405
**仓库**: /root/.openclaw/vibex
**分析视角**: 测试质量 — 基于 canvas-split-hooks 大规模重构的测试策略

---

## 背景

`canvas-split-hooks` 项目将 `CanvasPage.tsx`（700+ 行）拆分为 5 个 hooks，这是 VibeX 前端最大规模的重构之一。重构过程中测试覆盖面临特殊挑战：

1. 旧代码几乎无测试
2. 拆分过程中行为必须保持不变（regression 风险高）
3. Hook 依赖关系复杂，单元测试需要精确 mock

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | strategy | canvas-split-hooks 测试分层策略 | canvas-split-hooks | P0 |
| P002 | improvement | Hook 单元测试覆盖率目标设定 | 测试覆盖 | P1 |
| P003 | improvement | CI 阶段分离：lint → test → build | 测试效率 | P2 |
| P004 | improvement | 回归测试套件：行为不变性验证 | 质量门禁 | P2 |

---

## 2. 提案详情

### P001: canvas-split-hooks 测试分层策略

**问题描述**

canvas-split-hooks 涉及 5 个 hooks 的创建和迁移，当前缺乏系统的测试策略：

- E1-E4 的 Hook 单元测试未全部完成
- CanvasPage 集成测试缺失
- 重构完成后的 regression 风险无覆盖

**影响范围**

- `CanvasPage.tsx` 拆分后所有用户交互路径
- 跨 Hook 状态传递

**根因分析**

重构类任务通常只关注代码拆分，测试被视为"后续补充"。但对于 700+ 行组件，无测试的重构等于盲目改写。

**建议方案**

### 方案 A（推荐）: 三层测试策略

**Layer 1 — Hook 单元测试（E1-E4 完成后执行）**
- 每个 Hook 独立的 `.test.ts` 文件
- Mock 所有 store 依赖（zustand stores）
- 覆盖：初始化状态、状态更新、边界条件
- 目标覆盖率：每个 Hook > 80%

**Layer 2 — CanvasPage 集成测试**
- 保留现有的 `CanvasPage.test.tsx`（如果存在）
- 测试 Hook 之间的状态协调
- 使用 `@testing-library/react` 的 `Render` + 完整 store mock

**Layer 3 — E2E 回归测试**
- Playwright 测试：覆盖核心用户路径（创建上下文→生成流程→生成组件）
- 在 canvas-split-hooks 重构完成后添加
- 防止行为变化

---

### P002: Hook 单元测试覆盖率目标设定

**问题描述**

当前 canvas-split-hooks 的 Hook 测试覆盖率不均衡：
- `useCanvasEvents.ts` — 18 tests ✅
- 其他 Hook — 无测试或不完整

**影响范围**

- 所有拆分后的 Hook
- 重构 regression 检测能力

**根因分析**

未对 Hook 测试设定明确的覆盖率目标，导致执行随意。

**建议方案**

### 方案 A（推荐）: 为每个 Hook 设定覆盖率目标

| Hook | 最低覆盖率目标 |
|------|---------------|
| useCanvasState | 80% |
| useCanvasStore | 85% |
| useCanvasRenderer | 75% |
| useAIController | 70% |
| useCanvasEvents | 90%（已达标）|

**验收标准**

```bash
# 每个 Hook 运行覆盖率检查
pnpm jest --coverage src/lib/canvas/hooks/useCanvasState.test.ts
# 断言行覆盖率 > 目标值
```

---

### P003: CI 阶段分离：lint → test → build

**问题描述**

当前 `pnpm test` 内嵌了 lint + type check + build：
- 任何 lint 失败都会阻止测试运行
- 测试失败时不清楚是 lint 问题还是测试问题
- 开发者定位问题耗时

**影响范围**

- 所有前端测试
- CI 效率

**根因分析**

pretest 脚本做了太多事情，没有阶段性反馈。

**建议方案**

### 方案 A（推荐）: 分离 CI 阶段

```bash
# package.json
"test": "jest --passWithNoTests",
"test:all": "pnpm test && pnpm build",
"lint:check": "eslint src --max-warnings 0",
"type:check": "tsc --noEmit"
```

- `pnpm test` — 仅运行测试（最快反馈）
- `pnpm lint:check` — 仅 lint
- `pnpm type:check` — 仅类型检查
- `pnpm test:all` — 完整检查

**实施成本**: 低 | 风险: 低

---

### P004: 回归测试套件：行为不变性验证

**问题描述**

canvas-split-hooks 重构后，没有专门验证"行为与重构前完全一致"的测试套件。regression 可能在日常测试中被忽略。

**影响范围**

- CanvasPage 所有用户可见行为

**建议方案**

### 方案 A（推荐）: 建立 snapshot 测试

- 为关键组件（CanvasPage、BoundedContextTree、BusinessFlowTree）建立 snapshot 测试
- 在重构完成稳定后生成基准 snapshot
- 后续 PR 的 snapshot diff 必须人工 review

**验收标准**

```bash
# 重构完成后
pnpm jest --updateSnapshot

# 后续 PR
pnpm jest --ci  # snapshot diff 失败 → 必须人工确认
```

---

## 3. 验收标准

| ID | 验收标准 |
|----|----------|
| P001 | 每个 Hook 有独立 `.test.ts`，覆盖初始化/更新/边界 |
| P002 | Hook 覆盖率达标（上表） |
| P003 | `pnpm test` 只运行测试，无 lint/type/build 阻塞 |
| P004 | CanvasPage snapshot 测试存在并维护 |

---

## 4. 相关文件

- CanvasPage: `vibex-fronted/src/app/canvas/CanvasPage.tsx`
- Hooks: `vibex-fronted/src/lib/canvas/hooks/`
- 测试配置: `vibex-fronted/jest.config.ts`
- 现有测试: `vibex-fronted/src/components/canvas/*.test.tsx`
