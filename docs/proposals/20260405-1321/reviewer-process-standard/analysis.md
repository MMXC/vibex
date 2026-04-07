# Analysis: Reviewer Process Standardization

**Project**: reviewer-process-standard  
**Phase**: analyze-requirements  
**Analyst**: analyst subagent  
**Date**: 2026-04-05  
**Status**: ✅ Analysis Complete

---

## 1. Problem Statement

VibeX 项目的代码审查流程存在**多层不一致**，导致：
- 审查质量参差不齐（有的用 ce:review skill，有的纯手工）
- 报告格式混乱，难以横向对比
- Reviewer agent 的心跳任务领取逻辑不透明
- 安全扫描（npm audit / gitleaks）执行时机不统一
- 多个评审模板并存但缺乏统一调用规范

---

## 2. Current State Analysis

### 2.1 现有 Review Entry Points（评审入口）

| # | 入口 | 类型 | 触发方式 | 产出物 |
|---|------|------|----------|--------|
| 1 | `ce:review` skill | 自动化 | `/review` 命令或 `skill:ce:review` | `.context/compound-engineering/ce-review/<run-id>/` + 结构化报告 |
| 2 | `reviewer` 心跳脚本 | 半自动 | `reviewer-heartbeat.sh` | `docs/<project>/review.md` |
| 3 | PR Template 检查清单 | 手工 | 开发者自检 | PR Comment 中的 checklist |
| 4 | `acceptance-checklist.md` | 手工 | Epic 验收时 | 审查意见文本 |
| 5 | 手工 review 报告 | 手工 | 无标准触发 | `review-report.md` / `review.md` |

### 2.2 现有 Review 模板

| 模板 | 路径 | 用途 |
|------|------|------|
| `code-review.md` | `docs/vibex-report-template/templates/` | 代码质量审查 |
| `architecture-review.md` | `docs/vibex-report-template/templates/` | 架构设计审查 |
| `prd-review.md` | `docs/vibex-report-template/templates/` | PRD 需求审查 |
| `api-review.md` | `docs/vibex-report-template/templates/` | API 契约审查 |

### 2.3 不一致性清单

| # | 不一致项 | 具体表现 |
|---|----------|----------|
| 1 | **入口分散** | ce:review skill 与 reviewer 心跳脚本并行，reviewer 实际使用心跳领取任务，ce:review skill 被冷落 |
| 2 | **报告格式混乱** | 有的产 `review.md`，有的产 `review-report.md`，有的产 `proposals/<date>/reviewer.md` |
| 3 | **安全扫描时机不统一** | PR Template 中要求 `npm audit` + `gitleaks`，但 reviewer 心跳流程未强制要求 |
| 4 | **两阶段门禁未文档化** | Reviewer HEARTBEAT.md 提到"两阶段审查"（功能审查→推送验证），但无 SOP 文档 |
| 5 | **GStack 验证标准模糊** | HEARTBEAT.md 要求 GStack 截图/报告，但未明确哪些任务类型需要哪种证据 |
| 6 | **模板未与流程绑定** | 4 个 review 模板存在但未被任何标准流程引用 |
| 7 | **reviewer 自检报告路径不一致** | 历史教训：reviewer 自检报告路径 `/vibex/docs/agent-self-evolution-YYYYMMDD-daily/`，不在标准 proposals 路径 |
| 8 | **提案路径约定冲突** | HEARTBEAT.md 定义 `proposals/YYYYMMDD/reviewer.md`，但心跳脚本内嵌路径逻辑，部分提案写到其他位置 |

---

## 3. Solution Options

### 方案 A：标准化 Review 模板 + Reviewer SOP 文档

**核心思路**：固化现有最佳实践（reviewer 心跳 + 两阶段门禁），补全 SOP 文档，将模板绑定到流程节点。

**具体措施**：
1. 编写 `REVIEWER_SOP.md`：明确 reviewer 心跳领取→代码审查→安全扫描→报告产出→Slack 通知的完整流程
2. 将 4 个 review 模板（code/architecture/prd/api）绑定到对应阶段，明确何时使用哪个模板
3. 统一报告输出路径：`docs/<project>/reviews/<type>-<date>.md`
4. 安全扫描强制化：在 SOP 中明确每个 review 必须包含 `npm audit` + `gitleaks` 结果
5. GStack 验证分级：根据任务类型（BugFix / Feature / Refactor）明确需要的证据类型
6. 废弃手工 review 入口：所有 review 统一通过 reviewer 心跳领取，不再允许随意手工 review

**工时估算**：6-8h（1-2 个 Epic）
- 编写 SOP 文档：3h
- 模板整理与绑定：2h
- HEARTBEAT.md 清理与路径统一：2h
- 试点运行并修正：1h

**优点**：
- 改造成本低，复用现有 reviewer 心跳基础设施
- 团队已有肌肉记忆（reviewer agent 已在使用心跳）

**缺点**：
- ce:review skill 的能力未被充分利用（多 persona 并行审查）
- 依赖 reviewer agent 手动执行，自动化程度低

---

### 方案 B：整合 ce:review Skill + 分层 Review 流程

**核心思路**：以 `ce:review` skill 为自动审查主力，reviewer 心跳转为人工门禁（最终验收），建立三层审查架构。

**三层审查架构**：
| 层级 | 执行者 | 触发时机 | 产出物 |
|------|--------|----------|--------|
| L1 自动 | ce:review (mode:headless) | PR 创建时自动触发 | 结构化 findings JSON |
| L2 人工 | reviewer 心跳领取 | L1 通过后，reviewer 人工审查 | `review.md` |
| L3 最终 | reviewer + coord 共同 | Epic 完成后 | 验收报告 |

**具体措施**：
1. 编写 `REVIEWER_SOP.md`：定义三层架构的职责边界
2. 将 4 个模板整合为统一 `REVIEW_TEMPLATE.md`：单模板含所有维度（security/performance/architecture/requirements），按需填写
3. 统一报告路径：`docs/<project>/reviews/<epic>-review.md`
4. ce:review 配置化：预设 reviewer personas 池（correctness/security/performance/architecture），按文件类型自动选择
5. GStack 验证集成到 ce:review：mode:autofix 自动截图 + 生成报告
6. 废弃 PR Template 中的手工 checklist（改由 L1 自动执行）

**工时估算**：12-16h（2-3 个 Epic）
- SOP 编写：3h
- 模板整合：3h
- ce:review 配置与 personas 调优：4h
- CI/CD 集成（L1 自动触发）：3h
- 试点 + 迭代：3h

**优点**：
- 充分利用 ce:review skill 的多 persona 并行审查能力
- L1 自动执行，释放 reviewer 人工用于高价值判断
- 审查质量可量化（findings 数量、severity 分布）

**缺点**：
- 改造幅度大，ce:review skill 需要调优才能满足 VibeX 项目特点
- CI/CD 集成需要额外配置
- 团队需要适应新的三层架构

---

## 4. Recommended Solution

**推荐方案：A（标准化模板 + Reviewer SOP）**

**理由**：
1. **最小改造，最大收益**：方案 A 复用现有 reviewer 心跳基础设施，工时仅 6-8h，ROI 高
2. **渐进式改进**：方案 B 的三层架构是长期目标，可以先固化 SOP，再逐步引入 ce:review skill
3. **团队当前痛点是混乱而非效率**：现有流程的主要问题是"没有标准"，不是"效率低"。方案 A 先解决标准化，方案 B 后续再优化效率
4. **历史教训支持**：2026-03-30 reviewer 自检提案（P2）已经提出"两阶段审查 SOP 文档化"，说明团队已有共识，这是可以直接推进的工作

**实施顺序**：
```
Phase 1: 编写 REVIEWER_SOP.md，统一报告路径 (3h)
Phase 2: 整理模板，明确使用时机 (2h)
Phase 3: 清理 HEARTBEAT.md 中的路径逻辑 (2h)
Phase 4: 试点运行，收集反馈并迭代 (1h+)
```

---

## 5. Acceptance Criteria

| ID | 标准 | 验证方法 |
|----|------|----------|
| AC-1 | 所有 review 报告路径统一为 `docs/<project>/reviews/<type>-<date>.md` | `find docs -name "*review*.md" | grep -v templates` 无路径违规 |
| AC-2 | 每个 review 包含 `npm audit` + `gitleaks` 结果摘要 | 抽查 5 个 review 报告，检查安全扫描部分 |
| AC-3 | Reviewer SOP 文档覆盖完整流程（领取→审查→报告→通知） | SOP 包含所有流程节点，无遗漏 |
| AC-4 | 模板与流程节点绑定（code-review 用于 Epic 代码审查，prd-review 用于 PRD 评审会） | AGENTS.md 或 SOP 中明确注明 |
| AC-5 | Reviewer 心跳任务领取逻辑有明确文档说明 | HEARTBEAT.md 或 SOP 中注明如何领取任务 |
| AC-6 | 所有 review 报告包含 GStack 截图证据（涉及 UI 变更时） | 报告中有截图路径引用 |

---

## 6. Risk Assessment

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| **Reviewer 抗拒标准化**（习惯手工 review） | MEDIUM | SOP 设计时充分参考现有 reviewer 自检提案，让 reviewer 参与评审 |
| **模板过度复杂化**（4 个模板 → 1 个大模板） | MEDIUM | 保持模板精简，SOP 中提供使用决策树（哪个场景用哪个模板） |
| **路径迁移破坏历史链接**（旧报告路径变更） | LOW | 重定向说明或迁移脚本，保留旧路径引用 |
| **ce:review skill 被废弃**（长期不维护） | LOW | SOP 中保留 ce:review 作为可选 L1 工具，未来可重新启用 |
| **SOP 文档维护成本**（流程变更后未同步更新） | MEDIUM | SOP 纳入 reviewer 自检检查项，每次自检时验证 SOP 时效性 |

---

## 7. Related Files

| 文件 | 说明 |
|------|------|
| `/root/.openclaw/vibex/agents/reviewer/HEARTBEAT.md` | Reviewer 心跳脚本说明（需清理路径逻辑） |
| `/root/.openclaw/vibex/vibex-fronted/docs/vibex-report-template/templates/` | 4 个 review 模板（需绑定到流程） |
| `/root/.openclaw/vibex/vibex-fronted/.github/pull_request_template.md` | PR 手工 checklist（考虑简化） |
| `/root/.openclaw/vibex/vibex-fronted/templates/acceptance-checklist.md` | 验收审查清单（可与 review 流程合并） |
| `/root/.openclaw/extensions/compound-engineering/skills/ce-review/SKILL.md` | ce:review skill（未来可重新引入） |
| `/root/.openclaw/vibex/docs/LEARNINGS.md` | 历史教训记录（reviewer 自检报告路径问题） |

---

## 8. Research Notes

**调研范围**：
- `/root/.openclaw/vibex/docs/learnings/` — 1 个 learnings 文件（canvas-cors）
- `/root/.openclaw/vibex/docs/LEARNINGS.md` — analyst LEARNINGS（含提案路径契约教训）
- `/root/.openclaw/vibex/agents/reviewer/HEARTBEAT.md` — reviewer 心跳说明
- `/root/.openclaw/vibex/vibex-fronted/docs/vibex-report-template/templates/` — 4 个 review 模板
- `/root/.openclaw/vibex/vibex-fronted/CONTRIBUTING.md` — 安全审查流程说明
- `/root/.openclaw/vibex/vibex-fronted/.github/pull_request_template.md` — PR 审查清单
- `/root/.openclaw/vibex/vibex-fronted/templates/acceptance-checklist.md` — 验收审查清单
- `/root/.openclaw/extensions/compound-engineering/skills/ce-review/SKILL.md` — ce:review skill 文档
- `/root/.openclaw/vibex/docs/proposals/20260330/reviewer.md` — reviewer 自检报告（历史）
- `/root/.openclaw/vibex/docs/proposals/20260404/analyst.md` — analyst 自检提案（含改进方向）
- `/root/.openclaw/vibex/docs/proposals/20260405-1321/` — 当前项目上下文（subagent-timeout-strategy）
