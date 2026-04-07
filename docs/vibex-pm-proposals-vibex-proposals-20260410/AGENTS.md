# VibeX PM Proposals 2026-04-10 — Agent Roles & Responsibilities

> **文档版本**: v1.0
> **作者**: Architect Agent
> **日期**: 2026-04-10
> **状态**: Draft
> **工作目录**: /root/.openclaw/vibex

---

## 1. Agent 角色总览

| Agent | 职责范围 | 核心任务 | 汇报对象 |
|-------|---------|---------|---------|
| **Dev** | 编码实现、测试编写 | 4 个 Sprint 的功能开发 | PM |
| **Reviewer** | 代码审查、质量把关 | PR Review、E2E 测试验证 | PM |
| **PM** | 项目管理、干系人对齐 | 排期、验收、指标追踪 | Coord |
| **Coord** | 任务调度、进度协调 | 任务分发、状态同步 | — |

---

## 2. Dev Agent

### 2.1 职责

- 按 Sprint 计划实现所有 Epic 和 Story
- 编写 E2E 测试（Playwright，断言直接来自 PRD Section 4）
- 编写单元测试（覆盖率 > 70%）
- 更新 API 文档（新增接口）
- 记录技术债务（ADR）

### 2.2 Sprint 任务分配

#### Sprint 1（E01 + E02）

| Story | 任务 | 产出 | 验收标准 |
|-------|------|------|---------|
| E01-S1 | 模板存储结构 | `/data/templates/*.json` | 模板字段完整 |
| E01-S2 | 模板库页面 | `/app/templates/page.tsx` | AC-001 |
| E01-S3 | 模板选择与填充 | `/app/page.tsx` 增强 | AC-002 |
| E02-S1 | 引导步骤配置 | `/config/onboarding-steps.ts` | 步骤可配置 |
| E02-S2 | Overlay 引导组件 | `/components/Onboarding*.tsx` | AC-003 |
| E02-S3 | 引导状态持久化 | `/hooks/useOnboardingStatus.ts` | AC-004 |
| E02-S4 | 引导完成流程 | `/app/dashboard/page.tsx` 增强 | AC-003+AC-004 |

**完成标准**: 所有 E01/E02 测试通过 → 通知 Reviewer review

#### Sprint 2（E03 + E04）

| Story | 任务 | 产出 | 验收标准 |
|-------|------|------|---------|
| E03-S1 | 关键词检测引擎 | `/services/keyword-detector.ts` | AC-005 |
| E03-S2 | 追问气泡 UI | `/components/SmartHintBubble.tsx` | AC-006 |
| E03-S3 | 多轮澄清逻辑 | `/hooks/useClarificationContext.ts` | 多轮追问可用 |
| E04-S1 | 搜索栏组件 | `/components/ProjectSearchBar.tsx` | 搜索栏可用 |
| E04-S2 | 过滤逻辑实现 | `/app/api/v1/projects/search/route.ts` | AC-007 |
| E04-S3 | 分类视图 | `/components/ProjectFilter.tsx` | 分类视图可用 |

**完成标准**: `/api/v1/keyword-detect` 响应 < 1s，`/api/v1/projects/search` 响应 < 200ms

#### Sprint 3（E05 + E06）

| Story | 任务 | 产出 | 验收标准 |
|-------|------|------|---------|
| E05-S1 | 团队创建 API + 页面 | `/api/v1/teams/route.ts` | AC-008 |
| E05-S2 | 成员邀请与权限 | `/api/v1/teams/[id]/invite/route.ts` | AC-009 |
| E05-S3 | 项目共享管理 | `/api/v1/projects/[id]/share/route.ts` | AC-009 |
| E05-S4 | 协作状态展示 | `/components/TeamMembersList.tsx` | 成员列表可用 |
| E06-S1 | 版本快照生成 | `/api/v1/versions/route.ts` POST | AC-010 |
| E06-S2 | 版本历史列表 | `/api/v1/versions/route.ts` GET | AC-010 |
| E06-S3 | 版本对比视图 | `/components/DiffViewer.tsx` | AC-011 |

**完成标准**: E05/E06 所有 E2E 测试通过，协作功能无权限漏洞

#### Sprint 4（E07 ~ E10）

| Epic | 任务 | 产出 | 验收标准 |
|------|------|------|---------|
| E07 | 快捷键系统 | `/components/Shortcut*.tsx` | AC-012 |
| E08 | 离线模式 | `/components/OfflineBanner.tsx` | AC-013 |
| E09 | 导入导出 | `/components/ImportModal.tsx`, `ExportModal.tsx` | AC-014 |
| E10 | AI 评分 | `/components/StarRating.tsx`, `/api/v1/ratings` | AC-015 |

**完成标准**: 所有 E2E 测试通过，覆盖率 > 70%

### 2.3 协作规范

- **PR 频率**: 每个 Story 完成后开 PR，不合并 blocking 其他 Story 的 PR
- **Commit 规范**: `feat(E01-S2): add template library page`
- **测试优先**: 先写测试，再写实现（TDD 风格）
- **Code Review 请求**: 每个 PR 需 @reviewer review

---

## 3. Reviewer Agent

### 3.1 职责

- Code Review：逻辑正确性、边界处理、安全漏洞
- E2E 测试验证：确认 PRD assertions 全部覆盖
- Accessibility 审查：确保无新增 a11y 问题
- Lighthouse 审查：Performance Score > 80

### 3.2 Review Checklist

#### 代码审查

- [ ] 逻辑错误：状态管理、异步处理、错误传播
- [ ] 边界情况：空数据、超长输入、并发写入
- [ ] 安全：输入校验（Zod）、权限检查（viewer 不能写）
- [ ] 性能：KV 操作批量化、无 N+1 查询
- [ ] 命名：意图清晰，无误导性命名

#### E2E 测试审查

| Epic | 必须覆盖的断言（来自 PRD） |
|------|--------------------------|
| E01 | `expect(page.locator('.template-card').count()).toBeGreaterThanOrEqual(3)` |
| E01 | 点击模板后 `#requirement-input` 填充 |
| E02 | `expect(page.locator('.onboarding-step').count()).toBeLessThanOrEqual(4)` |
| E02 | 跳过引导后刷新不重复 |
| E03 | `expect(page.locator('.smart-hint-bubble')).toBeVisible({ timeout: 1000 })` |
| E04 | `expect(Date.now() - start).toBeLessThan(200)` |
| E05 | viewer 角色 `#edit-btn` disabled |
| E06 | `.diff-highlight-add` 和 `.diff-highlight-remove` 可见 |
| E07 | `Ctrl+/` 触发快捷键面板，`.shortcut-item` ≥ 3 |
| E08 | 离线时 `.offline-banner` 可见 |
| E09 | Markdown 文件导入后 `#requirement-input` 有内容 |
| E10 | 评分提交后 `.rating-success` 可见 |

#### 审查反馈处理

- **P0 问题**: 阻塞合并，要求立即修复
- **P1 问题**: 要求修复，可在下一 PR 迭代
- **P2 问题**: 建议性改进，登记为技术债务

---

## 4. PM Agent

### 4.1 职责

- Sprint 计划制定与执行监控
- 干系人对齐（功能优先级、范围变更）
- 成功指标追踪（新用户引导完成率、AI 质量评分等）
- 风险识别与升级
- 验收标准确认（DoD Checklist）

### 4.2 Sprint 管理

#### Sprint Planning（每 Sprint 开始前）

**输入**: PRD、Architecture、Implementation Plan
**输出**: Sprint Goal、任务分配、时间线

**会议议程**（30 分钟）:
1. 回顾上 Sprint 完成情况（Retrospective）
2. 确定本 Sprint Goal
3. 拆分任务到人
4. 识别 blockers 和依赖

#### Sprint Tracking（每日）

| 指标 | 测量方式 | 目标 |
|------|---------|------|
| Story 完成率 | 已完成 Story / 总 Story | > 80% |
| Blocked 时间 | blocked 时间 / Sprint 总时间 | < 10% |
| Bug 发现率 | P0/P1 Bug 数 | 0 |

**状态更新格式**（@coord）:
```
📊 Sprint 1 进度: 4/7 Stories (57%)
🔄 E01-S2 模板库页面 → Code Review 中
⚠️ E02-S2 引导组件 → 等待 designer 确认 UI → blocked
```

#### Sprint Review（每 Sprint 结束后）

**产出**: Sprint Report

| Sprint | 计划工时 | 实际工时 | 完成率 | 未完成项 |
|--------|---------|---------|--------|---------|
| Sprint 1 | 6h | ? | ? | — |
| Sprint 2 | 6h | — | — | — |
| Sprint 3 | 8h | — | — | — |
| Sprint 4 | 4h | — | — | — |

### 4.3 干系人对齐

#### 功能变更管理

| 变更类型 | 处理方式 |
|---------|---------|
| 范围缩减（移出 Story） | PM 决策，记录变更原因 |
| 范围扩充（新增 Story） | 评估工时，影响 Sprint 则推迟 |
| 验收标准调整 | 需 PRD 更新，Reviewer 确认 |

#### Stakeholder 沟通

| Stakeholder | 关注点 | 沟通频率 | 格式 |
|-------------|--------|---------|------|
| 项目经理 | 进度、风险 | 每日 | Sprint Tracking |
| 设计师 | UI/UX 方案 | Sprint 1/2 开始前 | 设计评审 |
| 测试团队 | E2E 测试计划 | Sprint 3 开始前 | 测试计划 |

### 4.4 成功指标追踪

| 指标 | 当前基线 | Sprint 4 目标 | 测量方式 |
|------|---------|--------------|---------|
| 新用户首次引导完成率 | N/A | > 70% | 引导完成事件埋点 |
| AI 生成质量评分 | 3.0/5 | 4.0/5 | 用户反馈评分 |
| 项目搜索响应时间 | N/A | < 200ms | DevTools Network |
| 团队协作功能可用率 | 0% | 100% | 功能可用性测试 |
| 版本对比功能使用率 | N/A | > 40% | 功能点击埋点 |

**数据收集计划**:
- Sprint 1 结束后：上线引导完成率埋点
- Sprint 2 结束后：上线搜索响应时间埋点
- Sprint 3 结束后：上线协作功能可用性测试 + 版本使用埋点
- Sprint 4 结束后：汇总所有指标，输出最终报告

---

## 5. Coord Agent

### 5.1 职责

- 任务派发与状态同步
- 跨 Agent 协调（Dev ↔ Reviewer ↔ PM）
- Blocked 任务升级
- 项目健康度监控

### 5.2 任务派发规则

| 触发条件 | 动作 |
|---------|------|
| Sprint 1 开始 | 派发 E01 + E02 给 Dev |
| E01-S1 完成 | 派发 E01-S2 给 Dev |
| Sprint 2 开始 | 派发 E03 + E04 给 Dev |
| PR 创建 | 派发 Code Review 给 Reviewer |
| Sprint 结束 | 派发 Sprint Report 任务给 PM |

### 5.3 协调流程

```
Dev 完成 Story → 通知 Reviewer review → Reviewer 通过 → 
通知 PM 验收 → PM 确认 DoD → 通知 Coord 更新状态
```

### 5.4 异常处理

| 场景 | 处理方式 |
|------|---------|
| Dev blocked > 30min | 升级给 PM，协调资源 |
| Reviewer 提出 P0 问题 | Dev 优先修复 |
| Sprint 目标可能延期 | PM 评估范围，决策是否缩减 |
| 跨 Sprint 依赖冲突 | PM 协调，Coord 调整任务顺序 |

---

## 6. Communication Protocol

### 6.1 Channel Structure

| Channel | 用途 | 参与者 |
|---------|------|--------|
| #dev | 日常开发、代码问题 | Dev |
| #review | PR 审查、测试结果 | Dev, Reviewer |
| #pm | Sprint 状态、指标、风险 | PM, Coord |
| #coord | 任务派发、进度同步 | Coord, 所有 Agent |

### 6.2 Meeting Cadence

| 会议 | 频率 | 时长 | 参与者 |
|------|------|------|--------|
| Sprint Planning | Sprint 开始时 | 30min | PM, Dev, Reviewer |
| Daily Standup | 每日 | 15min | Dev, PM |
| Code Review | PR 创建时 | — | Dev, Reviewer |
| Sprint Review | Sprint 结束时 | 30min | PM, Dev, Reviewer |

### 6.3 Escalation Path

```
Dev → PM → Coord → 项目经理
       ↑         ↑
  技术决策    资源协调
```

---

## 7. Definition of Done（总览）

### 功能完成标准

- [ ] 所有 Story 实现代码已合并至 `main` 分支
- [ ] 对应 Epic 的 E2E 测试全部通过（assertions 覆盖）
- [ ] 功能验收标准（AC-001 ~ AC-015）100% 通过
- [ ] Code Review 已通过
- [ ] 无 P0/P1 级别 Bug 遗留

### 文档完成标准

- [ ] Epic Spec 文档已创建并 review 通过
- [ ] API 接口文档（如有）已更新
- [ ] 用户使用文档（如有）已更新

### 质量完成标准

- [ ] 新功能代码覆盖率 > 70%
- [ ] Lighthouse Performance Score > 80
- [ ] 无新增 console.error
- [ ] 无新增 accessibility 问题

---

## 8. Out of Scope（明确不做的）

| 范围项 | 排除原因 | 后续规划 |
|--------|---------|---------|
| 用户自定义模板提交 | 需求模板库 P001 方案 B | 独立 Feature |
| 复杂权限体系（行级权限） | P005 方案 B | 独立 Feature |
| 移动端支持 | 本期仅 Web | 独立 Roadmap |
| AI 模型训练/微调 | 本期仅使用层面 | 独立 AI 项目 |
| 实时光标 | E05-S4 MVP 跳过 | Sprint 5+ |
| 版本数量上限（50 个） | Sprint 3 实现 | 技术债务项 |

---

## 执行决策

| 决策 | 状态 | 执行项目 | 日期 |
|------|------|---------|------|
| Agent 角色分工：Dev/Reviewer/PM/Coord | **已采纳** | vibex-proposals-20260410 | 2026-04-10 |
| Sprint 评审节奏：每 Sprint 结束 Review | **已采纳** | vibex-proposals-20260410 | 2026-04-10 |
| Blocked 升级阈值：30min | **已采纳** | vibex-proposals-20260410 | 2026-04-10 |
| E05-S4 实时光标 MVP 跳过 | **已采纳** | vibex-proposals-20260410 | 2026-04-10 |

