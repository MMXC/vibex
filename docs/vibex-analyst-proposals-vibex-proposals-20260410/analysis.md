# Requirements Analysis: Vibex Analyst Proposals 2026-04-10

**Project**: vibex-analyst-proposals-vibex-proposals-20260410
**Author**: Analyst
**Date**: 2026-04-10
**Status**: Requirements analyzed, proposals drafted

---

## 1. Business Scenario Analysis

### 1.1 Context

Vibex is a DDD modeling + prototype generation platform. The 2026-04-09 sprint (E1-E6: Backend data integrity + KV migration) completed successfully, resolving critical concurrency and deployment stability issues. However, **proposal execution debt** from 2026-04-06 through 2026-04-08 has accumulated, blocking team velocity.

### 1.2 Critical Business Flows at Risk

```
用户流程                          技术依赖                当前状态
─────────────────────────────────────────────────────────────────────
DDD建模 → AI生成三树 → 编辑确认
                            → Canvas API           ✅ OPTIONS已修
                            → generate-components   ⚠️ flowId未验证
                                    
画布编辑 → 快照保存/恢复
                            → Snapshot CRUD API    ⚠️ 双后端不一致
                            → KV persistence        ✅ E4已完成
                                    
团队协作 → 实时同步
                            → CollaborationService ✅ E1已修复
                            → Rate limiting         ⚠️ 仍pending

发布流程 → Git push → CI/CD
                            → secret scanning      ❌ P0 blocker!
                            → ESLint/TS types       ⚠️ 仍pending
```

### 1.3 Proposal Execution Debt Summary

| Sprint | 日期 | 提案数 | 已完成 | 待处理 | 积压率 |
|--------|------|--------|--------|--------|--------|
| 2026-04-06 | 4/06 | 5 (P0×3,P1×2) | 0 | 5 | 100% |
| 2026-04-07 | 4/07 | 3 | 0 | 3 | 100% |
| 2026-04-08 | 4/08 | 5 | 1 (vitest) | 4 | 80% |
| 2026-04-09 | 4/09 | 6 Epic | 6 | 0 | 0% |
| **合计** | | **19** | **7** | **12** | **63%** |

**Key Insight**: 提案执行率 63%，P0 项积压 2 个（A-P0-1 GitHub secret scanning、A-P0-2 ESLint any），直接影响团队日常协作和 TypeScript 代码质量。

### 1.4 Stakeholder Impact

| 角色 | 受影响提案 | 影响描述 |
|------|-----------|---------|
| Dev (所有人) | A-P0-1 | 修改 task_manager.py 时无法 push，严重阻塞协作 |
| Dev | A-P0-2 | `any` 类型蔓延导致重构风险不可评估 |
| QA | A-P0-3 | AI 生成组件归属错误，版本历史数据损坏 |
| PM | A-P1-4 | 提案追踪形同虚设，Sprint 规划失公信力 |
| 全团队 | A-P2-2 | 重复 review 浪费算力，评审质量下降 |

---

## 2. Technical Options

### Option A: 集中 Sprint 清债（推荐）

**思路**: 用一个 Sprint 集中处理所有积压提案（2026-04-10 ~ 2026-04-12，2天）

**实施计划**:

| 阶段 | 时长 | 任务 | 负责人 |
|------|------|------|--------|
| Phase 1 | 1h | A-P0-1: Slack token 迁移到环境变量 | Dev |
| Phase 2 | 2h | A-P0-2: ESLint no-explicit-any 清理 | Dev |
| Phase 3 | 1h | A-P0-3: generate-components flowId E2E 验证 | Tester |
| Phase 4 | 2h | A-P1-1: Tree 组件按钮统一 | Dev |
| Phase 5 | 1h | A-P1-2: selectedNodeIds 类型统一 | Dev |
| Phase 6 | 1h | A-P1-3: componentStore 批量方法 | Dev |
| Phase 7 | 1h | A-P1-4: proposal-tracker update 子命令 | Dev |

**总工时**: 9h（可在 2 天内完成）

**Pros**: 
- 一次性清债，团队轻装上阵
- 提案追踪机制从此可用
- TypeScript 类型安全基线建立

**Cons**: 
- 需要全员参与，2 天内无其他 feature 开发
- 测试验证时间被压缩

---

### Option B: 分流渐进处理（保守方案）

**思路**: 将提案分配到未来 3 个 Sprint 中，逐步落地

**实施计划**:

| Sprint | 日期 | 任务 |
|--------|------|------|
| Sprint A | 2026-04-10 | A-P0-1 (P0 blocker) + A-P0-2 |
| Sprint B | 2026-04-13 | A-P0-3 + A-P1-1 + A-P1-2 |
| Sprint C | 2026-04-16 | A-P1-3 + A-P1-4 + A-P2-1 + A-P2-2 |

**Pros**:
- 不影响当前 feature 开发节奏
- 风险分散，单次失败影响小

**Cons**:
- P0 blocker (A-P0-1) 仍阻塞团队 3 天
- TypeScript 债务持续累积
- 提案追踪士气问题持续存在

---

## 3. Preliminary Risks

| 风险 | 等级 | 描述 | 缓解措施 |
|------|------|------|---------|
| Option A 人力不足 | 中 | 2 天 Sprint 需要全员参与，若有人缺席则计划失败 | 提前沟通，明确 2 天为清债冲刺 |
| A-P0-2 `any` 清理范围超出预期 | 高 | 9 个文件可能只是冰山一角，遗留 `any` 达数十个 | 先用 `tsc --noEmit` 精确统计，再决定是否全清或只清新增 |
| A-P0-1 环境变量迁移破坏 CI/CD | 高 | `.env` 注入缺失导致 Slack 通知全挂 | 迁移前在 staging 验证，确认 CI/CD secret 注入正常 |
| A-P1-1 Tree 按钮统一破坏现有功能 | 中 | 按钮重构可能引入点击行为变化 | 按钮统一只改样式，不改 onClick 逻辑；补充 Playwright E2E |
| Option B P0 blocker 持续 3 天 | 高 | A-P0-1 阻塞团队日常开发 | **强烈建议选 Option A**，P0 blocker 不可接受 |
| A-P1-2 selectedNodeIds 类型修改影响面广 | 中 | canvasStore 和 treeStore 均有引用，修改可能引发运行时错误 | 使用 TypeScript strict 模式 + 逐个文件增量修改 |

---

## 4. Acceptance Criteria

### 通用验收（所有提案）

- [ ] 每个提案修复后，相关测试用例通过
- [ ] `git push` 成功，无 secret scanning 阻断
- [ ] `pnpm test` 全量通过

### A-P0-1: GitHub Secret Scanning 修复

- [ ] `grep -r "xoxp-" scripts/task_manager.py` 返回空
- [ ] 修改 task_manager.py 后 `git push` 成功（secret scanning 不阻断）
- [ ] `.env.example` 包含 `SLACK_TOKEN=` 行

### A-P0-2: ESLint no-explicit-any 清理

- [ ] `npx tsc --noEmit` 无 `any` 相关错误（排除 `@ts-ignore`）
- [ ] `pnpm lint` 通过（含 `no-explicit-any` 规则）

### A-P0-3: generate-components flowId 验证

- [ ] `tests/e2e/generate-components-flowid.test.ts` 存在且通过
- [ ] `canvasApi.generateComponents({ flowId })` 返回的组件 flowId 100% 正确
- [ ] Canvas 组件面板中，组件归属正确的 Flow 节点（gstack 截图验证）

### A-P1-1: Tree 组件按钮统一

- [ ] 三种 Tree（Context/Flow/Component）共用同一 Button 组件
- [ ] `pnpm test` 通过（按钮行为不变）
- [ ] Playwright E2E: 点击各 Tree 按钮，行为正确

### A-P1-2: selectedNodeIds 类型统一

- [ ] `selectedNodeIds` 只在 `treeStore` 定义
- [ ] 类型为 `Set<string>`
- [ ] `pnpm test` 通过（无类型错误）

### A-P1-3: componentStore 批量方法

- [ ] `componentStore.addComponents([])` 方法存在
- [ ] `componentStore.removeComponents([])` 方法存在
- [ ] 100 组件批量添加 < 100ms（性能测试通过）

### A-P1-4: proposal-tracker update 命令

- [ ] `python3 scripts/proposal_tracker.py update <id> done` 可执行且成功
- [ ] TRACKING.md 中对应提案状态更新为 `done`
- [ ] CLI 有帮助信息 `proposal_tracker.py --help`

### A-P2-1: ComponentRegistry HMR 支持

- [ ] 新增组件到 `vibexCanvasCatalog` 后，JsonRenderPreview 无需重启可见
- [ ] 文档说明如何注册新组件

### A-P2-2: Reviewer 任务去重

- [ ] team-tasks 中同一 PR ID 不出现多个 `status=pending` 的 review 任务
- [ ] Coord heartbeat 扫描时检测并拒绝重复派发

---

## 5. Recommendations

### 立即执行（今天）

1. **A-P0-1 (GitHub secret scanning)**: 立即迁移 `xoxp-` token 到环境变量，阻塞全团队 push，优先级高于一切。
2. **创建 Sprint 清债任务**: 向 Coord 提议 Option A（2 天冲刺），P0 blocker 不可再等。

### 本周完成

3. **A-P0-2 (ESLint any)**: 用 `tsc --noEmit` 精确统计范围后决定清理粒度。
4. **A-P0-3 (flowId 验证)**: 补充 E2E 测试，现有修复无回归保障。

### 下周规划

5. **A-P1-1 ~ A-P1-4**: UI 一致性 + 提案追踪 CLI 完善，4 项可并行。
6. **A-P2-1 ~ A-P2-2**: 长期技术债务 + 流程改进，可排入下周一 Sprint。

---

## 6. Open Questions

| # | 问题 | 负责人 | 回答 |
|---|------|--------|------|
| Q1 | A-P0-2 any 清理范围：只清理新增 any 还是全量清理？ | Dev | 待确认 |
| Q2 | A-P0-1 迁移后 CI/CD 如何注入 SLACK_TOKEN？ | Dev + Ops | 待确认 |
| Q3 | Option A Sprint 是否需要暂停当前 feature 开发？ | Coord | 待确认 |
| Q4 | A-P1-2 selectedNodeIds 统一到 treeStore 是否影响 canvasStore 现有逻辑？ | Dev | 待确认 |

---

*Analyst — 2026-04-10*
