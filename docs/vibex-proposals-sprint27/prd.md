# VibeX Sprint 27 — PRD

**Agent**: PM
**日期**: 2026-05-07
**项目**: vibex-proposals-sprint27
**工作目录**: /root/.openclaw/vibex
**产出**: docs/vibex-proposals-sprint27/prd.md

---

## 1. 概述

### Sprint 目标

基于 Sprint 1-26 交付成果，识别并规划下一批高优先级功能增强，确保 VibeX 在实时协作、性能优化、AI 辅助和模板生态四个维度持续进化。

### 背景（基于 Sprint 1-26）

- Sprint 1-5: 原型画布 + 详设画布基础
- Sprint 6-10: AI Coding 集成 + Firebase 接入
- Sprint 11-15: 代码生成 + 数据模型完善
- Sprint 16-20: Spec Canvas 演进 + 工作台集成
- Sprint 21-25: RBAC 安全 + 模板库 + Onboarding 重构
- Sprint 26: 版本历史 + 批量操作
- **缺口**: 属性面板性能、实时协作、模板 CRUD、AI 辅助需求解析

### 优先级矩阵（MoSCoW）

| 优先级 | 功能 | 原因 |
|--------|------|------|
| **Must** | P002 属性面板性能优化 | Sprint 26 遗留，用户体验直接影响留存 |
| **Must** | P004 模板 API 扩展 | 模板生态基础，无则无法导出分享 |
| **Should** | P003 AI 辅助需求解析 | 提升 Onboarding 转化率 |
| **Could** | P001 实时协作 | 基础设施部分就绪，但 Firebase 配置待确认 |

---

## 2. 功能详情

### P001-S27: Real-time Collaboration

#### 用户故事

> 作为团队成员，当我和同事同时在同一个项目 Canvas 上工作时，我希望我的操作能实时同步到对方屏幕，这样我们不需要刷新页面就能看到彼此的编辑结果，从而实现真正的无缝协作。

**角色**: 团队成员 A 和 B
**行为**: 在同一 Canvas URL 下编辑节点内容
**收益**: 无需刷新页面，实时看到他人编辑，提升协作效率

#### 验收标准（可测试断言）

```
// P001-S27-AC1: 多人 Presence 可见性
expect(userA.movedCursor().throttled(100ms)).toEmit(
  userB.presenceAvatar.receivesPosition(userA.cursor.position)
);
// 延迟 < 2000ms

// P001-S27-AC2: Firebase 降级容错
expect(firebaseConfig.isEmpty()).toBe(true);
await usePresence({ projectId: 'test' });
// 不抛出异常，降级到 mock

// P001-S27-AC3: TS 类型安全
expect(compile(['usePresence.ts', 'presence.ts'])).toHaveErrors(0);

// P001-S27-AC4: E2E 集成验证
expect(runPlaywright('presence-mvp.spec.ts')).toPass();
```

#### 页面集成标注

```
页面: /canvas/[projectId]
涉及组件: PresenceLayer, CursorLayer, usePresence
API: Firebase RTDB (FIREBASE_DATABASE_URL)
状态: 未合并到 main（在 ts-fix-worktree 中）
依赖: Firebase 凭证配置（.env.staging）
```

#### DoD（Definition of Done）

- [ ] PresenceLayer 已合并到 main 并通过 Code Review
- [ ] `.env.staging` 已配置 Firebase 凭证，RTDB 可写入
- [ ] 实时节点同步功能已实现（Yjs CRDT 或 last-write-wins）
- [ ] `usePresence()` TS 编译 0 errors
- [ ] `presence-mvp.spec.ts` 在 staging 环境全部通过
- [ ] 多人同时编辑同一节点时，无数据覆盖（冲突处理已验证）

---

### P002-S27: 属性面板性能优化（Sprint 26 E5 Carry-over）

#### 用户故事

> 作为大型项目用户，当我打开一个有 300 个节点的项目时，我希望属性面板的响应时间小于 200ms，操作流畅不卡顿，这样我能在大型项目中高效工作而不感到沮丧。

**角色**: 大型项目用户（>200 节点）
**行为**: 打开属性面板、滚动属性列表、点击属性项
**收益**: 响应时间 < 200ms，操作流畅，提升大型项目使用体验

#### 验收标准（可测试断言）

```
// P002-S27-AC1: 属性面板渲染性能
const panel = render(<PropertyPanel projectId="large-project-300nodes" />);
await waitForIdle();
expect(performance.now() - startTime).toBeLessThan(200);

// P002-S27-AC2: TS 类型安全
expect(compile(['PropertyPanel.tsx', 'useMemo.ts'])).toHaveErrors(0);

// P002-S27-AC3: Lighthouse Performance Score
expect(runLighthouse('/canvas/large-project')).toHaveScore('performance', >= 85);

// P002-S27-AC4: 加载进度指示器
render(<PropertyPanel projectId="large-project-250nodes" loading={true} />);
expect(getByTestId('loading-spinner')).toBeVisible();
```

#### 页面集成标注

```
页面: /canvas/[projectId] → 属性面板（右侧）
涉及组件: PropertyPanel, PropertyList, react-window (FixedSizeList)
依赖: react-window 已引入
优化: React.memo + useMemo
```

#### DoD（Definition of Done）

- [ ] 属性面板引入 `react-window` FixedSizeList 虚拟化
- [ ] DOM 节点从 ~200 降至 ~20（可视区域）
- [ ] 所有属性列表组件添加 `React.memo` + `useMemo`
- [ ] 节点数 > 200 时，进度指示器可见
- [ ] 300 节点项目属性面板渲染时间 < 200ms（DevTools Performance 验证）
- [ ] Lighthouse Performance Score ≥ 85
- [ ] TS 编译 0 errors
- [ ] 滚动行为、选中状态与优化前一致（专项 QA 通过）

---

### P003-S27: AI-Assisted Requirements

#### 用户故事

> 作为新用户，当我在 Onboarding 的 ClarifyStep 输入"我想做一个登录功能，包括用户名密码和验证码"时，系统自动解析我的自然语言为结构化需求（角色、目标、约束），让我在跳转到 PreviewStep 时能立即看到最匹配的模板，从而快速完成项目创建。

**角色**: 新用户（Onboarding 流程中）
**行为**: 在 ClarifyStep 输入自然语言需求
**收益**: 自动获得结构化需求，无需手动填写，直接匹配最合适模板

#### 验收标准（可测试断言）

```
// P003-S27-AC1: AI 解析结果展示
fill('clarify-input', '我想做一个登录功能，包括用户名密码和验证码');
await click('submit-clarify');
expect(getByTestId('ai-parse-preview')).toBeVisible();
expect(parseResult).toContainKeys(['role', 'goal', 'constraints']);

// P003-S27-AC2: 用户可编辑确认
expect(getByRole('textbox', { name: 'role' })).toBeEnabled();
await click('confirm-parse');
// 跳转 PreviewStep

// P003-S27-AC3: 超时降级不阻断
await useFakeTimers();
fill('clarify-input', '我要登录');
await click('submit-clarify');
await wait(31000); // AI timeout
// 自动降级为纯文本，不抛出异常，跳转 PreviewStep

// P003-S27-AC4: TS 类型安全
expect(compile(['ClarifyStep.tsx', 'ClarifyAI.tsx'])).toHaveErrors(0);
```

#### 降级策略

```
降级条件:
- LLM API 响应 > 30s
- LLM API 返回错误（4xx/5xx）
- 无 LLM API Key 配置

降级行为:
- 不抛出异常，静默降级
- 将用户原始输入作为纯文本传递到 PreviewStep
- 不阻断 Onboarding 流程
- 在 UI 显示 "AI 解析超时，已使用原始输入" 提示（可选）

降级方案C（本地规则引擎）作为备选:
- 基于关键词 + 正则匹配
- 语义理解质量差，仅作为临时降级
```

#### 页面集成标注

```
页面: /onboarding/clarify-step (ClarifyStep)
涉及组件: ClarifyStep, ClarifyAI, AIParsePreview
API: /api/ai/clarify (POST)
依赖: LLM API Key（OpenAI GPT-4o-mini / Claude）
```

#### DoD（Definition of Done）

- [ ] ClarifyStep 集成 AI 解析能力（调用 `/api/ai/clarify`）
- [ ] 显示结构化 JSON 预览（role/goal/constraints 可读展示）
- [ ] 用户可编辑/确认解析结果后跳转 PreviewStep
- [ ] AI 超时 30s 自动降级为纯文本，不阻断 Onboarding
- [ ] 无 LLM API Key 时，显示引导提示（而非静默失败）
- [ ] TS 编译 0 errors
- [ ] UI 引导帮助用户写出高质量需求描述

---

### P004-S27: Template API 扩展

#### 用户故事

> 作为用户张三，当我完成一个项目后，我希望将其导出为 JSON 模板，分享给团队成员乙。乙 通过导入功能，将张三的模板加入自己的模板库，在创建新项目时能直接使用张三的模板，从而实现团队知识复用。

**角色**: 用户张三（模板创建者）、用户乙（模板消费者）
**行为**: 导出项目为模板 → 下载 JSON 文件 → 分享给团队成员 → 团队成员导入 JSON → 模板入库
**收益**: 团队知识复用，新项目创建时间大幅缩短

#### 验收标准（可测试断言）

```
// P004-S27-AC1: GET 模板列表
const res = await request(app).get('/api/v1/templates');
expect(res.status).toBe(200);
expect(res.body.templates.length).toBeGreaterThanOrEqual(3);

// P004-S27-AC2: POST 创建模板
const createRes = await request(app)
  .post('/api/v1/templates')
  .send({ name: 'My Template', nodes: [], schema: {} });
expect(createRes.status).toBe(201);
expect(createRes.body.id).toBeDefined();
const getRes = await request(app).get(`/api/v1/templates/${createRes.body.id}`);
expect(getRes.status).toBe(200);

// P004-S27-AC3: PUT 更新模板
const updateRes = await request(app)
  .put(`/api/v1/templates/${templateId}`)
  .send({ name: 'Updated Template' });
expect(updateRes.status).toBe(200);
expect(updateRes.body.name).toBe('Updated Template');

// P004-S27-AC4: DELETE 删除模板
const delRes = await request(app).delete(`/api/v1/templates/${templateId}`);
expect(delRes.status).toBe(200);
const getDelRes = await request(app).get(`/api/v1/templates/${templateId}`);
expect(getDelRes.status).toBe(404);

// P004-S27-AC5: Dashboard UI 可访问
page.goto('/dashboard/templates');
expect(page.locator('[data-testid="template-list"]')).toBeVisible();
expect(page.locator('button:has-text("新建")')).toBeEnabled();
```

#### 页面集成标注

```
页面: /dashboard/templates (NEW)
涉及组件: TemplateList, TemplateCard, TemplateForm
API: /api/v1/templates (GET/POST/PUT/DELETE)
导出: GET /api/v1/templates/:id/export → JSON 文件下载
导入: POST /api/v1/templates/import (multipart/form-data)
```

#### DoD（Definition of Done）

- [ ] `GET /api/v1/templates` 返回 200，数组长度 ≥ 3（内置模板）
- [ ] `POST /api/v1/templates` 返回 201，创建后可 GET 到
- [ ] `PUT /api/v1/templates/:id` 返回 200，字段更新生效
- [ ] `DELETE /api/v1/templates/:id` 返回 200，再次 GET → 404
- [ ] 模板导出生成 JSON 文件，可下载
- [ ] 模板导入解析 JSON，校验 schema，POST 创建
- [ ] `/dashboard/templates` 页面可访问，有列表 + 新建按钮
- [ ] TS 编译 0 errors

---

## 3. 依赖关系图

```
P003-S27 (AI辅助)
    ↓ 依赖 useTemplates()
P004-S27 (模板API扩展)
    ↓ 依赖 /api/v1/templates

P001-S27 (实时协作)
    ↓ 依赖 PresenceLayer 已合并
    ↓ 依赖 Firebase 凭证配置

P002-S27 (属性面板性能)
    ↓ 无依赖，可独立执行
```

**关键依赖链**:

1. P001 → Firebase 凭证配置（coord + DevOps 介入）
2. P001 → PresenceLayer 从 ts-fix-worktree 合并到 main
3. P003 → LLM API Key 配置（coord 介入）
4. P003 → useTemplates hook（Sprint 25 E1 已有）
5. P004 → /api/v1/templates GET 已存在（仅补充写操作）

---

## 4. 风险登记册

| ID | 功能 | 风险描述 | 影响 | 概率 | 缓解措施 | 状态 |
|----|------|---------|------|------|---------|------|
| R1 | P001 | Firebase 凭证申请/配置需 Coord + DevOps | 高 | 高 | Sprint 27 启动前完成 Firebase 配置 | ⚠️ 待确认 |
| R2 | P001 | worktree 合并可能与 main 有冲突 | 中 | 中 | 尽早合并，隔离测试 | ⚠️ 待确认 |
| R3 | P001 | 多人同时编辑无 CRDT 可能产生覆盖 | 高 | 高 | 采用 Yjs CRDT 或 last-write-wins | 🔴 核心风险 |
| R4 | P003 | LLM API 成本不可预测 | 中 | 中 | 设置 usage limit，降级到规则引擎 | 🟡 可控 |
| R5 | P002 | react-window 可能破坏滚动/选中状态 | 中 | 低 | 分支 PR + 专项 QA | 🟢 可控 |
| R6 | P003 | 用户输入质量差异大，AI 解析失败率高 | 中 | 中 | 提供 UI 引导 + 降级到手动输入 | 🟢 可控 |
| R7 | P004 | 模板 JSON schema 变化导致导入失败 | 低 | 低 | 版本化 schema + 校验 | 🟢 可控 |

---

## 5. 总体 DoD（Definition of Done）

### Sprint 完成标准

- [ ] 所有 4 个功能的验收标准全部通过
- [ ] 每个功能的 DoD 清单全部勾选
- [ ] TS 编译 0 errors（全项目）
- [ ] E2E 测试覆盖所有新功能路径
- [ ] PRD 文档已更新，包含所有功能验收标准

### 交付物清单

| 交付物 | 路径 | 负责人 |
|--------|------|--------|
| PRD 文档 | docs/vibex-proposals-sprint27/prd.md | PM |
| 架构设计 | docs/vibex-proposals-sprint27/architecture.md | Architect |
| 执行计划 | docs/vibex-proposals-sprint27/IMPLEMENTATION_PLAN.md | Architect |
| 决策记录 | task vibex-proposals-sprint27 coord-decision done | Coord |

### Sprint 预估工期

| 功能 | 预估工时 | 依赖 |
|------|---------|------|
| P001-S27 | 6-8h | Firebase 凭证 + worktree 合并 |
| P002-S27 | 3h | 无 |
| P003-S27 | 3h | LLM API Key |
| P004-S27 | 3h | 无 |
| **总计** | **15-17h** | 2人 Sprint 60h，**可行** |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-sprint27
- **执行日期**: 2026-05-07（待 Coord 确认启动）