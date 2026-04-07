# Spec: E2 API Contract 测试

**文件名**: `specs/e2-api-contract-testing.md`
**Epic**: E2 — API Contract 测试
**优先级**: P1 | **工时**: 8h（1d）| **负责**: dev + tester

---

## 1. 目标

建立前后端 API 契约自动化校验机制，消除"字段名改了但 mock 没改"导致的隐蔽 bug。覆盖 3 个核心 API（domain-model, requirement, flow），生成 ≥20 条 contract 测试用例。

---

## 2. 功能规格

### E2-S1: 核心 API JSON Schema 生成

#### 技术规格

| 字段 | 值 |
|------|-----|
| 输出目录 | `test/schemas/` |
| 目标 API | domain-model, requirement, flow（3 个核心 API）|
| 数据源 | 后端 route tests（279 个）+ 实际 API 响应样本 |
| Schema 格式 | JSON Schema draft-07 |

#### Schema 字段定义

```json
// test/schemas/domain-model.json 示例
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "projectId", "boundedContexts"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "projectId": { "type": "string" },
    "boundedContexts": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "components"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "components": { "type": "array" }
        }
      }
    }
  }
}
```

#### 验收标准

```typescript
expect(fs.existsSync('test/schemas/domain-model.json')).toBe(true); // E2-S1-AC1
expect(fs.existsSync('test/schemas/requirement.json')).toBe(true);  // E2-S1-AC2
expect(fs.existsSync('test/schemas/flow.json')).toBe(true);         // E2-S1-AC3
const schema = JSON.parse(fs.readFileSync('test/schemas/domain-model.json', 'utf-8'));
expect(schema.type).toBe('object');                                  // E2-S1-AC4
expect(schema.required).toBeDefined();                              // E2-S1-AC5
expect(schema.required.length).toBeGreaterThan(0);                  // E2-S1-AC6
expect(Object.keys(schema.properties).length).toBeGreaterThan(0);   // E2-S1-AC7
```

---

### E2-S2: 前端 Mock 一致性校验

#### 技术规格

| 字段 | 值 |
|------|-----|
| 测试文件 | `test/contract/mock-consistency.test.ts` |
| 校验逻辑 | 读取 Schema 和前端 mock 数据，递归比对字段名、类型、required 约束 |
| 前端 mock 位置 | `services/api/*.test.ts` |
| 断言方式 | Jest + custom matchers for schema validation |

#### 校验脚本逻辑

```
1. 加载 test/schemas/*.json → schemas[]
2. 加载 services/api/*.test.ts 中的 mock 数据 → mocks[]
3. 对每个 schema，遍历对应 mock：
   a. 校验 required 字段是否存在
   b. 校验字段类型是否匹配
   c. 校验嵌套对象结构
4. 收集所有不一致项，输出错误报告
```

#### 验收标准

```typescript
const result = execSync('npm run test:contract', { cwd: projectRoot });
expect(result.exitCode).toBe(0);                                      // E2-S2-AC1
const jestResult = JSON.parse(fs.readFileSync('test-results/contract.json'));
expect(jestResult.numPassingTests).toBeGreaterThanOrEqual(20);      // E2-S2-AC2
expect(jestResult.numFailingTests).toBe(0);                         // E2-S2-AC3
expect(jestResult.testResults[0].assertionResults.every(
  r => r.status === 'passed'
)).toBe(true);                                                      // E2-S2-AC4
```

---

### E2-S3: Schema 变更 CI 拦截

#### 技术规格

| 字段 | 值 |
|------|-----|
| 实现方式 | GitHub Actions pre-check 或 Husky pre-commit hook |
| 触发条件 | `test/schemas/*.json` 文件变更 |
| 拦截逻辑 | Schema 变更后运行 contract 测试，失败则阻止 commit/PR |
| 配置位置 | `.github/workflows/contract.yml` |

#### GitHub Actions 配置

```yaml
# .github/workflows/contract.yml
name: API Contract Tests
on:
  pull_request:
    paths:
      - 'test/schemas/**'
      - 'src/services/api/**'
  push:
    branches: [main]

jobs:
  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Contract Tests
        run: npm run test:contract
      - name: Upload Results
        uses: actions/upload-artifact@v4
        with:
          name: contract-results
          path: test-results/contract.json
```

#### 验收标准

```typescript
// E2-S3-AC1: Schema 变更但 mock 未同步 → CI 失败
execSync('cp test/schemas/domain-model.json test/schemas/domain-model.json.bak');
fs.writeFileSync('test/schemas/domain-model.json',
  JSON.stringify({ ...JSON.parse(fs.readFileSync('test/schemas/domain-model.json')), version: 2 }));
const result = execSync('npm run test:contract', { cwd: projectRoot, expectFailure: true });
expect(result.exitCode).not.toBe(0);  // CI 失败
execSync('mv test/schemas/domain-model.json.bak test/schemas/domain-model.json');

// E2-S3-AC2: CI workflow 文件存在
expect(fs.existsSync('.github/workflows/contract.yml')).toBe(true);
```

---

## 3. 验收清单

- [ ] E2-S1: `test/schemas/` 下有 3 个核心 API 的 JSON Schema
- [ ] E2-S1: 每个 Schema 包含 `type`、`required`、`properties` 字段
- [ ] E2-S2: `npm run test:contract` 通过，≥20 条测试用例
- [ ] E2-S2: 前端 mock 与 Schema 一致性 100%
- [ ] E2-S3: `.github/workflows/contract.yml` 存在且可触发
- [ ] E2-S3: Schema 变更（mock 不同步）时 CI 失败
- [ ] E2-S3: Schema 和 mock 同时更新时 CI 通过

---

## 4. 测试用例

| TC ID | 场景 | 输入 | 预期输出 |
|-------|------|------|----------|
| TC-E2-01 | Schema 文件存在性 | `test/schemas/*.json` | 3 个文件存在 |
| TC-E2-02 | Schema 字段完整性 | domain-model.json | 包含 required、properties |
| TC-E2-03 | Contract 测试通过 | mock 与 schema 对齐 | exitCode=0, ≥20 tests pass |
| TC-E2-04 | Contract 测试失败 | mock 缺少 required 字段 | exitCode≠0, 显示缺失字段 |
| TC-E2-05 | CI 拦截 | Schema 变更，mock 不同步 | GitHub Actions 构建失败 |
| TC-E2-06 | CI 通过 | Schema 和 mock 同时更新 | GitHub Actions 构建成功 |

---

## 5. 依赖关系

```
E2-S1 (Schema 生成)
    ↓
E2-S2 (Mock 一致性校验) ←→ 需要 dev 提供 API 字段定义
    ↓
E2-S3 (CI 拦截) ←→ 需要 GitHub Actions 配置权限
```
