# Learnings: vibex-next (2026-04-25)

## Project Summary
- **Goal**: 实时协作感知 + 性能可观测性 + Analytics（Firebase Presence + WebVitals + 自建轻量 analytics）
- **Epics**: E1 TypeScript债务清理 / E2 Firebase可行性验证 / E3 Import/Export E2E覆盖 / E4 PM质量门禁
- **Duration**: 2026-04-25 pipeline 执行
- **Status**: completed

## Epic Execution Summary

| Epic | Dev Commit | Tester | Reviewer | Reviewer-Push | Status |
|------|-----------|--------|----------|---------------|--------|
| E1 TypeScript债务清理 | a7f0ce9e2 | ✅ | ✅ | ✅ | DONE |
| E2 Firebase可行性验证 | b8f63a137 | ✅ 7/7 | ✅ | ✅ | DONE |
| E3 Import/Export E2E覆盖 | a90674e79 | ✅ | ✅ | ✅ | DONE |
| E4 PM质量门禁 | c9612cd25 | ✅ | ✅ | ✅ | DONE |

## Key Learnings

### 1. Firebase 零SDK依赖方案 — 避免冷启动风险 (E2, workflow_issue)
**问题**: Firebase SDK 引入冷启动延迟和包体积增加，与性能可观测性目标冲突。

**方案**: 采用 Firebase REST API（零 SDK 依赖），Mock < 10ms，REST API 零冷启动，降级路径用 polling fallback。

**经验**: 第三方服务优先评估 REST API 可行性，SDK 引入前必须验证冷启动影响。性能敏感场景（实时协作感知）禁止引入有冷启动风险的 SDK。

**防范**: Firebase 新功能引入前必须通过冷启动 benchmark，REST API fallback 必须同步实现。

### 2. TypeScript 债务清理分阶段策略 (E1, best_practice)
**问题**: 后端 TypeScript 编译错误 197 → 0 一次性清理风险大，阻塞其他开发。

**方案**: 分阶段清理，第一阶段降至 28 个错误（修复 ddd.ts/openapi.ts/logger.ts/notifier.ts/schemas 等关键文件），Zod4 兼容性、DurableObject Binding 分离、SessionManager 返回值同步处理。

**经验**: 大规模 TS 债务用分阶段 + CI tsc gate 锁定，防止回退。AS_ANY 基线建立（163 pre-existing）隔离新问题与存量问题。

### 3. E2E 测试分层 — Teams API + 文件格式全覆盖 (E3, best_practice)
**产出**: 26 个 E2E 测试（Teams API 5 + JSON round-trip 6 + YAML round-trip 7 + 文件大小限制 8）。

**经验**: Import/Export 功能按三个维度覆盖：CRUD 端点、格式解析（JSON/YAML/特殊字符/Unicode）、边界值（5MB 文件大小限制）。每个维度独立 E2E suite，互不干扰。

### 4. PM 质量门禁 — 评审流程标准化 (E4, workflow_issue)
**产出**: Coord 评审四态表、Design Token 情绪地图检查点、PRD v2.0 模板（新增"本期不做"章节）、SPEC 模板更新。

**经验**: PM 质量门禁不是开发任务，而是流程升级。coord-decision 阶段标准化后，每次提案自动获得评审检查点，无需人工介入。

### 5. CI TypeScript Gate — 自动化质量门禁 (E1, tooling_addition)
**产出**: CI 新增 `typecheck-backend` + `typecheck-frontend` 独立 job，`tsc --noEmit` 作为独立 gate，`as-any-baseline` job 基线 163。

**经验**: TS gate 必须与构建流程分离，独立 job 才能真正阻断合并。AS_ANY 基线文档必须随代码同步更新，防止基线漂移。

## Known Issues
- **4个 pre-existing UI 组件测试失败**（EmptyState/Dropdown/Input/CardTreeError variant/className 相关），与 E1-E4 产出无关，属存量测试债务，待后续 Sprint 处理。

## Related
- vibex-proposals-20260425 P001-P004：对应的具体功能实现产出
- vibex-sprint7-fix E1：CI TypeScript Gate 的独立 fix
