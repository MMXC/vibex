# 🔴 BUG REPORT: E1 Design Review UI — API Contract Mismatch

**发现时间**: 2026-04-28 18:03  
**发现者**: reviewer (via API contract review)  
**严重性**: 🔴 High  
**状态**: REJECTED — 需修复后重提

---

## Bug 描述

**位置**: `src/components/dds/DDSCanvasPage.tsx:644-649`

**问题**: DDSCanvasPage 传入了 `ConflictResolutionDialog` 接口中**不存在的 prop**，导致类型错误。

**实际接口** (`ConflictResolutionDialog.tsx:32-35`):
```typescript
interface ConflictResolutionDialogProps {
  isOpen: boolean;
  changes: TokenChange[];
  designTokens?: { name: string; value: string }[];
  codeTokens?: { name: string; value: string }[];
  onResolve: (action: 'design' | 'code' | 'token' | 'merge') => void;
  onClose: () => void;
}
```

**DDSCanvasPage 传入的 props**:
```tsx
<ConflictResolutionDialog
  isOpen={conflictDialogOpen}
  changes={conflictChanges}
  onAcceptDesign={() => setConflictDialogOpen(false)}  // ❌ 不存在
  onAcceptCode={() => setConflictDialogOpen(false)}    // ❌ 不存在
  onDismiss={() => setConflictDialogOpen(false)}        // ❌ 不存在
/>
```

## 修复建议

将错误的 props 替换为正确的接口：

```tsx
<ConflictResolutionDialog
  isOpen={conflictDialogOpen}
  changes={conflictChanges}
  onResolve={(action) => {
    console.log('[DDSCanvasPage] Conflict resolved with:', action);
    setConflictDialogOpen(false);
  }}
  onClose={() => setConflictDialogOpen(false)}
/>
```

## 附加问题

TS build 错误被 `pako` 缺失掩盖 — 应先修复 `pako` 依赖以获得干净的 build 输出。

---

## 验证

修复后运行:
```bash
cd vibex-fronted && npx tsc --noEmit src/components/dds/DDSCanvasPage.tsx
```
应无类型错误。
