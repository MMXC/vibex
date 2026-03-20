# 架构：孤儿测试清理

## 方案
直接删除孤儿测试文件，不补充实现（功能不存在）。

## 变更清单
- [x] 删除 `src/hooks/__tests__/useConfirmationStep.test.ts` ✅
- [x] 删除 `src/hooks/__tests__/useConfirmationState.test.ts` ✅
- [x] 删除 `src/stores/confirmationStore.extended.test.ts` ✅
- [x] 删除 `src/app/domain/page.test.tsx` ✅

## 验收结果
- 测试套件: 147/147 passed
- 测试用例: 1674/1674 passed
- Commit: da21d240
