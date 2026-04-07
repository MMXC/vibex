# VibeX 提案汇总 — 2026-03-24

**汇总时间**: 2026-03-24 10:15 (UTC+8)  
**汇总人**: Analyst  
**提案来源**: dev × 3, analyst × 5, architect × 5, pm × 0, tester × 6, reviewer × 2  
**总计**: 21 条提案（P0 × 3, P1 × 8, P2 × 7, P3 × 3）

---

## 一、执行摘要

本次汇总覆盖 6 个 Agent 的自检提案，共识别 **3 个 P0 阻断项**、**8 个 P1 优先项**、**7 个 P2 改进项**、**3 个 P3 规划项**。

### 跨 Agent 提案聚类

提案存在明显的跨 Agent 关联，按影响域聚类：

| 聚类 | 提案数 | 核心主题 | 关联 Agent |
|------|--------|---------|-----------|
| A. 工具链稳定性 | 5 | task_manager/heartbeat/提案去重 | analyst, reviewer, dev |
| B. 前端质量与测试 | 8 | CardTreeNode/E2E/CI/accessibility | dev, tester, reviewer |
| C. 架构债务 | 5 | ErrorBoundary/Store拆分/共享类型 | architect |
| D. AI Agent 治理 | 3 | MEMORY同步/失败模式/报告质量 | analyst |

---

## 二、P0 阻断项（立即处理）

### 🔴 P0-1: page.test.tsx 4 个预存失败

**来源**: tester (T-001)  
**持续时间**: 2026-03-20 至今（4天）  
**问题**: `simplified-flow` 重构后布局从 5 栏 → 3 步流程，4 个测试用例过时：`three-column layout`, `navigation`, `five process steps`, `basic elements`  
**影响**: CI 测试可信度持续受损，每次 CI 报告都有失败标记  
**方案**: 删除或更新 4 个过时测试用例  
**工时**: 1h  
**负责**: dev  

### 🔴 P0-2: task_manager.py list/claim 命令挂起

**来源**: analyst (P0)  
**问题**: `task_manager.py list/claim` 执行后无输出，卡在 `CMDS DEFINITION`，阻塞所有 Agent 心跳自动化  
**根因**: 循环依赖或死锁、阻塞 I/O 无超时保护  
**方案**: 添加超时装饰器，heartbeat 脚本降级为直接读写 JSON  
**工时**: 2-4h  
**负责**: dev  

### 🔴 P0-3: proposal-dedup 生产验证缺失

**来源**: dev (D-002), analyst, reviewer  
**问题**: dedup 机制从未在真实数据上运行，路径 Bug + 字段 Bug 刚被修复，Chinese bigram 提取边界未验证  
**方案**: 导入 `proposals/20260323_*/` 真实数据，验证关键词提取正确性  
**工时**: 2d  
**负责**: dev + tester  

---

## 三、P1 优先项（本 Sprint）

### 🟠 P1-1: ErrorBoundary 组件去重

**来源**: architect (P0)  
**问题**: `components/error-boundary/ErrorBoundary.tsx` 和 `components/ui/ErrorBoundary.tsx` 两份实现，功能重叠  
**方案**: 统一到 `components/ui/`，废弃 `error-boundary/` 目录  
**工时**: 0.5d  
**负责**: dev  

### 🟠 P1-2: heartbeat 脚本幽灵任务误报

**来源**: reviewer (P1)  
**问题**: heartbeat 读取不存在的项目目录时仍报告"待处理"，产生误报  
**方案**: 读取任务前先检查 `/root/.openclaw/team-tasks/projects/{project}/tasks/` 目录是否存在  
**工时**: 0.5d  
**负责**: dev  

### 🟠 P1-3: CardTreeNode 组件单元测试补全

**来源**: dev (D-001)  
**问题**: CardTreeNode 缺少独立单元测试，仅 Epic3 集成测试覆盖  
**方案**: 覆盖正常渲染/空children/多层级嵌套/stepType分支/选中态切换场景  
**工时**: 4h  
**负责**: dev  

### 🟠 P1-4: confirmationStore.ts 拆分重构

**来源**: architect (P1)  
**问题**: `confirmationStore.ts` 461 行，违反单一职责，5 个子流程混在一个 Store  
**方案**: Zustand slice pattern 拆分为 `useRequirementStep/useContextStep/useModelStep/useFlowStep`  
**工时**: 1.5d  
**负责**: dev + architect  

### 🟠 P1-5: E2E 测试纳入 CI

**来源**: tester (T-003)  
**问题**: 9 个 Playwright 测试游离于 CI 之外，无自动化回归防护  
**方案**: 将 Playwright 测试集成到 CI pipeline  
**工时**: 2h  
**负责**: dev  

### 🟠 P1-6: API 错误处理测试补全

**来源**: tester (T-002)  
**问题**: `src/services/api.test.ts` 仅验证方法存在，不测错误边界  
**方案**: 补全 401/403/404/500 处理、网络超时、并发取消测试  
**工时**: 2h  
**负责**: dev  

### 🟠 P1-7: Accessibility 测试基线

**来源**: tester (T-005)  
**问题**: 无 WCAG 合规性自动化检测  
**方案**: 为 confirm/flow/dashboard 核心页面添加 jest-axe 测试  
**工时**: 2h  
**负责**: dev  

### 🟠 P1-8: HEARTBEAT.md 话题追踪脚本实现

**来源**: analyst (P1)  
**问题**: TASK_THREADS 规范存在但工具链未实现  
**方案**: 心跳脚本加入话题 ID 提取 + `--reply-to` 回复逻辑  
**工时**: 1d  
**负责**: analyst/dev  

---

## 四、P2 改进项（规划中）

| ID | 提案 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| P2-1 | 阶段任务报告约束清单截断修复 | reviewer (P1→P2) | 0.5d | 约束清单显示单字截断，需排查报告生成逻辑 |
| P2-2 | 前端错误处理模式统一 | dev (D-003) | 2d | ErrorType 枚举 + useErrorHandler hook |
| P2-3 | MEMORY.md AI Agent 失败模式扩展 | analyst (P2) | 0.5d | 增加 5 个 AI 特有失败模式 |
| P2-4 | 分析报告质量检查机制 | analyst (P2) | 0.5d | 轻量级报告审查清单 |
| P2-5 | React Query 覆盖率提升 | architect (P3) | 2d+ | 审计所有 api.ts 调用点，逐步迁移 |
| P2-6 | Landing Page Monorepo 整合 | architect (P4) | 1d | landing-page 作为 workspace package |

---

## 五、P3 规划项（长期）

| ID | 提案 | 来源 | 工时 | 说明 |
|----|------|------|------|------|
| P3-1 | 共享类型包建设 | architect (P2) | 2d | packages/types/ 前后端类型同步 |
| P3-2 | Mock 数据质量提升 | tester (T-004) | - | 持续迭代 |
| P3-3 | 测试报告自动化 | tester (T-006) | - | 持续迭代 |

---

## 六、提案关联图

```
P0-3 dedup生产验证
├── dev D-002: 阶段一 staging + 真实数据
├── reviewer: reviewer1-fix 修复后重新审查
└── tester: T-001 验证关键词提取正确性

P1-4 confirmationStore拆分
└── P3-1 共享类型包（前置依赖）

P2-2 错误处理统一
├── dev D-003: ErrorType + useErrorHandler
└── P1-1 ErrorBoundary去重（前置）

P1-8 HEARTBEAT话题追踪
├── analyst P1: 话题追踪规范
└── P0-2 task_manager修复（心跳依赖）
```

---

## 七、工时汇总

| 类别 | P0 | P1 | P2 | P3 | 合计 |
|------|----|----|----|----|------|
| 工具链 | 2d | 1d | 1d | - | 4d |
| 前端质量 | 1h | 13.5h | 3d | - | ~16h |
| 架构 | - | 2d | 3d | 2d | 7d |
| AI治理 | - | 1d | 1d | - | 2d |
| **合计** | **~2d** | **~5d** | **~7d** | **~2d** | **~16d** |

> 注: 工具链 P0-2 涉及所有 Agent，建议 **dev 最优先处理**

---

## 八、推荐执行计划

### Sprint 1（本週）：止血 + 快速见效
| # | 任务 | 负责 | 工时 | 依赖 |
|---|------|------|------|------|
| 1 | P0-2 task_manager 挂起修复 | dev | 2-4h | 无 |
| 2 | P0-1 page.test.tsx 修复 | dev | 1h | 无 |
| 3 | P1-1 ErrorBoundary 去重 | dev | 0.5d | 无 |
| 4 | P1-2 heartbeat 幽灵任务修复 | dev | 0.5d | 无 |
| 5 | P1-3 CardTreeNode 单元测试 | dev | 4h | 无 |

### Sprint 2（下週）：生产验证 + 架构铺垫
| # | 任务 | 负责 | 工时 | 依赖 |
|---|------|------|------|------|
| 6 | P0-3 dedup 生产验证 | dev+tester | 2d | reviewer1-fix 完成 |
| 7 | P1-4 confirmationStore 拆分 | dev+architect | 1.5d | 无 |
| 8 | P1-8 HEARTBEAT 话题追踪 | analyst/dev | 1d | P0-2 |

### Sprint 3（持续）：质量与架构
- P2-2 错误处理统一（2d）
- P1-5 E2E 纳入 CI（2h）
- P1-6 API 错误测试（2h）
- P1-7 Accessibility 基线（2h）
- P3-1 共享类型包（2d）

---

## 九、待确认项

1. **dedup reviewer1-fix 进展**: Bug 修复由谁负责？是否已派发给 dev？
2. **confirmationStore 拆分范围**: 是否包含 `useConfirmationStore` 历史快照逻辑？
3. **E2E CI 集成**: 当前 CI runner 是否支持 Playwright？
