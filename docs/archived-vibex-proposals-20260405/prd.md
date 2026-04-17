# PRD — vibex-proposals-20260405

**Agent**: PM
**日期**: 2026-04-05 00:15
**仓库**: /root/.openclaw/vibex
**基于**: proposals/20260405/analyst.md + pm.md

---

## 执行摘要

### 背景
vibex-proposals-20260405 共收集 2 个 agent 的提案：**Analyst (6条)** + **PM (4条)** = **10条提案**。

**推荐 P0 执行项（2条）**：
1. **P001: Canvas API 端点完整实现** — 91.7% 端点缺失，用户无法使用 AI 生成功能
2. **P002: Sprint 4 提案执行追踪** — 提案执行无追踪机制

**已覆盖提案（昨日已完成）**：A-P1-1(Hydration) / A-P1-2(Canvas导航) / A-P1-3(TreeToolbar)

---

## 提案汇总

### 来源分布

| Agent | 提案数 | P0 | P1 | P2 |
|-------|--------|-----|-----|-----|
| Analyst | 6 | 2 | 3 | 1 |
| PM | 4 | 2 | 1 | 1 |
| **合计** | **10** | **4** | **4** | **2** |

### 完整提案清单

| ID | 来源 | 标题 | 优先级 | 状态 |
|----|------|------|--------|------|
| P001 | PM | Canvas API 端点完整实现 | P0 | 新 |
| P002 | PM | Sprint 4 提案执行追踪 | P0 | 新 |
| A-P0-1 | Analyst | Canvas API 完整实现 | P0 | 与P001合并 |
| A-P0-2 | Analyst | 虚假完成检测自动化 | P0 | 新 |
| A-P1-1 | Analyst | Hydration 问题修复 | P1 | 已完成 |
| A-P1-2 | Analyst | Canvas 导航同步修复 | P1 | 已完成 |
| A-P1-3 | Analyst | TreeToolbar 集成 | P1 | 已完成 |
| P003 | PM | Canvas 空状态与错误处理 | P1 | 新 |
| A-P2-1 | Analyst | 提案去重机制 | P2 | 长期 |
| P004 | PM | 提案去重与聚类机制 | P2 | 长期 |

---

## Epic 总览

| Epic | 名称 | 来源提案 | 工时 | 优先级 |
|------|------|----------|------|--------|
| E1 | Canvas API 端点完整实现 | P001+A-P0-1 | 12-18h | P0 |
| E2 | Sprint 4 提案执行追踪 | P002 | 2h | P0 |
| E3 | Canvas UX 增强 | P003 | 3h | P1 |
| E4 | 虚假完成检测自动化 | A-P0-2 | 3h | P0 |

**总工时**: 20-26h（约3-4天）

---

## Epic 1: Canvas API 端点完整实现

### 概述
前端调用了 6 个 Canvas API 端点，但 91.7% 缺失（frontend-mock-cleanup 分析）。`generate-contexts` 有 500 错误（canvas-api-500-fix 分析）。用户无法使用 AI 生成限界上下文/流程/组件。

### Stories

#### Story E1-S1: Canvas API 端点盘点与优先级排序
- **来源**: analyst A-P0-1
- **工时**: 1h
- **验收标准**:
```bash
# 盘点前端所有 Canvas API 调用
grep -rn "fetch\|axios" src/ --include="*.ts" | grep -i canvas
# 输出: 列出所有 canvas 相关的 fetch 调用及目标端点

# 验证后端端点存在性
ls src/app/api/v1/canvas/*/route.ts
# 输出: 已有端点清单
```

#### Story E1-S2: generate-contexts 错误修复验收
- **来源**: canvas-api-500-fix 分析
- **工时**: 1h（已分析，E1验收）
- **验收标准**:
```bash
curl -X POST /api/v1/canvas/generate-contexts \
  -H 'Content-Type: application/json' \
  -d '{"requirementText":""}'
# 期望: 400 (不是 500 crash)
# body: {"success":false,"error":"requirementText 不能为空"}

curl -X POST /api/v1/canvas/generate-contexts \
  -H 'Content-Type: application/json' \
  -d '{"requirementText":"在线预约医生"}'
# 期望: 200 或 500 (不是 crash)
# body: {"success":true/false,"contexts":[...]}
```

#### Story E1-S3: generate-flows 端点实现
- **来源**: P001
- **工时**: 3-4h
- **验收标准**:
```typescript
const res = await fetch('/api/v1/canvas/generate-flows', {
  method: 'POST',
  body: JSON.stringify({ requirementText: '...', projectId: 'xxx' }),
});
expect(res.status).toBeGreaterThanOrEqual(200);
const body = await res.json();
expect(body).toHaveProperty('success');
expect(body).toHaveProperty('flows');
expect(Array.isArray(body.flows)).toBe(true);
```

#### Story E1-S4: generate-components 端点实现
- **来源**: P001
- **工时**: 3-4h
- **验收标准**: 同 E1-S3，替换 flows → components

#### Story E1-S5: API 错误处理规范化
- **来源**: canvas-api-500-fix + P001
- **工时**: 2h
- **验收标准**: 所有 Canvas API 统一错误响应结构
```typescript
// 统一响应结构
interface CanvasAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  generationId?: string;
}
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E1-F1 | 端点盘点 | 前端调用 vs 后端实现覆盖度 | expect(coverage >= 100%) | 无 |
| E1-F2 | generate-contexts验收 | 错误处理正确，不crash | expect(400/500 not crash) | 无 |
| E1-F3 | generate-flows实现 | 端点存在，返回正确结构 | expect(flows array) | 【需页面集成】 |
| E1-F4 | generate-components实现 | 端点存在，返回正确结构 | expect(components array) | 【需页面集成】 |
| E1-F5 | 错误处理规范 | 统一 CanvasAPIResponse | expect(all endpoints use it) | 无 |

### DoD
- [ ] 前端所有 Canvas fetch 调用对应的后端端点都存在
- [ ] generate-contexts/flows/components 三个端点测试覆盖
- [ ] 所有错误路径返回有效 Response，不抛 Promise reject
- [ ] API 响应结构统一使用 CanvasAPIResponse

---

## Epic 2: Sprint 4 提案执行追踪

### 概述
vibex-proposals-20260404 的 4 个 Epic（任务质量门禁、Canvas UX、提案流程优化、通知体验）无追踪机制。

### Stories

#### Story E2-S1: 提案索引页生成
- **工时**: 1h
- **验收标准**:
```bash
# proposals/index.md 存在且包含近30天所有提案
test -f proposals/index.md
grep "2026-04-05" proposals/index.md
grep "2026-04-04" proposals/index.md
```

#### Story E2-S2: 提案状态标签
- **工时**: 1h
- **验收标准**:
```bash
# 每个提案有状态标签
grep -E "P001|P002|E1|E2|E3|E4" proposals/index.md | grep -E "PENDING|IN_PROGRESS|COMPLETED"
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E2-F1 | 提案索引页 | proposals/index.md 聚合所有提案 | expect(file exists) | 无 |
| E2-F2 | 状态标签 | 每个提案有状态追踪 | expect(status tags) | 无 |

### DoD
- [ ] `proposals/index.md` 生成，包含所有 agent 的今日提案
- [ ] 每个提案标注状态：PENDING / IN_PROGRESS / COMPLETED / REJECTED
- [ ] 提案通过 coord 评审并分配优先级

---

## Epic 3: Canvas UX 增强

### 概述
Canvas 空状态和 API 错误时 UI 体验不佳。

### Stories

#### Story E3-S1: Canvas 空状态引导
- **工时**: 1.5h
- **验收标准**:
```typescript
// 节点为空时显示引导
const emptyState = screen.getByTestId('canvas-empty-state');
expect(emptyState).toBeVisible();
expect(emptyState.textContent).toMatch(/暂无|点击生成/);
```

#### Story E3-S2: API 错误友好提示
- **工时**: 1.5h
- **验收标准**:
```typescript
// API 错误时显示错误卡片 + 重试按钮
expect(screen.getByTestId('error-card')).toBeVisible();
expect(screen.getByRole('button', { name: /重试/ })).toBeVisible();
await userEvent.click(screen.getByRole('button', { name: /重试/ }));
// 重新触发 API 调用
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E3-F1 | 空状态引导 | 节点为空时显示引导 | expect(empty state visible) | 【需页面集成】 |
| E3-F2 | 错误卡片 | API 错误显示友好提示+重试 | expect(error card + retry btn) | 【需页面集成】 |

### DoD
- [ ] Canvas 三树（context/flow/component）空状态显示引导文案
- [ ] API 错误时显示错误卡片（非 alert）
- [ ] 错误卡片有重试按钮，点击后重新调用 API

---

## Epic 4: 虚假完成检测自动化

### 概述
analyst A-P0-2：虚假完成检测自动化，与 vibex-proposals-20260404 的 E1（任务质量门禁）合并执行。

### Stories

#### Story E4-S1: task_manager done 时检查 git commit
- **来源**: E1-F1 任务质量门禁（vibex-proposals-20260404）
- **工时**: 1h（已在 PRD 中定义）
- **验收标准**:
```bash
# task done 时记录 commit hash
python3 task_manager.py update <project> <stage> done
# 验证: 任务 JSON 中存在 commit 字段
```

#### Story E4-S2: 提案执行状态与 git commit 关联
- **工时**: 2h
- **验收标准**:
```bash
# proposals/index.md 中 COMPLETED 的提案对应有 git commit
# 检查: git log --oneline --grep="<project>" 有对应提交
```

### 功能点汇总

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| E4-F1 | git commit 记录 | done 时记录 commit hash | expect(commit in JSON) | 无 |
| E4-F2 | 提案执行关联 | 提案完成与 git commit 绑定 | expect(commit linked) | 无 |

### DoD
- [ ] `task_manager.py` 的 `done` 动作记录当前 commit hash
- [ ] proposals/index.md 中 COMPLETED 提案可追溯到对应 git commit
- [ ] 无 commit 的提案不能标记为 COMPLETED

---

## 验收标准汇总

| 功能ID | 验收断言 | 测试方式 |
|--------|----------|----------|
| E1-F2 | `expect(res.status).toBe(400)` | API 测试 |
| E1-F3 | `expect(Array.isArray(body.flows))` | API 测试 |
| E1-F4 | `expect(Array.isArray(body.components))` | API 测试 |
| E2-F1 | `expect(test -f proposals/index.md)` | 静态检查 |
| E2-F2 | `expect(status tag exists)` | 静态检查 |
| E3-F1 | `expect(emptyState).toBeVisible()` | Playwright |
| E3-F2 | `expect(retryBtn).toBeVisible()` | Playwright |
| E4-F1 | `expect('commit' in taskInfo)` | 单元测试 |
| E4-F2 | `expect(git commit exists for COMPLETED)` | 集成测试 |

---

## 非功能需求

| 类型 | 要求 |
|------|------|
| 性能 | API 端点响应 < 5s（AI 超时） |
| 覆盖度 | Canvas API 覆盖率 100% |
| 流程 | 提案执行状态可追踪 |

---

**PRD 状态**: ✅ 完成
**下一步**: Architect 架构设计 → Dev 实现
