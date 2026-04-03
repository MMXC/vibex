# AGENTS.md — VibeX 测试质量深化开发约束

**项目**: vibex-tester-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect

---

## 1. 测试框架约束

### 1.1 框架规范

| 约束 | 描述 | 违规处理 |
|------|------|---------|
| **禁止 vitest** | 项目仅安装 Jest，使用 jest | ESLint: `no-restricted-imports` 禁止 vitest |
| **禁止混合测试框架** | 一个文件中不能同时导入 jest 和 vitest | TypeScript 编译检查 |
| **Jest 配置统一** | 所有 contract 测试使用 `test/contract/jest.config.ts` | 禁止创建独立 jest.config.js |
| **Playwright 配置唯一** | 仅修改根目录 `playwright.config.ts`，不新增其他 playwright config | CI 验证 |

### 1.2 测试文件位置规范

```
test/
├── schemas/              # E2: API Schema 文件（JSON）
│   ├── domain-model.json
│   ├── requirement.json
│   └── flow.json
└── contract/
    ├── jest.config.ts   # E2: Contract 测试配置
    └── mock-consistency.test.ts  # E2: Mock 一致性测试

scripts/
├── generate-schemas.ts  # E2: Schema 生成脚本
├── parse-playwright-report.py  # E1: Report 解析
└── check-mock-sync.js   # E2-S3: Mock 同步检查

docs/
├── daily-stability.md    # E1-S3: 稳定性日志
└── test-quality-report.md  # E3-S2: 测试有效性报告

reports/
└── mutation/            # E3: 突变测试报告
    └── mutation.json
```

**禁止**:
- 在 `vibex-fronted/tests/` 目录外创建新的 E2E spec 文件
- 在 `src/stores/__tests__/` 目录外创建 store 测试
- 在 `test/schemas/` 目录外创建 JSON Schema 文件

---

## 2. Playwright 约束

### 2.1 配置约束

```typescript
// playwright.config.ts 必须配置
{
  retries: 2,        // E1-S1: CI 环境重试
  workers: 1,       // 消除并行 flaky
  reporter: [
    ['list'],        // CI 日志可读
    ['json']        // 用于 stability report
  ],
  timeout: 60000,    // 60s per test
  use: {
    actionTimeout: 15000,  // 15s action timeout
    trace: 'on-first-retry'  // 首次失败保留 trace
  }
}
```

### 2.2 E2E 测试规范

| 约束 | 描述 |
|------|------|
| **每个 spec 必须 idempotent** | 测试可重复运行，结果一致 |
| **必须有适当的 wait** | `page.waitForLoadState('networkidle')` 或 `waitForSelector` |
| **禁止硬编码 sleep** | 使用 `waitForFunction` 或 `waitForSelector` |
| **每个 flaky 测试必须标注** | 在 spec 文件顶部注释 `// Flaky: known issue #xxx` |
| **trace/screenshot on failure** | 已配置，测试失败自动保留 |

---

## 3. Contract 测试约束

### 3.1 Schema 生成规范

```typescript
// scripts/generate-schemas.ts 输出规范
interface SchemaOutput {
  $schema: string;     // "http://json-schema.org/draft-07/schema#"
  type: "object";
  required: string[];  // 必填字段
  properties: {
    [key: string]: {
      type: string;
      enum?: string[];  // 枚举值
      description?: string;
    };
  };
}
```

### 3.2 Mock 一致性测试规范

```typescript
// test/contract/mock-consistency.test.ts 断言规范
describe('API Mock Consistency', () => {
  // 每个 Schema 必须有 5+ 个字段一致性断言
  it('domain-model mock fields match schema', () => {
    const schema = loadSchema('domain-model');
    const mock = loadMock('domain-entity');

    // required 字段必须存在
    expect(Object.keys(mock)).toIncludeAllMembers(schema.required);

    // 字段类型必须一致
    for (const field of schema.required) {
      expect(typeof mock[field]).toBe(typeof schema.properties[field].type);
    }
  });
});
```

### 3.3 Schema 变更 CI 约束

```yaml
# schema-contract-gate.yml 触发条件
on:
  push:
    paths:
      - 'test/schemas/**'
      - 'test/contract/**'
```

---

## 4. 突变测试约束

### 4.1 Stryker 配置约束

```json
// stryker.conf.json 必须配置
{
  "testRunner": "jest",
  "mutate": [
    "src/lib/canvas/canvasStore.ts",
    "src/stores/contextStore.ts"
  ],
  "timeout": 600000,
  "thresholds": {
    "break": 70,
    "high": 90,
    "low": 60
  }
}
```

### 4.2 突变测试执行约束

| 约束 | 描述 |
|------|------|
| **仅对指定 store 抽样** | 不全量突变，保持运行时间 < 10min |
| **kill rate 目标** | >= 70%，低于阈值需补充 assertion |
| **Survived 突变分析** | 每个 survived 突变必须判断：测试不足 or 测试正确 |
| **突变报告必须存档** | `reports/mutation/mutation.json` 每次运行更新 |

### 4.3 突变测试 DoD

```
突变测试通过的判断标准:
1. stryker run 成功完成（无 timeout crash）
2. kill rate >= 70%
3. 所有 survived 突变已分析（有注释）
4. docs/test-quality-report.md 已更新
```

---

## 5. Git 约束

### 5.1 Commit 消息格式

```
# 格式: [E{Epic}-{Story}] {简短描述}
# 示例:
[E1-S1] playwright: set retries=2 for CI
[E2-S1] test: add domain-model JSON schema
[E3-S2] mutation: run stryker on canvasStore, kill rate 77%
```

### 5.2 PR 规范

| 约束 | 描述 |
|------|------|
| **PR 必须包含测试结果** | stability report 输出 / contract test 结果 |
| **PR 必须包含 schema diff** | test/schemas 变更需说明字段增删改 |
| **PR 必须包含 mutation 报告摘要** | E3 的 PR 需包含 kill rate 数字 |
| **一个 PR 对应一个 Epic** | 不在一个 PR 内混合多个 Epic |

---

## 6. CI/CD 约束

### 6.1 GitHub Actions 集成

```
# playwright.yml 新增 step
- name: Stability Report
  run: bash scripts/test-stability-report.sh
  continue-on-error: true  # flaky 不阻断 CI，但记录

# schema-contract-gate.yml (新增)
name: Schema Contract Gate
on:
  push:
    paths:
      - 'test/schemas/**'
      - 'test/contract/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:contract
```

### 6.2 CI 通过条件

| 套件 | 通过条件 | 阻断级别 |
|------|---------|---------|
| playwright E2E | passRate >= 95%, flaky <= 1 | 阻断 (E1) |
| contract tests | 20+ tests pass, 0 failures | 阻断 (E2) |
| schema gate | schema + mock 同时更新 | 阻断 (E2-S3) |
| mutation tests | kill rate >= 70% | 不阻断 (E3, 可选慢速套件) |

---

## 7. 测试数据约束

| 约束 | 描述 |
|------|------|
| **禁止使用真实用户数据** | 所有测试数据使用 mock/factory |
| **Schema fixtures 必须同步** | 后端 route test fixtures 变更时同步更新 Schema |
| **Mock 数据集中管理** | 在 `test/fixtures/` 目录管理，不散落各处 |
| **Stability report 记录真实数据** | daily-stability.md 记录真实 passRate，不造假 |

---

## 8. Feature Flag / Rollout 约束

| Epic | Feature Flag | 默认值 | 说明 |
|------|-------------|--------|------|
| E1-S3 stability report | — | 始终开启 | 集成到 CI，不需 flag |
| E2-S3 schema gate | — | PR 阻断 | test/schemas 变更才触发 |
| E3 mutation | `ENABLE_MUTATION_TEST` | off | 运行时间长，默认关闭，仅 CI scheduled 触发 |

---

## 9. 文档约束

### 9.1 必须维护的文档

| 文档 | 更新时机 | 负责人 |
|------|---------|--------|
| `docs/daily-stability.md` | 每次 E2E 运行后 | tester |
| `docs/test-quality-report.md` | 每次 mutation test 运行后 | tester |
| `test/schemas/README.md` | Schema 文件变更时 | dev |
| `stryker.conf.json` 注释 | 配置变更时 | dev/tester |

### 9.2 文档格式规范

```markdown
# test-quality-report.md 格式
## 突变测试结果
| Store | Kill Rate | Total | Killed | Survived |
|-------|-----------|-------|--------|----------|
| canvasStore | 77% | 100 | 77 | 23 |

## 覆盖率 vs 有效性
| 指标 | 值 | 状态 |
|------|-----|------|
| 行覆盖率 | 82% | ✅ |
| Kill Rate | 77% | ✅ |

## 结论
Epic 3 覆盖率成果有效。
```
