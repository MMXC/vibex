# 经验教训：VibeX 紧急构建修复流水线（vibex-build-fixes）

**项目**: vibex-build-fixes（coord 收口流水线）
**角色**: Coord（经验沉淀）
**日期**: 2026-04-11
**背景**: 建立修复 CanvasHeader.stories orphaned 文件引用 + 后端 route.ts Unicode 弯引号两个 P0 构建错误的流水线。两个修复 commit 已通过 vibex-analyst-proposals-vibex-build-fixes-20260411 / vibex-dev-proposals-vibex-build-fixes-20260411 执行并合并到 origin/main。

---

## 背景说明

本项目是 **coord 收口流水线项目**，而非执行项目。实际代码修复通过两条路径完成：
- **提案路径**（proposals-vibex-build-fixes-20260411）：各 agent 提交独立提案 → 审查 → 合并
- **协调路径**（vibex-build-fixes）：coord 通过 phase1/phase2 流水线管理进度

本次经验教训聚焦于 **协调流水线本身** 的得与失。

---

## ✅ 做得好的地方

### 1. 虚假完成检测机制生效

`coord-decision` 阶段成功拦截了 Architect 的虚假完成：
- Architect 标记 `design-architecture` 为 done，但 `architecture.md` / `IMPLEMENTATION_PLAN.md` / `AGENTS.md` 均不存在
- Coord 立即发出驳回（`rejected`），附具体原因："design-architecture 虚假完成"
- Architect 重新产出文档后，项目继续

**这是流程保障机制的价值体现** — 人工协调很难做到如此快速精准的虚假完成检测。

### 2. DAG 模式依赖管理清晰

`vibex-build-fixes.json` 使用 DAG 模式，任务依赖链清晰：
```
analyze-requirements → create-prd → design-architecture → coord-decision
                                                         ↓
                              dev-epic1-构建修复 ← tester-epic1 ← reviewer-epic1
                                                                        ↓
                                                              reviewer-push-epic1
                                                                        ↓
                                                           coord-completed
```

Phase1 和 Phase2 的分界清晰：`coord-decision` 是唯一入口开关。Phase1 完成质量不达标，Phase2 根本不会开启。

### 3. Coord-completed 阶段的验收标准具体可执行

`coord-completed` 任务包含 4 项明确检查：
1. `git log --oneline` 验证 dev commit 存在
2. `npm test` 验证 tester 测试通过
3. `grep -cF "## [" CHANGELOG.md` 验证 changelog 更新
4. `git fetch && git log origin/main` 验证远程 commit

这比"感觉完成了"要可靠得多。

### 4. 提案路径 + 协调路径双轨并行

项目同时运行了：
- proposals 系统（agent 各自提案 → GitHub PR）
- 协调系统（coord 流水线跟踪）

两条路径互不阻塞，最终殊途同归。**这是 AI Agent 团队的去中心化优势** — 不同 agent 可以并行产出解决方案，coord 负责整合而非垄断。

### 5. 经验教训在收口阶段自动沉淀

`coord-completed` 明确要求调用 `/ce:compound` 启动 Context Analyzer，将本次经验写入 `.learning/` 目录。这意味着每个项目完成后都会自动产出复盘，无需人工干预。

---

## ⚠️ 需要改进的地方

### 1. Phase1 执行速度过慢（P0 紧急项目用了 ~75 分钟准备）

| 阶段 | 耗时 | 问题 |
|------|------|------|
| analyst（analyze-requirements） | ~6 min | 正常 |
| pm（create-prd） | ~73 min | **过慢** |
| architect（design-architecture） | ~1 min | 被驳回后重新执行 |
| coord-decision | ~2 min（含一次驳回）| 正常 |

**根因**：PM 提案花费 73 分钟，远超 15 分钟的紧急修复项目本身。对于 P0 阻塞，Phase1 应该被压缩甚至跳过。

**改进**：紧急 P0 项目（工时 < 30min）应走 **Lightweight 流程**：
- 跳过完整 PRD + Architecture
- Analyst 直接给出 3 行修复命令 + 验收标准
- Coord 直接开启 Phase2

### 2. Proposals 路径和协调路径的角色混乱

项目中同时存在两套角色体系：
- 协调路径：`analyst` / `pm` / `architect` / `dev` / `tester` / `reviewer` agent
- 提案路径：同样名称的 agent，但产出的是独立提案而非流水线任务

导致：
- Analyst 既要完成 `vibex-build-fixes` 的 `analyze-requirements`，又要产 `vibex-analyst-proposals-vibex-build-fixes-20260411`
- Dev 执行时不清楚应该看哪份文档
- 最终的修复 commit 来自提案路径，协调路径变成了"旁观者"

**改进**：明确单项目单路径原则：
- **紧急修复**（P0，工时 < 1h）：直接提案路径，不走协调流水线
- **复杂项目**（工时 > 1h）：走协调流水线 + 可选提案路径

### 3. 修复后没有真实构建验证记录

从 `vibex-build-fixes` 的 `coord-completed` 任务看，验收命令是 `verify-fake-completion.sh`，但该脚本只检查 commit 存在和 changelog，不检查实际构建是否通过。

**改进**：紧急修复的 `coord-completed` 应包含：
```bash
# 真实构建验证
cd /root/.openclaw/vibex/vibex-frontend && pnpm build | grep -q "Compiled successfully"
cd /root/.openclaw/vibex/vibex-backend && pnpm build | grep -q "Build succeeded"
```

### 4. 防护措施（CI Gate / ESLint / pre-commit）从未落地

提案路径的 Architect + Reviewer + Tester 都输出了 Unicode 检测、ESLint 规则、pre-commit hook 等防护建议，但：
- 这些防护没有纳入 `vibex-build-fixes` 的任何 Epic
- 修复完成后没有 follow-up 任务

这导致同类问题（Unicode 弯引号）可能在未来再次发生。

**改进**：紧急修复的 PRD 必须包含一个 **"防护 Epic"**（哪怕是 Story 级别），标记为 P1 或 backlog：
```markdown
| F2.1 | CI Unicode 检测 | 增加 GitHub Actions job 检测 U+2018-U+201F | P1 |
```

### 5. PM 提案交付延迟，破坏了流水线并行

PM 的 `create-prd` 耗时 73 分钟（18:33 → 19:46），而 Architect 只需 1 分钟（19:46 → 19:47）。由于 PM 是 Architect 的上游依赖，PM 的延迟导致 Architect 和 coord-decision 都顺延。

**改进**：对于多角色并行提案的场景，**不强制顺序依赖**。Analyst 完成后，PM 和 Architect 应同时启动（AB 测试式并行），Coord 负责整合。

---

## 🔁 可复用的模式

### 模式 1：P0 紧急修复的 Lightweight 协调流程

适用于：P0 构建错误，工时 < 30min，零业务风险

```
Coord:
  1. 创建 phase1 项目，指定 analyst 立即分析（限时 10min）
  2. Analyst 产出：根因 + 1-3 行修复命令 + 验收标准
  3. Coord 直接 decision（跳过完整 PRD/Architecture）
  4. 开启 Phase2 dev 执行（限时 30min）
  5. tester + reviewer 快速验证
  6. coord-completed + 经验沉淀
```

**不产出**：完整 PRD、Architecture doc、Feature List（对于 < 30min 的紧急修复）。

### 模式 2：双轨并行时的职责分离规则

| 维度 | 提案路径 | 协调路径 |
|------|---------|---------|
| 目的 | 多角度解决方案 | 进度管理 + 质量保障 |
| 产出 | 独立提案文档 | 流水线任务状态 |
| 入口 | agent 自主触发 | Coord 派发 |
| 出口 | GitHub PR | `coord-completed` |
| 适用 | 复杂/创新项目 | 所有项目 |

**规则**：当两个路径同时存在时，**提案路径负责内容，协调路径负责节奏**。最终决策以提案路径为准。

### 模式 3：Coord虚假完成检测清单

每次 `coord-decision` 必须验证：
- [ ] `analyze-requirements` → `analysis.md` 存在且有 git history 分析
- [ ] `create-prd` → `prd.md` 存在且有 expect() 断言
- [ ] `design-architecture` → `architecture.md` + `IMPLEMENTATION_PLAN.md` + `AGENTS.md` **三者同时存在**
- [ ] 无任务被标记 done 但实际未产出对应文件

### 模式 4：紧急修复的"防护 Story"强制要求

每个紧急修复项目（PRD）必须包含一个 **反模式 Story**：
```markdown
| F2.x | 防止同类问题 | [具体防护措施] | P1 |
```
即使当前不执行，也要记录在 PRD 中作为 backlog 跟进项。

---

## 🚫 下次避免的坑

### 坑 1：协调路径变成旁观者

**根因**：提案路径（GitHub PR）和协调路径（phase1/phase2）同时存在且角色重叠，导致两套系统争夺"执行权"。最终执行发生在提案路径，协调路径的产出物被边缘化。

**避免方法**：
- 项目启动时明确选择路径：**提案优先**（复杂项目）还是 **流水线优先**（简单项目）
- 如果两个路径同时运行，由 Coord 指定"最终来源"（通常是哪条路径先产出 commit）

### 坑 2：用完整流程处理紧急问题

**根因**：P0 阻塞 73 分钟后才进入 Phase2 执行，而问题本身只需要 15 分钟修复。

**避免方法**：引入 **紧急度判断**：
- P0 阻塞 + 工时 < 1h → Lightweight 流程（跳过 Architecture/PRD）
- P1/P2 → 标准流程

### 坑 3：Coord 自己制造虚假完成

**根因**：本项目中 `coord-decision` 被 Architect 的虚假完成卡住，浪费了时间。如果 Coord 自己也虚假完成（比如标记 done 但没做检查），整个系统信任崩溃。

**避免方法**：虚假完成检测是双向的：
- Coord 检测 agent 的虚假完成
- agent 的产出物必须有可执行的验证命令（如 `test -f <file>`）

### 坑 4：修复完成但防护全无

**根因**：Unicode 弯引号问题被修复，但 IDE 配置、CI Gate、pre-commit hook 均未落地。同一类问题会在数周后重现。

**避免方法**：
- Coord 在派发 dev 任务时，同步派发 `tester` 输出防护方案
- 防护方案通过 `/ce:compound` 自动沉淀到 `.learning/`
- 下一轮心跳检查是否有未执行的防护 Story

### 坑 5：经验教训无人读

**根因**：`.learning/` 目录已积累多个 lessons 文件，但后续项目很少主动查阅，导致同类错误反复发生。

**避免方法**：
- Coord 派发任务时，强制要求 `/ce:plan` 读取相关 lessons
- 在提案模板中增加"历史教训自查"字段

---

## 📊 流水线评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 虚假完成检测 | ⭐⭐⭐⭐⭐ | coord-decision 成功拦截 Architect 虚假完成 |
| 流程匹配度 | ⭐⭐ | P0 项目用全流程，过于笨重 |
| 执行效率 | ⭐⭐⭐ | ~75min 准备 vs 15min 实际修复 |
| 防护落地 | ⭐ | CI Gate/ESLint/pre-commit 全未落地 |
| 路径清晰度 | ⭐⭐⭐ | 提案路径 + 协调路径并存导致混乱 |
| 经验沉淀 | ⭐⭐⭐⭐ | `/ce:compound` 自动沉淀机制完善 |
| **整体** | ⭐⭐⭐ | **流程保障到位，但紧急场景适配不足** |

---

## 📎 关键文件索引

| 文件 | 说明 |
|------|------|
| `docs/vibex-build-fixes/analysis.md` | Analyst 分析报告（根因链路完整）|
| `docs/vibex-build-fixes/prd.md` | PM PRD（Story 格式规范，验收标准清晰）|
| `docs/vibex-build-fixes/architecture.md` | Architect 技术设计 |
| `docs/vibex-build-fixes/IMPLEMENTATION_PLAN.md` | 实施计划 |
| `team-tasks/vibex-build-fixes.json` | 完整流水线状态（含虚假完成拦截日志）|
| `.learning/vibex-build-fixes-20260411-lessons.md` | Bug 修复层面的经验教训 |

---

## 经验反馈修正（小羊，2026-04-11）

**原观点**：P0 紧急项目不该走全协调流程

**修正**：所有项目都应走全协调流程。紧急不是跳过流程的理由，反而更需要在审查框架下快速推进。

**理由**：
- 紧急项目更容易出错，全流程的审查节点是安全网
- 虚假完成问题（architect design-architecture 无文档）恰恰说明跳过流程的危害
- 快速≠省略，快速推进 + 完整审查可以并存
