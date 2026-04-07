# 测试覆盖率提升方案 (E002)

**项目**: vibex-proposals-impl-20260318  
**任务**: E002 - 测试覆盖率提升  
**时间**: 2026-03-19

---

## 当前覆盖率状态

| 指标 | 当前 | 目标 | 差距 |
|------|------|------|------|
| 行覆盖率 | 64.27% | 80% | +15.73% |
| 函数覆盖率 | 62.09% | 75% | +12.91% |
| 分支覆盖率 | 52.53% | 70% | +17.47% |

**测试规模**: 150 测试套件, 1701 测试用例

---

## 关键低覆盖文件 (按优先级排序)

### P0 - 核心业务逻辑 (需优先覆盖)

| 文件 | 行覆盖 | 分支覆盖 | 差距(行) | 建议测试数 |
|------|--------|----------|----------|-----------|
| services/ddd/stream-service.ts | 12.71% | 7.69% | +87% | 15+ |
| lib/api-retry.ts | 28.12% | 26.92% | +52% | 8+ |
| services/oauth/oauth.ts | 32.89% | 43.33% | +47% | 10+ |
| lib/mermaid-parser.ts | 37.71% | 29.62% | +42% | 12+ |

### P1 - 功能模块 (次优先)

| 文件 | 行覆盖 | 差距(行) | 建议测试数 |
|------|--------|----------|-----------|
| services/github/github-import.ts | 38.7% | +41% | 8+ |
| lib/componentRegistry.ts | 41.37% | +39% | 6+ |
| authStore.ts | 50% | +30% | 8+ |
| lib/flow-layout.ts | 62.04% | +18% | 10+ |

---

## 覆盖率提升策略

### 1. 添加缺失的测试文件

```bash
# 创建测试目录结构
src/services/ddd/__tests__/stream-service.test.ts
src/lib/__tests__/api-retry.test.ts
src/services/oauth/__tests__/oauth.test.ts
src/lib/__tests__/mermaid-parser.test.ts
```

### 2. Mock 外部依赖

```typescript
// stream-service.ts 需要 mock:
// - SSE 流式响应
// - 状态机转换
// - 错误处理分支
```

### 3. 验收标准

- [ ] 行覆盖率 ≥ 80%
- [ ] 函数覆盖率 ≥ 75%
- [ ] 分支覆盖率 ≥ 70%
- [ ] 无新增 lint 错误

---

## 实施步骤

1. **分析阶段** (已完成)
   - 运行 `npx jest --coverage` 获取基线
   - 识别低覆盖文件
   - 制定优先级

2. **实现阶段** (待执行)
   - 为 P0 文件添加测试
   - 为 P1 文件添加测试
   - 验证覆盖率达标

3. **验证阶段** (待执行)
   - 运行完整测试套件
   - 确认覆盖率达标
   - 提交代码

---

## 预计工时

- P0 文件测试编写: 4h
- P1 文件测试编写: 3h
- 调试和修复: 2h
- **总计: ~9h**

---

## 参考资源

- Jest 覆盖率文档: https://jestjs.io/docs/coverage
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- MSW (Mock Service Worker): https://mswjs.io/
