# 阶段任务报告：design-architecture
**项目**: vibex-canvas
**领取 agent**: architect
**领取时间**: 2026-04-11T14:14:34.937864+00:00
**版本**: rev 4 → 5

## 项目目标
修复 Vibex Canvas 页面布局错乱的 CSS 问题

## 阶段任务
# ★ Agent Skills（必读）
# `api-and-interface-design` — 接口设计、REST API、数据模型
# `deprecation-and-migration` — 迁移路径评估、废弃方案处理
# 技术设计必须通过 `/ce:plan` 技能执行 Technical Design

# ★ Phase1 第三步：系统架构设计（design-architecture）

系统架构设计

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 架构文档: docs/vibex-canvas/architecture.md
- 实施计划: docs/vibex-canvas/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-canvas/AGENTS.md

## ★ 必须依次执行两个阶段

### 阶段一：Technical Design（使用 /ce:plan）
基于 PRD 生成技术设计文档：
1. **接口设计**：REST API / 数据模型 / 边界
2. **模块划分**：核心模块、依赖关系、数据流
3. **技术选型**：依赖库、中间件、第三方服务
4. **风险评估**：性能瓶颈、兼容性、安全性

### 阶段二：技术审查（使用 /plan-eng-review）
生成技术设计文档后，必须进行技术审查：
1. **自我审查**：对照 PRD 验收标准，确认技术方案覆盖所有功能点
2. **外部视角**：使用 `/plan-eng-review` 技能，邀请外部视角检查架构合理性
3. **审查输出**：列出架构风险点 + 改进建议
4. **文档完善**：基于审查结果更新 architecture.md

**两个阶段依次完成，才能产出最终 architecture.md**

## 你的任务（Technical Design 产出）
1. 基于 PRD 设计系统架构
2. 输出 IMPLEMENTATION_PLAN.md（实施计划）
3. 输出 AGENTS.md（开发约束）
4. 接口文档完整
5. 评估性能影响

## 产出物
- 架构文档: docs/vibex-canvas/architecture.md
- 实施计划: docs/vibex-canvas/IMPLEMENTATION_PLAN.md
- 开发约束: docs/vibex-canvas/AGENTS.md

## 驳回红线
- 架构设计不可行 → 驳回重新设计
- 接口定义不完整 → 驳回补充
- 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
- 未执行 Technical Design 阶段 → 驳回补充
- 未执行 /plan-eng-review 技术审查 → 驳回补充


## 🔴 约束清单
- 强制使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 兼容现有架构
- 接口文档完整
- 评估性能影响
- 技术方案可执行
- 生成 IMPLEMENTATION_PLAN.md
- 生成 AGENTS.md
- 工作目录: /root/.openclaw/vibex

## 📦 产出路径
/root/.openclaw/vibex/docs/vibex-canvas/architecture.md

## 📤 上游产物
- create-prd: /root/.openclaw/vibex/docs/vibex-canvas/prd.md
