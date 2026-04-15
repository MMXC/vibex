# AGENTS.md — VibeX E6/E7 实施规范

**项目**: vibex-architect-proposals-vibex-proposals-20260416
**日期**: 2026-04-16

---

## 开发约束

> **驳回红线**（符合任一条 → 驳回重做）
> - 架构设计不可行 → 驳回重新设计
> - 接口定义不完整 → 驳回补充
> - 缺少 IMPLEMENTATION_PLAN.md 或 AGENTS.md → 驳回补充
> - 未执行 Technical Design 阶段 → 驳回补充
> - 未执行 /plan-eng-review 技术审查 → 驳回补充

### 强制验证
- 必须使用 gstack 技能（/browse /qa /qa-only /canary）验证问题真实性与修复效果
- 兼容现有架构
- 接口文档完整
- 评估性能影响
- 技术方案可执行

---

## Dev Agent 任务清单

### E6-S1: @babel/parser AST 解析

**入口命令**: 
```bash
cd /root/.openclaw/vibex/vibex-backend
pnpm add @babel/parser @babel/traverse @babel/types
```

**必读文件**:
- `vibex-backend/src/lib/prompts/code-review.ts` — 现有集成点
- `vibex-backend/src/lib/prompts/code-generation.ts` — 现有集成点
- `docs/vibex-architect-proposals-vibex-proposals-20260416/architecture.md` — 架构规范

**实现规范**:
1. 新建 `src/lib/security/codeAnalyzer.ts`，导出 `analyzeCodeSecurity(code: string): SecurityReport`
2. SecurityReport 必须包含: `hasUnsafe`, `unsafeEval[]`, `unsafeNewFunction[]`, `unsafeDynamicCode[]`, `confidence`
3. `confidence < 100` 当 AST 解析失败时，设置为 50
4. 修改 code-review.ts: AI 分析 + AST 扫描并行执行，扫描结果注入 warnings
5. 修改 code-generation.ts: 同上
6. 新建 `src/lib/security/__tests__/codeAnalyzer.test.ts`
7. 运行 `pnpm lint && pnpm type-check`

**验收**: Vitest 测试全通过，覆盖率 >80%

### E6-S2: 误报率 <1% 验证

**入口命令**: 
```bash
cd /root/.openclaw/vibex/vibex-backend
# 生成样本后运行
pnpm test -- --run src/lib/security/__tests__/falsePositiveRate.test.ts
```

**实现规范**:
1. 在 `test/fixtures/safe-code/` 生成 1000 条合法样本
2. 误报率计算: `hasUnsafe === true` 的样本数 / 1000
3. 断言: `< 0.01` (1%)
4. 如有误报，添加到 `DANGEROUS_PATTERNS_WHITELIST` 而非删除检测规则

**验收**: `expect(falsePositiveRate).toBeLessThan(0.01)` 通过

### E6-S3: AST 性能验证

**入口命令**:
```bash
pnpm test -- --run src/lib/security/__tests__/codeAnalyzer.perf.test.ts
```

**实现规范**:
1. 生成 5000 行测试文件
2. `Date.now()` 测量 `analyzeCodeSecurity(largeFile)` 耗时
3. 断言: `< 50ms`
4. 注意: 包含冷启动时间（首次加载 Babel）

**验收**: 性能测试通过

---

## Tester Agent 任务清单

### E6 测试策略

**测试框架**: Vitest + @vitest/coverage-v8
**覆盖率阈值**: branch >80%
**运行命令**:
```bash
cd /root/.openclaw/vibex/vibex-backend
pnpm test -- --run --coverage
```

**测试用例映射**:

| Test ID | Epic | 描述 | 断言 |
|---------|------|------|------|
| TC-E6-01 | E6 | eval("x") 检测 | hasUnsafe=true, unsafeEval.length>0 |
| TC-E6-02 | E6 | new Function() 检测 | hasUnsafe=true |
| TC-E6-03 | E6 | 安全代码误报 | hasUnsafe=false |
| TC-E6-04 | E6 | setTimeout("code",0) | hasUnsafe=true |
| TC-E6-05 | E6 | AST 解析失败 | confidence=50 |
| TC-E6-06 | E6 | 误报率验证 | rate < 0.01 |
| TC-E6-07 | E6 | 5000行性能 | < 50ms |

### E7 测试策略

**测试框架**: Vitest + supertest
**运行命令**:
```bash
cd /root/.openclaw/vibex/packages/mcp-server
pnpm test -- --run
```

**测试用例映射**:

| Test ID | Epic | 描述 | 断言 |
|---------|------|------|------|
| TC-E7-01 | E7 | GET /health → 200 | status=ok, 所有字段存在 |
| TC-E7-02 | E7 | 异常时返回 error | status=error, error 字段 |
| TC-E7-03 | E7 | JSON log 格式 | JSON.parse(stdout) 成功 |
| TC-E7-04 | E7 | log level 正确 | level in ['debug','info','warn','error'] |
| TC-E7-05 | E7 | SDK version mismatch | warn log 包含版本信息 |

---

## Reviewer Agent 任务清单

### 代码审查检查单

- [ ] 所有新增文件已添加，不存在悬空引用
- [ ] E6: `analyzeCodeSecurity` 返回类型与 architecture.md 一致
- [ ] E6: AST 解析失败时 `confidence=50`（不是 throw）
- [ ] E7: /health 端点无副作用（只读）
- [ ] E7: pino logger 不输出敏感字段
- [ ] 所有测试通过（`pnpm test -- --run`）
- [ ] 覆盖率 >80% (branch)
- [ ] changelog 已更新 (`CHANGELOG.md`)

### 合规性检查

- [ ] 接口签名与 architecture.md API Definitions 一致
- [ ] 文件路径与 architecture.md File Structure 一致
- [ ] 技术选型与 architecture.md Tech Stack 一致
- [ ] 性能指标符合 architecture.md Performance Impact 评估

---

## 文件产出规范

所有 Agent 必须在以下路径产出文件（禁止修改其他路径）:

```
vibex-backend/src/lib/security/
├── codeAnalyzer.ts           # E6 dev
└── __tests__/
    ├── codeAnalyzer.test.ts    # E6 tester
    ├── falsePositiveRate.test.ts  # E6-S2
    └── codeAnalyzer.perf.test.ts  # E6-S3

packages/mcp-server/src/
├── health.ts                 # E7 dev
├── lib/logger.ts             # E7 dev
├── __tests__/
│   ├── health.test.ts        # E7 tester
│   └── logger.test.ts        # E7 tester
└── index.ts                  # E7 dev (修改)

vibex-backend/package.json     # E6 dev (修改依赖)
packages/mcp-server/package.json  # E7 dev (修改依赖)
CHANGELOG.md                  # reviewer (更新)
```
