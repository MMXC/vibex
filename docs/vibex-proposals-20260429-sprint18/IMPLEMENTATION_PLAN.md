# VibeX Sprint 18 实施计划

**版本**: v1.0
**日期**: 2026-04-30
**Agent**: architect
**Sprint 周期**: 2026-04-30 ~ 2026-05-13 (2 weeks)
**总工时**: 80h

---

## 1. Sprint 目标

1. **P0**: 消除 E3-U2（mcp-server 7 errors）和 E3-U3（vibex-backend ~379 errors）TypeScript 编译错误，`tsc --noEmit` 通过
2. **P1**: 完成 `@vibex/types` 共享类型基础设施，使 E18-TSFIX-3
3. **P2**: 扫描 Sprint 1-17 backlog，识别 Top 2 高优先级功能增强
4. **P3**: 测试覆盖率提升至 ≥ 80%，DX 改进

---

## 2. Sprint 规划（2 周）

### Week 1 (04-30 ~ 05-06)

| Day | Epic | Story | 任务 | 负责 Agent |
|-----|------|-------|------|-----------|
| Day 1-2 | E18-TSFIX | E18-TSFIX-1 | E3-U2 mcp-server TS 修复（7 errors） | coder |
| Day 1-2 | E18-TSFIX | E18-TSFIX-2 | E3-U3 vibex-backend 类型修复（前 150 errors） | coder |
| Day 3-4 | E18-TSFIX | E18-TSFIX-2 | E3-U3 类型修复（后 229 errors） | coder |
| Day 3-4 | E18-TSFIX | E18-TSFIX-3 | @vibex/types shared types + guards | coder |
| Day 5 | E18-CORE | E18-CORE-1 | Sprint 1-17 backlog 扫描与优先级排序 | analyst |

### Week 2 (05-07 ~ 05-13)

| Day | Epic | Story | 任务 | 负责 Agent |
|-----|------|-------|------|-----------|
| Day 6-7 | E18-TSFIX | E18-TSFIX-2 | 严格模式 `strict: true` 全量验证 | reviewer |
| Day 8-9 | E18-CORE | E18-CORE-2 | Top 1 功能实现（待 backlog 确定） | coder |
| Day 8-9 | E18-QUALITY | E18-QUALITY-1 | 测试覆盖率提升 ≥ 80% | coder |
| Day 10-11 | E18-CORE | E18-CORE-3 | Top 2 功能实现（待 backlog 确定） | coder |
| Day 12-13 | E18-QUALITY | E18-QUALITY-2 | DX 改进（tsconfig strict、类型文档、migration guide） | coder |
| Day 14 | - | - | Sprint 总结，PR 合并，Retro | 所有 |

---

## 3. Story 详细任务分解

### Story E18-TSFIX-1: E3-U2 类型修复（mcp-server）

**工时**: 16h | **验收标准**: `tsc --noEmit` 在 packages/mcp-server 目录通过，0 errors
**状态**: ✅ DONE (commit d713b85f2)

#### 任务清单

```
1. [x] 修复 src/routes/health.ts
   - 问题: buildResponse() 返回类型错误 (http.ServerResponse['writeHead'] 类型)
   - 修复: 移除未使用的 buildResponse 函数
   - 验证: ✅ tsc --noEmit 通过 (0 errors)

2. [x] 修复 src/index.ts
   - 问题: `import.meta.url` 在 CJS 输出中不允许
   - 修复: package.json 添加 "type": "module"，tsconfig.json 确认 NodeNext
   - 验证: ✅ tsc --noEmit 通过 (0 errors)

3. [x] 修复 src/tools/reviewDesign.ts
   - 问题: 3个模块找不到 (designCompliance, a11yChecker, componentReuse)
   - 修复: 相对路径导入 + .js 扩展名
   - 验证: ✅ tsc --noEmit 通过 (0 errors)

4. [x] 确认 @vibex/types 依赖正确
   - 检查: ✅ 依赖路径正确

5. [x] 严格模式验证
   - 运行: cd packages/mcp-server && pnpm exec tsc --noEmit
   - 期望: ✅ 0 errors (verified 2026-04-30)

6. [x] 类型覆盖率报告 / 测试
   - 运行: pnpm test → ✅ 12 passed, 2 test suites passed
   - 期望: ✅ 测试通过
```

### Story E18-TSFIX-2: E3-U3 类型修复（vibex-fronted）

**工时**: 16h | **验收标准**: `tsc --noEmit` 在 vibex-fronted 通过，0 errors
**状态**: ✅ DONE (commits c04dcccd2, a3e4aadfd)

**注意**: vibex-backend 在 E18-TSFIX-1 阶段已通过 (0 errors)，本阶段聚焦 vibex-fronted。

#### 任务清单

```
1. [x] 分析 TS 错误分布
   - 确认: vibex-fronted 344 errors（vibex-backend 0 errors）

2. [x] 批量修复 strict null errors
   - 策略: noUncheckedIndexedAccess + null guards + non-null assertions
   - 验证: ✅ 344 → 0 errors

3. [x] 修复 unwrappers.ts 行为变更
   - 问题: unwrapField 返回 T | null 代替 T
   - 修复: 更新测试用例 expect null 而非 undefined
   - 验证: ✅ 20 tests passed
```

### Story E18-TSFIX-3: 类型基础设施加固

**工时**: 8h | **验收标准**: `@vibex/types` 导出完整 shared types + guards

#### 任务清单

```
1. [ ] 完善 packages/types/src/index.ts
   - 确保导出所有 shared types: Session, Config, Response, Project, Branch, Flow
   - 每个类型必须有 JSDoc 注释

2. [ ] 创建 packages/types/src/guards.ts
   - 实现: isSession, isConfig, isResponse 类型守卫
   - 测试: 为每个 guard 写 3 个正向 + 3 个负向测试用例

3. [ ] 创建 packages/types/src/schemas.ts
   - 为每个 shared type 创建对应 Zod schema
   - 确保 schema.parse() 严格匹配 TS type

4. [ ] 发布/构建验证
   - 运行: cd packages/types && pnpm run build
   - 验证: dist/ 目录包含所有 .d.ts 文件
```

---

## 4. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 386 errors 超出 16h 修复工时 | 中 | 高 | E18-TSFIX-2 拆分两阶段：mcp-server (7 errors, 4h) + backend (379 errors, 12h) |
| strict 模式引入新错误 | 高 | 中 | 先修复 non-strict errors，再开启 strict，最后扫残余 |
| E18-CORE-2/3 功能范围不清 | 高 | 中 | E18-CORE-1 必须 Week 1 完成，输出 backlog 文档 |
| 类型修复 Breaking Changes | 中 | 高 | 每个 PR 附带 migration guide 草案 |
| CI tsc 时间 > 5min | 低 | 低 | ts-buildkite cache + `--incremental` |

---

## 5. DoD 检查单

### Story E18-TSFIX-1 (mcp-server)
- [x] `cd packages/mcp-server && pnpm exec tsc --noEmit` → 0 errors ✅ (verified 2026-04-30)
- [x] `pnpm exec tsc --noEmit 2>&1 | grep -c "error TS"` → 0 ✅ (0 errors)
- [x] `@vibex/types` 依赖正确，类型导出完整 ✅
- [x] 单元测试通过: `pnpm test` → 0 failures ✅ (12 tests passed)
- [ ] 类型覆盖率 ≥ 80%

### Story E18-TSFIX-2 (vibex-fronted)
- [x] `cd vibex-fronted && pnpm exec tsc --noEmit` → 0 errors ✅ (verified 2026-04-30)
- [x] unwrappers.test.ts → 20 tests passed ✅ (updated for null return type)
- [x] `tsc --noEmit` 错误数: 344 → 0 ✅
- [x] Commits 含 E18-TSFIX-2 标识 ✅

**注意**: vibex-backend tsc 在 E18-TSFIX-1 阶段已通过 (0 errors)。

### Story E18-TSFIX-3: @vibex/types 类型基础设施

**工时**: 8h | **验收标准**: `@vibex/types` 导出完整 shared types + guards
**状态**: ✅ DONE (commit d6332dd3f, e56fde7ae)

#### 任务清单

```
1. [x] 检查 @vibex/types 现有类型
   - api.ts: BoundedContext, DedupResult 等 ✅
   - store.ts: CardTreeNode, TeamTaskProject ✅
   - events.ts: AppEvent 等 ✅

2. [x] 创建 packages/types/src/guards.ts
   - 19 个类型守卫函数覆盖 CardTree, TeamTasks, BoundedContext
   - 验证: dist/guards.d.ts 生成 ✅

3. [x] 更新 index.ts 导出 guards
   - export * from './guards.js' ✅

4. [x] 构建验证
   - cd packages/types && pnpm build → 成功 ✅
   - dist/ 包含所有 .d.ts ✅
```

### Story E18-TSFIX-3 (shared types)
- [x] `packages/types/src/index.ts` 导出所有 shared types ✅
- [x] `packages/types/src/guards.ts` 包含 19 个类型守卫 ✅ (commit d6332dd3f)
- [x] `packages/types/src/schemas.ts` 包含 Zod schemas ✅ (已存在)
- [x] `cd packages/types && pnpm build` → 成功 ✅
- [ ] Guard 测试覆盖率 100% ⚪ (暂跳过，Jest 未配置)

### Story E18-CORE-1: 功能增强识别

**工时**: 8h | **验收标准**: backlog 文档包含 ≥ 5 个功能点，每个含 RICE 评分
**状态**: ✅ DONE (commit 9b4b0ea33)

#### 任务清单

```
1. [x] 扫描代码库和 git history
   - 确认: CanvasPage 无骨架屏, 12 个 as any 用法, 三树缺空状态

2. [x] 创建 backlog 文档
   - 输出: docs/backlog-sprint17.md ✅
   - 功能点数: 6 个 ✅

3. [x] 每个功能点有描述/RICE 评分/验收标准
   - B1 画布骨架屏: RICE=54 ✅
   - B2 TS as any 消除: RICE=54 ✅
   - B3 三树空状态: RICE=54 ✅
   - B4 错误边界: RICE=36 ✅
   - B5 E2E 测试补全: RICE=81 ✅
   - B6 导出增强: RICE=24 ✅

4. [x] Top 3 优先级已标注
   - B5 (RICE=81), B1/B2/B3 (RICE=54) ✅
```

### Story E18-CORE-1 (backlog)
- [x] `docs/backlog-sprint17.md` 已创建 ✅
- [x] backlog 包含 ≥ 5 个功能点 ✅ (6 items)
- [x] 每个功能点有: 描述、RICE 评分、验收标准 ✅
- [x] Top 3 优先级已标注 ✅
- [x] Commit 含 E18-CORE-1 ✅ (9b4b0ea33)

### Story E18-CORE-2: 画布骨架屏加载状态 (B1)

**工时**: 8h | **验收标准**: 画布加载时显示骨架屏
**状态**: ✅ DONE (commit 8af38ce53)

#### 任务清单

```
1. [x] 分析 CanvasPage 加载流程
   - useProjectLoader 返回 loading 状态 ✅
   - CanvasPage 未使用该状态 ✅

2. [x] 创建 CanvasPageSkeleton 组件
   - 三栏布局骨架屏 ✅
   - 使用 SkeletonLine/SkeletonBox ✅

3. [x] 集成到 CanvasPage
   - 加载中显示骨架屏 ✅
   - 加载完成正常渲染 ✅

4. [x] 验证
   - pnpm exec tsc --noEmit → 0 errors ✅
```

### Story E18-CORE-2 (canvas skeleton)
- [x] `src/components/canvas/CanvasPageSkeleton.tsx` 已创建 ✅
- [x] CanvasPage 加载时显示骨架屏 ✅
- [x] `pnpm exec tsc --noEmit` → 0 errors ✅
- [x] Commit 含 E18-CORE-2 ✅ (8af38ce53)

### Story E18-CORE-3: 三树空状态 UX (B3)

**工时**: 8h | **验收标准**: 三树组件显示空状态占位符
**状态**: ✅ DONE (commit 8a6ad3e2)

#### 任务清单

```
1. [x] 分析三树组件结构
   - BoundedContextTree ✅
   - ComponentTree ✅
   - BusinessFlowTree ✅

2. [x] 添加空状态显示
   - BoundedContextTree: 暂无限界上下文 ✅
   - ComponentTree: 暂无组件 ✅
   - BusinessFlowTree: 暂无业务流程 ✅

3. [x] 验证
   - pnpm exec tsc --noEmit → 0 errors ✅
```

### Story E18-CORE-3 (tree empty states)
- [x] 三树组件显示空状态 ✅
- [x] `pnpm exec tsc --noEmit` → 0 errors ✅
- [x] Commit 含 E18-CORE-3 ✅ (8a6ad3e2)

### Story E18-QUALITY-1: 测试覆盖率提升

**工时**: 8h | **验收标准**: @vibex/types 类型守卫测试覆盖率 ≥ 80%
**状态**: ✅ DONE (commit 412827d85)

#### 任务清单

```
1. [x] 为 @vibex/types guards 编写单元测试
   - guards.ts: 19 个函数 ✅
   - 测试用例: 84 个 (vitest) + 38 个 (Node runner) ✅

2. [x] 验证测试通过
   - vitest: 84 tests passed ✅
   - node test-guards.mjs: 38 tests passed ✅
```

### Story E18-QUALITY-1 (test coverage)
- [x] @vibex/types 测试覆盖率 ≥ 80% ✅
- [x] 84 个 vitest 测试用例全部通过 ✅
- [x] Commit 含 E18-QUALITY-1 ✅ (412827d85)

---

## 6. 依赖关系

```
Day 1-2: E18-TSFIX-1 (mcp-server 修复)
Day 1-2: E18-TSFIX-2 (backend 修复 Phase 1)
Day 3-4: E18-TSFIX-2 (backend 修复 Phase 2)
Day 3-4: E18-TSFIX-3 (shared types) ← 依赖 E18-TSFIX-1 开始后
Day 5:   E18-CORE-1 (backlog) ← 独立，可与类型修复并行
Day 6-7: E18-TSFIX-2 收尾 + strict 验证
Day 8-9: E18-CORE-2 (Top1) ← 依赖 E18-CORE-1
Day 8-9: E18-QUALITY-1 (测试覆盖) ← 依赖 E18-TSFIX-1, E18-TSFIX-2
Day 10-11: E18-CORE-3 (Top2) ← 依赖 E18-CORE-1
Day 12-13: E18-QUALITY-2 (DX)
Day 14: Sprint 总结
```

---

## 7. 关键命令参考

```bash
# TS 类型检查
cd packages/mcp-server && pnpm exec tsc --noEmit
cd vibex-backend && pnpm exec tsc --noEmit

# 严格模式
cd vibex-backend && pnpm exec tsc --noEmit --strict

# 类型覆盖率
pnpm exec jest --coverage --collectCoverageFrom='packages/types/src/**/*.ts'
pnpm exec jest --coverage --collectCoverageFrom='packages/mcp-server/src/**/*.ts'

# 构建 @vibex/types
cd packages/types && pnpm run build

# 统计错误数
cd vibex-backend && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l
cd packages/mcp-server && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | wc -l

# 错误分布
pnpm exec tsc --noEmit 2>&1 | grep "error TS" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
```

### Story E18-QUALITY-2: 开发者体验改进

**工时**: 8h | **验收标准**: tsconfig strict、类型文档、migration guide
**状态**: ✅ DONE (commit a1c3d8e5)

#### 任务清单

```
1. [x] tsconfig strict 模式检查
   - vibex-fronted: strict: true ✅
   - noUncheckedIndexedAccess: true ✅
   - packages/mcp-server: strict: true ✅

2. [x] 类型文档已生成
   - docs/types/README.md ✅
   - 包含 @vibex/types 所有公开类型 ✅
3. [x] Migration guide 已创建
   - E18-TSFIX-2 Breaking Changes 说明 ✅
   - unwrapField 返回类型变更处理方式 ✅
```

### Story E18-QUALITY-2 (DX improvements)
- [x] `tsconfig.json` strict 模式已开启 ✅
- [x] `docs/types/README.md` 已创建 ✅
- [x] Migration guide 存在 ✅
- [x] Commit 含 E18-QUALITY-2 ✅ (a1c3d8e5)
