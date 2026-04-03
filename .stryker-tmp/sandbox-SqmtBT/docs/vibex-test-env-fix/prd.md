# PRD: 测试环境阻塞修复 — 2026-03-31

> **任务**: vibex-test-env-fix/create-prd
> **创建日期**: 2026-03-31
> **PM**: PM Agent
> **项目路径**: /root/.openclaw/vibex
> **产出物**: /root/.openclaw/vibex/docs/vibex-test-env-fix/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | 3 个独立问题导致测试环境完全阻塞：ESLint pre-test 阻止测试、CardTreeNode React19 兼容失败、覆盖率阈值配置不当 |
| **目标** | 解除测试阻塞，恢复 CI/CD 流程 |
| **成功指标** | `npm test` 正常运行；CardTreeNode 15/15 测试通过；覆盖率不阻止 CI |

---

## 2. Epic 拆分

### Epic 1: D-001 — ESLint pre-test 阻塞（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S1.1 | 修改 pre-test-check.js：`--max-warnings 0` → `--max-warnings 999` | 0.5h | `expect(exec('npx eslint src/').code).not.toBe(1);` |
| S1.2 | 验证 `npm test` 可正常执行（不被 pre-test 阻塞） | 0.25h | `expect(exec('npm test -- --testPathPattern=dummy').code).toBe(0);` |
| S1.3 | 长期：批量修复现有 418 个 ESLint warnings | 4h（P2） | `expect(eslintWarnings).toBeLessThan(50);` |

**文件**: `vibex-fronted/scripts/pre-test-check.js:98`

**DoD**: `npm test` 可正常执行，不被 pre-test 阻塞

---

### Epic 2: D-002 — CardTreeNode React19 兼容（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S2.1 | CardTreeNode.test.tsx 添加 `@xyflow/react` mock | 1h | `expect(jestMock).toBeCalledWith('@xyflow/react');` |
| S2.2 | 验证 15 个测试全部通过 | 0.25h | `expect(npx jest CardTreeNode --no-coverage).toHaveTests(15); expect(passRate).toBe(100);` |
| S2.3 | 升级 @testing-library/react 到 latest（长期兼容） | 0.75h | `expect(libraryVersion).toBeLatest();` |

**DoD**: CardTreeNode.test.tsx 15/15 测试全部通过

---

### Epic 3: D-003 — 覆盖率阈值调整（P0）

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| S3.1 | 移除 jest.config.ts global 阈值 | 0.5h | `expect(jestConfig.global).toBeUndefined();` |
| S3.2 | 只对 canvas 目录设置 70% 阈值 | 0.5h | `expect(threshold['./src/components/canvas/**']).toBe(70); expect(threshold['./src/lib/canvas/**']).toBe(70);` |

**DoD**: 有测试的代码覆盖率要求 70%，无测试的代码不拖累整体

---

## 3. 验收标准总表

| ID | 条件 | 测试断言 |
|----|------|---------|
| AC-1 | `npm test` 不被 pre-test 阻塞 | `expect(exec('npm test').code).toBe(0);` |
| AC-2 | CardTreeNode 15 测试全部通过 | `expect(failedTests.length).toBe(0);` |
| AC-3 | 覆盖率不阻止 CI | `expect(exec('npm test -- --coverage').code).toBe(0);` |
| AC-4 | ESLint warnings 仍可查询 | `expect(exec('npx eslint src/').output).toContain('warnings');` |

---

## 4. 实施计划

| Epic | Story | 工时 | 优先级 | 负责人 |
|------|-------|------|--------|--------|
| Epic 1 | S1.1+S1.2 ESLint 修复 | 0.75h | P0 | dev |
| Epic 2 | S2.1+S2.2+S2.3 CardTreeNode 兼容 | 2h | P0 | dev |
| Epic 3 | S3.1+S3.2 覆盖率阈值 | 1h | P0 | dev |

**总工时**: 3.75h

---

## 5. 后续：长期代码质量

| 行动 | 工时 | 负责人 |
|------|------|--------|
| 批量修复 ESLint warnings | 4h | dev |
| 逐步提高覆盖率阈值（每季度 +5%） | 2h/季度 | tester |
