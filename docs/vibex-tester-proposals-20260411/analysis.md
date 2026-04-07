# Tester Proposals — Analysis Document
**项目**: vibex-tester-proposals-vibex-proposals-20260411
**日期**: 2026-04-11
**产出**: docs/vibex-tester-proposals-vibex-proposals-20260411/analysis.md

---

## 1. 业务场景分析

### 1.1 当前测试成熟度评估

| 维度 | 评分 (1-5) | 说明 |
|------|-----------|------|
| E2E 覆盖率 | 2 | 58+ spec 但 35+ 被 @ci-blocking 跳过 |
| CI 门禁有效性 | 1 | @ci-blocking 3轮未修复，门禁形同虚设 |
| 稳定性指标 | 1 | stability.spec.ts 路径错误，检查形同虚设 |
| 单元测试覆盖 | 2 | useAutoSave/useAIController 被 exclude |
| 合约测试覆盖 | 1 | 仅1个 contract spec，flows API 无覆盖 |
| 变异测试 | 1 | Stryker 在 pnpm workspace 阻塞 |

### 1.2 20260411 Sprint 测试需求矩阵

| 来源 | 功能点 | 测试类型 | 风险等级 | 现有覆盖 |
|------|--------|---------|---------|---------|
| dev/20260411 | WebSocket console.log → logger | backend unit | 中 | ❌ 无 |
| dev/20260411 | project-snapshot.ts TODO 修复 | contract E2E | 高 | ❌ 无 |
| dev/20260411 | ai-service JSON 解析增强 | backend unit | 中 | ❌ 无 |
| dev/20260411 | PrismaClient Workers guard | manual/integration | 高 | ❌ 无 |
| 20260410遗留 | generate-components flowId | E2E | 高 | ❌ 无 |
| 20260410遗留 | @ci-blocking 移除 | CI governance | 极高 | ⚠️ 测试数量验证 |

### 1.3 关键用户路径覆盖现状

```
用户核心路径:
[注册/登录] → [创建项目] → [输入需求] → [AI生成Canvas] → [预览/编辑] → [导出]
     ↓              ↓            ↓            ↓              ↓         ↓
  auth-flow    project-flow  requirement  generate-     prototype  export
  ✅ spec      ✅ spec      ✅ spec     ❌ flowId验证   ⚠️ 跳过    ⚠️ 跳过
                                                          ↓
                                                    [冲突解决]
                                                    ⚠️ 跳过
```

---

## 2. 技术方案选项

### 方案 A：渐进式修复 + 新测试覆盖（推荐）

**策略**: 先止血（P0 测试基础设施），再补充新增功能测试，最后系统性清理技术债务。

**实施步骤**:

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | 删除 `tests/e2e/playwright.config.ts`，统一根配置 | 1h | CI 使用 30s timeout |
| Phase 2 | 修复 `stability.spec.ts` 路径 + 验证 waitForTimeout 87处 | 1h | F1.1/F1.3 正常工作 |
| Phase 3 | 添加 generate-components flowId E2E | 2h | AI生成有 CI 保障 |
| Phase 4 | 添加 project-snapshot contract test | 2h | 快照 API schema 验证 |
| Phase 5 | 清理 87 处 waitForTimeout | 4h | 稳定性提升 |

**优点**: 快速止血，风险可控，每阶段可验证
**缺点**: 耗时长（~10h），waitForTimeout 清理需逐文件手动替换

### 方案 B：激进重构 + 全面覆盖

**策略**: 重写 Playwright 配置体系，一次性解决所有测试基础设施问题。

**实施步骤**:

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | 删除 `tests/e2e/` 整个目录，统一测试到根 `tests/e2e/` | 2h | 消除双重配置 |
| Phase 2 | 修复所有 7 个 Playwright project testDir | 1h | 所有 project 正常 |
| Phase 3 | 添加 5 个 20260411 新功能 E2E 测试 | 3h | 全覆盖 |
| Phase 4 | 统一替换 waitForTimeout → 网络等待 | 6h | 零不稳定等待 |
| Phase 5 | 添加 MSW 隔离 AI/网络调用 | 4h | 确定性测试 |

**优点**: 一次解决所有历史债务，测试可靠性最高
**缺点**: 变更范围大（涉及 58+ 测试文件），回滚成本高

### 方案 C：最小可行 + 聚焦门禁（快速止血）

**策略**: 只修复最影响 CI 门禁的 3 个 P0 问题，其他推迟到下一 sprint。

**实施步骤**:

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | 删除 `grepInvert` + 删除 `tests/e2e/playwright.config.ts` | 30min | CI 运行所有测试 |
| Phase 2 | 修复 `stability.spec.ts` 路径 | 15min | F1 指标生效 |
| Phase 3 | 添加 generate-components flowId E2E | 2h | AI生成 CI 保障 |
| Phase 4 | 验证 CI pass rate ≥ 90% | 1h | 门禁达标 |

**优点**: 最快恢复 CI 门禁有效性（<4h）
**缺点**: 技术债务保留，waitForTimeout 继续累积

---

## 3. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| 删除 `tests/e2e/playwright.config.ts` 后 CI 无法运行 | 低 | 高 | 提前在本地验证 `pnpm run test:e2e:ci` |
| stability.spec.ts 修复后 87 处 FAIL 导致 CI 红 | 高 | 中 | 先批量清理 waitForTimeout 再验证 |
| 新增 E2E 测试不稳定导致 CI flaky | 中 | 中 | 使用 `force:true` + 网络等待替代 waitForTimeout |
| WebSocket logger 重构破坏生产日志 | 低 | 高 | 添加 backend unit test 验证 logger 调用 |
| project-snapshot contract test 暴露 schema 不一致 | 中 | 中 | 分阶段测试，先测 happy path |

---

## 4. 验收标准

### 4.1 P0 — CI 门禁有效性（必须通过）

```
✅ CI E2E 运行 >= 50 个测试（非 15 个）
✅ CI E2E expect timeout = 30000ms（非 10000ms）
✅ stability.spec.ts 能检测到 waitForTimeout 违规（非 0 结果）
✅ 根 playwright.config.ts 是唯一配置（tests/e2e/playwright.config.ts 不存在）
```

### 4.2 P1 — 新功能测试覆盖

```
✅ generate-components E2E 验证 flowId 存在且为 UUID
✅ project-snapshot API contract test 验证响应 schema
✅ ai-service JSON 解析增强有 unit test 覆盖 markdown 提取
✅ backend WebSocket logger 重构有回归测试
```

### 4.3 P2 — 技术债务控制

```
✅ E2E spec 中 waitForTimeout 数量 <= 0（除 stability.spec.ts 自身检测代码）
✅ canvas-e2e project testDir 指向存在目录
✅ useAutoSave.test.ts 能被 Vitest 运行（非 excluded）
✅ Contract 测试 >= 2 个（含 flows API）
```

---

## 5. 工时估算

| 方案 | 总工时 | 适用场景 |
|------|--------|---------|
| 方案 A（渐进式） | ~10h | 有充足时间，系统性修复 |
| 方案 B（激进重构） | ~16h | 需要一次性解决所有债务 |
| 方案 C（最小可行） | ~4h | 快速恢复 CI，债务推迟 |

**推荐**: 方案 C（最小可行）优先，方案 A 后续 sprint 跟进。

**单人估算**:
- P0 基础设施修复: 1.5h
- 新功能测试覆盖: 5h
- waitForTimeout 清理: 4h
- 合计: **~10.5h（方案 A）**

---

## 6. 依赖关系

```
P0-1/2/3 基础设施修复（删除双重配置）
    ↓
P0-4 generate-components E2E（依赖 CI 配置正确）
    ↓
P1-1/2 新功能测试（P0-4 之后追加）
    ↓
P2 waitForTimeout 清理（依赖所有新测试已添加）
```

---

## 7. 测试资产全景图（2026-04-11）

```
vibex-fronted/
├── playwright.config.ts              ← 根配置 ✅ expect: 30000ms
├── tests/
│   ├── e2e/
│   │   ├── playwright.config.ts      ← ❌ 重复配置 expect: 10000ms
│   │   ├── stability.spec.ts         ← ❌ 路径错误 ./e2e/ 不存在
│   │   ├── *.spec.ts                 ← 58+ E2E spec（35+ 被 @ci-blocking 跳过）
│   │   └── canvas-e2e project        ← ❌ testDir: './e2e' 不存在
│   └── unit/
│       ├── setup.tsx                 ← ✅ Vitest Jest 兼容
│       └── __tests__/
│           ├── useAutoSave.test.ts   ← ❌ 被 vitest exclude
│           └── useAIController.test.tsx ← ⚠️ jest 语法不兼容
├── tests/contract/
│   └── sync.contract.spec.ts        ← 1 个合约测试 ❌ flows API 无覆盖
└── vitest.config.ts

vibex-backend/
├── src/
│   ├── services/
│   │   ├── websocket/connectionPool.ts ← ⚠️ console.log → logger 重构中
│   │   ├── ai-service.ts               ← ⚠️ JSON 解析增强中
│   │   └── __tests__/                  ← ❌ 无 backend unit test
│   └── routes/
│       └── project-snapshot.ts         ← ⚠️ 5个 TODO 修复中
└── vitest.config.ts
```

---

*本分析由 Tester Agent 生成于 2026-04-11*
