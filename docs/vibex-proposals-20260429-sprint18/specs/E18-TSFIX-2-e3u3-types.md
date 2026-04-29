# Spec: E18-TSFIX-2 — E3-U3 TypeScript 类型修复

## 概述

修复 E3-U3 模块中的 TypeScript 类型错误，消除 342 个 TS errors 中属于 E3-U3 的部分。

## 现状分析

- **错误数量**: 约 171 个（E3-U3 占 342 总错误的一半）
- **主要错误类型**:
  1. `TS2339` — Property does not exist on type
  2. `TS2345` — Argument of type X is not assignable to parameter of type Y
  3. `TS2769` — No overload matches this call
  4. `TS2741` — Property is missing
  5. `TS2571` — Property does not exist on type 'object'

## 修复策略

### Step 1: 错误分类

```bash
npx tsc --noEmit 2>&1 | grep "e3-u3" | awk -F':' '{print $4}' | sort | uniq -c | sort -rn
```

### Step 2: 类型定义补全

- 检查 `src/e3-u3/types/` 目录下的类型定义文件
- 补全缺失的 interface/type
- 使用 `satisfies` 操作符替代部分 `as` 类型断言

### Step 3: Response 类型泛化

```ts
type E3U3Response =
  | { status: 'success'; data: E3U3Session }
  | { status: 'error'; error: E3U3Error }
  | { status: 'pending'; progress: number };
```

## 验收标准（逐条 expect）

```ts
describe('E18-TSFIX-2: E3-U3 TypeScript Type Fixes', () => {
  it('tsc should report zero errors for e3-u3 module', () => {
    const result = execSync('npx tsc --noEmit', { cwd: 'src/e3-u3' });
    expect(result.exitCode).toBe(0);
  });

  it('type coverage for e3-u3 should be >= 95%', () => {
    const coverage = runTypeCoverage('src/e3-u3');
    expect(coverage.percentage).toBeGreaterThanOrEqual(95);
  });

  it('E3U3Session type should be exported', () => {
    const types = getExports('@/e3-u3/types');
    expect(types).toContain('E3U3Session');
    expect(types).toContain('E3U3Config');
    expect(types).toContain('E3U3Response');
  });

  it('no unsafe type casts in e3-u3 source', () => {
    const unsafeCasts = grepFiles('src/e3-u3', /as any|as unknown/);
    expect(unsafeCasts.length).toBe(0);
  });

  it('all e3-u3 test files pass', () => {
    const result = execSync('npm test -- --testPathPattern=e3-u3', { cwd: '.' });
    expect(result.exitCode).toBe(0);
  });
});
```

## 涉及文件

| 文件路径 | 修改类型 |
|----------|----------|
| `src/e3-u3/types/index.ts` | 修改 |
| `src/e3-u3/types/session.ts` | 新增 |
| `src/e3-u3/types/config.ts` | 修改 |
| `src/e3-u3/types/response.ts` | 修改 |
| `src/e3-u3/**/*.ts` | 逐文件修复 |

## DoD Checklist

- [ ] `npx tsc --noEmit` 在 e3-u3 目录返回 0 errors
- [ ] `npx tsc --noEmit 2>&1 | grep -c "error TS"` 在 e3-u3 目录返回 0
- [ ] 类型覆盖率报告 `coverage/type-coverage-e3-u3.html` 生成
- [ ] 无 `as any` 逃逸（需注释豁免的除外）
- [ ] `src/e3-u3/**/*.test.ts` 全部通过
