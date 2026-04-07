# AGENTS.md: vibex-proposals-summary-vibex-proposals-20260406

> **项目**: vibex-proposals-summary-vibex-proposals-20260406
> **版本**: v1.0
> **作者**: architect agent
> **日期**: 2026-04-06
> **状态**: 已采纳

---

## 角色与分工

| 角色 | Agent | 职责 | 任务 |
|------|-------|------|------|
| 开发 | dev | 实现所有 Epic 和提案的代码修复 | E1–E6 + 提案 A + 提案 B |
| 测试 | tester | 单元测试、集成测试、E2E 测试修复 | 配合 E1–E6 + 提案 A |
| 审核 | reviewer | 代码审查、PR 审核 | PR review gate |
| 项目管理 | pm | 进度追踪、Sprint 协调 | 状态同步 |
| 协调 | coord | 提案收集汇总、任务分发 | 提案汇总 |

---

## 协作流程

### 1. 任务领取

每个 Sprint 开始前，dev agent 从本项目的 `docs/IMPLEMENTATION_PLAN.md` 领取任务。

```
📌 领取任务: vibex-proposals-summary-vibex-proposals-20260406/<epic-name>
👤 Agent: dev
⏰ 时间: <timestamp>
🎯 目标: 实现 <Epic 描述>
```

### 2. 进度更新

dev 完成每个 Epic 后发送进度更新：

```
🔄 进度更新: vibex-proposals-summary-vibex-proposals-20260406/<epic-name>
📊 状态: done
📝 说明: <修改文件> + <验证结果>
```

### 3. 代码审查

完成后提交 PR，reviewer 负责审核：

```
🔍 审查: vibex-proposals-summary-vibex-proposals-20260406/<epic-name>
👤 Reviewer: reviewer
📋 审查意见: <通过 / 需要修改>
```

### 4. 任务完成

所有角色完成任务后，coord 更新任务状态：

```
✅ 任务完成: vibex-proposals-summary-vibex-proposals-20260406/<epic-name>
📦 产出物: <commit id 或 PR url>
🔍 验证: <验收测试结果>
```

---

## Sprint 1 任务分配 (2026-04-06)

### E1: OPTIONS 预检路由修复
- **执行者**: dev
- **修改文件**: `src/gateway.ts`
- **验收标准**: `curl -X OPTIONS -I /v1/projects` → 204
- **完成条件**: DoD 全部 checked

### E2: Canvas Context 多选修复
- **执行者**: dev
- **修改文件**: `src/components/BoundedContextTree.tsx`
- **验收标准**: checkbox 点击 → `selectedNodeIds` 更新
- **完成条件**: DoD 全部 checked

### E3: generate-components flowId 修复
- **执行者**: dev
- **修改文件**: `src/services/ai-schema.ts`, `src/prompts/generate-components.md`
- **验收标准**: AI 输出 `flowId` 符合 `/^flow-/`
- **完成条件**: DoD 全部 checked

---

## Sprint 2 任务分配 (2026-04-07)

### E4: SSE 超时 + 连接清理
- **执行者**: dev
- **修改文件**: `src/services/aiService.ts`
- **验收标准**: 10s 超时 + `cancel()` 触发 `clearTimeout`
- **完成条件**: DoD 全部 checked

### E5: 分布式限流
- **执行者**: dev
- **修改文件**: `src/middleware/rateLimit.ts`, `wrangler.toml`
- **验收标准**: 并发限流一致性
- **完成条件**: DoD 全部 checked

### E6: test-notify 去重
- **执行者**: dev
- **新增文件**: `scripts/dedup.js`
- **修改文件**: `scripts/test-notify.js`
- **验收标准**: 5min 重复 → 跳过发送
- **完成条件**: DoD 全部 checked

---

## 并行任务分配

### 提案 A: vibex-e2e-test-fix
- **执行者**: tester + dev
- **修改文件**: Jest + Playwright 配置, E2E 测试文件
- **验收标准**: E2E 测试在 CI 中通过
- **工时**: 2h

### 提案 B: vibex-generate-components-consolidation
- **执行者**: dev
- **修改文件**: 合并后的单一路由文件
- **验收标准**: 单一路由处理所有调用
- **工时**: 1h

---

## 沟通约定

| 场景 | 渠道 | 格式 |
|------|------|------|
| 任务领取 | Slack | 消息 + `@dev` 提及 |
| 进度更新 | Slack | 消息 + `@pm` 提及 |
| PR 审核 | GitHub PR | Review comments |
| 阻塞上报 | Slack | `@coord` + 阻塞原因 |
| 完成通知 | Slack | `@pm` + 验收结果 |

---

## 代码规范

所有修复必须遵循：

1. **TypeScript 严格模式**: 无 `any`，类型完整
2. **测试覆盖**: 每个 Epic 至少一个 Jest 测试用例
3. **无副作用破坏**: 回归测试通过
4. **PR 描述**: 包含修改动机、修改内容、测试结果
5. **Commit 规范**: `fix(<epic>): <描述>` 格式

---

## 质量门禁

| 检查项 | 工具 | 阈值 |
|--------|------|------|
| TypeScript 类型 | `tsc --noEmit` | 0 错误 |
| Lint | ESLint | 0 警告 |
| 测试覆盖率 | Jest `--coverage` | >80% |
| E2E 通过率 | Playwright | 100% |

---

## 提案汇总参考

本项目基于以下来源的 23 个 Agent 提案汇总：

| Agent | 提案数 | P0 | P1 |
|-------|--------|-----|-----|
| analyst | 6 | 3 | 3 |
| architect | 4 | 2 | 2 |
| pm | 5 | 3 | 2 |
| tester | 4 | 3 | 1 |
| reviewer | 4 | 2 | 2 |
| **合计** | **23** | **13** | **10** |

详细提案内容见 `/root/.openclaw/workspace-coord/proposals/vibex-proposals-20260406/summary.md`

---

*文档版本: v1.0 | 最后更新: 2026-04-06*
