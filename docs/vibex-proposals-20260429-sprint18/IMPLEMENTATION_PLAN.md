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

### Story E18-TSFIX-2: E3-U3 类型修复（vibex-backend）

**工时**: 16h | **验收标准**: `tsc --noEmit` 在 vibex-backend 通过，0 errors（排除 frontend）

#### 任务清单

```
Phase 1: 高优先级错误（Day 1-2, 约8h）

1. [ ] 分析 386 errors 分布
   - 命令: cd vibex-backend && pnpm exec tsc --noEmit 2>&1 | grep "error TS" | cut -d: -f1 | sort | uniq -c | sort -rn | head -20
   - 识别: 高频错误文件 TOP 10

2. [ ] 分类错误类型
   - 类型A: missing type annotations (~40%)
   - 类型B: implicit any in function params (~30%)
   - 类型C: wrong/missing module imports (~20%)
   - 类型D: Zod schema 与 TS type 不一致 (~10%)

3. [ ] 批量修复 Zod schema 类型不一致
   - 目标: 所有 route handler 参数使用 Zod 解析后，TS 类型自动推断
   - 工具: 为每个 route 创建 `routeName.schema.ts` 文件

Phase 2: 核心模块修复（Day 3-4, 约8h）

4. [ ] 修复 src/routes/*.ts 错误
   - 重点: chat.ts, projects.ts, flows.ts（使用频率最高）

5. [ ] 修复 src/services/*.ts 错误
   - 重点: llm 服务、auth 服务

6. [ ] 修复 src/lib/*.ts 错误
   - 重点: env.ts, prompts/*.ts

Phase 3: 收尾验证（Day 5, 约4h）

7. [ ] 全量严格模式验证
   - 运行: cd vibex-backend && pnpm exec tsc --noEmit --strict
   - 期望: 0 errors

8. [ ] 回归验证
   - 运行: pnpm run lint
   - 运行: pnpm run test
   - 期望: 全部通过
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

### Story E18-TSFIX-2 (vibex-backend)
- [ ] `cd vibex-backend && pnpm exec tsc --noEmit` → 0 errors
- [ ] `tsconfig.json` 的 `strict` 模式已开启
- [ ] 每个 route 有对应的 `*.schema.ts` 文件
- [ ] `pnpm run test` → 0 failures
- [ ] `pnpm run lint` → 0 errors

### Story E18-TSFIX-3 (shared types)
- [ ] `packages/types/src/index.ts` 导出所有 shared types
- [ ] `packages/types/src/guards.ts` 包含 3 个类型守卫
- [ ] `packages/types/src/schemas.ts` 包含所有 Zod schemas
- [ ] `cd packages/types && pnpm run build` → 成功
- [ ] Guard 测试覆盖率 100%

### Story E18-CORE-1 (backlog)
- [ ] `docs/backlog-sprint17.md` 已创建
- [ ] backlog 包含 ≥ 5 个功能点
- [ ] 每个功能点有: 描述、RICE 评分、验收标准草稿
- [ ] Top 3 优先级已标注

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
