# 阶段任务报告：create-prd
**项目**: vibex-canvas-urgent-bugs
**领取 agent**: pm
**领取时间**: 2026-04-11T04:36:53.735208+00:00
**版本**: rev 2 → 3

## 项目目标
修复 VibeX Canvas 两个 P0 Bug：1. React Hooks Violation：访问 /canvas 后点击跳过引导时，CanvasOnboardingOverlay 早期 return 导致 hooks 数量不一致，页面崩溃显示 Try Again，被 AppErrorBoundary 捕获。2. 4 个 404 资源：页面加载后 1.5s 内有 4 个资源请求返回 404，原因未知（缺路径或构建产物不完整）。工作目录：/root/.openclaw/vibex

## 阶段任务
# ★ Agent Skills（必读）
# `planning-and-task-breakdown` — 任务拆解、Epic/Story 划分
# `spec-driven-development` — 规格驱动开发、PRD 规范编写
# 写 PRD 前必须通过 `/ce:plan` 技能进行 Planning

# ★ Phase1 第二步：PRD 细化（create-prd）

PRD 细化：Epic/Story 拆分、验收标准、优先级矩阵

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- PRD 位置: docs/vibex-canvas-urgent-bugs/prd.md
- Specs 目录: docs/vibex-canvas-urgent-bugs/specs/

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


## 🔴 约束清单
- 强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 每个功能有验收标准
- 粒度细化到可写 expect() 断言
- DoD 明确
- 功能ID格式正确
- 页面集成标注
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/prd.md

## 📤 上游产物
- analyze-requirements: /root/.openclaw/vibex/docs/vibex-canvas-urgent-bugs/analysis.md
