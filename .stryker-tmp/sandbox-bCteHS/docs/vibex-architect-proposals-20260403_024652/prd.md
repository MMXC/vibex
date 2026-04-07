# PRD: VibeX Architect 提案实施计划（Sprint 4+）

**项目**: vibex-architect-proposals-20260403_024652  
**版本**: v1.0  
**日期**: 2026-04-03  
**角色**: PM  
**状态**: Draft

---

## 一、执行摘要（Executive Summary）

### 1.1 背景

Sprint 3 已完成 canvas-json-persistence 的三个核心 Epic（E1 统一数据模型、E2 后端版本化存储、E3 自动保存），但遗留以下架构债务：

- **E4 同步协议缺失**：多用户并发编辑无冲突检测与解决机制，数据一致性风险
- **canvasStore Facade 臃肿**：`canvasStore.ts` 主文件 1513 行，单文件过大，维护成本极高
- **TypeScript 类型安全不足**：大量 `any` 类型，strict 模式未启用
- **API 契约测试空白**：`/v1/canvas/snapshots` 格式漂移风险，缺少前后端契约层
- **测试策略边界模糊**：Jest 与 Playwright 职责不清，部分无法 Jest 测试的代码混入单元测试

### 1.2 目标

| 目标 | 描述 |
|------|------|
| **O1** | 完成 E4 同步协议，实现多用户并发编辑的冲突检测与解决（HTTP 409 + ConflictDialog） |
| **O2** | 将 canvasStore Facade 从 1513 行压缩至 <300 行，消除单文件技术债务 |
| **O3** | 启用 TypeScript Strict 模式，将 `any` 类型减少 80% |
| **O4** | 建立前后端 API 契约测试，防止 `/v1/canvas/snapshots` 格式漂移 |
| **O5** | 统一前端测试策略，明确 Jest/Playwright 职责边界 |

### 1.3 成功指标

| 指标 | 目标值 | 测量方式 |
|------|--------|---------|
| **SI-1** | E4 同步协议覆盖率 = 100% | Playwright `conflict*.spec.ts` E2E 测试全部通过 |
| **SI-2** | canvasStore.ts 行数 ≤ 300 行 | `wc -l canvasStore.ts` ≤ 300 |
| **SI-3** | `any` 类型减少 ≥ 80% | `grep -c ": any" src/` 对比基准线 |
| **SI-4** | API 契约测试在 PR 级别 blocking | GitHub Actions CI 返回非 0 退出码 |
| **SI-5** | 测试策略文档完整 | `docs/TESTING_STRATEGY.md` 存在且经 team review |
| **SI-6** | 零新增 regression | 每次迁移 commit 后 `npm test` 全通过，覆盖率 > 80% |

### 1.4 路线图

| Sprint | 实施范围 | 优先级 | 预估工时 |
|--------|---------|--------|---------|
| Sprint 4 | E1 (E4 Sync Protocol) + E2 (Facade Cleanup) | P0 | 7-10h |
| Sprint 5 | E3 Phase 1 (noImplicitAny) | P1 | 3-4h |
| Sprint 6 | E3 Phase 2 (strict) + E5 (测试策略) | P1 | 3-4h |
| Sprint 7+ | E4 (API 契约测试) | P2 | 4-5h |

---

## 二、Epic 拆分与 Story 清单

---

### Epic E1: E4 同步协议（Sync Protocol）

**目标**：实现多用户并发编辑的冲突检测与解决机制，闭合 canvas-json-persistence 最后一块拼图。

**依赖 Sprint 3**: E1 统一数据模型、E2 后端版本化存储（已有 `version` 字段和 snapshot 端点）。

---

#### Story E1-S1: 自动保存携带版本号

| 字段 | 内容 |
|------|------|
| **Story** | E1-S1: 自动保存携带版本号 |
| **功能点** | 修改 `useAutoSave` hook，在每次保存请求中携带 `version` 字段；后端 `snapshots.ts` 增加乐观锁检查，当 `localVersion < serverVersion` 时返回 HTTP 409 |
| **验收标准** | `expect(hook).toBeDefined()` — `useAutoSave` 内部对 POST /v1/canvas/snapshots 请求体包含 `{..., version: <number>}` 字段；`expect(response.status).toBe(409)` — 后端检测到版本冲突时返回 409 |
| **页面集成** | 无（hook 层修改） |
| **工时** | 2h |
| **依赖** | E1-S2（前端 ConflictDialog）|

**验收标准详情**:
```typescript
// E1-S1: 后端乐观锁检查
expect(serverResponse.status).toBe(409);
expect(serverResponse.body.code).toBe('VERSION_CONFLICT');

// E1-S1: 前端版本号携带
expect(snapshotPayload).toHaveProperty('version');
expect(typeof snapshotPayload.version).toBe('number');
```

---

#### Story E1-S2: ConflictDialog 冲突解决 UI

| 字段 | 内容 |
|------|------|
| **Story** | E1-S2: ConflictDialog 冲突解决 UI |
| **功能点** | 新建 `ConflictDialog` 组件，接收冲突数据（local/server 两份 canvas JSON），提供三个操作选项：Keep Local / Accept Server / Merge |
| **验收标准** | `expect(screen.getByText('Keep Local')).toBeVisible()` — 冲突时正确渲染三选项按钮；`expect(onKeepLocal).toHaveBeenCalled()` — 点击 Keep Local 后 version 更新为 `serverVersion + 1` |
| **页面集成** | 【需页面集成】集成到 Canvas 编辑器主界面，冲突触发时以 Modal 形式展示 |
| **工时** | 3h |
| **依赖** | E1-S1（后端 409 响应就绪）|

**验收标准详情**:
```typescript
// E1-S2: 对话框渲染
expect(screen.getByText(/冲突检测/i)).toBeVisible();
expect(screen.getByRole('button', { name: 'Keep Local' })).toBeVisible();
expect(screen.getByRole('button', { name: 'Accept Server' })).toBeVisible();
expect(screen.getByRole('button', { name: 'Merge' })).toBeVisible();

// E1-S2: 版本号更新
expect(resolvedVersion).toBe(serverVersion + 1);
```

---

#### Story E1-S3: 冲突场景 E2E 测试覆盖

| 字段 | 内容 |
|------|------|
| **Story** | E1-S3: 冲突场景 E2E 测试覆盖 |
| **功能点** | 编写 Playwright `conflict*.spec.ts` 测试文件，覆盖：单用户保存无冲突、版本冲突触发 409、ConflictDialog 三选项流程、冲突解决后正常保存 |
| **验收标准** | `expect(tests).toHaveLength(4)` — 覆盖上述四个场景；`expect(exitCode).toBe(0)` — 所有 Playwright 测试通过 |
| **页面集成** | 无（测试文件） |
| **工时** | 2h |
| **依赖** | E1-S1、E1-S2 均完成 |

**验收标准详情**:
```typescript
// E1-S3: 4 个冲突测试场景全部通过
expect(conflictTests.every(t => t.status === 'passed')).toBe(true);
expect(playwrightExitCode).toBe(0);
```

---

### Epic E2: canvasStore Facade 清理

**目标**：将 `canvasStore.ts` 从 1513 行压缩至 < 300 行，消除单文件技术债务。

**现状**：`stores/` 已拆分，但 `canvasStore.ts` 仍保留 1513 行主文件，残留 `CascadeUpdateManager` 和直接定义的状态/动作。

---

#### Story E2-S1: canvasStore.ts 剩余逻辑分析

| 字段 | 内容 |
|------|------|
| **Story** | E2-S1: canvasStore.ts 剩余逻辑分析 |
| **功能点** | 逐行审查 1513 行 `canvasStore.ts`，识别未迁移逻辑（状态定义、actions、reducers），按所属 domain 分类到对应 `stores/` 模块 |
| **验收标准** | `expect(map).toHaveProperty('CascadeUpdateManager')` — 识别出 CascadeUpdateManager 归属；`expect(lines).toBeLessThanOrEqual(1513)` — 分析报告包含所有行数的归属分类 |
| **页面集成** | 无（分析阶段） |
| **工时** | 2h |
| **依赖** | 无 |

**验收标准详情**:
```typescript
// E2-S1: 分析报告结构
expect(analysisReport.domains).toContain('CascadeUpdateManager');
expect(analysisReport.unmigratedLines).toBeLessThanOrEqual(1513);
```

---

#### Story E2-S2: CascadeUpdateManager 迁移

| 字段 | 内容 |
|------|------|
| **Story** | E2-S2: CascadeUpdateManager 迁移 |
| **功能点** | 将 `CascadeUpdateManager` 逻辑从 `canvasStore.ts` 迁移到 `stores/` 下的独立模块；更新所有组件引用 |
| **验收标准** | `expect(stores['cascade-update']).toBeDefined()` — 迁移后模块存在；`expect(canvasStoreLines).toBeLessThanOrEqual(1300)` — canvasStore.ts 行数减少 ≥ 200 行 |
| **页面集成** | 无（内部重构） |
| **工时** | 2h |
| **依赖** | E2-S1（分析完成）|

**验收标准详情**:
```typescript
// E2-S2: 迁移后行数检查
expect(lineCount('canvasStore.ts')).toBeLessThanOrEqual(1300);
// E2-S2: 模块存在
expect(require('./stores/cascade-update')).toBeDefined();
```

---

#### Story E2-S3: 剩余逻辑分批迁移

| 字段 | 内容 |
|------|------|
| **Story** | E2-S3: 剩余逻辑分批迁移 |
| **功能点** | 将 `canvasStore.ts` 剩余未迁移的状态定义、actions、reducers 逐批迁移到对应 stores/ 模块；每次迁移后运行 `npm test` 验证无 regression |
| **验收标准** | `expect(canvasStoreLines).toBeLessThanOrEqual(300)` — 最终行数 ≤ 300；`expect(allTestsPassed).toBe(true)` — 所有 `npm test` 通过 |
| **页面集成** | 【需页面集成】组件引用需切换到 stores/ 模块 |
| **工时** | 3h |
| **依赖** | E2-S2（CascadeUpdateManager 迁移完成）|

**验收标准详情**:
```typescript
// E2-S3: 最终行数
expect(lineCount('canvasStore.ts')).toBeLessThanOrEqual(300);
// E2-S3: 测试通过
expect(testResults.exitCode).toBe(0);
expect(testResults.coverage).toBeGreaterThanOrEqual(80);
```

---

### Epic E3: TypeScript Strict 模式

**目标**：启用 TypeScript Strict 模式，将 `any` 类型减少 80%，提升代码类型安全基线。

---

#### Story E3-S1: tsconfig.json Strict 配置启用（Phase 1）

| 字段 | 内容 |
|------|------|
| **Story** | E3-S1: tsconfig.json Strict 配置启用（Phase 1） |
| **功能点** | 修改 `tsconfig.json`，启用 `noImplicitAny: true`；扫描全库 `any` 类型，按引用次数排序，取前 50 个高频项修复 |
| **验收标准** | `expect(config.strict).toBe(true)` — strict 模式已启用；`expect(errorCount).toBeLessThanOrEqual(50)` — `tsc --noEmit` 编译错误数 ≤ 50 |
| **页面集成** | 无（配置层修改） |
| **工时** | 3h |
| **依赖** | 无 |

**验收标准详情**:
```typescript
// E3-S1: 编译错误数控制
expect(tscErrors.count).toBeLessThanOrEqual(50);
// E3-S1: noImplicitAny 启用
expect(tsconfig.noImplicitAny).toBe(true);
```

---

#### Story E3-S2: 剩余 any 类型全面修复（Phase 2）

| 字段 | 内容 |
|------|------|
| **Story** | E3-S2: 剩余 any 类型全面修复（Phase 2） |
| **功能点** | 在 Phase 1 基础上，继续修复剩余 `any` 类型；确保全库 `any` 类型减少 ≥ 80%；在 CI 中增加 `tsc --strict` 检查 |
| **验收标准** | `expect(anyCount).toBeLessThanOrEqual(baseline * 0.2)` — any 类型减少 ≥ 80%；`expect(newAnyCount).toBe(0)` — 新增 `@ts-ignore` 数量 = 0 |
| **页面集成** | 无（类型修复） |
| **工时** | 4h |
| **依赖** | E3-S1（Phase 1 完成）|

**验收标准详情**:
```typescript
// E3-S2: any 减少率
const baseline = 250; // 初始 any 类型数
expect(currentAnyCount).toBeLessThanOrEqual(baseline * 0.2);
// E3-S2: 无新增 ts-ignore
expect(newTsIgnoreCount).toBe(0);
```

---

### Epic E4: API 契约测试

**目标**：建立前后端 API 契约测试，防止 `/v1/canvas/snapshots` 格式漂移。

---

#### Story E4-S1: 契约测试框架选型与初始化

| 字段 | 内容 |
|------|------|
| **Story** | E4-S1: 契约测试框架选型与初始化 |
| **功能点** | 评估并选择 Pact 或 OpenAPI + Prism 作为契约测试框架；在 `tests/contracts/` 目录初始化项目结构 |
| **验收标准** | `expect(dir).toBeDefined()` — `tests/contracts/` 目录存在；`expect(hasPactConfig).toBe(true)` — 配置文件存在（Pact broker 或 OpenAPI spec） |
| **页面集成** | 无（测试基础设施） |
| **工时** | 1h |
| **依赖** | 无 |

**验收标准详情**:
```typescript
// E4-S1: 目录存在
expect(fs.existsSync('tests/contracts')).toBe(true);
// E4-S1: 配置存在
expect(fs.existsSync('pact.config.js') || fs.existsSync('openapi.yaml')).toBe(true);
```

---

#### Story E4-S2: /v1/canvas/snapshots 契约定义

| 字段 | 内容 |
|------|------|
| **Story** | E4-S2: /v1/canvas/snapshots 契约定义 |
| **功能点** | 对 `/v1/canvas/snapshots`（POST/GET）和 `/v1/canvas/rollback` 定义契约规范；编写 Consumer 测试（前端验证 API 响应格式）和 Provider 测试（后端验证响应符合契约） |
| **验收标准** | `expect(contract.specs).toHaveLength(3)` — 至少 3 个接口有契约定义；`expect(consumerTests).toHaveLength(2)` — POST/GET Consumer 测试存在 |
| **页面集成** | 无（后端契约层） |
| **工时** | 2h |
| **依赖** | E4-S1（框架初始化）|

**验收标准详情**:
```typescript
// E4-S2: 契约定义数量
expect(contract.endpoints).toContain('/v1/canvas/snapshots');
expect(contract.methods).toContain('POST');
expect(contract.methods).toContain('GET');
```

---

#### Story E4-S3: CI 集成契约测试

| 字段 | 内容 |
|------|------|
| **Story** | E4-S3: CI 集成契约测试 |
| **功能点** | 在 GitHub Actions 中添加契约测试 step，确保 PR 级别 blocking；契约破坏时 CI 返回非 0 退出码 |
| **验收标准** | `expect(exitCode).toBe(0)` — 契约测试通过时 CI 通过；`expect(exitCode).not.toBe(0)` — 契约破坏时 CI 失败 |
| **页面集成** | 无（CI 配置） |
| **工时** | 1h |
| **依赖** | E4-S2（契约定义完成）|

**验收标准详情**:
```typescript
// E4-S3: CI blocking
expect(ciStep.name).toBe('Contract Tests');
expect(ciStep.if).toBeTruthy(); // 无条件执行
expect(contractViolationCI.exitCode).not.toBe(0);
```

---

### Epic E5: 测试策略统一

**目标**：明确 Jest（单元/集成）与 Playwright（E2E）的职责边界，统一前端测试策略。

---

#### Story E5-S1: 测试策略文档编写

| 字段 | 内容 |
|------|------|
| **Story** | E5-S1: 测试策略文档编写 |
| **功能点** | 编写 `docs/TESTING_STRATEGY.md`，明确：Jest 覆盖纯函数/hooks 单元测试、Playwright 覆盖 UI/E2E；`beacon`/`requestAnimationFrame` 相关测试迁移到 Playwright；禁止 `waitForTimeout` 硬编码等待 |
| **验收标准** | `expect(fs.existsSync('docs/TESTING_STRATEGY.md')).toBe(true)` — 文档存在；`expect(doc.sections).toContain('Jest Scope')` — 包含 Jest 范围定义；`expect(doc.sections).toContain('Playwright Scope')` — 包含 Playwright 范围定义 |
| **页面集成** | 无（文档） |
| **工时** | 1h |
| **依赖** | 无 |

**验收标准详情**:
```typescript
// E5-S1: 文档结构完整性
expect(doc.hasJestScope).toBe(true);
expect(doc.hasPlaywrightScope).toBe(true);
expect(doc.hasForbiddenPatterns).toBe(true); // waitForTimeout 禁止
```

---

#### Story E5-S2: beacon/rAF 测试迁移

| 字段 | 内容 |
|------|------|
| **Story** | E5-S2: beacon/rAF 测试迁移 |
| **功能点** | 将 `beacon` 和 `requestAnimationFrame` 相关测试从 Jest 迁移到 Playwright；在 `tests/e2e/` 中新增对应 spec 文件 |
| **验收标准** | `expect(jestTests).toHaveLength(0)` — beacon/rAF 相关 Jest 测试已移除；`expect(playwrightTests).toHaveLength(n)` — Playwright 中存在对应 E2E 测试 |
| **页面集成** | 无（测试迁移） |
| **工时** | 2h |
| **依赖** | E5-S1（策略文档完成）|

**验收标准详情**:
```typescript
// E5-S2: Jest 中无 beacon/rAF 测试
expect(jestTests.filter(t => t.includes('beacon') || t.includes('rAF'))).toHaveLength(0);
// E5-S2: Playwright 有覆盖
expect(playwrightSpecs.filter(s => s.includes('auto-save') || s.includes('beacon'))).toBeGreaterThan(0);
```

---

## 三、验收标准汇总表（All Stories）

| Story ID | Story 名称 | P | 工时 | 页面集成 | 依赖 |
|----------|-----------|---|------|---------|------|
| E1-S1 | 自动保存携带版本号 | P0 | 2h | 无 | - |
| E1-S2 | ConflictDialog 冲突解决 UI | P0 | 3h | 【需页面集成】 | E1-S1 |
| E1-S3 | 冲突场景 E2E 测试覆盖 | P0 | 2h | 无 | E1-S1, E1-S2 |
| E2-S1 | canvasStore.ts 剩余逻辑分析 | P1 | 2h | 无 | - |
| E2-S2 | CascadeUpdateManager 迁移 | P1 | 2h | 无 | E2-S1 |
| E2-S3 | 剩余逻辑分批迁移 | P1 | 3h | 【需页面集成】 | E2-S2 |
| E3-S1 | tsconfig.json Strict 配置启用 | P1 | 3h | 无 | - |
| E3-S2 | 剩余 any 类型全面修复 | P1 | 4h | 无 | E3-S1 |
| E4-S1 | 契约测试框架选型与初始化 | P2 | 1h | 无 | - |
| E4-S2 | /v1/canvas/snapshots 契约定义 | P2 | 2h | 无 | E4-S1 |
| E4-S3 | CI 集成契约测试 | P2 | 1h | 无 | E4-S2 |
| E5-S1 | 测试策略文档编写 | P2 | 1h | 无 | - |
| E5-S2 | beacon/rAF 测试迁移 | P2 | 2h | 无 | E5-S1 |
| **合计** | | | **28h** | | |

---

## 四、DoD（Definition of Done）

### 全局 DoD（每个 Story 必须满足）

- [ ] 代码变更已提交到 `feature/E4-sync-protocol` / `feature/facade-cleanup` 等分支
- [ ] 所有相关 `npm test` 通过，无 regression
- [ ] 验收标准中的 `expect()` 断言均已通过
- [ ] Code Review 已通过（至少 1 名 team member approve）
- [ ] 如涉及页面集成，对应页面已更新并通过 UI 验证
- [ ] 如涉及 API 变更，后端 API 文档已更新
- [ ] 迁移类 Story（E2 系列）无 `console.error` 新增 warning

### Epic 级别 DoD

| Epic | DoD |
|------|-----|
| E1 (Sync Protocol) | ConflictDialog 三选项均可正常触发版本更新；Playwright E2E 覆盖率 ≥ 80% |
| E2 (Facade Cleanup) | `canvasStore.ts` 行数 ≤ 300；所有组件引用已切换到 stores/ 模块 |
| E3 (TS Strict) | `tsc --strict` 零 error；CI step 存在且 blocking |
| E4 (API 契约) | 契约测试在 PR 级别运行；破坏契约的 PR 无法 merge |
| E5 (测试策略) | 文档经 team review；Jest/Playwright 边界清晰，无职责混淆 |

---

## 五、非功能需求（Non-Functional Requirements）

| 类别 | 需求 |
|------|------|
| **性能** | E1-S1 冲突检测延迟 ≤ 100ms（从保存请求到 409 响应） |
| **性能** | E2 迁移后 `npm test` 单次运行时间 ≤ 60s |
| **可靠性** | E1 冲突解决操作 100% 可恢复（版本号记录到操作日志） |
| **可维护性** | E2 迁移后每个 stores/ 模块 ≤ 200 行 |
| **可测试性** | E3 启用 strict 后，`tsc --noEmit` 错误数 ≤ 50 |
| **可部署性** | E4 契约测试在 CI 中独立运行，不阻塞其他 step |
| **兼容性** | E1 ConflictDialog 兼容 Chrome/Firefox/Safari 最新版本 |
| **可观测性** | E1-S1 保存操作写入操作日志（包含 version 字段） |

---

## 六、实施约束（Implementation Constraints）

| 约束 | 描述 |
|------|------|
| **C1** | E2 Facade 清理必须逐 commit 验证，每步迁移后 `npm test` 通过才可继续 |
| **C2** | E3 TypeScript Strict 分阶段启用（先 noImplicitAny，再 strict），宽限期 2 周 |
| **C3** | E4 契约测试在 API 端点稳定后启动，当前仅覆盖 `/v1/canvas/snapshots` 和 `/v1/canvas/rollback` |
| **C4** | E1 ConflictDialog UI 遵循现有 VibeX 设计系统，不引入新 design token |
| **C5** | 所有前端代码变更必须通过 Code Review，禁止 direct commit to main |
| **C6** | E5 策略文档编写前需与 Dev/Tester 协商，确保策略可落地执行 |
| **C7** | Sprint 4 并行执行 E1 + E2，但 E2-S3（最终迁移）需在 E1-S2（ConflictDialog）之后合并，避免冲突 |

---

## 七、排期计划

| Day | Sprint 4 任务 |
|-----|--------------|
| Day 1-2 | E2-S1（分析）+ E2-S2（CascadeUpdateManager 迁移）+ E1-S1（版本号字段）|
| Day 3-5 | E1-S2（ConflictDialog）+ E2-S3（分批迁移）+ E1-S3（E2E 测试）|
| Day 5 | 集成测试 + CI 验证 + Code Review |

---

*本文档由 PM Agent 生成于 2026-04-03 02:56 GMT+8*
*基于：analysis.md（Analyst 视角）、proposals/20260403/dev.md*
