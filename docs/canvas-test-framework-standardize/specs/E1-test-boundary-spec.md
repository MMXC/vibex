# E1 Spec: 测试边界规范

## S1.1 Playwright 配置合并

### 保留配置
```
playwright.config.ts          → 开发默认（workers:4, retries:0）
playwright.ci.config.ts      → CI（workers:1, retries:3）
playwright.a11y.config.ts    → 可访问性测试
```

### 删除配置
- `playwright.test.config.ts` → 合并至 `playwright.config.ts`
- `playwright.perf.config.ts` → 合并至 `playwright.config.ts`
- `playwright-canvas-phase2.config.ts` → 合并至 `playwright.config.ts`
- `playwright-canvas-crash-test.config.cjs` → 合并至 `playwright.ci.config.ts`

## S1.2 重复测试文件处理

### 流程
1. 对比 `tests/basic.spec.ts` 和 `tests/e2e/basic.spec.ts` 的测试用例
2. 合并无重复用例到 `tests/e2e/basic.spec.ts`
3. 删除 `tests/basic.spec.ts`

## S1.3 TESTING_STRATEGY.md

```markdown
# VibeX 测试策略

## 框架边界
- **Jest**: `src/**/*.test.ts` — 单元测试 + 集成测试
- **Playwright**: `tests/e2e/**/*.spec.ts` — E2E 测试

## 禁止事项
- Jest 不测试真实 DOM（用 Playwright）
- Playwright 不做类型校验（用 Jest）
- 同一功能不得同时在 Jest 和 Playwright 中测试
```

## S1.4 Jest 配置
```typescript
// jest.config.ts
export default {
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/tests/'],
  // 移除对路径的依赖，统一用命名规范
};
```
