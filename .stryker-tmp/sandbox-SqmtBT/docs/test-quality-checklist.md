# Test Quality Checklist

> 参考本清单进行测试用例审查和质量评估。
> 路径: `/root/.openclaw/vibex/docs/test-quality-checklist.md`

## 1. Global State Management

- [ ] beforeAll 修改全局状态 → 必须有对应的 afterAll 恢复
- [ ] 使用 jest.spyOn → 需调用 `.mockRestore()` 或 `.mockReset()`

## 2. Mock Isolation

- [ ] `jest.clearAllMocks()` — 清除调用记录，保留 mock 实现
- [ ] `jest.resetAllMocks()` — 清除调用记录 + 重置实现
- [ ] `jest.restoreAllMocks()` — 恢复原始实现（推荐）

## 3. Module State Isolation

- [ ] 每个测试文件独立 setup/teardown
- [ ] 共享状态修改后必须恢复

## 4. Async Cleanup

- [ ] 未 resolved 的 Promise 需在 afterAll 中 cancel
- [ ] setTimeout/setInterval 需在 afterAll 中 clear

## 5. Test Quality Criteria

| 维度 | 标准 | 检查项 |
|------|------|--------|
| 隔离性 | 每个测试独立运行 | 无测试间依赖 |
| 可重复性 | 多次运行结果一致 | 无随机值/时间依赖 |
| 可读性 | 测试意图明确 | describe/it 描述清晰 |
| 覆盖率 | 关键路径已覆盖 | 分支覆盖 ≥ 80% |
| 断言质量 | 断言有意义 | 不只是 `.toBeDefined()` |
