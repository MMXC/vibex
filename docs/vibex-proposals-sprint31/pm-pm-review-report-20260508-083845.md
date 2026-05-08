# 阶段任务报告：pm-review
**项目**: vibex-proposals-sprint31
**领取 agent**: pm
**领取时间**: 2026-05-08T00:38:45.877613+00:00
**版本**: rev 5 → 6

## 项目目标
VibeX Sprint 31 功能提案规划：基于 Sprint 1-30 交付成果，识别下一批高优先级功能增强

## 阶段任务
产品分析（PRD）：VibeX Sprint 31 功能提案规划：基于 Sprint 1-30 交付成果，识别下一批高优先级功能增强

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 分析文档: /root/.openclaw/vibex/docs/vibex-proposals-sprint31/analysis.md
- PRD 位置: /root/.openclaw/vibex/docs/vibex-proposals-sprint31/prd.md
- Specs 目录: /root/.openclaw/vibex/docs/vibex-proposals-sprint31/specs/

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


## 🔴 约束清单
- 每个功能有验收标准
- 粒度细化到可写 expect() 断言
- DoD 明确
- 功能ID格式正确
- 页面集成标注
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-proposals-sprint31/prd.md

## 📤 上游产物
- analyst-review: /root/.openclaw/vibex/docs/vibex-proposals-sprint31/analysis.md

## ⏰ SLA Deadline
`2026-05-09T08:38:45.875034+08:00` (24h 内完成)

## 执行结果
完成时间: 2026-05-08T02:16:00+00:00

### 产出清单
- ✅ prd.md — 2个Epic、5个Story、每条含expect()断言+DoD
- ✅ 优先级矩阵（RICE/P0/P1）
- ✅ 执行顺序依赖图
- ✅ 自检通过：执行摘要✅ Epic拆分✅ 验收标准✅ DoD✅ 页面集成标注✅

### 5个功能点
| ID | 功能点 | 工时 |
|----|--------|------|
| F1.1 | schema字段对齐 | 3h |
| F1.2 | 导出功能重构 | 4h |
| F1.3 | 导入Modal | 6h |
| F2.1 | ProtoPreview E2E测试 | 5h |
| F2.2 | ProtoFlowCanvas Presence头像 | 3h |

总工期: 21h

### 检查单
- [x] 执行摘要包含：背景 + 目标 + 成功指标
- [x] Epic/Story表格格式正确（ID/描述/工时/验收标准）
- [x] 每个Story有可写的expect()断言
- [x] DoD章节存在且具体
- [x] 涉及页面的功能点标注【需页面集成】
