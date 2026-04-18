<<<<<<< Updated upstream
# VibeX TabBar 无障碍切换 — PRD

**项目**: vibex
**阶段**: create-prd
**PM**: pm
**日期**: 2026-04-13
**来源**: analysis.md (analyze-requirements)
**Planning 输出**: docs/vibex/plan/feature-list.md
=======
# PRD — wow-harness OpenClaw 实装验证

**项目**: vibex
**阶段**: Phase 1 第二步（create-prd）
**PM**: pm
**日期**: 2026-04-13
**状态**: PRD 编制完成
>>>>>>> Stashed changes
**产出**: `/root/.openclaw/vibex/docs/vibex/prd.md`
**基于**: `analysis.md` + `plan/feature-list-wow-harness.md`

---

## 1. 执行摘要

### 背景

<<<<<<< Updated upstream
当前 VibeX TabBar 的 4 个标签页（上下文/流程/组件/原型）使用 `disabled` 属性实现 phase 锁定：用户必须按 input → context → flow → component 的顺序解锁标签页，点击被锁定的 tab 没有任何响应（tooltip 需要 hover 才能看到）。这是从 canvas-three-tree-unification epic 就存在的设计，从未经过 UX 验证。同时移动端 `useTabMode` 有独立的 tab bar 实现，与桌面端 TabBar 行为不一致。

历史经验一致指向同一个反模式：用阻断代替告知。`disabled` 是一种静默拒绝，用户点击后没有任何反馈，体验断裂。PhaseIndicator 已承担阶段状态告知职责，与 TabBar 的 disabled 锁定存在职责重叠。

### 目标

将 TabBar 改为单一标签切换模式——点击任意 tab 立即切换内容，**不使用 disabled 阻断状态**，phase 进度通过 PhaseIndicator 告知而非用 disabled 锁住操作。

### 成功指标

- AC-1: 4 个 tab 均无 `disabled` 属性（`expect(tab).not.toBeDisabled()`）
- AC-2: 点击任意 tab，内容立即切换，响应 < 100ms
- AC-3: 空树显示引导提示而非空白
- AC-4: PhaseIndicator 不受影响，仍正常显示
- AC-5: 移动端与桌面端行为一致
- AC-6: prototype tab 始终可点击，与 phase 解耦
- AC-7: 只有一个 tab 处于 active
- AC-8: 切换 tab 后三树数据不丢失
=======
当前 OpenClaw 的 agent 治理依赖 `SOUL.md` + `AGENTS.md` 软约束（约 70% 遵守率），无机械拦截层。具体痛点：

1. **审查 agent 越权**：审查类 agent 有时被 prompt 引导越权修改代码，物理上无法拦截
2. **重复编辑循环**：dev agent 在同一文件上重复编辑超过 5 次仍未解决问题时，无人提醒"换方法"
3. **假完成**：dev agent 自评任务完成，但 build + test 实际失败
4. **黑箱治理**：无法量化各 guard 的实际效果，无法持续优化

wow-harness 是 Claude Code 生产级 agent 治理框架，经过 6 个月生产验证。本次目标是将其核心工程哲学「机械约束 > 软约束」实装到 OpenClaw。

### 目标

将 wow-harness 的 5 个可移植核心机制实装到 OpenClaw agent 治理体系：
- E1: Review agent schema-level 隔离（物理禁止写文件的审查 agent）
- E2: D8 机械化 progress check（零 LLM 成本防假完成）
- E3: Loop detection + Session reflection（打破编辑循环 + 量化治理效果）
- E4: Risk tracking + Pattern learning（高频风险监控 + 失败模式积累）

### 成功指标

| 指标 | 目标值 |
|------|--------|
| Review agent 写文件能力 | 物理上不可用（spawn 报错或 tools 白名单过滤） |
| D8 check 通过率 | 100%（未通过则 status ≠ done） |
| Loop 警告命中率 | 同一文件 5 次编辑后触发警告 |
| metrics 覆盖率 | 每个 session 至少 1 条 metrics JSONL |
| Pattern DB 初始规模 | ≥ 10 条常见失败模式 |
| OpenClaw 向后兼容 | 已有 skill 调度、消息路由功能不受影响 |
| Phase 1 工期 | 5 个工作日内完成交付 |
>>>>>>> Stashed changes

---

## 2. Epic 拆分

<<<<<<< Updated upstream
### Epic 1: TabBar 无障碍化改造

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S1.1** | TabBar.tsx 移除 disabled + 锁定逻辑 | 1h | 见下方 expect() 条目 |
| **S1.2** | CanvasPage.tsx 移动端内联 TabBar 同步改造 | 0.5h | `<768px` 下行为与桌面端一致 |

**Epic 1 总工时**: 1.5h

---

### Epic 2: 空状态提示设计

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S2.1** | ContextTreePanel 空状态 | 0.5h | `nodes.length === 0` 时显示"请先在需求录入阶段输入需求" |
| **S2.2** | FlowTreePanel 空状态 | 0.5h | 空数据显示"请先确认上下文节点，流程将自动生成" |
| **S2.3** | ComponentTreePanel 空状态 | 0.5h | 空数据显示"请先完成流程树，组件将自动生成" |

**Epic 2 总工时**: 1.5h

---

### Epic 3: 行为验证与测试

| Story ID | 描述 | 工时 | 验收标准 |
|---|---|---|---|
| **S3.1** | prototype tab 完全解锁验证 | 0.5h | prototype tab 不受 phase 锁定，始终可点击 |
| **S3.2** | Tab active 状态验证 | 0.5h | `activeTree === null` 时 context 为 active；其他情况 `activeTree === tab.id` |
| **S3.3** | E2E 测试覆盖（tab-switching.spec.ts） | 1.5h | AC-1 ~ AC-8 全部通过 |

**Epic 3 总工时**: 2.5h

---

### 工时汇总

| Epic | 工时 |
|---|---|
| Epic 1: TabBar 无障碍化改造 | 1.5h |
| Epic 2: 空状态提示设计 | 1.5h |
| Epic 3: 行为验证与测试 | 2.5h |
| **合计** | **5.5h** |
=======
### Epic 1 — Review agent schema-level 隔离

**目标**: 通过 `sessions_spawn` 的 tools 白名单参数，物理上隔离审查类 agent 的写文件能力。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E1.1** | 审查 agent 工具白名单配置 | 1h | 白名单 config 存在且格式正确 |
| **E1.2** | sessions_spawn 审查隔离实现 | 1h | `expect(sessions_spawn('reviewer', { tools: [...] }))` 中 tools 不含 Edit/Write/exec |

**Epic 1 总工时**: 2h

---

### Epic 2 — D8 机械化 progress check

**目标**: 在 `task_manager.py` 中插入 `pnpm build && pnpm test` 验证，未通过则阻塞 task done。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E2.1** | D8 机械化 build+test 验证 | 2h | `expect(child_process.spawnSync('pnpm', ['build'], ...).status).toBe(0)` |
| **E2.2** | progress.json 写入 | 0.5h | D8 check 后 `progress.json` 存在且 `status === 'pass'` |
| **E2.3** | task_manager.py D8 钩子 | 1h | `task update ... done` 调用前触发 D8 check |
| **E2.4** | D8 check 失败阻塞交付 | 0.5h | D8 fail 时 `task status` 保持 `pending`，不允许 `done` |

**Epic 2 总工时**: 4h

---

### Epic 3 — Loop detection + Session reflection

**目标**: 追踪同一文件的重复编辑，超阈值注入警告；增强心跳输出治理 metrics。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E3.1** | Edit 次数追踪 | 1h | 同一文件 6 次 Edit 调用后，计数器 = 6 |
| **E3.2** | Loop 警告注入 | 1h | 计数器 >5 时，`additionalContext` 含警告文本 |
| **E3.3** | 阈值可配置 | 0.5h | 修改 config.json 阈值后，触发时机随之变化 |
| **E3.4** | Session metrics 收集 | 1h | metrics 对象含 `toolCalls: { Bash, Edit, Write, Read }` |
| **E3.5** | metrics JSONL 写入 | 0.5h | `~/.openclaw/sessions/{id}/metrics.jsonl` 可读且格式正确 |

**Epic 3 总工时**: 5h

---

### Epic 4 — Risk tracking + Pattern learning

**目标**: 记录高频风险操作并注入提醒；建立失败模式库供查询。

| Story ID | 描述 | 工时 | 验收标准 |
|----------|------|------|---------|
| **E4.1** | Risk 操作频次记录 | 1h | `metrics.toolCalls.Bash > 0` 时有记录 |
| **E4.2** | Risk 高频警告 | 0.5h | 单 session Bash > 20 次时 additionalContext 含风险提醒 |
| **E4.3** | Pattern DB 初始化 | 1h | `~/.openclaw/failure-patterns.jsonl` 存在且 ≥ 10 条 |
| **E4.4** | Pattern lookup 接口 | 1h | 给定错误类型返回匹配 pattern（精确匹配或模糊） |

**Epic 4 总工时**: 3.5h
>>>>>>> Stashed changes

---

## 3. 验收标准

<<<<<<< Updated upstream
### S1.1 — TabBar.tsx 移除 disabled + 锁定逻辑

```typescript
// 删除前（TabBar.tsx:37-42）
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
const isLocked = tab.id !== 'prototype' && tabIdx > phaseIdx;
disabled={isLocked}
title={isLocked ? `需先完成上一阶段` : `切换到 ${tab.label} 树`}

// 删除前（TabBar.tsx:48-53）
const tabIdx = PHASE_ORDER.indexOf(tab.id as Phase);
if (tabIdx > phaseIdx) { return; }

// 删除后：handleTabClick 始终执行 setActiveTree(tabId)，无 phase 守卫

// AC-1: 无 disabled 按钮
expect(tab).not.toBeDisabled()  // 4 个 tab 均通过

// AC-6: prototype tab 始终可点击（不受 phase 锁定）
const prototypeBtn = page.locator('[role="tab"]', { hasText: '🚀' });
await prototypeBtn.click();
await expect(prototypeBtn).toBeEnabled();
```

### S1.2 — 移动端内联 TabBar 同步改造

```typescript
// AC-5: 移动端行为一致
await page.setViewportSize({ width: 375, height: 812 });
// 移动端内联 tab bar 应无 disabled
const mobileTabs = page.locator('[role="tab"]');
await expect(mobileTabs.first()).not.toBeDisabled();
```

### S2.1 / S2.2 / S2.3 — 空状态提示

```typescript
// 在 input 阶段点击 flow tab，显示引导提示
await page.goto('/canvas');
await page.click('[role="tab"]', { hasText: '🔀' });  // flow tab
// 空状态提示可见
const emptyState = page.locator('text=请先确认上下文节点');
await expect(emptyState).toBeVisible();

// 在 input 阶段点击 component tab
await page.click('[role="tab"]', { hasText: '🧩' });  // component tab
const emptyState2 = page.locator('text=请先完成流程树');
await expect(emptyState2).toBeVisible();
```

### S3.2 — Tab active 状态

```typescript
// AC-7: 只有一个 tab 处于 active
const activeTabs = page.locator('[role="tab"][aria-selected="true"]');
await expect(activeTabs).toHaveCount(1);

// 默认状态：context 为 active
await page.goto('/canvas');
const contextTab = page.locator('[role="tab"]', { hasText: '🔵' });
await expect(contextTab).toHaveAttribute('aria-selected', 'true');
```

### S3.3 — E2E 测试完整覆盖

```typescript
// tab-switching.spec.ts
test('AC-1: 4 个 tab 均无 disabled 属性', async ({ page }) => {
  await page.goto('/canvas');
  const tabs = page.locator('[role="tab"]');
  await expect(tabs).toHaveCount(4);
  for (const tab of await tabs.all()) {
    await expect(tab).not.toBeDisabled();
  }
});

test('AC-2: 点击立即切换，响应 < 100ms', async ({ page }) => {
  await page.goto('/canvas');
  const start = Date.now();
  await page.click('[role="tab"]', { hasText: '🔀' });
  await expect(page.locator('text=请先确认上下文节点')).toBeVisible();
  expect(Date.now() - start).toBeLessThan(100);
});

test('AC-4: PhaseIndicator 不受影响', async ({ page }) => {
  await page.goto('/canvas');
  const phaseIndicator = page.locator('[aria-label*="阶段"]');
  await expect(phaseIndicator).toBeVisible();
  // 切换 tab 后仍正常显示
  await page.click('[role="tab"]', { hasText: '🔀' });
  await expect(phaseIndicator).toBeVisible();
});

test('AC-8: 切换 tab 后数据不丢失', async ({ page }) => {
  // 先在 context tab 添加节点
  await page.goto('/canvas');
  await page.click('[role="tab"]', { hasText: '🔵' });
  // ... 添加 context 节点
  // 切换到 flow tab 再切回
  await page.click('[role="tab"]', { hasText: '🔀' });
  await page.click('[role="tab"]', { hasText: '🔵' });
  // context 节点仍存在
  const contextNodes = page.locator('[data-testid="context-node"]');
  await expect(contextNodes).toHaveCountGreaterThan(0);
=======
### E1 — Review agent schema 隔离

```
// E1.2: sessions_spawn 审查隔离
const result = await sessions_spawn({
  label: 'review-check',
  agentId: 'review',
  runtime: 'subagent',
  tools: ['Read', 'Grep', 'sessions_history'], // 不含 Edit/Write/exec
>>>>>>> Stashed changes
});
expect(result.tools).not.toContain('Edit');
expect(result.tools).not.toContain('Write');
expect(result.tools).not.toContain('exec');
```

### E2 — D8 progress check

```
// E2.1: build+test 通过
const buildResult = spawnSync('pnpm', ['build'], { cwd: '/root/.openclaw' });
expect(buildResult.status).toBe(0);

const testResult = spawnSync('pnpm', ['test'], { cwd: '/root/.openclaw' });
expect(testResult.status).toBe(0);

// E2.2: progress.json 存在
const progress = JSON.parse(readFileSync('progress.json', 'utf-8'));
expect(progress.status).toBe('pass');
expect(progress.timestamp).toBeDefined();

// E2.4: D8 失败时 status 阻塞
// 模拟 build 失败
spawnSync('pnpm', ['build'], { status: 1 });
const status = taskGetStatus('vibex/some-task');
expect(status).not.toBe('done');
```

### E3 — Loop detection + Session reflection

```
// E3.1: Edit 次数追踪
for (let i = 0; i < 6; i++) {
  await exec(`edit file=client.ts "const x = ${i}"`);
}
const counter = getEditCounter('client.ts');
expect(counter).toBe(6);

// E3.2: Loop 警告注入
expect(additionalContext).toContain('loop detection');
expect(additionalContext).toContain('client.ts');

// E3.4: Session metrics 收集
const metrics = getSessionMetrics(sessionId);
expect(metrics.toolCalls).toBeDefined();
expect(metrics.toolCalls.Edit).toBeGreaterThan(0);
expect(metrics.agentType).toBe('dev');

// E3.5: metrics JSONL 写入
const lines = readFileSync(metricsPath, 'utf-8').trim().split('\n');
expect(lines.length).toBeGreaterThan(0);
const entry = JSON.parse(lines[lines.length - 1]);
expect(entry.timestamp).toBeDefined();
```

### E4 — Risk tracking + Pattern learning

```
// E4.2: Risk 高频警告（Bash > 20）
// 模拟 21 次 Bash 调用
simulateBashCalls(21);
expect(additionalContext).toContain('high frequency');
expect(additionalContext).toContain('Bash');

// E4.3: Pattern DB 初始化
const patterns = readFileSync(patternDbPath, 'utf-8').trim().split('\n');
expect(patterns.length).toBeGreaterThanOrEqual(10);

// E4.4: Pattern lookup
const match = lookupPattern('SyntaxError: Unexpected token');
expect(match).toBeDefined();
expect(match.solution).toBeTruthy();
```

---

<<<<<<< Updated upstream
## 4. DoD (Definition of Done)

### Epic 1 完成条件
- [ ] `TabBar.tsx` 中 `isLocked` 变量已删除
- [ ] `TabBar.tsx` 中 `disabled={isLocked}` 已删除
- [ ] `TabBar.tsx` 中 `handleTabClick` 的 phase 守卫已删除
- [ ] `CanvasPage.tsx` 中移动端内联 tab bar 的 disabled 逻辑已删除
- [ ] AC-1: 4 个 tab 均无 `disabled` 属性

### Epic 2 完成条件
- [ ] `ContextTreePanel` 空状态显示"请先在需求录入阶段输入需求"
- [ ] `FlowTreePanel` 空状态显示"请先确认上下文节点，流程将自动生成"
- [ ] `ComponentTreePanel` 空状态显示"请先完成流程树，组件将自动生成"
- [ ] AC-3: 空树显示引导提示而非空白

### Epic 3 完成条件
- [ ] prototype tab 不受 phase 锁定，始终可点击
- [ ] AC-7: 只有一个 tab 处于 active
- [ ] `tab-switching.spec.ts` 覆盖 AC-1 ~ AC-8
- [ ] AC-1 ~ AC-8 全部 E2E 测试通过
- [ ] `pnpm build` + `pnpm test` 均通过

### 项目整体 DoD
- [ ] 所有 Epic 完成条件全部满足
- [ ] changelog 已更新

---

## 5. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|---|---|---|---|---|
| F1.1 | TabBar 移除 disabled 锁定逻辑 | 删除 `isLocked`、`disabled` 属性、`handleTabClick` 中的 phase 守卫 | `expect(tab).not.toBeDisabled()` | 【需页面集成】 |
| F1.2 | 移动端内联 TabBar 同步移除 | CanvasPage 中 `useTabMode` 下的内联 tab bar 删除 disabled 逻辑 | `<768px` 下无 disabled | 【需页面集成】 |
| F2.1 | ContextTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F2.2 | FlowTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F2.3 | ComponentTreePanel 空状态 | 空数据显示引导文案 | `expect(emptyState).toBeVisible()` | 【需页面集成】 |
| F3.1 | prototype tab 完全解锁 | 不受 phase 锁定，始终可点击 | `expect(prototypeTab).toBeEnabled()` | 【需页面集成】 |
| F4.1 | Tab active 状态正确 | 只有一个 tab active；context 默认 active | `expect(activeTabs).toHaveCount(1)` | 【需页面集成】 |
| F5.1 | E2E 测试覆盖 | 新增 `tab-switching.spec.ts` | AC-1 ~ AC-8 全通过 | 无 |
=======
## 4. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | 审查 agent 工具白名单 | 定义 review 类 agent tools 白名单（Read/Grep/sessions_history） | `expect(whitelist).toContain('Read')` | 无 |
| F1.2 | sessions_spawn 审查隔离 | spawn 审查类 agent 时传入 tools 白名单 | `expect(result.tools).not.toContain('Write')` | 无 |
| F2.1 | D8 机械化 build+test | `pnpm build && pnpm test`，解析退出码 | `expect(buildResult.status).toBe(0)` | 无 |
| F2.2 | progress.json 写入 | D8 通过后写入 status=pass | `expect(progress.status).toBe('pass')` | 无 |
| F2.3 | task_manager D8 钩子 | task done 前触发 D8 check | `expect(d8Triggered).toBe(true)` | 无 |
| F2.4 | D8 失败阻塞交付 | D8 fail 时 status ≠ done | `expect(taskStatus).not.toBe('done')` | 无 |
| F3.1 | Edit 次数追踪 | 同一文件 Edit 次数计数器 | `expect(counter).toBe(6)` | 无 |
| F3.2 | Loop 警告注入 | 阈值超 5 次时 additionalContext 含警告 | `expect(ctx).toContain('loop detection')` | 无 |
| F3.3 | 阈值可配置 | config 中阈值可调整 | config 改后触发时机随之变化 | 无 |
| F4.1 | Session metrics 收集 | 心跳增强：tool 频次、guard 命中 | `expect(metrics.toolCalls).toBeDefined()` | 无 |
| F4.2 | metrics JSONL 写入 | metrics 追加写入 JSONL | `expect(JSON.parse(line)).toBeValid()` | 无 |
| F5.1 | Risk 操作频次记录 | 记录 Bash/Edit/Write 调用频率 | `expect(metrics.toolCalls.Bash).toBeDefined()` | 无 |
| F5.2 | Risk 高频警告 | 单 session 高频操作时注入提醒 | `expect(ctx).toContain('high frequency')` | 无 |
| F6.1 | Pattern DB 初始化 | failure-patterns.jsonl 初始化 ≥ 10 条 | `expect(patterns.length).toBeGreaterThanOrEqual(10)` | 无 |
| F6.2 | Pattern lookup | 给定错误类型返回匹配 solution | `expect(match.solution).toBeTruthy()` | 无 |

---

## 5. DoD (Definition of Done)

### Epic 1 — Review agent schema-level 隔离

- [ ] `review-agent-whitelist.json` 或 config 中定义了 tools 白名单
- [ ] `sessions_spawn` 审查 agent 时 tools 参数不含 Edit/Write/exec
- [ ] 单元测试覆盖：spawn 审查 agent 的 tools 白名单验证
- [ ] 白名单变更有配置说明文档

### Epic 2 — D8 机械化 progress check

- [ ] `task_manager.py` 中 `task done` 前调用 D8 check
- [ ] `pnpm build && pnpm test` 在 clean 环境全通过
- [ ] D8 fail 时 `task status` 保持 pending，日志输出失败原因
- [ ] `progress.json` 格式正确（status/timestamp/error）
- [ ] 单元测试覆盖 D8 check 逻辑（mock spawn）

### Epic 3 — Loop detection + Session reflection

- [ ] 同一文件 Edit 调用计数器正常工作（递增 + 独立文件隔离）
- [ ] 阈值超 5 次时 additionalContext 含 "loop detection" 警告文本
- [ ] 阈值通过 config 可配置（默认 5）
- [ ] metrics.jsonl 每 session 至少 1 条记录
- [ ] metrics 包含：sessionId、agentType、toolCalls、guardHits、duration

### Epic 4 — Risk tracking + Pattern learning

- [ ] metrics 中含 Bash/Edit/Write 频次统计
- [ ] 高频 Bash (>20) 时注入风险提醒
- [ ] `failure-patterns.jsonl` 初始 ≥ 10 条，覆盖常见失败类型
- [ ] `lookupPattern(errorType)` 返回匹配的 solution
- [ ] Pattern DB 支持追加（写入新 pattern）

### 项目整体 DoD

- [ ] E1 + E2 + E3 + E4 全部 Epic DoD 完成
- [ ] `pnpm build && pnpm test` 在本机全通过
- [ ] 所有新机制可通过 config 开关独立启用/禁用
- [ ] 已有 skill 调度、消息路由功能全量回归通过
- [ ] changelog 更新了本次实装的 4 个 Epic
>>>>>>> Stashed changes

---

## 6. 依赖关系图

```
F1.1 TabBar.tsx 移除 disabled    ──┐
F1.2 CanvasPage 移动端同步      ──┤─ 共同产出: TabBar 无障碍化
                                  │
F2.1/F2.2/F2.3 空状态           ──┤─ 共同产出: 空状态提示设计
                                  │
F3.1 prototype tab 解锁         ──┤─ 共同产出: 行为验证
F4.1 Tab active 状态
                                  │
F5.1 E2E 测试                   ← 所有 Epic 的验收

无外部依赖，无需协调后端或其他团队
```

---

## 7. 风险提示

| 风险 | 可能性 | 影响 | 缓解 |
<<<<<<< Updated upstream
|---|---|---|---|
| 用户点击空树感到困惑 | 中 | 低 | Epic 2 空状态提示；PhaseIndicator 引导下一步 |
| 三树同时渲染性能下降 | 低 | 低 | 可用 CSS `display:none` 视觉隐藏，不卸载数据 |
| 原型 tab 与其他 tab 行为不一致 | 低 | 中 | prototype tab 特殊处理，不受 phase 锁定 |
=======
|------|--------|------|------|
| OpenClaw sessions_spawn 不支持 tools 参数 | 低 | 高 | E1.2 前先验证 API 能力（AC-1 已验证） |
| Loop detection 误触发（大型重构） | 中 | 低 | 阈值可配置，默认 5 次 |
| metrics JSONL 写入性能影响 | 低 | 低 | 追加写入，非实时，对响应时间无影响 |
| Pattern DB 维护负担 | 中 | 低 | 初始手动维护，可渐进积累 |
| 多个独立机制增加运营复杂度 | 中 | 中 | config 独立开关，不强制全开 |
>>>>>>> Stashed changes

---

## 8. 关键代码位置索引

| 文件 | 行 | 用途 |
|---|---|---|
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 37-42 | `isLocked` + `disabled` 定义 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 48-53 | `handleTabClick` 锁定守卫 |
| `vibex-fronted/src/components/canvas/TabBar.tsx` | 54-61 | 按钮 disabled + class 条件 |
| `vibex-fronted/src/components/canvas/CanvasPage.tsx` | ~240-260 | 移动端内联 tab bar（含 disabled） |

---

## 9. PRD 格式校验

- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [x] 每个 Story 有可写的 expect() 断言
- [x] DoD 章节存在且具体
<<<<<<< Updated upstream
- [x] 功能点汇总表格式正确
- [x] 已执行 Planning（Feature List 已产出）
- [x] 页面集成标注完整（【需页面集成】）
- [x] 无遗漏验收标准

---

*Planning 输出: `docs/vibex/plan/feature-list.md`*
*基于 Analyst 报告: `docs/vibex/analysis.md`*
*推荐方案: 方案 A（TabBar 移除 disabled + 空状态提示）*
=======
- [x] 功能点汇总表格式正确（ID/功能名/描述/验收标准/页面集成）
- [x] 已执行 Planning（Feature List: plan/feature-list-wow-harness.md）
- [x] 页面集成标注（全部为"无"，本次无页面改动）
- [x] 安全风险已覆盖（schema 隔离物理上阻塞越权）

---

## 8. 驳回红线检查

| 红线 | 状态 | 说明 |
|------|------|------|
| PRD 缺少执行摘要/Epic拆分/验收标准/DoD | ✅ | 全部包含 |
| 功能点模糊，无法写 expect() | ✅ | 所有 16 个功能点均有 expect() 断言 |
| 验收标准缺失 | ✅ | E1-E4 共 16 个 Story 均有 expect() 条目 |
| 涉及页面但未标注【需页面集成】 | ✅ | 本次无页面改动，全部标注"无" |
| 未执行 Planning（无 Feature List） | ✅ | plan/feature-list-wow-harness.md 已生成 |

---

*Planning 输出: `plan/feature-list-wow-harness.md`*  
*基于 Analyst 报告: `analysis.md`*  
*推荐方案: 方案 A（精选机制集成）*  
*Phase 1 总工时: ~14.5h（约 2 个工作日）*
>>>>>>> Stashed changes
