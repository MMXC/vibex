# Spec: E18-QUALITY-1 — 测试覆盖率提升

## 概述

为 E3-U2/U3 类型修复相关代码编写单元测试和集成测试，确保覆盖率 ≥ 80%。

## 测试策略

### 单元测试范围

1. **类型守卫测试** — `src/types/shared/guards.test.ts`
2. **类型 utilities 测试** — `src/types/shared/utilities.test.ts`
3. **E3-U2 模块测试** — `src/e3-u2/**/*.test.ts`
4. **E3-U3 模块测试** — `src/e3-u3/**/*.test.ts`

### 集成测试范围

1. **类型流测试** — 验证 E3-U2 ↔ E3-U3 类型兼容性
2. **配置文件解析测试** — 验证 Config 类型正确解析

## 测试框架

- **框架**: Vitest（与现有项目一致）
- **覆盖率工具**: @vitest/coverage-v8
- **Mock**: Vitest built-in mocking

## 关键测试用例

### E3-U2 类型测试

```ts
import { describe, it, expect } from 'vitest';
import { isE3U2Session } from '@/types/shared/guards';
import type { E3U2Session } from '@/types/shared/session';

describe('E3U2Session type guards', () => {
  it('isE3U2Session returns true for valid E3U2Session', () => {
    const session: E3U2Session = {
      id: 'sess-001',
      module: 'e3-u2',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };
    expect(isE3U2Session(session)).toBe(true);
  });

  it('isE3U2Session returns false for E3U3Session', () => {
    const session = {
      id: 'sess-002',
      module: 'e3-u3',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };
    expect(isE3U2Session(session)).toBe(false);
  });
});
```

### E3-U3 类型测试

```ts
import { describe, it, expect } from 'vitest';
import { isE3U3Session } from '@/types/shared/guards';
import type { E3U3Session } from '@/types/shared/session';

describe('E3U3Session type guards', () => {
  it('isE3U3Session returns true for valid E3U3Session with priority', () => {
    const session: E3U3Session = {
      id: 'sess-003',
      module: 'e3-u3',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      priority: 5,
    };
    expect(isE3U3Session(session)).toBe(true);
  });
});
```

## 覆盖率目标

| 模块 | 行覆盖率 | 分支覆盖率 |
|------|----------|------------|
| e3-u2 | ≥ 80% | ≥ 70% |
| e3-u3 | ≥ 80% | ≥ 70% |
| types/shared | ≥ 90% | ≥ 80% |

## 验收标准（逐条 expect）

```ts
describe('E18-QUALITY-1: Test Coverage', () => {
  it('e3-u2 coverage >= 80%', () => {
    const report = JSON.parse(execSync('npm run coverage -- --reporter=json', { cwd: 'src/e3-u2' }));
    expect(report.totals.lines.pct).toBeGreaterThanOrEqual(80);
  });

  it('e3-u3 coverage >= 80%', () => {
    const report = JSON.parse(execSync('npm run coverage -- --reporter=json', { cwd: 'src/e3-u3' }));
    expect(report.totals.lines.pct).toBeGreaterThanOrEqual(80);
  });

  it('all tests pass', () => {
    const result = execSync('npm test', { cwd: '.' });
    expect(result.exitCode).toBe(0);
  });
});
```

## DoD Checklist

- [ ] `src/e3-u2/**/*.test.ts` 全部存在且通过
- [ ] `src/e3-u3/**/*.test.ts` 全部存在且通过
- [ ] `src/types/shared/**/*.test.ts` 全部存在且通过
- [ ] `npm run coverage` 输出 e3-u2/e3-u3 行覆盖率 ≥ 80%
- [ ] CI pipeline 包含 `npm test` 步骤且通过
