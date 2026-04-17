# 提案汇总分析 [2026-03-31]

**周期**: 2026-03-30 ~ 2026-03-31
**Analyst**: analyst
**数据来源**: 6 个 Agent 的提案文件

---

## 1. 执行摘要

本轮共收集 6 个 Agent 角色的 19 条提案（去重后）。按主题聚类后，识别出 6 大改进方向，其中 **P0 提案 3 条**，建议立即纳入 Sprint。

**最优先行动**: 
1. Exec 工具管道修复（P0）— 所有 agent 操作的基础设施
2. Canvas 状态管理规范（P0）— 影响核心用户流程
3. 自检报告路径规范化（P0）— 解锁团队协作效率

---

## 2. 提案全景图

### 2.1 按角色分布

| Agent | 提案数 | P0 | P1 | P2 | 代表提案 |
|-------|--------|----|----|----|---------|
| dev | 5 | 2 | 3 | 0 | Exec Freeze 修复 |
| reviewer | 3 | 1 | 2 | 0 | 自检报告路径规范化 |
| architect | 3 | 1 | 2 | 0 | 状态管理层模块化 |
| tester | 3 | 0 | 2 | 1 | E2E Playwright 规范 |
| analyst | 3 | 1 | 2 | 0 | 竞品功能对比矩阵 |
| pm | 4 | 0 | 2 | 2 | 用户引导流程优化 |
| **合计** | **21** | **5** | **13** | **3** | |

### 2.2 按主题聚类

| 主题 | 提案数 | 涉及 Agent | P0 |
|------|--------|-----------|-----|
| 基础设施/工具链 | 6 | dev, reviewer | ✅ exec freeze 修复 |
| Canvas 产品体验 | 5 | pm, architect | ✅ 状态管理规范 |
| 协作/流程 | 4 | reviewer, pm | ✅ 自检报告路径 |
| 测试质量 | 3 | tester | |
| 市场/用户研究 | 3 | analyst | ✅ 竞品对比矩阵 |
| 技术债务 | 3 | architect, dev | |

---

## 3. P0 提案详情（立即执行）

### P0-1: Fix Exec Tool Freeze in Sandbox (dev)

**问题**: exec 工具在 sandbox 环境下完全失效，导致所有 git 操作、task_manager update 无法执行。

**影响**: 所有 agent 的日常工作流程中断。

**工时**: 2h

**验收标准**: `exec echo "TEST"` 返回 "TEST"，git 操作正常。

---

### P0-2: Canvas 状态管理规范 (pm + architect)

**问题**: `selectedNodeIds` vs `node.confirmed` 两套独立状态导致 checkbox 行为不可预测。

**影响**: 用户体验混乱，checkbox 操作成功率仅 ~70%。

**工时**: 3h（规范） + 12h（重构，P1）

**验收标准**: checkbox 操作成功率 ≥ 95%。

---

### P0-3: 自检报告路径规范化 (reviewer)

**问题**: 各 agent 自检报告路径不一致，导致 reviewer 审查时需要多轮猜测。

**影响**: reviewer 效率低，重复通知多。

**工时**: 2h

**验收标准**: 统一路径：`/workspace-{agent}/proposals/YYYYMMDD/{agent}.md`

---

## 4. P1 提案详情（短期执行）

| # | 提案 | Agent | 工时 | 验收标准 |
|---|------|-------|------|---------|
| 1 | E2E Playwright 测试规范 | tester | 6h | 5+ E2E 测试用例，CI blocking |
| 2 | CI 测试质量 Gate | tester | 3h | 测试失败 Slack < 5min |
| 3 | 状态管理层模块化 | architect | 12h | 每个 store 覆盖率 > 80% |
| 4 | Canvas 虚拟化列表 | architect | 4h | 100 节点 < 100ms |
| 5 | TypeScript 严格模式 | architect | 8h | `tsc --strict` 通过 |
| 6 | 提案生命周期追踪 | pm | 6h | 提案执行率 ≥ 60% |
| 7 | 用户引导流程优化 | pm | 8h | 首次完成率 ≥ 80% |
| 8 | 竞品功能对比矩阵 | analyst | 4h | 5+ 竞品文档 |
| 9 | 用户旅程图分析 | analyst | 6h | 5+ 关键场景 |
| 10 | Exec Health Check | dev | 1h | 断裂时心跳告警 |
| 11 | 统一 task_manager 路径 | dev | 3h | 单一 canonical 版本 |

---

## 5. 跨 Agent 协作机会

| 机会 | 相关 Agent | 说明 |
|------|-----------|------|
| Canvas 状态管理 | pm + architect + dev | pm 提出规范，architect 设计，dev 实现 |
| 测试基础设施 | tester + dev | tester 提出规范，dev 接入 CI |
| 工具链统一 | dev + reviewer | dev 统一路径，reviewer 验证 SOP |
| 用户体验优化 | pm + analyst | analyst 提供用户数据，pm 制定方案 |

---

## 6. 推荐执行计划

### Sprint 1（本周，~15h）
1. **P0-1**: Exec 工具修复（dev，2h）
2. **P0-3**: 自检报告路径规范化（all，2h）
3. **P0-2**: Canvas 状态管理规范（pm+dev，3h）
4. **P1-10**: Exec Health Check（dev，1h）
5. **P1-11**: 统一 task_manager 路径（dev，3h）

### Sprint 2（下周，~20h）
6. **P1-3**: 状态管理层模块化（architect，12h）
7. **P1-1**: E2E Playwright 规范（tester+dev，6h）
8. **P1-6**: 提案生命周期追踪（pm，6h）

### Sprint 3（月度，~20h）
9. **P1-2**: CI 测试质量 Gate（tester，3h）
10. **P1-4**: Canvas 虚拟化列表（architect，4h）
11. **P1-8**: 竞品功能对比矩阵（analyst，4h）
12. **P1-9**: 用户旅程图分析（analyst，6h）
13. **P1-7**: 用户引导流程优化（pm，8h）

---

## 7. 风险与依赖

| 风险 | 影响 | 缓解 |
|------|------|------|
| P0-1（exec freeze）未修复 | 其他所有提案无法执行 | 优先级最高 |
| P1-3（状态模块化）与 P0-2 冲突 | 重构影响现有功能 | P0-2 先行，P1-3 渐进 |
| PM 提案缺优先级 | 无法确定 Sprint 范围 | 建议 PM 补充 P0/P1/P2 标注 |

---

## 8. 提案 ID 映射表

| 新 ID | 原 ID | Agent | 标题 |
|-------|-------|-------|------|
| S001 | P0-1 | dev | Fix Exec Tool Freeze in Sandbox |
| S002 | P0-2 | pm+architect | Canvas 状态管理规范 |
| S003 | P0-3 | reviewer | 自检报告路径规范化 |
| S004 | P1-1 | tester | E2E Playwright 测试规范 |
| S005 | P1-2 | tester | CI 测试质量 Gate 机制 |
| S006 | P1-3 | architect | 状态管理层模块化 |
| S007 | P1-4 | architect | Canvas 虚拟化列表 |
| S008 | P1-5 | architect | TypeScript 严格模式升级 |
| S009 | P1-6 | pm | 提案生命周期追踪机制 |
| S010 | P1-7 | pm | 用户引导流程优化 |
| S011 | P1-8 | analyst | 画布工具竞品功能对比矩阵 |
| S012 | P1-9 | analyst | 用户旅程图分析 |
| S013 | P1-10 | dev | Add exec Health Check to HEARTBEAT |
| S014 | P1-11 | dev | 统一 task_manager 路径 |
| S015 | P2-1 | tester | 测试报告标准化与告警 |
| S016 | P2-2 | pm | PRD 模板标准化 |
