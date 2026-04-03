# Dev Agent 提案 — 2026-03-24

**日期**: 2026-03-24
**Agent**: dev
**来源**: vibex-dev-proposals-20260324_0958

---

## 执行时间
2026-03-24 09:56 (Asia/Shanghai)

## 状态扫描
- **最近完成**: homepage-cardtree-debug Epic1-4 ✅, proposal-dedup-mechanism Epic1-2 ✅
- **待处理**: proposal-dedup-reviewer1-fix 仅完成 PRD，implementation 未开始
- **技术债**: CardTreeNode 组件单元测试缺失，dedup 机制未生产验证

---

## 提案列表

### 提案 D-001: CardTreeNode 组件单元测试补全 (P1, 4h)

**问题描述**: homepage-cardtree-debug Epic1-4 完成度较高，但 CardTreeNode 组件本身缺少独立的单元测试。目前仅有 Epic3 的集成测试覆盖交互逻辑，组件边界（props 校验、状态转换、渲染分支）未被充分测试。

**改进建议**:
1. 为 `CardTreeNode` 组件创建 `CardTreeNode.test.tsx`
2. 覆盖场景：正常渲染、children 为空、多层级嵌套、stepType 分支（diagnostic/pre-diagnostic/manual）、选中态切换
3. 为 `boundedContextsToCardTree` 转换函数创建单元测试

**预期收益**: 组件可靠性提升，回归问题提前暴露，测试覆盖率从 ~60% 提升至 ~85%

**工作量估算**: M（4h）

**关联文件**:
- `vibex-fronted/src/components/CardTree/CardTreeNode.tsx`
- `vibex-fronted/src/components/CardTree/CardTreeRenderer.tsx`
- `vibex-fronted/src/components/CardTree/__tests__/CardTreeNode.test.tsx`（待创建）

---

### 提案 D-002: proposal-dedup 机制生产验证 (P1, 2d)

**问题描述**: proposal-dedup-mechanism Epic1-2 已完成，Epic2 E2E 测试全部 57 tests 通过。但机制从未在真实项目中运行，关键词提取（Chinese bigram 保留）的边界情况未充分验证。

**改进建议**:
1. **阶段一（1d）**: 搭建 staging 环境，导入真实提案数据（`proposals/20260323_*/`）运行 dedup 扫描
2. **阶段二（0.5d）**: 验证 Chinese bigram 提取正确性——"中央区域画布展示"应提取哪些关键词？对比人工标注
3. **阶段三（0.5d）**: 修复发现的问题，更新测试用例

**预期收益**: dedup 机制可投入生产使用，消除关键词误判导致的提案误去重

**工作量估算**: L（2d）

**关联文件**:
- `vibex-backend/src/routes/proposals.py`
- `proposals/20260323_*/`（测试数据）
- `scripts/task_manager.py`（dedup 集成）

---

### 提案 D-003: 前端错误处理模式统一 (P2, 2d)

**问题描述**: CardTree Epic4 实现了组件级错误处理（超时检测、降级展示），但错误处理模式分散在多个组件中：CardTree/ErrorState、useJsonTreeVisualization、HomePage。缺乏统一的错误类型定义和恢复策略。

**改进建议**:
1. 定义 `ErrorType` 枚举：`NETWORK_ERROR | TIMEOUT | PARSE_ERROR | UNKNOWN`
2. 创建 `useErrorHandler` hook，统一错误捕获 + 重试逻辑
3. 重构 CardTree 错误处理，接入统一 hook
4. 文档化错误恢复策略（哪些错误可重试？重试几次？）

**预期收益**: 错误处理代码减少 ~40%，用户体验一致，调试成本降低

**工作量估算**: L（2d）

**关联文件**:
- `vibex-fronted/src/hooks/useErrorHandler.ts`（待创建）
- `vibex-fronted/src/components/CardTree/`
- `vibex-fronted/src/components/ErrorState/`

---

## 今日工作总结

### 完成的工作
无（今日刚开始）

### 识别的问题
1. **CardTreeNode 单元测试缺失** — Epic1-4 集成测试覆盖不足，组件边界未充分测试
2. **dedup 机制生产盲区** — Chinese bigram 提取未经验证
3. **前端错误处理分散** — 多个组件独立实现，模式不统一

---

## 提案优先级

| 优先级 | 提案 | 工作量 | 状态 |
|--------|------|--------|------|
| P1 | D-001 CardTreeNode 单元测试 | M | 待领取 |
| P1 | D-002 dedup 生产验证 | L | 待领取 |
| P2 | D-003 错误处理模式统一 | L | 待领取 |

---

## 关联追踪

- **vibex-homepage-cardtree-debug** Epic1-4 ✅ — CardTreeNode 实现完成
- **proposal-dedup-mechanism** Epic1-2 ✅ — 核心机制完成，待生产验证
- **proposal-dedup-reviewer1-fix** 仅 PRD — implementation 未开始
