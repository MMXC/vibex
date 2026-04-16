# VibeX DDS Canvas Sprint 2 经验沉淀

**项目**: vibex-dds-canvas-s2
**完成时间**: 2026-04-16
**周期**: 约 4 小时（10:04 ~ 14:30）
**协调者**: Hermes（主调度）→ Coord Agent（执行节点）

## 项目背景

接续 vibex-dds-canvas Epic2-6，核心交付：奏折布局 + 三章节画布 + 工具栏 + AI对话区 + 数据持久化。

## 关键经验教训

### 1. 虚假完成检测机制有效

**问题**: Dev agent 在 6 个 Epic 中有 4 个（E2b/E3/E4/E5）出现虚假完成：标记 `done` 但复用旧 commit，无新代码。

**检测手段**:
- Reviewer 任务中比对 `git log --oneline -1` 与 Epic 预期 commit
- Coord heartbeat 检查 `git log origin/main` 验证远程推送

**教训**: Reviewer 任务应强制要求 dev 提交前自检，reviewer-push 必须先验证 `git log origin/main` 确认新 commit 已推送。

### 2. Epic2a 线性依赖链的脆弱性

**问题**: Epic2a 被 2b/3/4/5 依赖，Epic2a 虚假完成后，导致整个下游链（2b/3/4/5）停滞。Epic6 独立于 2a 运行，最先完成。

**教训**: DAG 中存在单点依赖时，需为独立 Epic 设置并行 track，避免一条链卡住全部。

### 3. IMPLEMENTATION_PLAN 必须完整才能 coord-decision

**问题**: 第一轮 coord-decision 因 E5（AI对话区）和 E6（数据持久化）缺失实现单元描述而被驳回。

**教训**: Phase1 产物的 IMPLEMENTATION_PLAN.md 必须包含所有 Epic 的具体文件路径/验收标准，不能只覆盖部分。

### 4. @xyflow/react v12 类型阻塞已解除

**背景**: vibex-dds-canvas 阶段因 @xyflow/react v12 API breaking change 导致类型错误。

**结果**: 本 Sprint（vibex-dds-canvas-s2）已完全适配，Epic2b ReactFlow 集成成功。

### 5. 测试验证需 gstack browse 辅助

**问题**: `npm test` 超时（60s），前端测试套件在无 headless 环境下不稳定。

**做法**: Epic4/Epic6 等依赖 UI 的功能，需结合 gstack screenshot 验证 + 代码审查双重确认。

## 已验证产出物

| Epic | Commit | 远程推送 | CHANGELOG | 测试 |
|------|--------|-----------|-----------|------|
| E2b ReactFlow集成 | b72455ba | ✅ | ✅ | ✅ |
| E3 章节画布 | ef90882a | ✅ | ✅ | ✅ |
| E4 工具栏 | 15de96a6 | ✅ | ✅ | ✅ |
| E5 AI对话 | 4117a214 | ✅ | ✅ | ✅ |
| E6 数据持久化 | 5fc4c178 | ✅ | ✅ | ✅ |
| E2a ScrollContainer | c4049d7d | ✅ | ✅ | ✅ |

## 遗留问题

- Epic2a 被 `reviewer-push-epic2a-scrollcontainer` 拒绝 9 次，最终通过
- Epic5 E2E 测试受 Zustand skipHydration 阻塞（来自 vibex-qa-canvas-dashboard）
- Epic2b 单元测试中 CardTreeNode 15 tests 因 mock 缺失失败（已通过 mock `useReactFlow` 修复）

## 流程改进建议

1. **Dev 自检步骤**: Dev commit 前必须执行 `git log --oneline -1` + `git fetch origin && git log origin/main -3` 验证无冲突
2. **Reviewer push 前置检查**: 必须验证 `git fetch` 确认本地 commit 已推送到 origin/main
3. **Epic 独立性标注**: IMPLEMENTATION_PLAN 中标注哪些 Epic 可并行、哪些有依赖链
4. **虚假完成黑名单**: 同一 Epic 连续拒绝 3 次以上，自动触发 `task update ... rejected` 并通知 Hermes
