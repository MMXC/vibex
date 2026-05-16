# VibeX Sprint 37 — Agent 分工文档

**Agent**: architect
**日期**: 2026-05-17
**项目**: vibex-proposals-sprint37

---

## Agent 角色定义

### 1. Architect

**职责**: 架构设计、技术选型、接口定义、风险评估

**产出**:
- `architecture.md` — 本文档
- `IMPLEMENTATION_PLAN.md` — Epic 拆分与 stage 定义
- 本文档 `AGENTS.md`

**触发**: Sprint 37 Kickoff，由 Team Lead / Coordinator 发起

---

### 2. Dev Agent

**职责**: 功能代码实现、单元测试、CHANGELOG.md 更新

**工作区**: `/root/.openclaw/vibex`

**每个 Epic 的任务**:
1. 阅读 Epic 相关的 PRD/Architecture 章节
2. 检出/创建分支 (`epic/<feature>-<description>`)
3. 实现代码
4. 编写单元测试（覆盖率 > 80%，hooks/stores）
5. 更新 CHANGELOG.md（格式参考 `CHANGELOG_CONVENTION.md`）
6. 提交并 push 到远程
7. 向 Coordinator 报告 dev 阶段完成

**Code Style**:
- TypeScript strict mode
- CSS Modules（`.module.css`），禁止内联 `style={{}}`
- ESLint + Prettier 自动格式化
- 使用现有 Zustand store 模式（参考 `vibex-fronted/src/stores/`）
- 组件优先使用 CSS variables（`design-tokens.css`）

**CHANGELOG 更新规范**:
```markdown
## [Epic <编号>] <Epic 名称> (<YYYY-MM-DD>)

- <变更点 1>
- <变更点 2>

类型: <feat|fix|refactor|docs|test|chore>
影响: <组件或 API 路由>
```

**Dev 自检清单**（提交前必做）:
- [ ] `pnpm lint` 通过
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] CHANGELOG.md 已更新
- [ ] `grep -rn "style={{" src/ --include="*.tsx"` 无结果（无内联样式）

---

### 3. Tester Agent

**职责**: 集成测试、E2E 测试、测试报告

**工作区**: `/root/.openclaw/vibex`

**每个 Epic 的任务**:
1. 阅读 Dev 提交的功能代码和单元测试
2. 阅读 Epic 的 DoD Checklist
3. 编写/执行集成测试（Vitest）
4. 编写/执行 E2E 测试（Playwright）
5. 生成测试报告
6. 向 Coordinator 报告测试结果（PASS/FAIL）

**测试文件命名**:
- 单元测试: `__tests__/<filename>.test.ts` (Vitest)
- E2E 测试: `e2e/<filename>.spec.ts` (Playwright)

**Playwright 测试规范**:
- 每个 Feature 至少一个 E2E spec 文件
- 使用 `test.describe` 分组
- 覆盖 Happy path + Error path
- 使用 `page.waitForSelector` 替代 `sleep`

**Tester 驳回条件**:
- 单元测试失败
- E2E 测试失败（非 flaky）
- 测试覆盖率低于 Epic DoD 要求

---

### 4. Reviewer Agent

**职责**: Code Review、批准/驳回、远程 push、PR 创建

**工作区**: `/root/.openclaw/vibex`

**每个 Epic 的任务**:
1. 阅读功能代码 + 测试代码
2. 执行门禁检查（lint + type-check + tests）
3. 评估代码质量：
   - 架构一致性（符合 architecture.md）
   - 安全（无 XSS、注入风险）
   - 性能（无 N+1、无大循环阻塞）
   - 可维护性（命名、注释、文档）
4. 通过 → push 到远程分支 + 创建 PR
5. 驳回 → 使用标准驳回模板（见 AGENTS.md §驳回模板）
6. 至少 1 个 reviewer 通过后，通知 Coordinator

**PR 创建规范**:
```
Title: [Epic <编号>] <Epic 名称>
Body:
  - Feature: <feature-id>
  - DoD: <checklist status>
  - Testing: <test coverage>
  - Notes: <any special considerations>
Labels: epic, sprint-37, <feature-id>
```

**Reviewer Constraints 检查清单**（必检）:
- [ ] `pnpm lint` 通过
- [ ] `pnpm type-check` 通过
- [ ] `pnpm test` 全部通过
- [ ] CHANGELOG.md 已更新
- [ ] `src/app/` 页面未被手动修改
- [ ] 无新增内联 `style={{}}`
- [ ] `grep "TODO\|FIXME" src/` 无未完成 TODO

---

### 5. Coordinator Agent

**职责**: Epic 调度、状态跟踪、跨 Epic 协调、最终交付

**工具**: `/root/.openclaw/skills/team-tasks/scripts/task_manager.py`

**任务**:
1. 初始化 Sprint 37 Epic 追踪
2. 按优先级调度 Epic（E001→E002→...→E016）
3. 监控每个 Epic 的 stage 进度
4. 处理 Epic 间依赖（如 F002-E006 需要 E005 完成）
5. 标记 Epic 为 `coord-completed`
6. Sprint 结束时生成交付报告

**Sprint 37 Epic 追踪**:

| Epic | Feature | 状态 | 当前 Stage | 备注 |
|------|---------|------|-----------|------|
| E001 | F001 | pending | — | P0 |
| E002 | F001 | pending | — | P0 |
| E003 | F001 | pending | — | P0 |
| E004 | F001 | pending | — | P0 |
| E005 | F002 | pending | — | P0 |
| E006 | F002 | pending | — | P0，后端 |
| E007 | F002 | pending | — | P0 |
| E008 | F003 | pending | — | P1 |
| E009 | F003 | pending | — | P1 |
| E010 | F003 | pending | — | P1 |
| E011 | F004 | pending | — | P1 |
| E012 | F004 | pending | — | P1 |
| E013 | F004 | pending | — | P1 |
| E014 | F005 | pending | — | P2 |
| E015 | F005 | pending | — | P2 |
| E016 | F005 | pending | — | P2 |

---

## 跨 Feature 协调规则

### Epic 间依赖

```
F001 (E001-E004)
  └── 无依赖，并行开发

F002 (E005-E007)
  └── E005 (PNG/SVG) → E007 (UI集成) ← E006 (PDF API)
         ↑                                       ↑
      无依赖                                  无依赖

F003 (E008-E010)
  └── E008 (Canvas) → E009 (Dashboard) → E010 (Telemetry)

F004 (E011-E013)
  └── E011 (Store) → E012 (Settings UI) → E013 (Customization)

F005 (E014-E016)
  └── E014 (ThemeProvider) → E015 (Enterprise) → E016 (Settings)
```

### 并行开发策略

| Agent | 分配 Epic | 依赖处理 |
|-------|----------|---------|
| dev-agent-1 | F001 (E001-E004) | 无依赖，独立开发 |
| dev-agent-2 | F002 (E005, E007) | 等待 E006 backend 完成 PDF API |
| dev-agent-3 (backend) | F002-E006 (PDF API) | 独立开发 |
| dev-agent-4 | F003 (E008-E010) | 无依赖 |
| dev-agent-5 | F004 (E011-E013) | 等待 E014 完成 ThemeProvider（可选依赖） |
| dev-agent-6 | F005 (E014-E016) | 无依赖 |

---

## 驳回模板（Reviewer 标准格式）

### 类型 A: CHANGELOG 遗漏

```
❌ 审查驳回
📍 文件位置: CHANGELOG.md
🔧 修复命令: 参考 CHANGELOG_CONVENTION.md 格式，在 CHANGELOG.md 追加 Epic 条目
📋 参考规范: architecture.md § CHANGELOG 更新规范

原因: 本 Epic 变更未记录到 CHANGELOG.md，违反更新时机规范。
```

### 类型 B: TypeScript 类型错误

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: cd /root/.openclaw/vibex/vibex-fronted && pnpm type-check
📋 参考规范: CLAUDE.md § 代码风格

原因: TypeScript 编译失败，存在类型错误。请修复后重新提交。
```

### 类型 C: ESLint 规则违反

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: cd /root/.openclaw/vibex/vibex-fronted && pnpm lint
📋 参考规范: CLAUDE.md § 代码风格

原因: ESLint 规则检查未通过。请运行 pnpm lint 并修复所有错误/警告。
```

### 类型 D: 测试失败

```
❌ 审查驳回
📍 文件位置: <test file>
🔧 修复命令: cd /root/.openclaw/vibex/vibex-fronted && pnpm test
📋 参考规范: IMPLEMENTATION_PLAN.md § 测试策略

原因: 测试失败，DoD 要求所有测试通过。请修复后重新提交。
```

### 类型 E: 内联样式违规

```
❌ 审查驳回
📍 文件位置: <file>:<line>
🔧 修复命令: 将内联 style={{}} 替换为 CSS Modules className
📋 参考规范: CLAUDE.md § Design System

原因: 禁止使用内联 style={{}} 定义颜色/间距/字体，违反设计系统规范。
```

---

## 通知机制

| 事件 | 通知 | 目标 |
|------|------|------|
| Architect 完成 | task_manager update + Slack | Team Lead |
| Epic dev 完成 | Slack | Tester |
| Epic tester 完成 | Slack | Reviewer |
| Epic reviewer 通过 | Slack + GitHub PR | Coordinator |
| Epic coord 完成 | Slack | Team Lead |
| Sprint 37 完成 | Slack | All |

**Slack 通知脚本**:
```bash
python3 /root/.openclaw/skills/team-tasks/scripts/notify-agent.py \
  --channel hermes-test \
  --message "Sprint 37 Architect Review 完成"
```

---

## 验收门禁

每个 Epic 合入 main 前必须通过：

| 门禁 | 命令 | 标准 |
|------|------|------|
| Lint | `cd /root/.openclaw/vibex/vibex-fronted && pnpm lint` | 0 errors |
| Type Check | `cd /root/.openclaw/vibex/vibex-fronted && pnpm type-check` | 0 errors |
| Unit Tests | `cd /root/.openclaw/vibex/vibex-fronted && pnpm test` | 100% pass |
| E2E Tests | `cd /root/.openclaw/vibex/vibex-fronted && pnpm test:e2e` | 100% pass |
| Build | `cd /root/.openclaw/vibex/vibex-fronted && pnpm build` | success |
| CHANGELOG | Git diff | 有 Epic 条目 |
| Review | Human/GitHub | ≥ 1 approved |
