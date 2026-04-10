# Analysis: vibex-proposals-20260412 Sprint — Analyst Review (Updated)

**Project**: vibex-proposals-20260412
**Stage**: analyze-requirements
**Analyst**: analyst
**Date**: 2026-04-10
**Status**: Updated — 基于最新系统状态验证

---

## 1. Research — 历史经验索引

### 1.1 learnings/ 相关文档

| 文档 | 核心教训 | Sprint 关联 |
|------|----------|------------|
| `vibex-e2e-test-fix.md` | Epic 划分不当导致虚假完成；IMPL PLAN scope drift；PRD vs IMP 需严格对齐 | E5/E6 测试重构 |
| `canvas-testing-strategy.md` | Mock store 需真实反映 Zustand；Vitest vs Jest 隔离 | E5 waitForTimeout 重构 |
| `canvas-cors-preflight-500.md` | 路由注册顺序敏感；多层中间件防御性处理 | E3 CI守卫 |
| `canvas-api-completion.md` | Route 匹配优先级；Snapshot testing 高效性 | E4.2 @vibex/types 落地 |

### 1.2 Git History 关键发现

| 阶段 | Commit | 意义 |
|------|--------|------|
| canvas-code-audit (刚完成) | `774a08cb` ~ `a0d581ea` | P0-1/2/3 + P1-2/4/5 + P2-2 全部实现 |
| sse-backend-fix | `1c0366ba` | SSE 稳定性修复经验可复用 |
| vibex-fifth | `640468d5` ~ `353612f8` | Sprint 3 遗留未验收功能已清理 |

### 1.3 关键教训（防止重复犯错）

来自 `vibex-e2e-test-fix.md` 的高阶模式：
- **IMPL PLAN scope drift**: Architect 在 IMPLEMENTATION_PLAN 中创建了 PRD 中不存在的 Epic（E2 "Jest/Vitest 分离", E3 "CI Gate"），导致 task chain 虚假完成
- **虚假完成检测**: 仅检查 project-level status 不够，必须验证所有 Epic task chain
- **Epic 合并原则**: 当 Epic 间存在实现依赖时，应合并而非强行拆分

**→ 防范**: 本 sprint 的 IMPLEMENTATION_PLAN 需严格对照 PRD 范围，不得超出

---

## 2. 当前系统状态验证

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 前端 TypeScript 编译 | ✅ **0 errors** | 最关键的 P0 阻塞已解除 |
| canvas-code-audit P0 修复 | ✅ 全部完成 | F1.1/F1.2/F1.3 已实现 |
| canvas-code-audit P1 修复 | ✅ 全部完成 | F2.1-2.5 已实现 |
| 后端 Auth Mock | 🔴 需修复 | 16 suites/101 tests failing，getAuthUserFromRequest mock 未对齐 |
| 后端 Vitest/Jest | ✅ jest 30.2.0 可用 | 测试框架正常 |

**重大发现 1**: PRD 中描述的 "206 个 TypeScript 错误" 已经归零！这是本 sprint 最关键的变化。

**重大发现 2**: Backend 测试失败数量从 PRD 描述的 94 个增加到 101 个，根因相同：Auth mock `getAuthUserFromRequest` 函数签名变更（1参数→2参数），但 mock 未同步更新。测试返回 401 Unauthorized 而非预期响应。

---

## 3. PRD + Architecture 可行性评估

### 3.1 PRD 总体评估

**质量**: 高 — 20+ 提案经过 Analyst + Architect + Reviewer + Tester 四方评审，Epic 划分清晰，工时估算有基准

**完整性**: 满足 — 包含完整的 Epic/Story/功能点拆分，验收标准具体可测试

**主要问题**: 撰写时（2026-04-07）假设 TS 有 206 errors，但实际已经归零

### 3.2 Architecture 可行性评估

| Epic | 可行性 | 关键风险 | 建议 |
|------|--------|----------|------|
| **E0.1 TypeScript** | ✅ 已完成 | 无 | — |
| **E0.2 Auth Mock** | ✅ 可行 | 低 — 方案明确，jest 30.2.0 可用 | 3h 内可完成 |
| **E1 Token日志 safeError** | ✅ 可行 | 低 — 扫描+包装+测试链完整 | 并行 E0.2 执行 |
| **E2 提案状态追踪** | ✅ 可行 | 低 — 纯流程改进 | 1h |
| **E3 CI守卫** | ✅ 可行 | 低 — grepInvert 模式已在 e2e-test-fix 中验证 | — |
| **E4.1 ErrorBoundary** | ✅ 可行 | 中 — React ErrorBoundary 与现有代码的集成边界需确认 | 与 Dev 对齐 |
| **E4.2 @vibex/types 落地** | ⚠️ 有条件 | 中 — @vibex/types 的类型 Schema 需先完善 | 先做 Schema 调研 |
| **E4.3 v0→v1 迁移** | ✅ 可行 | 中 — 需覆盖所有 v0 路由 | 全量扫描 |
| **E4.4 frontend types 对齐** | ⚠️ 有条件 | 中 — 依赖 E4.2 的 Schema 完整性 | 后置 E4.2 |
| **E4.5 flowNodeIndex 优化** | ✅ 可行 | 低 — useMemo 优化，无副作用 | — |
| **E5 waitForTimeout 重构** | ⚠️ 有条件 | 中 — 87处替换存在 regression 风险 | 保留 stability.spec.ts 的 timeout |
| **E6 SOP + pre-commit** | ✅ 可行 | 低 — Husky + ESLint 成熟方案 | — |
| **E7 docs** | ✅ 可行 | 低 — 纯文档工作 | — |

### 3.3 IMPLEMENTATION_PLAN Scope Drift 风险

**⚠️ 警告**: IMPLEMENTATION_PLAN 中的 TS Epic 拆分（TS-E1~E4）与 PRD E0 的关系需厘清：

| IMPLEMENTATION_PLAN | 对应 PRD |
|---------------------|----------|
| TS-E1: Zod v4 迁移 | PRD E0.1 (F0.1-F0.3) |
| TS-E2: Cloudflare 类型 | PRD E0.1 (隐含) |
| TS-E3: as any 清理 | PRD E0.1 (隐含) |
| TS-E4: missing modules | PRD E0.1 (隐含) |
| Auth Mock | PRD E0.2 (F0.4) — **对齐** |

**风险**: IMPLEMENTATION_PLAN 的 TS-E1~E4 在 PRD 中不存在，属于 Architect 扩展 scope。历史上 `vibex-e2e-test-fix` 中发生过类似的 scope drift 导致虚假完成。

**建议**: 
- TS errors 已归零，TS-E1~E4 应标记为 N/A 或 DONE
- IMPLEMENTATION_PLAN 需与 PRD 重新对齐

---

## 4. 风险矩阵

| 风险 | 可能性 | 影响 | 缓解方案 |
|------|--------|------|----------|
| E4.2 @vibex/types Schema 不完整 | 中 | 高 — 类型不一致导致新的 TS 错误 | 先做 Schema 调研，确认 0 errors 后再落地 |
| E5 waitForTimeout 重构引入 regression | 中 | 中 — 87处替换，边界条件多 | 保留 stability.spec.ts 的 timeout；每批替换后运行 E2E |
| E4.1 ErrorBoundary 集成边界不清 | 中 | 中 — 三个 TreePanel 的错误隔离边界需定义 | 与 Architect + Dev 对齐集成方案 |
| IMPLEMENTATION_PLAN scope drift | 高 | 高 — 历史上已发生一次 | 严格对照 PRD 范围，禁止创建 PRD 中不存在的 Epic |
| E0.2 Auth Mock 修复后新测试失败 | 低 | 高 | 备份 + 逐批验证，每批后运行 jest |

---

## 5. 工期重新评估（基于当前状态）

| Epic | 原始估算 | 实际估算 | 调整原因 |
|------|----------|----------|----------|
| E0.1 TS 修复 | 2h | **0h (已完成)** | TS errors = 0 |
| E0.2 Auth Mock | 3h | 3h | 保持不变 |
| E1 Token日志 | 1.5h | 1.5h | 保持 |
| E2 提案追踪 | 2h | 1h | 纯流程，文档已存在 |
| E3 CI守卫 | 1.5h | 1h | grepInvert 模式已验证 |
| E4.1 ErrorBoundary | 1h | 1.5h | 需对齐集成边界 |
| E4.2 @vibex/types | 2h | **3h** | 需先调研 Schema 完整性 |
| E4.3 v0迁移 | 2h | 2h | 保持 |
| E4.4 types对齐 | 3h | 3h | 保持 |
| E4.5 flowNodeIndex | 1.5h | 1h | 优化已有眉目 |
| E5 waitForTimeout | 4h | 5h | regression 风险，保守估算 |
| E5 flowId E2E | 2h | 2h | 保持 |
| E5 JsonTreeModal UT | 1h | 1h | 保持 |
| E6 SOP + pre-commit | 1.5h | 1h | Husky 已有基础设施 |
| E7 docs | 2h | 1.5h | 模板已有 |
| **总计** | **29.5h** | **26.5h** | 节省 3h |

---

## 6. 验收标准补充

### 6.1 需新增的验收标准

| # | 标准 | 来源 | 验证命令 |
|---|------|------|----------|
| AC0.0 | 前端 TS 0 errors（已验证） | 本分析 | `cd vibex-fronted && npx tsc --noEmit \| grep -c "error TS"` → 0 |
| AC-E4.2 | @vibex/types Schema 调研报告 | 本分析 | docs 存在且包含所有 API 路由类型 |
| AC-E4.4 | frontend types 迁移后 0 new TS errors | 本分析 | `npx tsc --noEmit` 仍为 0 |

### 6.2 验收标准冲突检查

| 冲突点 | 分析 |
|--------|------|
| PRD AC0.1: "pnpm tsc --noEmit → 0 error" | ✅ 与实际一致（前端 0 errors） |
| PRD E4.4: "duplicateTypes → 0" | ⚠️ 需先完成 E4.2 Schema 调研，否则迁移引入新错误 |
| PRD E5: "waitForTimeout ≤ 10" | ✅ 可行，但 stability.spec.ts 需豁免 |

---

## 7. 推荐决策

### 决策：Conditional — 需先解决 IMPLEMENTATION_PLAN scope drift

**理由**：
1. PRD 中 TS errors = 206 的假设已不成立，E0.1 应标记为 DONE
2. IMPLEMENTATION_PLAN 中的 TS-E1~E4 在 PRD 中不存在，属于 scope drift
3. E4.2 和 E4.4 有依赖关系，需顺序执行
4. E4.1 ErrorBoundary 集成边界需与 Dev 对齐

**建议调整**：

```
Sprint 0（即时）:
  E0.1 TS → DONE（已自动解除）
  E0.2 Auth Mock → 并行执行

Sprint 1（04/12-04/14）:
  E1 Token日志 + E2 提案追踪 + E3 CI守卫 → 保持
  E4.1 ErrorBoundary → 1.5h（需先对齐集成边界）
  E4.2 @vibex/types Schema 调研 → 新增（0.5h 调研 + 2.5h 实现）

Sprint 2（04/15-04/18）:
  E4.3 v0迁移 + E4.4 types对齐 → 顺序执行
  E4.5 + E5 + E6 + E7 → 保持
```

### 不建议的内容

- **不建议** 创建 IMPLEMENTATION_PLAN 中 PRD 没有的 Epic（如 TS-E1~E4）
- **不建议** 跳过 E4.2 直接做 E4.4（Schema 不完整风险）

---

## 执行决策
- **决策**: 有条件采纳（需调整）
- **执行项目**: vibex-sprint-0412
- **执行日期**: 2026-04-10（立即执行 E0.2）
