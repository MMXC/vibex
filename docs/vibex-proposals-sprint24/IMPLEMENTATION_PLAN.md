# VibeX Sprint 24 — Implementation Plan

**Architect**: architect 🤖
**Date**: 2026-05-03
**Project**: vibex-proposals-sprint24
**Phase**: architect-review
**Status**: Implementation Plan Complete

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint24
- **执行日期**: 2026-05-03

---

## 1. 里程碑概览

```
Week 1 (2026-05-03 ~ 2026-05-09)
├── M1: P001 + P002 验证性任务 (0.5d，并行)
├── M2: P004 API 测试文件创建 + CI coverage gate (1.5d，并行)
├── M3: P003 Onboarding data-testid 修复 + 页面集成 (0.5d)
└── M4: P005 CanvasDiffPage 架构搭建 (1d)

Week 2 (2026-05-10 ~ 2026-05-16)
├── M5: P004 测试用例补全 + 覆盖率达标 (1d)
├── M6: P005 diff 算法 + 视图 (1d)
├── M7: P003 Onboarding 引导内容填充 (0.5d)
└── M8: 全量 build gate + DoD 验收 (0.5d)
```

---

## 2. 任务分解

### 2.1 P001: E2E Slack 配置验证

| Task ID | 描述 | 执行者 | 工时 | 依赖 | 状态 |
|---------|------|--------|------|------|------|
| T1.1 | 验证 `.github/workflows/test.yml` e2e job 末尾有 `e2e:summary:slack` | Dev | 0.25h | 无 | ✅ CI 已配置 |
| T1.2 | 新增 webhook dry-run step（curl 验证 SLACK_WEBHOOK_URL）| Dev | 0.5h | 无 | ⚠️ 待实现 |
| T1.3 | 添加 `webhook:dryrun` script 到 package.json | Dev | 0.25h | T1.2 | ⚠️ 待实现 |
| T1.4 | 验证 CI run 后 Slack 收到 Block Kit 消息（需 repo admin）| Dev/Admin | 0.5h | T1.2 | ⏳ 待执行 |
| T1.5 | 运行 `pnpm run build` 验证 0 errors | Dev | 0.25h | T1.2 | ⏳ 待验证 |

**dry-run step 示例**：
```yaml
- name: Validate Slack Webhook
  run: pnpm --filter vibex-fronted run webhook:dryrun
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

**触发方式**：
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXX" \
pnpm --filter vibex-fronted run webhook:dryrun
```

---

### 2.2 P002: TypeScript 债务确认

| Task ID | 描述 | 执行者 | 工时 | 依赖 | 状态 |
|---------|------|--------|------|------|------|
| T2.1 | 前端 `tsc --noEmit` → 0 errors 验证 | Dev | 0.25h | 无 | ✅ 已清零 |
| T2.2 | 后端 `tsc --noEmit` 状态审计 | Dev | 0.5h | 无 | ✅ 0 errors |
| T2.3 | mcp-server `tsc --noEmit` 状态审计 | Dev | 0.5h | 无 | ✅ 0 errors |
| T2.4 | 量化后端/mcp-server TS 错误清单 | Dev | 0.5h | T2.2/T2.3 | ✅ 0 errors，无债务 |
| T2.5 | Coord 决策：P002 是否纳入 Sprint 24 修复 | Coord | — | T2.4 | ✅ 后端+mcp均0 errors，无需修复，告知coord |

**验证命令**：
```bash
# 后端
cd vibex-backend && pnpm exec tsc --noEmit 2>&1 | head -50

# MCP Server
cd packages/mcp-server && pnpm exec tsc --noEmit 2>&1 | head -50
```

---

### 2.3 P003: Onboarding 新手引导

| Task ID | 描述 | 执行者 | 工时 | 依赖 | 状态 |
|---------|------|--------|------|------|------|
| T3.1 | 审计已有 OnboardingModal 组件，列出缺失 data-testid | Dev | 0.25h | 无 | ✅ 完成（重复问题已修复） |
| T3.2 | 添加 `data-testid="onboarding-step-{n}-skip-btn"` (step-specific) | Dev | 0.25h | T3.1 | ✅ 完成（去重后每步骤唯一） |
| T3.3 | 添加 `data-testid="onboarding-step-{n}-next-btn"` (step-specific) | Dev | 0.25h | T3.1 | ✅ 完成（去重后每步骤唯一） |
| T3.4 | 添加 `data-testid="onboarding-step-{n}-prev-btn"` (step-specific) | Dev | 0.25h | T3.1 | ✅ 完成（去重后每步骤唯一） |
| T3.5 | 添加 `data-testid="onboarding-step-{n}"` 到各步骤组件 | Dev | 0.5h | T3.1 | ✅ 完成（容器唯一ID） |
| T3.6 | 在 Dashboard 页面集成 OnboardingProvider | Dev | 0.5h | T3.2-T3.5 | ✅ 完成（已添加到 dashboard/page.tsx） |
| T3.7 | 在 DDSCanvasPage 集成 NewUserGuide | Dev | 0.5h | T3.2-T3.5 | ✅ 完成（已添加到 DDSCanvasPage.tsx） |
| T3.8 | 引导内容填充（5 步文案确认）| Dev | 0.5h | T3.6 | ⚠️ 待填充 |
| T3.9 | 验证 localStorage flag 正确写入/读取 | Dev | 0.5h | T3.2-T3.5 | ⏳ 待验证 |
| T3.10 | 运行 `pnpm run build` 验证 0 errors | Dev | 0.25h | T3.6-T3.8 | ⏳ 待验证 |

**data-testid 缺口清单**（T3.1 产出）：
```tsx
// OnboardingModal.tsx 中需要添加：
<button data-testid="onboarding-skip-btn" ...>跳过</button>
<button data-testid="onboarding-next-btn" ...>下一步</button>
<button data-testid="onboarding-prev-btn" ...>上一步</button>

// 各步骤组件中需要添加：
<div data-testid="onboarding-step-0">  {/* welcome */}
<div data-testid="onboarding-step-1">  {/* input */}
<div data-testid="onboarding-step-2">  {/* clarify */}
<div data-testid="onboarding-step-3">  {/* model */}
<div data-testid="onboarding-step-4">  {/* prototype */}
```

---

### 2.4 P004: API 模块测试补全

| Task ID | 描述 | 执行者 | 工时 | 依赖 | 状态 |
|---------|------|--------|------|------|------|
| T4.1 | 创建 `src/services/api/modules/__tests__/auth.test.ts` | Dev | 1人日 | 无 | ⚠️ 缺失 |
| T4.2 | 创建 `src/services/api/modules/__tests__/project.test.ts` | Dev | 1人日 | 无 | ⚠️ 缺失 |
| T4.3 | 创建 `src/services/api/modules/__tests__/canvas.test.ts` | Dev | 0.5人日 | T4.1/T4.2 | ⚠️ 缺失 |
| T4.4 | 添加 CI coverage threshold（≥ 60%）到 test.yml | Dev | 0.25h | 无 | ⚠️ 缺失 |
| T4.5 | 配置 vitest coverage 收集（`--coverage`）| Dev | 0.25h | T4.4 | ⚠️ 缺失 |
| T4.6 | 运行 `pnpm run test:unit` 验证新增测试通过 | Dev | 0.5h | T4.1-T4.3 | ⏳ 待验证 |
| T4.7 | 检查覆盖率报告 ≥ 60% | Dev | 0.25h | T4.6 | ⏳ 待验证 |
| T4.8 | 运行 `pnpm run build` 验证 0 errors | Dev | 0.25h | T4.1-T4.7 | ⏳ 待验证 |

**测试用例规划**：

auth.test.ts（≥ 8 个用例）：
```typescript
describe('login', () => {
  it('正常登录返回用户信息')
  it('密码错误抛出 AuthError')
  it('用户不存在抛出 UserNotFoundError')
  it('网络错误触发重试后失败')
  it('token 过期自动 refresh')
})
describe('logout', () => {
  it('清除本地 token')
  it('调用 /auth/logout API')
})
describe('getCurrentUser', () => {
  it('返回当前用户信息')
  it('未登录抛出 UnauthorizedError')
})
```

project.test.ts（≥ 7 个用例）：
```typescript
describe('getProjects', () => {
  it('返回项目列表')
  it('按用户过滤')
  it('空列表返回空数组')
})
describe('createProject', () => {
  it('创建后返回项目')
  it('名称重复抛出 ConflictError')
})
describe('updateProject', () => {
  it('更新后返回项目')
  it('不存在的项目抛出 NotFoundError')
})
describe('deleteProject', () => {
  it('软删除成功')
  it('永久删除成功')
})
```

---

### 2.5 P005: 跨 Canvas 版本对比

| Task ID | 描述 | 执行者 | 工时 | 依赖 | 状态 |
|---------|------|--------|------|------|------|
| T5.1 | 设计 `CanvasDiffPage` 路由（`/canvas-diff`）| Dev | 0.5h | 无 | ⚠️ 待实现 |
| T5.2 | 实现 `compareCanvasProjects` 算法（`src/lib/canvasDiff.ts`）| Dev | 2h | 无 | ⚠️ 缺失 |
| T5.3 | 实现 `CanvasDiffSelector` 组件（选两个 Canvas）| Dev | 1h | T5.1 | ⚠️ 缺失 |
| T5.4 | 实现 `CanvasDiffView` 组件（新增红/移除绿/修改黄）| Dev | 1.5h | T5.2 | ⚠️ 缺失 |
| T5.5 | 实现 diff 报告 JSON 导出功能 | Dev | 0.5h | T5.4 | ⚠️ 缺失 |
| T5.6 | 添加 data-testid（canvas-diff-selector, diff-item-added 等）| Dev | 0.5h | T5.3-T5.5 | ⚠️ 缺失 |
| T5.7 | 验证空状态引导文案 | Dev | 0.25h | T5.3 | ⏳ 待验证 |
| T5.8 | 运行 `pnpm run build` 验证 0 errors | Dev | 0.25h | T5.1-T5.7 | ⏳ 待验证 |

**compareCanvasProjects 核心逻辑**：
```typescript
// src/lib/canvasDiff.ts
export function compareCanvasProjects(a: CanvasProject, b: CanvasProject): CanvasDiff {
  const mapA = new Map(a.items.map(i => [i.id, i]));
  const mapB = new Map(b.items.map(i => [i.id, i]));

  const added: CanvasItem[] = [];
  const removed: CanvasItem[] = [];
  const modified: ModifiedItem[] = [];
  const unchanged: CanvasItem[] = [];

  for (const [id, itemB] of mapB) {
    if (!mapA.has(id)) {
      added.push(itemB);
    } else {
      const itemA = mapA.get(id)!;
      const changedFields = getChangedFields(itemA, itemB);
      if (changedFields.length > 0) {
        modified.push({ id, before: itemA, after: itemB, changedFields });
      } else {
        unchanged.push(itemA);
      }
    }
  }

  for (const [id, itemA] of mapA) {
    if (!mapB.has(id)) removed.push(itemA);
  }

  return { added, removed, modified, unchanged, summary: { ... } };
}
```

---

## 3. 执行顺序

```
Week 1（并行）
├── Dev A: P004 T4.1-T4.5（API 测试 + CI coverage）
├── Dev B: P003 T3.1-T3.7（Onboarding data-testid + 集成）
└── Dev C: P002 T2.2-T2.4（后端/mcp-server TS 审计）

Week 2（并行）
├── Dev A: P004 T4.6-T4.8（测试用例补全 + 覆盖率）
├── Dev B: P005 T5.1-T5.5（CanvasDiffPage + diff 算法）
└── Dev C: P001 T1.2-T1.4（webhook dry-run + 验证）

Week 2 末尾
└── 全量 build gate + Coord DoD 评审
```

---

## 4. DoD Checklist（最终验收）

### P001 DoD
- [ ] CI workflow 包含 webhook dry-run step
- [ ] `pnpm --filter vibex-fronted run webhook:dryrun` → 输出 configured/invalid 状态
- [ ] `pnpm run build` → 0 errors

### P002 DoD
- [ ] `pnpm --filter vibex-fronted exec tsc --noEmit` → 0 errors（已知）
- [ ] `pnpm --filter vibex-backend exec tsc --noEmit` → 错误清单已量化
- [ ] `pnpm --filter @vibex/mcp-server exec tsc --noEmit` → 错误清单已量化
- [ ] Coord 已决策 P002 是否纳入 Sprint 24 修复

### P003 DoD
- [ ] `data-testid="onboarding-overlay"` 存在 ✅（已存在）
- [ ] `data-testid="onboarding-skip-btn"` 存在
- [ ] `data-testid="onboarding-next-btn"` 存在
- [ ] 5 步引导内容确认（创建/添加/生成/导出/完成）
- [ ] 跳过/完成 flag 写入 localStorage 正确
- [ ] 已跳过用户不再展示引导
- [ ] `pnpm run build` → 0 errors

### P004 DoD
- [ ] `modules/auth.test.ts` 存在，覆盖率 ≥ 60%，≥ 5 个测试用例
- [ ] `modules/project.test.ts` 存在，覆盖率 ≥ 60%，≥ 5 个测试用例
- [ ] `modules/canvas.test.ts` 存在（≥ 5 个测试用例）
- [ ] 新增测试用例总数 ≥ 20
- [ ] CI 配置 `coverage: true` + threshold ≥ 60%
- [ ] `pnpm run build` → 0 errors

### P005 DoD
- [ ] `/canvas-diff` 路由存在（`CanvasDiffPage.tsx`）
- [ ] `data-testid="canvas-a-selector"` 和 `data-testid="canvas-b-selector"` 存在
- [ ] diff 视图显示新增（红）/ 移除（绿）/ 修改（黄）节点
- [ ] `data-testid="diff-export-btn"` 存在
- [ ] 首次选择时显示引导文案
- [ ] `pnpm run build` → 0 errors

---

## 5. 资源需求

| 资源 | 需求 | 优先级 |
|------|------|--------|
| Dev（2-3人并行）| Week 1/2 各需 2-3 人 | P0 |
| Repo admin | P001 webhook secret 验证 | P1 |
| Coord | P002 范围决策 | P1 |

---

*生成时间: 2026-05-03 09:25 GMT+8*
*Architect Agent | VibeX Sprint 24 Implementation Plan*
