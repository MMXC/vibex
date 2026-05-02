# VibeX Sprint 22 PRD — 功能提案规划

**Agent**: pm
**日期**: 2026-05-02
**项目**: vibex-proposals-20260502-sprint22
**依据**: analysis.md（analyst 评审）
**产出路径**: `/root/.openclaw/vibex/docs/vibex-proposals-20260502-sprint22/prd.md`

---

## 1. 执行摘要

### 背景

Sprint 1-21 已完成 6 个 Epic 的建设（Design Review / E2E CI / Teams / Template Library / Agent），但存在以下真实产品问题：

| 问题 | 现状 | 影响 |
|------|------|------|
| Design Review 调用 mock 而非真实 MCP | S19 迁移到 API route，但走本地静态分析，非 AI 评审 | 用户得不到 AI 设计建议 |
| E2E CI 稳定性未验证 | S21 CI E2E 环境隔离已落地，但 flaky rate 未监控 | PR 合入质量不稳定 |
| Teams 协作与画布权限断裂 | Teams API + Dashboard 完整，但画布无权限区分 | 协作体验不完整 |
| 需求模板库缺失 | 新用户面对空白 requirement chapter，无引导 | 首日体验差，AI 生成质量低 |
| Agent UI E2E 路径未覆盖 | S20 Agent 真实接入完成，但 E2E 只覆盖 basic happy path | 会话删除/超时/回写无保障 |

### 目标

Sprint 22 聚焦四个功能增强 + 一个验证任务，填补已有功能的完成度缺口：

1. **P001**: Design Review 接入真实 MCP Server（AI 评审）
2. **P002**: E2E CI 稳定性监控（flaky rate < 5%）
3. **P003**: Teams 协作 UI 完善（画布权限集成）
4. **P004**: 需求模板库基础建设（新用户引导）
5. **P005**: Agent API E2E 路径补全（会话管理）

### 成功指标

- [ ] P001: Design Review 响应中有 AI 推理痕迹（非纯静态 linting）
- [ ] P002: 连续 3 次 CI E2E 执行 flaky rate < 5%
- [ ] P003: 用户可在画布中区分团队成员 vs 访客
- [ ] P004: 新项目创建流程提供模板选择 + 自动填充
- [ ] P005: `pnpm test:e2e --grep "agent"` 全部通过（13+ tests）

---

## 2. Epic 拆分

### Epic E1: Design Review 真实 MCP 集成

**Story**: E1-S1: MCP Bridge 集成

| 字段 | 内容 |
|------|------|
| Story ID | E1-S1 |
| 描述 | 修改 `/api/mcp/review_design` API route，通过 OpenClawBridge 调用真实 MCP server `/tools/review_design` |
| 角色 | 用户（设计师） |
| 行为 | 按下 Ctrl+Shift+R 触发 Design Review |
| 收益 | 收到 AI 驱动的设计评审，而非本地静态 linting 结果 |
| 工时估算 | 2-3h |
| 依赖 | S20 OpenClawBridge（P006 已完成） |

**验收标准（expect 断言）**:
```typescript
// E1-S1 AC
expect(response.body.aiScore).toBeDefined();          // AI 评分存在
expect(response.body.suggestions).toBeInstanceOf(Array); // 建议为数组
expect(response.status).not.toBe(500);               // MCP 不可用不崩

// E1-S1 AC: graceful degradation
expect(screen.findByText(/暂不可用/i)).toBeTruthy(); // 降级提示可见
```

---

**Story**: E1-S2: E2E 验证真实 MCP 路径

| 字段 | 内容 |
|------|------|
| Story ID | E1-S2 |
| 描述 | 添加 E2E 测试覆盖 Design Review 真实 MCP 调用链路 |
| 角色 | QA |
| 行为 | CI 中执行 E2E Design Review 测试 |
| 收益 | 回归测试覆盖真实 API，防止静默退化 |
| 工时估算 | 1-2h |
| 依赖 | E1-S1 完成 |

**验收标准（expect 断言）**:
```typescript
// E1-S2 AC
const result = await request.get('/api/mcp/review_design');
expect(result.status).toBe(200);
expect(result.body.toolsCalled).toContain('review_design');
```

---

### Epic E2: E2E CI 稳定性监控

**Story**: E2-S1: Flaky Rate 监控 + 告警

| 字段 | 内容 |
|------|------|
| Story ID | E2-S1 |
| 描述 | 在 CI E2E job 中集成 flaky rate 监控，连续 3 次失败触发 Slack 告警 |
| 角色 | DevRel / DevOps |
| 行为 | E2E job 失败时自动计算 flaky rate |
| 收益 | CI health 透明，flaky 问题可追踪 |
| 工时估算 | 2h |
| 依赖 | S21 CI E2E（已完成） |

**验收标准（expect 断言）**:
```typescript
// E2-S1 AC
expect(ciReport.e2eFlakyRate).toBeLessThan(0.05);   // < 5%
expect(slackAlertSent).toBe(true);                   // 连续 3 次失败发告警
```

---

**Story**: E2-S2: 关键路径 E2E 覆盖率提升

| 字段 | 内容 |
|------|------|
| Story ID | E2-S2 |
| 描述 | 新增 Canvas 核心路径 E2E 测试（创建/编辑/删除卡片 + API 调用） |
| 角色 | QA |
| 行为 | 执行 E2E 关键路径测试套件 |
| 收益 | 覆盖率 ≥ 80%，CI gate 更有保障 |
| 工时估算 | 2h |
| 依赖 | E2-S1 完成 |

**验收标准（expect 断言）**:
```typescript
// E2-S2 AC
const coverage = await getCoverageReport();
expect(coverage.e2e.criticalPath).toBeGreaterThanOrEqual(0.80);
```

---

### Epic E3: Teams 协作 UI 完善

**Story**: E3-S1: PresenceAvatars 团队成员标识

| 字段 | 内容 |
|------|------|
| Story ID | E3-S1 |
| 描述 | 在 PresenceAvatars 组件中区分"团队成员"（绿色边框）与"访客"（灰色边框） |
| 角色 | 用户（协作者） |
| 行为 | 进入画布后，看到团队成员有特殊标识 |
| 收益 | 快速识别谁是团队成员，谁是外部访客 |
| 工时估算 | 3-4h |
| 依赖 | S14 Teams API |
| 页面集成 | 【需页面集成】DDSCanvasPage.tsx, PresenceAvatars.tsx |

**验收标准（expect 断言）**:
```typescript
// E3-S1 AC
const teamMemberAvatar = screen.getByTestId('avatar-alice');
expect(teamMemberAvatar.className).toContain('team-member-border'); // 绿色边框

const guestAvatar = screen.getByTestId('avatar-bob');
expect(guestAvatar.className).toContain('guest-border');             // 灰色边框
```

---

**Story**: E3-S2: 画布权限 RBAC 按钮控制

| 字段 | 内容 |
|------|------|
| Story ID | E3-S2 |
| 描述 | 非 owner 用户的画布删除/分享按钮置灰（显示 tooltip: "需要 Owner 权限"） |
| 角色 | 用户（member） |
| 行为 | member 尝试删除团队共享的画布 |
| 收益 | 越权操作被 UI 层拦截，而非后端 403 后才感知 |
| 工时估算 | 4-5h |
| 依赖 | E3-S1 完成 |
| 页面集成 | 【需页面集成】DDSCanvasPage.tsx, CanvasToolbar.tsx |

**验收标准（expect 断言）**:
```typescript
// E3-S2 AC
const deleteBtn = screen.getByTestId('canvas-delete-btn');
expect(deleteBtn).toBeDisabled();
expect(screen.queryByText(/需要 Owner 权限/i)).toBeTruthy();

// E3-S2 AC: E2E 越权
await memberSession.click('[data-testid="canvas-delete-btn"]');
const response = await request.delete('/api/v1/projects/:id');
expect(response.status).toBe(403);
```

---

**Story**: E3-S3: 团队成员列表 Toolbar 显示

| 字段 | 内容 |
|------|------|
| Story ID | E3-S3 |
| 描述 | 画布 Toolbar 显示团队成员头像堆叠（当前在线 + 离线成员） |
| 角色 | 用户 |
| 行为 | 查看画布 Toolbar 的团队成员头像 |
| 收益 | 快速看到谁参与了这个画布 |
| 工时估算 | 2-3h |
| 依赖 | E3-S1 完成 |
| 页面集成 | 【需页面集成】DDSCanvasPage.tsx, CanvasToolbar.tsx |

**验收标准（expect 断言）**:
```typescript
// E3-S3 AC
const memberStack = screen.getByTestId('team-member-stack');
expect(memberStack.children).toHaveLength(teamMembers.length);
```

---

### Epic E4: 需求模板库基础建设

**Story**: E4-S1: 模板选择界面

| 字段 | 内容 |
|------|------|
| Story ID | E4-S1 |
| 描述 | 新项目创建流程提供模板选择（3 个行业模板 + 1 个空白选项） |
| 角色 | 用户（新用户） |
| 行为 | 点击 "New Project" 后选择模板 |
| 收益 | 不再面对空白 requirement 输入框 |
| 工时估算 | 3-4h |
| 依赖 | 无 |
| 页面集成 | 【需页面集成】Dashboard, NewProjectModal.tsx |

**验收标准（expect 断言）**:
```typescript
// E4-S1 AC
await page.click('[data-testid="new-project-btn"]');
const modal = screen.getByTestId('template-select-modal');
expect(modal).toBeVisible();
expect(screen.getAllByTestId('template-option')).toHaveLength(4); // 3 行业 + 1 空白
```

---

**Story**: E4-S2: 模板自动填充 + 引导

| 字段 | 内容 |
|------|------|
| Story ID | E4-S2 |
| 描述 | 模板选择后自动填充 requirement chapter（包含结构化引导：用户/场景/目标/约束） |
| 角色 | 用户 |
| 行为 | 选择 "SaaS 产品设计" 模板后，进入 Canvas |
| 收益 | requirement 输入有参考，减少 AI 生成垃圾输出 |
| 工时估算 | 1-2h |
| 依赖 | E4-S1 完成 |
| 页面集成 | 【需页面集成】NewProjectModal.tsx, ChapterPanel.tsx |

**验收标准（expect 断言）**:
```typescript
// E4-S2 AC
await page.click('[data-testid="template-option-sass"]');
await page.click('[data-testid="confirm-template-btn"]');
const requirementContent = await page.locator('[data-testid="requirement-chapter"]').innerText();
expect(requirementContent).toContain('用户');
expect(requirementContent).toContain('场景');
expect(requirementContent).toContain('目标');
```

---

**Story**: E4-S3: 自定义模板保存

| 字段 | 内容 |
|------|------|
| Story ID | E4-S3 |
| 描述 | 用户可将当前 requirement 内容保存为自定义模板（localStorage） |
| 角色 | 用户 |
| 行为 | 填写完 requirement 后点击 "保存为模板" |
| 收益 | 团队可复用最佳实践模板 |
| 工时估算 | 1h |
| 依赖 | E4-S2 完成 |
| 页面集成 | 【需页面集成】ChapterPanel.tsx |

**验收标准（expect 断言）**:
```typescript
// E4-S3 AC
await page.click('[data-testid="save-as-template-btn"]');
const stored = await page.evaluate(() => localStorage.getItem('customTemplates'));
expect(JSON.parse(stored)).toContainEqual(expect.objectContaining({ name: expect.any(String) }));
```

---

### Epic E5: Agent API E2E 路径补全

**Story**: E5-S1: Agent 超时降级 E2E

| 字段 | 内容 |
|------|------|
| Story ID | E5-S1 |
| 描述 | 添加 E2E 测试：backend timeout 时 UI 显示 graceful error message（非 crash） |
| 角色 | QA |
| 行为 | Agent backend 不可用时触发 agent 会话 |
| 收益 | 越界场景有测试覆盖，用户不会看到白屏 |
| 工时估算 | 1h |
| 依赖 | S20 Agent 真实接入 |

**验收标准（expect 断言）**:
```typescript
// E5-S1 AC
await mockBackend.down();
await page.click('[data-testid="agent-session-new"]');
await page.waitForSelector('[data-testid="agent-error-message"]');
expect(await page.locator('[data-testid="agent-error-message"]').innerText())
  .toMatch(/暂不可用|超时/i);
```

---

**Story**: E5-S2: Agent 会话列表 UI E2E

| 字段 | 内容 |
|------|------|
| Story ID | E5-S2 |
| 描述 | E2E 测试：创建 2 个 agent 会话后，列表显示 2 条记录 |
| 角色 | QA |
| 行为 | 创建 2 个 agent 会话，查看会话列表 |
| 收益 | 多会话场景有 UI 测试保障 |
| 工时估算 | 1h |
| 依赖 | E5-S1 完成 |

**验收标准（expect 断言）**:
```typescript
// E5-S2 AC
await page.click('[data-testid="agent-new-session"]');
await page.click('[data-testid="agent-new-session"]');
const sessionList = page.locator('[data-testid="agent-session-item"]');
expect(await sessionList).toHaveLength(2);
```

---

**Story**: E5-S3: Agent 会话删除 E2E

| 字段 | 内容 |
|------|------|
| Story ID | E5-S3 |
| 描述 | E2E 测试：删除 agent 会话（DELETE /api/agent/sessions/:id） |
| 角色 | QA |
| 行为 | 删除一个 agent 会话 |
| 收益 | 会话管理路径完整 |
| 工时估算 | 1h |
| 依赖 | E5-S2 完成 |

**验收标准（expect 断言）**:
```typescript
// E5-S3 AC
const initialCount = await page.locator('[data-testid="agent-session-item"]').count();
await page.click('[data-testid="agent-session-delete-btn"]:first');
await page.waitForResponse('**/api/agent/sessions/**');
expect(await page.locator('[data-testid="agent-session-item"]')).toHaveLength(initialCount - 1);
```

---

## 3. 验收标准汇总表

| Story ID | 验收标准数 | 核心断言 | 页面集成 |
|----------|-----------|---------|---------|
| E1-S1 | 3 | AI 评分存在 + 降级提示可见 | 否（API layer） |
| E1-S2 | 2 | toolsCalled 包含 review_design | 否 |
| E2-S1 | 2 | flakyRate < 5% + Slack 告警 | 否 |
| E2-S2 | 1 | 关键路径覆盖率 >= 80% | 否 |
| E3-S1 | 2 | team-member-border + guest-border | DDSCanvasPage, PresenceAvatars |
| E3-S2 | 2 | button disabled + 403 response | DDSCanvasPage, CanvasToolbar |
| E3-S3 | 1 | member count 匹配 | DDSCanvasPage, CanvasToolbar |
| E4-S1 | 2 | modal visible + 4 options | Dashboard, NewProjectModal |
| E4-S2 | 3 | requirement 包含结构化字段 | NewProjectModal, ChapterPanel |
| E4-S3 | 1 | localStorage 包含自定义模板 | ChapterPanel |
| E5-S1 | 1 | error message 可见 | AgentSessions UI |
| E5-S2 | 1 | session count = 2 | AgentSessions UI |
| E5-S3 | 1 | session count - 1 | AgentSessions UI |

---

## 4. DoD (Definition of Done)

每个 Story 的研发完成必须同时满足以下标准：

### 开发完成标准

- [ ] 功能代码实现完毕（符合 Epic 描述）
- [ ] `pnpm run build` → 0 errors
- [ ] 所有 expect() 测试通过（本地 `pnpm test`）
- [ ] TypeScript 无新增错误（`pnpm exec tsc --noEmit`）

### 测试完成标准

- [ ] 对应 E2E spec 已实现且在 CI 中通过
- [ ] E2E flaky rate < 5%（针对 E2E 相关 Story）
- [ ] 无 regression：现有 CI gate 测试全部通过

### 文档完成标准

- [ ] 相关 CHANGELOG 条目已写入
- [ ] 涉及 API 变更的，已更新 API 文档（api-contract.yaml）
- [ ] 涉及页面集成的，已更新对应组件文档

### 集成完成标准

- [ ] P003/E3 系列：前端页面已更新，团队成员标识、权限按钮、Toolbar 均可见
- [ ] P004/E4 系列：模板选择流程端到端可用
- [ ] E2E 相关 Story：flaky rate 监控已集成到 CI

---

## 5. 工时汇总

| Epic | Story | 工时估算 |
|------|-------|---------|
| E1: Design Review | E1-S1 + E1-S2 | 3-5h |
| E2: E2E CI 稳定性 | E2-S1 + E2-S2 | 4h |
| E3: Teams 协作 UI | E3-S1 + E3-S2 + E3-S3 | 9-12h |
| E4: 需求模板库 | E4-S1 + E4-S2 + E4-S3 | 5-7h |
| E5: Agent E2E 补全 | E5-S1 + E5-S2 + E5-S3 | 3h |
| **合计** | **13 个 Story** | **24-31h** |

---

## 6. 执行决策

- **决策**: PM 评审通过
- **执行项目**: vibex-proposals-20260502-sprint22
- **执行日期**: 待 coord 确认后启动 Sprint 22 阶段一
- **进入 Sprint 22 的功能**: E1 + E2 + E3（分期）+ E4 + E5
- **E3 风险提示**: E3-S2 跨 store 权限同步复杂，建议分期执行（E3-S1 优先）

---

*PM Review | 2026-05-02 | VibeX Sprint 22 PRD*
