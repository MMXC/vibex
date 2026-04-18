# P1-003: E6 测试数量不一致（143 声称 vs 169 实际 Round1）

**严重性**: P1 (数据一致性)
**Epic**: E6
**Spec 引用**: analyst-qa-report.md §3 单元测试覆盖验证

## 问题描述

E6 测试数量存在多个数据版本：
- CHANGELOG 声称：143 tests
- Round1 tester report：169 tests（167 pass, 2 failed）
- 当前状态：2 个失败测试已删除，current count 未知

## 代码证据

```bash
# 验证当前测试数量
pnpm test -- --testPathPattern="DDSCanvasStore" --listTests
# 预期：准确数量

# 验证失败测试是否已删除
grep -n "deselectCard" src/stores/dds/DDSCanvasStore.test.ts
# 预期：有注释说明 deselectCard is not implemented
```

## 修复建议

1. 确认当前 DDSCanvasStore.test.ts 实际测试数量
2. 更新 CHANGELOG commit message 为准确数字
3. 补充注释说明 deselectCard 未实现状态

## 影响范围

- `DDSCanvasStore.test.ts`
- `CHANGELOG.md`

## 验证标准

```bash
pnpm test -- --testPathPattern="DDSCanvasStore" --passWithNoTests
# 期望：准确测试数量输出
```
