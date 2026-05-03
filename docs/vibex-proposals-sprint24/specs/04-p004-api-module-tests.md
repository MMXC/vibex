# P004: API 模块测试补全规格文档

## UI 组件

- **组件名称**: 测试覆盖率报告 + CI Quality Gate
- **主要文件路径**: `src/api/__tests__/auth.test.ts`、`src/api/__tests__/project.test.ts`、`.github/workflows/ci.yml`（test job）

## 四态定义

### 1. 理想态

`auth.test.ts` 和 `project.test.ts` 测试文件存在且通过，覆盖率 ≥ 60%，CI 成功通过 quality gate。

```
expect(testFilesExist).toEqual({
  'auth.test.ts': true,
  'project.test.ts': true
})
expect(testExitCode).toBe(0)
expect(coveragePercentage).toBeGreaterThanOrEqual(60)
expect(ciJobStatus).toBe('success')
```

### 2. 空状态

不适用（测试层任务，无 UI 交互）。

```
// N/A
```

### 3. 加载态

Vitest 正在运行，终端输出测试进度。

```
expect(ciJobStatus).toBe('in_progress')
expect(vitestRunning).toBe(true)
```

### 4. 错误态

**场景一：覆盖率低于阈值**
测试通过但覆盖率 < 60%，CI quality gate 失败，输出覆盖率报告。

**场景二：API 签名变更**
对应测试用例失败，CI 输出失败的测试用例名称及断言差异。

```
// 场景一
expect(coveragePercentage).toBeLessThan(60)
expect(ciJobStatus).toBe('failed')
expect(ciLogs).toContain('Coverage below threshold')

// 场景二
expect(testExitCode).not.toBe(0)
expect(failedTests).toContain('auth.test.ts')
expect(ciLogs).toMatch(/AssertionError|Expected.*Received/)
```