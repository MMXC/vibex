# E5 Spec: 命名与目录规范

## 测试目录结构
```
tests/
├── unit/          # Jest 单元测试（src/ 下 .test.ts）
├── e2e/           # Playwright E2E 测试
├── performance/   # 性能测试
└── fixtures/      # 共享测试数据
```

## ESLint 规则
```typescript
// .eslintrc
{
  "rules": {
    "test/match-files": ["error", {
      "jest": "**/*.test.ts",
      "playwright": "**/*.spec.ts"
    }]
  }
}
```
