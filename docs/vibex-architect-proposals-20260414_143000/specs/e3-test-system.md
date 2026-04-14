# Spec — E3: 测试体系建设

> **Epic**: E3
> **Epic 名称**: 测试体系建设
> **关联提案**: A-P1-5（测试覆盖率提升）
> **Sprint**: Sprint 2
> **总工时**: 12h
> **状态**: 已采纳

---

## 1. 背景

当前 Vitest 配置存在问题，测试在 CI 环境无法正常执行，可信度受损。需修复配置问题并提升关键模块测试覆盖率。

## 2. Scope

### In Scope
- 修复 Vitest 配置问题（CI 环境兼容性）
- 提升关键模块测试覆盖率至合理水位
- 建立 coverage threshold 机制

### Out of Scope
- 不追求 100% 覆盖率（聚焦核心业务逻辑）
- 不修改生产代码以迁就测试

---

## 功能点: F1.1 — Vitest 配置修复 + 覆盖率提升

**功能点 ID**: E3.S1.F1.1

### 技术实现

#### Step 1: 诊断 Vitest 问题

```bash
# 在 CI 环境运行测试，捕获具体错误
CI=true npx vitest run --reporter=verbose
```

常见问题：
- Node.js 版本差异（CI 用 Node 18，本地用 Node 22）
- 路径别名（`@/`）在 CI 环境解析失败
- Mock 文件路径不匹配
- 环境变量缺失（`process.env` 未定义）

#### Step 2: 修复配置

**vitest.config.ts 关键修复项**:
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node', // 或 'jsdom'，与 CI 一致
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8', // 或 'istanbul'
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 70,    // 覆盖率底线
        functions: 70,
        branches: 60,
        statements: 70
      }
    },
    // 解决 @/ 路径别名问题
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  }
})
```

#### Step 3: 添加 CI 环境适配

```typescript
// src/test/setup.ts
// 在所有测试文件运行前执行
if (typeof process.env.NODE_ENV === 'undefined') {
  process.env.NODE_ENV = 'test'
}

if (typeof process.env.API_BASE_URL === 'undefined') {
  process.env.API_BASE_URL = 'http://localhost:8787'
}
```

#### Step 4: 提升关键模块覆盖率

**聚焦模块**（按优先级）:
1. `src/lib/api-client.ts` — API 调用层
2. `src/components/TemplateSelector/` — 核心组件
3. `src/hooks/useCatalog.ts` — 数据获取 hooks

#### 验收标准（expect() 断言）

```typescript
describe('E3.S1.F1.1 — 测试体系建设', () => {
  it('AC1: npx vitest run exit code 为 0', () => {
    const { exitCode } = execSync('npx vitest run', { encoding: 'utf8' })
    expect(exitCode).toBe(0)
  })

  it('AC2: CI 环境测试可正常执行（无模块找不到错误）', () => {
    const { stderr } = execSync('CI=true npx vitest run', { encoding: 'utf8' })
    expect(stderr).not.toContain('cannot find module')
    expect(stderr).not.toContain('Error: ')
  })

  it('AC3: 覆盖率报告可生成', () => {
    execSync('npx vitest run --coverage', { encoding: 'utf8' })
    const reportExists = fs.existsSync('./coverage/coverage-summary.json')
    expect(reportExists).toBe(true)
  })

  it('AC4: 覆盖率达到阈值', () => {
    const summary = JSON.parse(
      fs.readFileSync('./coverage/coverage-summary.json', 'utf8')
    )
    expect(summary.total.lines.pct).toBeGreaterThanOrEqual(70)
    expect(summary.total.functions.pct).toBeGreaterThanOrEqual(70)
    expect(summary.total.branches.pct).toBeGreaterThanOrEqual(60)
  })

  it('AC5: 新增组件未写测试时 CI 失败', () => {
    // 通过 PR 流程验证：创建一个无测试的组件，coverage threshold 应触发失败
    const result = execSync('npx vitest run --coverage', { encoding: 'utf8' })
    // 如果 coverage 未达标，vitest 会以非 0 exit code 退出
    expect(result).toContain('Coverage thresholds not met')
  })

  it('AC6: 核心模块 API client 有测试覆盖', () => {
    const coverage = JSON.parse(
      fs.readFileSync('./coverage/coverage-summary.json', 'utf8')
    )
    const apiClientCoverage = coverage['src/lib/api-client.ts']
    expect(apiClientCoverage.lines.pct).toBeGreaterThanOrEqual(80)
  })
})
```

---

## 工时估算

| 步骤 | 工时 | 说明 |
|------|------|------|
| 诊断 Vitest 配置问题 | 2h | CI 环境复现 + 错误定位 |
| 修复 vitest.config.ts | 2h | 环境适配 + 路径别名 + reporters |
| 编写 CI 环境适配脚本 | 1h | setup.ts |
| 提升核心模块覆盖率（api-client, hooks） | 4h | 编写测试用例 |
| 配置 coverage threshold | 1h | vitest.config.ts thresholds |
| 验证 CI pipeline | 2h | 端到端验证 |
| **合计** | **12h** | |

## 验收标准汇总（Given/When/Then）

| ID | Given | When | Then |
|----|-------|------|------|
| E3.S1.F1.1.AC1 | 开发者运行 `npx vitest run` | 测试完成 | exit code 为 0 |
| E3.S1.F1.1.AC2 | CI pipeline 执行 `npm run test:ci` | 完成 | 无 "cannot find module" 错误 |
| E3.S1.F1.1.AC3 | 运行 `npx vitest run --coverage` | 完成 | coverage-summary.json 存在 |
| E3.S1.F1.1.AC4 | 覆盖率检测 | 检测完成 | 覆盖率达到 thresholds 配置 |
| E3.S1.F1.1.AC5 | 新增组件未写测试 | PR 创建 | CI coverage threshold 失败 |
| E3.S1.F1.1.AC6 | API client 模块 | coverage 报告 | 行覆盖率 >= 80% |
