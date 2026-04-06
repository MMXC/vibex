# VibeX 测试基础设施实施计划

**项目**: vibex-tester-proposals-vibex-proposals-20260410  
**版本**: 1.0  
**日期**: 2026-04-10  
**状态**: Draft

---

## 1. Sprint 总览

| Sprint | 周期 | 人天 | 目标 |
|--------|------|------|------|
| Sprint 1 | 5 天 | 5 人天 | 止血与配置统一（Epic 1-4） |
| Sprint 2 | 2 天 | 1.5 人天 | 扩展与决策（Epic 5） |

---

## 2. Sprint 1: 止血与配置统一（5 人天）

### Day 1 AM: Epic 1 — Playwright 配置统一

#### Story S1.1: 合并 Playwright 配置（0.5d）

**目标**: 删除 `tests/e2e/playwright.config.ts`，统一使用根配置

**执行步骤**:
1. 读取 `tests/e2e/playwright.config.ts`，提取 `webServer` 配置块
2. 将 `webServer` 配置合并到 `playwright.config.ts`
3. 验证 CI workflow (`.github/workflows/test.yml`) 中的 Playwright 命令指向根配置
4. 删除 `tests/e2e/playwright.config.ts`
5. 验证: `test -f tests/e2e/playwright.config.ts` → PASS

**验证命令**:
```bash
# AC1: 文件已删除
test -f vibex-fronted/tests/e2e/playwright.config.ts && echo "FAIL" || echo "PASS"

# AC2: webServer 在根配置
grep "webServer" vibex-fronted/playwright.config.ts

# AC3: CI 使用根配置
grep "playwright.config.ts" .github/workflows/test.yml
# 不应包含 tests/e2e/playwright.config.ts
```

#### Story S1.2: 移除 grepInvert（0.1d）

**执行步骤**:
1. 打开 `playwright.config.ts`
2. 找到 `grepInvert` 配置行并删除
3. 验证: `grep "grepInvert" playwright.config.ts` → 无输出

**验证命令**:
```bash
grep "grepInvert" vibex-fronted/playwright.config.ts vibex-fronted/tests/e2e/playwright.config.ts
# 应无输出
```

#### Story S1.3: CI 配置验证（0.5d）

**执行步骤**:
1. 验证 `expect: { timeout: 30000 }` 在根配置中
2. 运行 `CI=true npx playwright test --list` 验证配置加载正常
3. 确认 CI workflow 使用 `npx playwright test`（无子路径）

**验证命令**:
```bash
grep -A1 "expect:" vibex-fronted/playwright.config.ts
# 输出: timeout: 30000
```

---

### Day 1 PM: Epic 2 — 稳定性监控修复

#### Story S2.1: 修复 stability.spec.ts 路径（0.5d）

**目标**: E2E_DIR 从 `./e2e/` 修正为 `./tests/e2e/`

**执行步骤**:
1. 打开 `tests/e2e/stability.spec.ts`
2. 找到 `E2E_DIR` 常量定义行
3. 修改: `const E2E_DIR = './e2e/'` → `const E2E_DIR = './tests/e2e/'`
4. 添加目录存在性断言（`existsSync` 检查）
5. 验证: `npx playwright test stability.spec.ts --project=chromium` → 不显示 "0 tests found"

**验证命令**:
```bash
grep "E2E_DIR" vibex-fronted/tests/e2e/stability.spec.ts
# 包含 ./tests/e2e/

grep "existsSync\|isDirectory\|assert" vibex-fronted/tests/e2e/stability.spec.ts
# 有至少一个存在性检查

npx playwright test stability.spec.ts --project=chromium 2>&1
# 不包含 "0 tests found"
```

#### Story S2.2: 验证 F1 检查通过（0.25d）

**执行步骤**:
1. 运行 `stability.spec.ts` 全部 F1 检查
2. 确认 E2E spec 数量统计正确（58 个）
3. 确认无 "directory not found" 错误

---

### Day 2: Epic 3 — waitForTimeout 清理（1d）

#### Story S3.1: conflict-resolution.spec.ts 清理（0.25d）

**执行步骤**:
1. 扫描文件中所有 `waitForTimeout` 用法
2. 分类替换（见架构文档 §4.3 等待策略模式）:
   - 网络响应等待 → `page.waitForResponse()`
   - 元素出现 → `page.waitForSelector(locator, { state: 'visible' })`
   - 元素消失 → `page.waitForSelector(locator, { state: 'hidden' })`
   - 路由变化 → `expect(page).toHaveURL()`
3. 移除所有 `waitForTimeout` 调用
4. 运行测试验证无回归

**替换映射表**:
| 原代码 | 替换方案 |
|--------|---------|
| `await page.waitForTimeout(1000)` | `await page.waitForResponse(r => r.url().includes('api'), { timeout: 5000 })` |
| `await page.waitForTimeout(500)` | `await page.waitForSelector('#element-id', { timeout: 3000 })` |
| `await page.waitForTimeout(3000)` | `await expect(page).toHaveURL(/\/expected/, { timeout: 5000 })` |

#### Story S3.2: conflict-dialog.spec.ts 清理（0.25d）

同 S3.1 模式，替换 6 处 `waitForTimeout`。

#### Story S3.3: auto-save.spec.ts 清理（0.25d）

同 S3.1 模式，替换 5 处 `waitForTimeout`。重点关注：
- 保存后网络完成 → `waitForResponse('/api/sync')`
- 对话框消失 → `waitForSelector('[role="dialog"]', { state: 'hidden' })`

#### Story S3.4: 其他文件 + ESLint 规则（0.25d）

**执行步骤**:
1. 清理 `homepage-tester-report.spec.ts` 中 2 处
2. 清理 `login-state-fix.spec.ts` 中 1 处
3. 扫描所有 `tests/e2e/*.spec.ts` 确认无残留
4. 添加 ESLint 规则检测新增的 `waitForTimeout`

**ESLint 规则**:
```json
// .eslintrc 中添加
{
  "rules": {
    "no-restricted-globals": ["error", "waitForTimeout"]
  }
}
```

**验证命令**:
```bash
# 无 waitForTimeout 残留（排除注释）
grep -rn "waitForTimeout" vibex-fronted/tests/e2e/ \
  --include="*.spec.ts" \
  -v "flaky\|comment\|FIXME\|//\|/\*"
# 返回 0 行
```

---

### Day 3: Epic 4 — Hook 测试激活（useAIController）

#### Story S4.1: useAIController 测试修复（1d）

**目标**: jest.* 语法迁移到 vi.*，测试通过

**执行步骤**:
1. 读取 `src/hooks/canvas/useAIController.test.tsx`
2. 识别所有 `jest.` 调用:
   ```bash
   grep -n "jest\." vibex-fronted/src/hooks/canvas/useAIController.test.tsx
   ```
3. 替换规则:
   | Jest | Vitest |
   |------|--------|
   | `jest.fn()` | `vi.fn()` |
   | `jest.spyOn()` | `vi.spyOn()` |
   | `jest.clearAllMocks()` | `vi.clearAllMocks()` |
   | `jest.mock()` | `vi.mock()` |
   | `jest.useFakeTimers()` | `vi.useFakeTimers()` |
   | `jest.useRealTimers()` | `vi.useRealTimers()` |
   | `jest.mockResolvedValue()` | `vi.mockResolvedValue()` |
4. 检查 `setupFiles` 是否正确导入 Vitest 兼容的 setup
5. 运行测试: `npx vitest run useAIController.test.tsx`
6. 验证: 0 failures

**验证命令**:
```bash
# 无 jest.* 语法残留
grep "jest\." vibex-fronted/src/hooks/canvas/useAIController.test.tsx
# 应无输出

# 测试通过
cd vibex-fronted && npx vitest run src/hooks/canvas/useAIController.test.tsx --reporter=verbose
# 0 failures
```

---

### Day 4: Epic 4 — Hook 测试激活（useAutoSave）

#### Story S4.2: useAutoSave 测试修复（1d）

**目标**: 调查 exclude 根因，修复 sendBeacon/localStorage mock

**执行步骤**:
1. 检查 `vitest.config.ts` 的 exclude 列表，找到 `useAutoSave`
2. 读取 `src/hooks/canvas/__tests__/useAutoSave.test.ts`
3. 诊断测试失败原因:
   ```bash
   npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts
   ```
4. 常见问题修复:
   - **sendBeacon mock**: `navigator.sendBeacon` 是非标准 API，需要手动 mock
   - **localStorage mock**: Vitest jsdom 环境有内置 localStorage，但仍需精确 mock
5. 修复 mock 代码:
   ```typescript
   beforeEach(() => {
     // Mock sendBeacon
     Object.defineProperty(navigator, 'sendBeacon', {
       value: vi.fn().mockReturnValue(true),
       writable: true,
       configurable: true,
     });
     // Mock localStorage
     const storage = {};
     Storage.prototype.getItem = vi.fn((key) => storage[key] ?? null);
     Storage.prototype.setItem = vi.fn((key, value) => { storage[key] = value; });
   });
   ```
6. 验证: `npx vitest run useAutoSave.test.ts` → 0 failures

**验证命令**:
```bash
cd vibex-fronted && npx vitest run src/hooks/canvas/__tests__/useAutoSave.test.ts --reporter=verbose
# 0 failures
```

#### Story S4.3: 从 vitest.config.ts 移除 exclude（0.25d）

**执行步骤**:
1. 打开 `vitest.config.ts`
2. 从 `exclude` 数组中移除 `'useAutoSave'` 和 `'useCanvasExport'`
3. 验证测试文件不被跳过:
   ```bash
   npx vitest run --reporter=verbose | grep -E "useAutoSave|useCanvasExport"
   ```

**验证命令**:
```bash
grep "useAutoSave" vibex-fronted/tests/unit/vitest.config.ts
# 应无 exclude 匹配
```

---

### Day 5: Epic 5 — canvas-e2e 修复 + CI 验证

#### Story S5.1: canvas-e2e testDir 修复（0.5d）

**执行步骤**:
1. 打开 `playwright.config.ts`
2. 找到 `name: 'canvas-e2e'` 项目配置
3. 确认 `testDir: './tests/e2e'`
4. 运行 `npx playwright test --project=canvas-e2e --list` 验证找到测试

**验证命令**:
```bash
grep -A5 "name: 'canvas-e2e'" vibex-fronted/playwright.config.ts | grep "testDir"
# 包含 ./tests/e2e

npx playwright test --project=canvas-e2e --list 2>/dev/null | grep "·" | wc -l
# >= 1
```

#### Day 5 PM: CI 端到端验证（0.5d）

**执行步骤**:
1. 触发完整 CI pipeline（push to feature branch）
2. 验证 E2E job 运行 ≥ 50 个测试（grepInvert 移除后）
3. 验证 pass rate ≥ 90%
4. 确认 Vitest + Jest unit tests 通过
5. 确认 coverage threshold 门禁执行

**成功标准**:
- CI E2E: ≥ 50 tests run, ≥ 90% pass
- CI Unit: Vitest 0 failures, Jest 0 failures
- CI Coverage: All thresholds ≥ 85%

---

## 3. Sprint 2: 扩展与决策（1.5 人天）

### Day 6: Epic 5 — flows.contract.spec.ts

#### Story S5.2: flows.contract.spec.ts 新增（0.5d）

**执行步骤**:
1. 参考 `tests/contract/sync.contract.spec.ts` 模式
2. 定义 flows API Zod schema（见架构文档 §4.5）
3. 实现 4 个 contract 测试用例
4. 运行测试: `npx playwright test tests/contract/flows.contract.spec.ts`

**验证命令**:
```bash
test -f vibex-fronted/tests/contract/flows.contract.spec.ts && echo "PASS"
cd vibex-fronted && npx playwright test tests/contract/flows.contract.spec.ts
# 0 failures
```

---

### Day 7: Epic 5 — Stryker 决策

#### Story S5.3: Stryker 方案决策（0.5d）

**执行步骤**:
1. 研究三个选项:
   - **选项 A**: Docker CI（独立 mutation test 环境）
   - **选项 B**: 替代指标（用高级测试覆盖替代 mutation）
   - **选项 C**: Vitest runner（利用 Vitest 原生 mutation 支持）
2. 评估维度: CI 成本、维护复杂度、团队接受度
3. 产出 `docs/decisions/stryker-approach.md`
4. 包含决策矩阵和推荐选项

**文档结构**:
```markdown
# ADR: Mutation Testing Strategy

## Status: Proposed

## Options
| Option | Pros | Cons | Est. Cost |
|--------|------|------|-----------|
| A: Docker CI | 隔离环境 | CI 时间增加 | High |
| B: Alternative metrics | 零额外 CI | 无 mutation 覆盖 | Low |
| C: Vitest runner | 原生集成 | Vitest 迁移先行 | Medium |

## Decision
[选定方案 + 理由]

## Consequences
```

---

## 4. Epic-Story 甘特图

```
Week 1 (Sprint 1)
────────────────────────────────────────────────────
Mon AM  │ S1.1 合并配置 │ S1.2 移除grep │ S1.3 CI验证 │
Mon PM  │ S2.1 stability路径│ S2.2 F1验证 │
Tue     │ S3.1 conflict-res │ S3.2 conflict-dlg │ S3.3 auto-save │ S3.4 其他+ESLint │
Wed     │ S4.1 useAIController 修复 │
Thu AM  │ S4.2 useAutoSave 修复 │
Thu PM  │ S4.3 移除 exclude │
Fri AM  │ S5.1 canvas-e2e修复 │
Fri PM  │ CI 端到端验证 (E2E ≥ 50 tests, ≥ 90%) │

Week 2 (Sprint 2)
────────────────────────────────────────────────────
Mon     │ S5.2 flows.contract.spec.ts 新增 │
Tue     │ S5.3 Stryker 决策文档 + 收尾 │
```

---

## 5. 风险缓解计划

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| grepInvert 移除后 CI 失败率上升 | 高 | 高 | 设置 pass rate ≥ 90%；分批修复失败的 @ci-blocking 测试 |
| useAutoSave.exclude 根因复杂 | 中 | 中 | Day 4 专门诊断；超时则记录根因后延后 |
| stability.spec.ts 修复后暴露 waitForTimeout | 高 | 中 | Day 2 已安排清理；提前扫描估算工作量 |
| Jest → Vitest 迁移后覆盖率下降 | 低 | 中 | Vitest coverage 单独配置 threshold |
| CI E2E 执行时间超过 30 分钟 | 中 | 中 | 监控 CI 时间；Sprint 1 后评估优化 |

---

## 6. Sprint 结束标准

### Sprint 1 Done (Day 5)
- [ ] Epic 1: Playwright 单一配置，grepInvert 移除
- [ ] Epic 2: stability.spec.ts 路径正确，F1 检查通过
- [ ] Epic 3: 0 waitForTimeout 残留，ESLint 规则生效
- [ ] Epic 4: useAIController + useAutoSave + useCanvasExport 全部激活（7/7）
- [ ] Epic 5: canvas-e2e testDir 修复
- [ ] **CI E2E ≥ 50 tests, ≥ 90% pass rate**
- [ ] Vitest: 0 failures
- [ ] Jest: 0 failures

### Sprint 2 Done (Day 7)
- [ ] flows.contract.spec.ts 存在并通过
- [ ] Stryker 决策文档存在
- [ ] **全量 DoD 达成**
- [ ] 所有修改已 commit

---

## 7. 每日检查点

| Day | 检查点 | 负责人 |
|-----|--------|--------|
| Day 1 | Playwright 单一配置生效；grepInvert 已移除 | Dev |
| Day 1 | stability.spec.ts 运行正常（找到测试） | Dev |
| Day 2 | 0 waitForTimeout 残留 | Dev |
| Day 3 | useAIController 测试通过 | Dev |
| Day 4 | useAutoSave 测试通过；exclude 移除 | Dev |
| Day 5 | CI E2E ≥ 50 tests, ≥ 90% pass | Tester |
| Day 6 | flows.contract.spec.ts 通过 | Dev |
| Day 7 | Stryker 决策文档；全量 DoD | Architect |

---

## 8. 执行决策

- **决策**: 已采纳
- **执行项目**: team-tasks 项目 vibex-tester-proposals-vibex-proposals-20260410
- **执行日期**: 2026-04-10

---

*本实施计划由 Architect Agent 生成，基于 PRD + Tester 提案*
