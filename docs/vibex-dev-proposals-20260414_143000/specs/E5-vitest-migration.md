# Spec: E5 - Vitest 迁移方案规划

## E5.1 迁移方案

### Phase 1: 基础设施（Sprint 2，~12h）
- [ ] 安装 Vitest 配置（共存模式，与 Jest 并行）
- [ ] 迁移 Vitest 配置：vitest.config.ts
- [ ] 迁移 `@testing-library/react` 测试（~30 个）
- [ ] 配置 Vitest CI step（与 Jest 并行运行）

### Phase 2: 测试迁移（Sprint 3，~12h）
- [ ] 迁移后端服务测试（~20 个）
- [ ] 迁移 E2E 组件测试（~15 个）
- [ ] 删除 Jest 配置（Vitest only）
- [ ] CI 移除 Jest step

## E5.2 工时估算

| 阶段 | 工时 | 说明 |
|------|------|------|
| Phase 1 | 12h | 基础设施 + 30 个测试迁移 |
| Phase 2 | 12h | 服务测试 + E2E + 清理 |
| **合计** | **24h** | |

## E5.3 回滚方案

```typescript
// jest.config.ts 保留（回滚时启用）
// vitest.config.ts 移除
// CI 中注释 Vitest step，启用 Jest step
```

## E5.4 风险缓解

| 风险 | 缓解措施 |
|------|---------|
| Jest 特定 API（jest.fn()）Vitest 不兼容 | 使用 `vi.fn()` 替换，`@jest/globals` polyfill |
| 迁移期间测试 break | Phase 1 保持 Jest 运行，并行验证 |
| 覆盖率下降 | 对比覆盖率报告，确保不下降 |
