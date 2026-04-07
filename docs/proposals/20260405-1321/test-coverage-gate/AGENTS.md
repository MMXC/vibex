# AGENTS.md - CI Coverage Gate Enforcement

## 开发约束

### 配置规范
```typescript
// vitest.config.ts - 必须包含
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',  // 必须用 v8
      thresholds: {
        lines: 80,
        branches: 65,
      },
    },
  },
});
```

### 阈值调整规范
```bash
# 只在覆盖率提升时调整阈值
# 禁止降低阈值
git commit -m "chore: increase coverage threshold lines 80->82"
```

### 禁止事项
- ❌ 在 jest.config.ts 中配置 Vitest 阈值
- ❌ 降低已设置的阈值
- ❌ 跳过覆盖率检查

### Baseline 更新
```bash
# 只在覆盖率提升时更新 baseline
pnpm test:coverage
cp coverage/coverage-summary.json coverage/baseline.json
git add coverage/baseline.json
```

*Architect Agent | 2026-04-05*
