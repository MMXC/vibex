# Spec: E3 突变测试（抽样）

**文件名**: `specs/e3-mutation-testing.md`
**Epic**: E3 — 突变测试（抽样）
**优先级**: P2 | **工时**: 4h（0.5d）| **负责**: tester

---

## 1. 目标

验证 VibeX 测试套件的有效性，证明"覆盖率 ≥80%"不只是数字游戏。通过对 canvasStore 和 contextStore 的抽样突变测试，确保 kill rate ≥ 70%，输出测试有效性评分。

---

## 2. 功能规格

### E3-S1: 突变测试工具集成

#### 技术规格

| 字段 | 值 |
|------|-----|
| 工具 | stryker-mutator（`@stryker-mutator/jest-runner`）|
| 配置文件 | `stryker.conf.json` |
| 抽样范围 | `src/stores/canvasStore.ts`, `src/stores/contextStore.ts` |
| 超时 | 单次运行 ≤ 10min |
| 测试框架 | Jest 29+（已安装）|

#### stryker.conf.json 配置

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "jest",
  "jest": {
    "configFile": "jest.config.js"
  },
  "mutate": [
    "src/stores/canvasStore.ts",
    "src/stores/contextStore.ts"
  ],
  "timeout": 60000,
  "timeoutFactor": 1.5,
  "reporters": ["html", "json", "clear-text"],
  "coverageAnalysis": "perTest"
}
```

#### 安装命令

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/jest-runner
```

#### 验收标准

```typescript
expect(fs.existsSync('stryker.conf.json')).toBe(true);            // E3-S1-AC1
const cfg = JSON.parse(fs.readFileSync('stryker.conf.json', 'utf-8'));
expect(cfg.mutate).toContain('src/stores/canvasStore.ts');        // E3-S1-AC2
expect(cfg.mutate).toContain('src/stores/contextStore.ts');       // E3-S1-AC3
expect(cfg.timeout).toBe(60000);                                   // E3-S1-AC4
expect(cfg.testRunner).toBe('jest');                              // E3-S1-AC5
```

---

### E3-S2: 核心 Store 突变测试执行

#### 技术规格

| 字段 | 值 |
|------|-----|
| 运行命令 | `npx stryker run` |
| 报告位置 | `reports/mutation/mutation.json` |
| 目标 kill rate | ≥ 70% |
| 兜底策略 | kill rate < 70% 时补充 assertion 后重新运行 |

#### 突变算子覆盖

| 算子 | 说明 | 示例 |
|------|------|------|
| ConditionalBoundary | 边界条件反转 | `a < 5` → `a >= 5` |
| LogicalOperator | 逻辑运算符替换 | `&&` → `\|\|` |
| StringLiteral | 字符串常量变更 | `"pending"` → `""` |
| ArrayDeclaration | 数组初始化变更 | `[1,2,3]` → `[]` |
| ObjectLiteral | 对象字面量变更 | `{a:1}` → `{}` |

#### 验收标准

```typescript
const result = execSync('npx stryker run', { cwd: projectRoot, timeout: 600000 });
expect(result.exitCode).toBe(0);                                               // E3-S2-AC1
const report = JSON.parse(fs.readFileSync('reports/mutation/mutation.json', 'utf-8'));
expect(report.score).toBeGreaterThanOrEqual(0.70);                            // E3-S2-AC2
expect(report.score).toBeLessThanOrEqual(1.0);                                // E3-S2-AC3
expect(fs.existsSync('docs/test-quality-report.md')).toBe(true);              // E3-S2-AC4
```

#### 补充 assertion 规则

当某行代码的 mutants 全部 survived（未被 killed）时：
1. 定位对应的 Jest 测试文件
2. 识别缺失的 assertion 场景
3. 添加 `expect()` 断言
4. 重新运行突变测试直到 kill rate 达标

---

### E3-S3: 测试有效性验证报告

#### 技术规格

| 字段 | 值 |
|------|-----|
| 报告文件 | `docs/test-quality-report.md` |
| 内容 | kill rate、覆盖率对比分析、有效性评分、改进建议 |
| 有效性评分算法 | `(killRate * 0.6 + coverageRate * 0.4) * 100` |

#### 报告模板

```markdown
# Test Quality Report — Sprint 3

**生成日期**: 2026-04-07
**测试范围**: canvasStore, contextStore（抽样）

## 突变测试结果

| 指标 | 值 |
|------|-----|
| 总 Mutants | 120 |
| Killed | 96 |
| Survived | 24 |
| Kill Rate | 80% ✅ |

## 覆盖率 vs 有效性

| 指标 | Epic 3 结果 | E3 突变验证 |
|------|-----------|-------------|
| Store 覆盖率 | ≥80% | ✅ 已验证 |
| 测试有效性（kill rate）| ≥70% | 80% ✅ |
| **综合有效性评分** | - | **82/100** |

## 改进建议

1. canvasStore 中 `addComponent` 方法的 mutants 存活率高，建议补充边界条件测试
2. contextStore 中 `updateFlow` 的 error handling 路径未覆盖，建议增加 try-catch 测试
```

#### 验收标准

```typescript
const report = fs.readFileSync('docs/test-quality-report.md', 'utf-8');
expect(report).toContain('kill rate');                             // E3-S3-AC1
expect(report).toContain('coverage');                             // E3-S3-AC2
expect(report).toMatch(/effectiveness.*score|评分/i);             // E3-S3-AC3
expect(report).toMatch(/\d+\s*%\s*✅/);                           // E3-S3-AC4
// 综合有效性评分 ≥ 70
const scoreMatch = report.match(/综合有效性评分[:\s]+(\d+)/);
expect(parseInt(scoreMatch[1])).toBeGreaterThanOrEqual(70);      // E3-S3-AC5
```

---

## 3. 验收清单

- [ ] E3-S1: `stryker.conf.json` 存在且配置正确
- [ ] E3-S1: 仅对 canvasStore 和 contextStore 抽样
- [ ] E3-S2: `npx stryker run` 执行成功（exitCode=0）
- [ ] E3-S2: kill rate ≥ 70%
- [ ] E3-S2: `reports/mutation/mutation.json` 存在
- [ ] E3-S3: `docs/test-quality-report.md` 包含 kill rate 和覆盖率对比
- [ ] E3-S3: 综合有效性评分 ≥ 70/100

---

## 4. 测试用例

| TC ID | 场景 | 输入 | 预期输出 |
|-------|------|------|----------|
| TC-E3-01 | stryker 配置存在 | `stryker.conf.json` | 包含 canvasStore 和 contextStore |
| TC-E3-02 | 突变测试运行 | `npx stryker run` | exitCode=0, 报告生成 |
| TC-E3-03 | Kill rate 达标 | 突变测试报告 | kill rate ≥ 70% |
| TC-E3-04 | Kill rate 不达标 | 突变测试报告 | kill rate < 70%，补充 assertion |
| TC-E3-05 | 有效性报告内容 | `docs/test-quality-report.md` | 包含 kill rate + 覆盖率 + 评分 |
| TC-E3-06 | 有效性评分 | 报告计算 | 综合评分 ≥ 70 |

---

## 5. 依赖关系

```
E3-S1 (工具集成)
    ↓
E3-S2 (突变测试执行)
    ↓
E3-S3 (有效性报告)
```

---

## 6. 已知限制

1. 突变测试运行时间较长（5-10min），需设置在 CI 慢速套件中
2. 抽样范围仅限于两个 store，全量突变测试不包含在本次 sprint
3. stryker 与某些 TypeScript 语法不兼容，需在 `ignore` 中排除第三方库
