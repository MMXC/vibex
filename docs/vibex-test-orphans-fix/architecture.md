# 架构：孤儿测试清理

## 方案
直接删除孤儿测试文件，不补充实现（功能不存在）。

## 变更清单
- 删除 `src/hooks/__tests__/useConfirmationStep.test.ts`
- 删除 `src/hooks/__tests__/useConfirmationState.test.ts`
- 删除 `src/stores/confirmationStore.extended.test.ts`
- 删除 `src/app/domain/page.test.tsx`
