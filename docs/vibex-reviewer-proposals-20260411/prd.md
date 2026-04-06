# PRD — vibex-reviewer-proposals

**项目**: vibex-proposals-20260411  
**版本**: 1.0  
**日期**: 2026-04-11  
**状态**: Draft  
**负责人**: PM

---

## 1. 执行摘要

### 背景

Vibex 代码库经过多轮功能迭代，积累了大量技术债务，包括：`as any` 类型断言滥用、空 catch 块吞噬异常、重复的 API unwrap 模块、eslint-disable 注释积累等问题。这些债务降低了代码可维护性，增加了重构风险，阻碍了 TypeScript 类型系统的安全保障能力。

### 目标

在 2 周内（1-2 个 Sprint）系统性消除代码库中的关键类型安全缺口和静默故障风险，建立强制约束防止新债务产生，将代码质量指标恢复到可维护基准线。

### 成功指标

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| `as any` 出现次数（源码层） | >0 | 0 |
| 空 catch 块数量 | 2+ | 0 |
| 并行 unwrap 模块数量 | 2 | 1 |
| `eslint-disable` 行数 | 6+ | 减少 50% |
| `tsc --noEmit` | 0 errors | 维持 |
| `npm run lint` | 0 errors | 维持（新增规则） |

---

## 2. Feature List

| ID | 功能名称 | 描述 | 根因关联 | 工时 |
|----|---------|------|---------|------|
| F1 | 消除 `as any` 类型断言 | 消除源码中所有 `as any`，替换为 `unknown` + 类型守卫或显式接口 | H-1, H-3 | 4h |
| F2 | 修复空 catch 块 | 为所有空 catch 块添加结构化日志或错误上报 | H-2 | 1h |
| F3 | 合并 API unwrap 模块 | 合并 `src/services/api/unwrappers.ts` 和 `src/lib/api-unwrap.ts`，统一 API 响应解包入口 | M-3 | 2h |
| F4 | 清理 eslint-disable 注释 | 逐文件评估 eslint-disable 注释，消除可安全移除的项 | M-1, L-5, L-6 | 1h |
| F5 | 评估并处理 TODO 注释 | 逐条评估 TODO 状态，过期则删除，仍有效则关联 JIRA ticket | M-2 | 1h |
| F6 | 引入 ESLint 强制规则 | 配置 `@typescript-eslint/no-explicit-any` 等规则，CI 强制拦截新增违规 | 方案B | 3h |

**总工时估算**: 12h（单人）/ 8h（双人并行）

---

## 3. Epic 拆分

### Epic 1: 类型安全修复（Type Safety Cleanup）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 修复 catalog.ts `as any` | 1h | `grep "as any" src/lib/canvas-renderer/catalog.ts` 输出 0 行 |
| S1.2 | 修复 registry.tsx `as any` | 1h | `grep "as any" src/lib/canvas-renderer/registry.tsx` 输出 0 行 |
| S1.3 | 重构 useDDDStateRestore.ts 类型断言 | 1.5h | `grep "as any" src/hooks/ddd/useDDDStateRestore.ts` 输出 0 行 |
| S1.4 | 修复 RelationshipEdge.tsx `as any` | 0.5h | 库缺陷通过注释记录，不引入新 `as any` |
| S1.5 | 修复 export-formats.ts `(child as any)` | 1h | `grep "as any" vibex-backend/src/lib/export-formats.ts` 输出 0 行 |
| S1.6 | 修复测试文件中 `e: any` | 0.5h | 测试文件 catch 参数统一改为 `unknown` + 类型守卫 |

**Epic 1 工时**: 5.5h

---

### Epic 2: 错误处理规范化（Error Handling Normalization）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | NotificationService.ts 空 catch 添加日志 | 0.5h | catch 块包含 `console.error('[NotificationService]', e)` 或结构化日志 |
| S2.2 | PrototypePage.ts 空 catch 添加日志 | 0.5h | catch 块包含有意义的错误日志 |
| S2.3 | 验证无其他遗漏空 catch | 0.5h | `grep -rn "} catch {" src services vibex-backend/src` 输出仅含带日志的 catch |

**Epic 2 工时**: 1.5h

---

### Epic 3: 代码一致性提升（Code Consistency）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 合并两个 unwrap 模块 | 2h | 仅保留 `src/services/api/unwrappers.ts`，所有调用统一入口 |
| S3.2 | 清理 eslint-disable 注释 | 1h | 可安全移除的 eslint-disable 全部移除，不可移除的添加说明 |
| S3.3 | 评估 TODO 状态 | 1h | 所有 TODO 均包含 ticket 引用或已删除 |

**Epic 3 工时**: 4h

---

### Epic 4: 工具强制约束（Tooling Enforcement）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S4.1 | 引入 TypeScript ESLint 严格规则 | 1h | `.eslintrc.json` 新增 `@typescript-eslint/no-explicit-any: error` 等规则 |
| S4.2 | 修复新规则产生的 lint 错误 | 1.5h | `npm run lint` 输出 0 errors |
| S4.3 | 配置 CI 拦截 | 0.5h | GitHub Actions lint job 包含 `npm run lint`，失败则阻断 merge |

**Epic 4 工时**: 3h

---

## 4. 验收标准（AC）

```typescript
// AC1: as any 消除
const asAnyCount = execSync("grep -rn 'as any' vibex-fronted/src vibex-backend/src --include='*.ts' --include='*.tsx' | grep -v 'test' | grep -v '.spec.' | wc -l").toString().trim();
expect(parseInt(asAnyCount)).toBe(0);

// AC2: 空 catch 消除
const emptyCatchCount = execSync("grep -rn '} catch {' vibex-fronted/src vibex-backend/src services --include='*.ts' --include='*.tsx' | grep -v 'console.error\\|logger\\|log\\|Sentry\\|report' | wc -l").toString().trim();
expect(parseInt(emptyCatchCount)).toBe(0);

// AC3: unwrap 模块合并
const unwrapFiles = execSync("find . -name 'api-unwrap.ts' -o -name 'unwrappers.ts' | grep -v node_modules").toString().trim().split('\n');
expect(unwrapFiles.filter(f => f.includes('src/'))).toHaveLength(1);

// AC4: TypeScript 编译通过
expect(execSync("cd vibex-fronted && npx tsc --noEmit && cd ../vibex-backend && npx tsc --noEmit").toString()).not.toContain('error TS');

// AC5: ESLint 无错误
const lintExitCode = execSync("cd vibex-fronted && npm run lint; echo $?").toString().trim().split('\n').pop();
expect(parseInt(lintExitCode)).toBe(0);

// AC6: eslint-disable 减少 50%
// 基准值在基线扫描中记录，当前减少量通过 diff 计算
```

---

## 5. DoD（Definition of Done）

- [ ] 所有 Epic 对应的 Story 验收标准 100% 通过
- [ ] `grep -rn "as any" <src> --include='*.ts' --include='*.tsx' | wc -l` == 0（不含测试文件）
- [ ] `grep -rn "} catch {" <src> services vibex-backend/src` 所有结果均有日志或上报语句
- [ ] 并行 unwrap 模块已合并，仅保留一个入口文件
- [ ] `npm run lint` 在 vibex-fronted 和 vibex-backend 均输出 0 errors
- [ ] `npx tsc --noEmit` 在 vibex-fronted 和 vibex-backend 均输出 0 errors
- [ ] PR 通过 Code Review，所有 reviewer 同意合并
- [ ] E2E 回归测试通过率 100%
- [ ] 变更日志已更新

---

## 6. 功能点汇总表（含页面集成标注）

| 功能点 | 文件路径 | 页面/模块关联 | 测试覆盖要求 |
|--------|---------|-------------|------------|
| F1.1 catalog.ts 类型安全 | `vibex-fronted/src/lib/canvas-renderer/catalog.ts` | Canvas 渲染 → Catalog 加载 | 单元测试 |
| F1.2 registry.tsx 类型安全 | `vibex-fronted/src/lib/canvas-renderer/registry.tsx` | Canvas 渲染 → Registry 管理 | 单元测试 |
| F1.3 useDDDStateRestore 重构 | `vibex-fronted/src/hooks/ddd/useDDDStateRestore.ts` | DDD 状态恢复 | 集成测试 |
| F1.4 RelationshipEdge 注释 | `vibex-fronted/src/components/canvas/edges/RelationshipEdge.tsx` | Canvas 关系边 | 不适用（已知库缺陷） |
| F1.5 export-formats 类型安全 | `vibex-backend/src/lib/export-formats.ts` | 后端导出格式 | 单元测试 |
| F1.6 测试文件 `e: any` | `tests/e2e/*.ts` | E2E 测试 | 不适用（测试文件自身修复） |
| F2.1 NotificationService 日志 | `services/NotificationService.ts` | 通知服务 | 日志验证测试 |
| F2.2 PrototypePage 日志 | `vibex-fronted/tests/e2e/pages/PrototypePage.ts` | E2E 测试工具类 | 不适用 |
| F3.1 unwrap 模块合并 | `src/services/api/unwrappers.ts` + `src/lib/api-unwrap.ts` | 全局 API 调用 | E2E 回归 |
| F3.2 eslint-disable 清理 | 多文件 | 代码质量 | 不适用 |
| F3.3 TODO 评估 | 多文件 | 需求完整性 | 不适用 |
| F4.1-4.3 ESLint 规则 | `.eslintrc.json` + CI 配置 | CI/CD | lint job 验证 |

---

## 7. 实施计划（Sprint 排期）

### Sprint 1: 基础修复（Week 1）

**目标**: 消除 P0/P1 级类型安全和错误处理风险

| Day | 任务 | Epic | 负责人 |
|-----|------|------|--------|
| Day 1 AM | S1.1 catalog.ts `as any` | Epic 1 | Dev |
| Day 1 PM | S1.2 registry.tsx `as any` | Epic 1 | Dev |
| Day 2 AM | S1.3 useDDDStateRestore 重构 | Epic 1 | Dev |
| Day 2 PM | S1.4 RelationshipEdge + S1.5 export-formats | Epic 1 | Dev |
| Day 3 AM | S1.6 测试文件 `e: any` | Epic 1 | Dev |
| Day 3 PM | S2.1 NotificationService + S2.2 PrototypePage 日志 | Epic 2 | Dev |
| Day 4 AM | S2.3 验证无遗漏空 catch | Epic 2 | Dev |
| Day 4 PM | Sprint 1 回归测试 + Code Review | - | Dev + Reviewer |
| Day 5 | Sprint 1 总结 + Sprint 2 启动 | - | PM |

**Sprint 1 交付**: Epic 1 + Epic 2 完成，代码库类型安全基本达标

### Sprint 2: 一致性与约束（Week 2）

**目标**: 消除代码不一致性，建立工具强制约束

| Day | 任务 | Epic | 负责人 |
|-----|------|------|--------|
| Day 6 AM | S3.1 unwrap 模块合并 | Epic 3 | Dev |
| Day 6 PM | S3.2 eslint-disable 清理 | Epic 3 | Dev |
| Day 7 AM | S3.3 TODO 评估处理 | Epic 3 | Dev |
| Day 7 PM | S4.1 引入 ESLint 严格规则 | Epic 4 | Dev |
| Day 8 AM | S4.2 修复新规则错误 | Epic 4 | Dev |
| Day 8 PM | S4.3 CI 配置 | Epic 4 | DevOps |
| Day 9 AM | 全量回归测试 | - | Dev + Tester |
| Day 9 PM | Code Review + PR Merge | - | Reviewer |
| Day 10 | 最终验证 + 文档更新 + Sprint 2 总结 | - | 全员 |

**Sprint 2 交付**: Epic 3 + Epic 4 完成，技术债务清理完毕，工具约束到位

---

## 8. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 修复 `as any` 引入新编译错误 | 中 | 逐文件修改 + `tsc --noEmit` 验证 + PR 前 E2E 回归 |
| 合并 unwrap 模块 API 变更影响范围 | 中 | 保留旧入口兼容（deprecated），逐步迁移调用方 |
| ESLint 新规则阻断 CI | 低-中 | 先以 warn 级别引入，确认后升为 error |
| 清理 eslint-disable 暴露新 lint 错误 | 低 | 评估每条注释的必要性，不可移除的加说明保留 |

---

## 9. Out of Scope

- 不在本期范围内进行 DDD 类型架构大规模重构（方案 C，推迟至下个季度评估）
- 不修改测试文件的 `as any` 以外的其他问题
- 不修改 `changelog/page.tsx` 中的历史 `as any` 变更记录
- 不涉及数据库迁移或 API 接口变更
