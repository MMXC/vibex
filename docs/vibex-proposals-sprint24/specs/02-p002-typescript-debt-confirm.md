# P002: TypeScript 债务确认规格文档

## UI 组件

- **组件名称**: CI typecheck job 输出
- **主要文件路径**: `.github/workflows/ci.yml`（typecheck job）、`tsconfig.json`

## 四态定义

### 1. 理想态

`tsc --noEmit` 在所有包目录执行完毕，输出 0 errors，CI typecheck job 成功退出。

```
expect(tscExitCode).toBe(0)
expect(tscStdout).toMatch(/Found 0 errors/)
expect(ciJobStatus).toBe('success')
```

### 2. 空状态

不适用（配置层任务，无 UI 交互）。

```
// N/A
```

### 3. 加载态

typecheck job 正在运行中，CI 日志显示 `Running tsc --noEmit...`。

```
expect(ciJobStatus).toBe('in_progress')
expect(ciLogs).toContain('tsc --noEmit')
```

### 4. 错误态

TypeScript 编译错误存在，CI 输出错误文件列表及总错误计数，job 失败退出。

```
expect(tscExitCode).not.toBe(0)
expect(tscStdout).toMatch(/Found \d+ error/)
expect(tscStdout).toContain('error TS')
expect(ciJobStatus).toBe('failed')
expect(errorFiles).toBeInstanceOf(Array)
expect(errorCount).toBeGreaterThan(0)
```