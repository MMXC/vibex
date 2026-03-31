# 开发约束 (AGENTS.md): Canvas Epic3 测试补充

> **项目**: canvas-epic3-test-fill
> **阶段**: Phase1 — 测试补充
> **版本**: 1.0.0
> **日期**: 2026-03-31
> **Architect**: Architect Agent
> **工作目录**: /root/.openclaw/vibex/vibex-fronted

---

## 1. 测试框架

| 维度 | 约束 |
|------|------|
| **E2E** | Playwright（现有） |
| **组件测试** | Vitest + Testing Library（现有） |
| **断言** | expect |
| **定位器** | data-testid（优先） |

---

## 2. 代码规范

### 2.1 定位器优先级

```typescript
// ✅ 正确：data-testid 优先
await page.click('[data-testid="expand-both-btn"]');

// ❌ 错误：CSS 选择器脆弱
await page.click('.btn-expand');
```

### 2.2 测试命名

```typescript
// ✅ 正确：描述性名称
test('F1.3 F11 快捷键 - 进入全屏', async ({ page }) => {

// ❌ 错误：模糊命名
test('F11 test', async ({ page }) => {
```

---

## 3. 覆盖率要求

| 指标 | 阈值 |
|------|------|
| 行覆盖率 | ≥ 80% |
| 分支覆盖率 | ≥ 70% |

---

## 4. 提交流程

```
1. tester 完成测试用例
2. npm test -- --coverage
3. 覆盖率达标后提交
4. git commit -m "test(canvas-epic3): 补充 10 个测试用例"
```

---

*本文档由 Architect Agent 生成*
