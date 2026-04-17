# 阶段任务报告：pm-review
**项目**: vibex-proposals-20260411-page-tree
**领取 agent**: pm
**领取时间**: 2026-04-11T23:51:13.370157+00:00
**版本**: rev 6 → 7

## 项目目标
组件树按页面组织 — 修复 flowId 匹配问题

## 阶段任务
产品分析（PRD）：组件树按页面组织 — 修复 flowId 匹配问题

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 分析文档: /root/.openclaw/vibex/docs/vibex-proposals-20260411-page-tree/analysis.md
- PRD 位置: /root/.openclaw/vibex/docs/vibex-proposals-20260411-page-tree/prd.md
- Specs 目录: /root/.openclaw/vibex/docs/vibex-proposals-20260411-page-tree/specs/

## 你的任务
1. 基于 analysis.md 创建 PRD
2. 定义 Epic/Story 和验收标准（每个可写 expect() 断言）
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
- 功能点模糊，无法写 expect() → 驳回
- 验收标准缺失 → 驳回
- 涉及页面但未标注【需页面集成】→ 驳回

## 完成后推进提案链
完成 prd.md 后：

```bash
task update vibex-proposals-20260411-page-tree pm-review done
```


## 🔴 约束清单
- 每个功能有验收标准
- 粒度细化到可写 expect() 断言
- DoD 明确
- 功能ID格式正确
- 页面集成标注
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-proposals-20260411-page-tree/prd.md

## 📤 上游产物
- analyst-review: /root/.openclaw/vibex/docs/vibex-proposals-20260411-page-tree/analysis.md
