# P1-001: E1 测试数据错误 — 声称 10 tests 实际 6 tests

**严重性**: P1 (数据一致性)
**Epic**: E1
**Spec 引用**: analyst-qa-report.md §1 E1 测试数据不一致

## 问题描述

tester-e1-report 声称 "10 tests（6+4）"，但 `figma-import.test.ts` 不存在，实际只有 `image-ai-import.test.ts` 6 个测试。

## 代码证据

```bash
ls src/lib/__tests__/figma-import.test.ts
# 预期：存在
# 实际：文件不存在

ls src/lib/__tests__/image-ai-import.test.ts
# 预期：存在
# 实际：存在，6 个测试
```

## 修复建议

1. tester 补充 `figma-import.test.ts`（4 个测试）
2. 或修正 tester-e1-report 数据（实际 6 tests，删除声称的 10）

## 影响范围

- `docs/vibex-sprint6-ai-coding-integration-qa/tester-e1-report.md`（数据修正）
- `src/lib/__tests__/figma-import.test.ts`（建议新增）

## 验证标准

```bash
pnpm test -- --testPathPattern="(image-ai-import|figma-import)"
# 期望：>= 10 tests
```
