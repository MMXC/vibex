# Spec: E2 - stability.spec.ts 路径修复

**Epic**: E2
**来源**: T-P0-2
**工时**: 1h
**状态**: Draft

---

## 1. Overview

修复 `stability.spec.ts` 中的路径错误，使其真正检查 `tests/e2e/` 目录而非不存在的 `./e2e/`。

## 2. Problem Statement

`stability.spec.ts` 当前检查路径 `./e2e/`，该目录不存在。测试永远 PASS，无法发现真实的测试稳定性问题（如大量 flaky 测试）。

## 3. Technical Spec

### 3.1 路径修复

**变更前**:
```typescript
// 查找 ./e2e/ 目录下的 .spec.ts 文件
const e2eDir = './e2e';
```

**变更后**:
```typescript
// 查找 tests/e2e/ 目录下的 .spec.ts 文件
const e2eDir = './tests/e2e';
```

### 3.2 目录存在性断言

```typescript
import * as fs from 'fs';
import * as path from 'path';

test('tests/e2e directory must exist', () => {
  const e2eDir = path.resolve(process.cwd(), 'tests/e2e');
  expect(fs.existsSync(e2eDir)).toBe(true);
});

test('no @ci-blocking in spec files', () => {
  // ... 检查 tests/e2e/ 下的文件
  // 期望: 发现真实违规数量 > 0（如果存在 @ci-blocking）
  // 或: 发现真实违规数量 = 0（如果已清理完毕）
});
```

### 3.3 错误信息改进

当发现违规时，输出真实文件路径列表：
```typescript
if (violations.length > 0) {
  throw new Error(
    `Found ${violations.length} @ci-blocking violations:\n` +
    violations.map(v => `  - ${v.file}:${v.line}`).join('\n')
  );
}
```

## 4. Acceptance Criteria

### S2.1: 路径指向 tests/e2e/
```typescript
// 验证 stability.spec.ts 内容
const content = fs.readFileSync('tests/e2e/stability.spec.ts', 'utf-8');
expect(content).toContain('tests/e2e');
expect(content).not.toContain("'./e2e'");
expect(content).not.toContain('"./e2e"');
```

### S2.2: 目录不存在时 FAIL
```bash
# 临时重命名目录
mv tests/e2e tests/e2e.bak
npx playwright test tests/e2e/stability.spec.ts
# 期望: 测试失败，提示 tests/e2e 目录不存在
mv tests/e2e.bak tests/e2e
```

## 5. Out of Scope

- stability.spec.ts 的其他检查逻辑修改（如检查 @flaky、统计通过率）
- CI 环境的额外稳定性报告

## 6. Dependencies

- 依赖 E1 完成（需根配置 `expect.timeout >= 30s`）

## 7. Rollback Plan

恢复 `./e2e` 路径即可。
