# Spec: E18-QUALITY-2 — 开发者体验改进

## 概述

改进开发环境配置、类型文档、migration guides，提升开发者体验。

## 实现目标

### 1. TypeScript 严格模式

`tsconfig.json` 严格模式配置：

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2. 类型文档生成

使用 `typedoc` 生成 API 类型文档：

```bash
npm install --save-dev typedoc
npx typedoc --out docs/types src/types/shared/
```

输出：`docs/types/README.md`（索引页）+ `docs/types/` 下各类型文档。

### 3. Migration Guide

创建 `docs/migrations/e18-tsfix.md`，记录本次类型修复的 Breaking Changes：

```markdown
# Migration Guide: Sprint 18 TypeScript Fixes

## Breaking Changes

### E3U2Config
- `sessionId` 从 optional 变为 required
- 新增 `endpoint?: string` 字段
- 新增 `timeout?: number` 字段

### E3U3Response
- `data` 字段类型从 `any` 变为 `E3U3Session | null`
- 移除 `raw` 字段（已废弃）

## 升级步骤

1. 更新所有 `E3U2Config` 实例化代码，确保传入 `sessionId`
2. 将 `E3U3Response.data` 的类型断言替换为类型守卫
3. 移除所有 `as any` 类型断言
```

### 4. CI 性能优化

确保类型检查在 5 分钟内完成：

```yaml
# .github/workflows/typecheck.yml
- name: Type Check
  run: npx tsc --noEmit
  timeout-minutes: 5
```

## 验收标准（逐条 expect）

```ts
describe('E18-QUALITY-2: Developer Experience', () => {
  it('tsconfig.json strict mode enabled', () => {
    const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf-8'));
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });

  it('type docs exist', () => {
    expect(fs.existsSync('docs/types/README.md')).toBe(true);
    expect(fs.existsSync('docs/types/')).toBe(true);
  });

  it('migration guide exists', () => {
    expect(fs.readFileSync('docs/migrations/e18-tsfix.md', 'utf-8')).toContain('Breaking Changes');
  });

  it('ci type check passes within 5 minutes', () => {
    const start = Date.now();
    execSync('npx tsc --noEmit', { timeout: 300000 });
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(300000);
  });
});
```

## DoD Checklist

- [ ] `tsconfig.json` 的 `strict: true` 已开启
- [ ] `docs/types/README.md` 存在且包含所有公开类型
- [ ] `docs/migrations/e18-tsfix.md` 记录了所有 Breaking Changes
- [ ] `npx typedoc` 运行无错误
- [ ] CI type check 在 5 分钟内完成
- [ ] 新开发者可通过 README 快速上手类型系统
