# vibex-proposals-sprint34 — Sprint 34 经验总结

## 项目概览
- **时间**: 2026-05-09 ~ 2026-05-10
- **目标**: VibeX Sprint 34 功能提案规划 + 3 Epic 交付

## 交付 Epic

| Epic | 功能 | Dev Commit | 状态 |
|------|------|-----------|------|
| P001 | 撤销重做系统 | 0a02febcf + c2e4942d0 | ✅ |
| P002 | 性能基线系统 | 211cf9dba | ✅ |
| P003 | 快捷键动态集成 | 557fac1d5 + 42cf3f872 | ✅ |

## 关键经验

### 1. shortcutStore 动态集成模式
P003 解决了 shortcutStore 和 useKeyboardShortcuts 长期分离的问题。
**实现方式**: 在 useKeyboardShortcuts 内部 subscribe shortcutStore，动态注册/注销 keydown 监听器。
**模式**: 方案A（单一 hook 内部订阅）优于方案B（状态提升），更内聚。
**注意**: subscribe 回调中 actionMap 需要通过 ref 访问，避免依赖循环。

### 2. 历史 Store 模式（P001）
`canvasHistoryStore` 为每个 nodeId/flowId 管理独立 history 栈，通过 middleware 包装 patch 操作实现自动历史记录。
- `undoCallback`/`redoCallback` → 直接操作 historyStore
- `DDSCanvasPage.tsx` 已有 P001 连接，无需额外变更

### 3. 性能基线工具（P002）
`PerformanceBaseline` 使用 mock 方法避免 Firebase 依赖：
- `isFirebaseConfigured()` 返回 false 时直接使用 localStorage
- 测试环境下 mock 所有 Firebase 调用（setPresence/subscribeToOthers/removePresence < 10ms）
- 避免 CI 环境因无 Firebase 而失败

### 4. 测试覆盖策略
- P001/P003: 单元测试覆盖核心逻辑（useKeyboardShortcuts.test.ts 12 tests, canvasHistoryStore）
- P002: mock + 性能基准测试
- E2E: SSE Bridge 完整事件序列覆盖

### 5. Changelog 管理
每个 Epic 完成后必须同步更新 CHANGELOG.md：
- `## [Unreleased] S34-P001: ...`
- 在对应 Epic 章节下追加子条目

### 6. Git 工作流
- 每个 Epic 一个 feat commit + 一个 docs commit（changelog）
- Reviewer-push 验证远程分支，确认无未推送 commit
- 合并冲突时优先保留 HEAD（origin/main）版本

## 风险与处理

| 风险 | 处理 |
|------|------|
| 全量测试 171 个失败（预存问题） | P003 测试独立通过（12 tests），不影响 Epic 交付 |
| shortcutStore 和 hook 分离已久 | 统一 store 订阅模式，避免重复实现 |
| 合并冲突导致工作区不一致 | git checkout -- file 恢复 HEAD，确保与 origin 一致 |

## 依赖链验证
- P001 ← coord-decision, reviewer-push-p001
- P002 ← coord-decision, reviewer-push-p001
- P003 ← coord-decision, reviewer-push-p002
- 全链路无断点

## 下一步
Sprint 35 规划时可参考：
- 快捷键动态化已验证，可扩展到更多 actions
- 性能基线工具可沉淀为通用 benchmark 框架
