# P0-005: E4/E5 单元测试完全缺失

**严重性**: P0 (阻塞)
**Epic**: E4, E5
**Spec 引用**: analyst-qa-report.md §测试覆盖验证

## 问题描述

E4（PRD融合）和 E5（状态处理）完全没有单元测试覆盖，总计 0 tests。已有测试覆盖 35 tests 全部 PASS，但 E4/E5 的关键功能无测试保护。

## 代码证据

```
| Epic | 测试文件 | 通过/总数 |
| E1   | deliveryStore.test.ts | 12/12 ✅ |
| E2   | DeliveryNav.test.tsx + CanvasBreadcrumb.test.tsx | 7/7 ✅ |
| E3   | DDLGenerator.test.ts + formatDDL.test.ts | 16/16 ✅ |
| E4   | 无测试 | ❌ |
| E5   | 无测试 | ❌ |
```

## 修复建议

补充测试：
1. **E4**: `PRDTab.test.tsx`（PRDGenerator + Markdown 导出）
2. **E5**: `DeliveryStateHandling.test.tsx`（空状态 + toast + 骨架屏）

## 影响范围

- 新增测试文件（E4/E5 各 1 个）
