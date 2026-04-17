# 阶段任务报告：create-prd
**项目**: vibex-sprint1-prototype-canvas-qa
**领取 agent**: pm
**领取时间**: 2026-04-17T17:02:16.699506+00:00
**版本**: rev 3 → 4

## 项目目标
QA验证 Sprint1 原型画布基础：检查产出物完整性、交互可用性、设计一致性

## 执行过程
- 基于 analysis.md（2026-04-18 00:58）完成 Planning 和 PRD 编写
- Feature List 输出到 plan/feature-list.md
- PRD 输出到 prd.md，包含 5 Epic、11 功能点、58 条 expect() 断言
- 5 个 Spec 文件输出到 specs/ 目录

## 完成时间
2026-04-18 01:05 GMT+8

## 产出路径
- PRD: docs/vibex-sprint1-prototype-canvas-qa/prd.md
- Planning: docs/vibex-sprint1-prototype-canvas-qa/plan/feature-list.md
- Specs: docs/vibex-sprint1-prototype-canvas-qa/specs/ (5 文件)

## 检查单
- [x] Feature List 已产出
- [x] 执行摘要包含背景 + 目标 + 成功指标
- [x] Epic/Story 表格格式正确
- [x] 每个 Story 有 expect() 断言（58 条）
- [x] DoD 章节存在且具体
- [x] 本质需求穿透（神技1）：每个 Epic 有底层动机描述
- [x] 最小可行范围（神技2）：每个 Epic 有必做/不做/暂缓区分
- [x] 用户情绪地图（神技3）：关键页面有进入/迷路/出错描述
- [x] Specs 目录存在（5 个 Epic 对应文件）
- [x] 功能ID格式正确（F1.1~F5.1）
- [x] 优先级矩阵已产出

---

## 阶段任务
# ★ Agent Skills（必读）
# `planning-and-task-breakdown` — 任务拆解、Epic/Story 划分
# `spec-driven-development` — 规格驱动开发、PRD 规范编写
# 写 PRD 前必须通过 `/ce:plan` 技能进行 Planning
# **`pm-ux-ui-mastery`** — ★ 新增必读技能！PM元技能：攻克UX之难 + 防御UI之错
#   包含6大神技：剥洋葱(1)、极简主义(2)、老妈测试(3)、状态机(4)、原子化(5)、开发同理心(6)
#   使用场景：写PRD时用神技1-3穿透本质、做减法、测盲区；写Spec时用神技4-6穷举四态、规范组件、开发交接

# ★ Phase1 第二步：PRD 细化（create-prd）

PRD 细化：Epic/Story 拆分、验收标准、优先级矩阵

> ⚡ **UX/UI 神技速查**（详情见 `pm-ux-ui-mastery` 技能）：
> - 神技1 剥洋葱：需求 → 问3个Why → 剥离现有形态 → 触及本质
> - 神技2 极简主义：每个功能问"去掉用户能走通吗？"→ 不能才加
> - 神技3 老妈测试：找圈外人测，迷路处=UX致命盲区
> - 神技4 状态机：每个UI元素必须定义 理想态/空状态/加载态/错误态
> - 神技5 原子化：间距8倍数、颜色Token、组件拼装禁止硬编码
> - 神技6 开发同理心：标注对齐方式+响应式+组件边界，开发不需要再问

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- PRD 位置: docs/vibex-sprint1-prototype-canvas-qa/prd.md
- Specs 目录: docs/vibex-sprint1-prototype-canvas-qa/specs/

## ★ 必须先执行 Planning（使用 /ce:plan）
在开始写 PRD 前，必须先用 `/ce:plan` 技能进行 Planning：
1. **基于 Analyst 报告**：读取 analysis.md，理解业务场景、技术方案、风险
2. **拆解 Feature List**：从 analysis 的技术方案中拆解出可交付的功能点
3. **Epic/Story 划分**：按问题根因或功能相关性组织 Epic，每个 Epic 下拆 Story
4. **Planning 输出**：输出 Feature List 表格（ID / 功能名 / 描述 / 根因关联 / 工时估算）

Planning 完成后，再基于 Planning 结果编写 PRD。

## 你的任务（Planning 之后的 PRD 工作）
1. 基于 analysis.md 和 Planning 结果创建 PRD
2. 定义功能点和验收标准（每个可写 expect() 断言）
3. 创建 specs/ 目录存放详细规格
4. 每个功能点必须有 DoD (Definition of Done)

## 功能点格式
| ID | 功能点 | 描述 | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | xxx | xxx | expect(...) | 【需页面集成】 |

## PRD 格式规范（必须包含以下章节）
1. **执行摘要** — 背景/目标/成功指标
2. **Epic 拆分** — Epic/Story 表格（含工时估算）
3. **验收标准** — 每个 Story 可测试的 expect() 条目
4. **DoD (Definition of Done)** — 研发完成的判断标准

### ★ 新增章节（基于 UX/UI 神技）

#### 2a. 本质需求穿透（神技1：剥洋葱）
每个Epic下必须回答：
- 用户的底层动机是什么？（剥离"现有形态"描述）
- 去掉现有方案，理想解法是什么？
- 这个Epic解决了用户的什么本质问题？

#### 2b. 最小可行范围（神技2：极简主义）
每个Epic下必须区分：
- **本期必做**：去掉这个用户流程就走不通的
- **本期不做**：去掉后用户仍能完成任务（即使体验稍差）
- **暂缓**：80%用户的80%场景不需要的

#### 2c. 用户情绪地图（神技3：老妈测试）
每个关键页面必须描述：
- 用户进入时的情绪（焦虑？迷茫？期待？）
- 用户迷路时的引导文案（禁止只写"无内容"）
- 用户出错时的兜底机制

#### 2d. UI状态规范（神技4：状态机 — Spec阶段应用）
> 以下为Spec文件要求，PRD中标注即可，详见specs/目录
- 每个UI元素在 specs/ 中必须有四态定义：理想态/空状态/加载态/错误态
- 空状态禁止只留白，必须有引导插图+文案
- 加载态必须用骨架屏，禁止用转圈（会抖动）
- 错误态至少覆盖：网络异常/权限不足/数据超长/接口超时

## PRD 格式校验（自检后再提交）
- [ ] 执行摘要包含：背景 + 目标 + 成功指标
- [ ] Epic/Story 表格格式正确（ID/描述/工时/验收标准）
- [ ] 每个 Story 有可写的 expect() 断言
- [ ] DoD 章节存在且具体

## 驳回红线
- PRD 缺少执行摘要/Epic拆分/验收标准/DoD 任一章节 → 驳回补充
- 功能点模糊，无法写 expect() → 驳回重回阶段一
- 验收标准缺失 → 驳回补充
- 涉及页面但未标注【需页面集成】→ 驳回补充
- 未执行 Planning（无 Feature List）→ 驳回补充
- **UX相关（神技1-3）**：
  - Epic无"本质需求穿透"描述 → 驳回补充（神技1）
  - Epic无"最小可行范围"区分（全部都是必做）→ 驳回重写（神技2）
  - 关键页面无"用户情绪地图" → 驳回补充（神技3）
- **UI相关（神技4-5）**：
  - 涉及页面的Epic但specs/无四态定义 → 驳回补充（神技4）
  - specs/中有硬编码间距/颜色（非Token）→ 驳回修正（神技5）
  - 空状态只有留白无引导文案 → 驳回修正（神技4）


## 🔴 约束清单
- 强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 每个功能有验收标准
- 粒度细化到可写 expect() 断言
- DoD 明确
- 功能ID格式正确
- 页面集成标注
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-sprint1-prototype-canvas-qa/prd.md

## 📤 上游产物
- analyze-requirements: /root/.openclaw/vibex/docs/vibex-sprint1-prototype-canvas-qa/analysis.md

## ⏰ SLA Deadline
`2026-04-19T01:02:16.697101+08:00` (24h 内完成)
