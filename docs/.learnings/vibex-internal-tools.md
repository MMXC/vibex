# Learnings: vibex-internal-tools

## 项目概览
dedup REST API (E1) + CLI 集成 (E2) + Slack 告警 (E3)，合计 4h。

## 核心决策

### 1. stdlib-only 内部工具设计
**决策**: dedup API 使用 `urllib` + `http.server`，CLI 用纯 `subprocess`
**结果**: 零外部依赖，部署简单，agent 可直接调用
**适用场景**: 内部工具 / CLI / 轻量服务，不适用于需要 async/并发控制的场景

### 2. E2 → E3 依赖链设计
**设计**: E2 完成后才解锁 E3 dev
**效果**: coord 正确串联 dev-dedup-api封装 → dev-coord集成 → dev-告警通知
**教训**: 有明确先后顺序的 Epic 必须通过依赖链约束，否则 E3 抢跑会丢失集成价值

### 3. E2/E3 的 task chain 自动依赖
E2 dev → E3 dev 之间通过 `reviewer-push-e2` 串联，Phase2 创建时已预置：
```
E1 dev → E2 dev (依赖 reviewer-push-e1)
E3 dev (依赖 reviewer-push-e2)
```
coord 追加 E3 时只需加依赖 `reviewer-push-e2`，系统自动生成正确的等待关系。

## 经验

### 快速启动小工具项目
- **PRD 极简**: 内部工具 PRD 可压缩到 1 页（API 设计 + CLI 用例 + 告警规则）
- **自包含**: 所有脚本放在 `scripts/` 下，dev 自己完成测试 + reviewer push
- **无前端**: 不需要 gstack browse 验证，commit + changelog 即可判断完成

### coord 追加 Epic 流程
当用户提出新增需求时：
1. 更新 IMPLEMENTATION_PLAN（追加 Epic 行 + 任务分解行 + DoD）
2. 用 `task add` 追加 dev → tester → reviewer → reviewer-push 四节点
3. 最后一个 reviewer-push 依赖前一个的 reviewer-push（链式依赖）

## 跨项目参考
- dedup API 模式可复用为其他内部服务的 REST 健康检查接口
- CLI stdlib wrapper 模式适合所有 agent 调用的命令行工具
