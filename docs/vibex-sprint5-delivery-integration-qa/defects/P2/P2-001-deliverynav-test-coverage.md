# P2-001: DeliveryNav 测试覆盖率不足

**严重性**: P2（体验/建议）
**Epic**: E2
**Spec 引用**: specs/E2-navigation.md

## 问题描述
- **Spec E2**: DeliveryNav 应有 7 tests
- **实际**: `DeliveryNav.test.tsx` 仅 3 tests

## 代码证据

```bash
$ grep -c "it(" /root/.openclaw/vibex/vibex-fronted/src/components/delivery/__tests__/DeliveryNav.test.tsx
3
```

## 修复建议

补充 4 个测试用例，覆盖 Spec E2 的关键场景：
```typescript
// 补充测试
it('E2-U4: 点击面包屑跳转回 DDS Canvas', () => {
  // 验证 CanvasBreadcrumb 跳转逻辑
});
it('E2-U5: 面包屑显示当前画布名称', () => {
  // 验证面包屑文案
});
it('E2-U6: 无障碍 aria-current 属性', () => {
  // 验证 aria-current="page"
});
it('E2-U7: 导出按钮可点击', () => {
  // 验证导出按钮存在且 disabled=false
});
```

## 影响范围
- `src/components/delivery/__tests__/DeliveryNav.test.tsx`
- 测试覆盖率（低优先级，不阻塞功能）
