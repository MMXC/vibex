# 阶段任务报告：tester-epic2-核心体验基础
**项目**: vibex-p0-q2-sprint1
**领取 agent**: tester
**领取时间**: 2026-04-14T08:54:19.162975+00:00
**版本**: rev 18 → 19

## 项目目标
Sprint 1: P0清理 + 核心体验 (P-001 Auth/Pagelist品牌一致性, P-002 需求智能补全, P-003 项目搜索, P-004 Canvas Phase导航, P-010+A-P1-3 错误体验统一, Dev P0-1/2/3) | 合计约27-29h

## 阶段任务
# ★ Agent Skills（必读）
# `test-driven-development` — 测试策略、测试用例设计
# `browser-testing-with-devtools` — 浏览器测试、真实用户流程验收
# `frontend-ui-engineering` — 前端 UI 渲染验证
# `performance-optimization` — 性能指标检查

# ★ Phase2 测试任务（tester）

测试 Epic: Epic2-核心体验基础

## 📁 工作目录
- 项目路径: /root/.openclaw/vibex
- 验收脚本: /root/.openclaw/vibex/docs/vibex-p0-q2-sprint1/AGENTS.md

## ★ 测试方法（两种必须结合）

### 方法一：代码层面检查（使用 /ce:review）
- 使用 `/ce:review` 技能的测试维度
- 检查单元测试覆盖率、断言质量、边界条件
- 适合：后端逻辑、工具函数、数据模型

### 方法二：真实用户流程验收（使用 /qa）★ 关键 ★
**针对前端相关代码变动，必须显式调用 gstack 的 `/qa`**
- 启动浏览器，访问 Staging URL
- 执行完整用户操作路径
- 输出可视化测试报告
- 这是区分"脑内测试"和"真实测试"的关键

## 你的任务
1. 对照 IMPLEMENTATION_PLAN.md 确认测试覆盖
2. 代码层面：使用 `/ce:review` 检查单元测试
3. 前端层面：使用 `/qa` 进行真实浏览器验收
4. 运行测试：确保 100% 通过率
5. 截图保存测试证据

## 驳回红线
- dev 无 commit → 标记 failed
- 测试失败 → 驳回 dev
- 缺少关键测试用例 → 驳回 dev
- 前端代码变动但未使用 `/qa` → 驳回 dev（必须真实测试）


## 🔴 约束清单
- 工作目录: /root/.openclaw/vibex
- 测试100%通过
- 覆盖所有功能点
- 必须验证上游产出物

## 📦 产出路径
npm test 验证通过

## 📤 上游产物
- dev-epic2-核心体验基础: /root/.openclaw/vibex

## ⏰ SLA Deadline
`2026-04-15T16:54:19.159084+08:00` (24h 内完成)
