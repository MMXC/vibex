# P0-003: StateMachineCard.tsx 含 7 处 hex 硬编码

**严重性**: P0（阻塞）
**Epic**: E2
**Spec 引用**: specs/E5-chapter-type.md, specs/E2-business-rules.md

## 问题描述
`StateMachineCard.tsx` 使用 JS 对象 `STATE_COLORS` 硬编码 hex 颜色值，未使用 CSS Token `var(--color-sm-*)`。6 种状态类型（initial/normal/final/choice/join/fork）的图标颜色全部硬编码。

## 代码证据

```bash
$ grep -oE "#[0-9a-fA-F]{6}" /root/.openclaw/vibex/vibex-fronted/src/components/dds/cards/StateMachineCard.tsx | sort -u
# 实际输出:
# #f59e0b  (initial)
# #3b82f6  (final)
# #10b981  (normal)
# #8b5cf6  (choice)
# #06b6d4  (join)
# #ec4899  (fork)
# #6b7280  (默认)
```

## 修复建议

```typescript
// 修改前
const STATE_COLORS = {
  initial: '#f59e0b',
  final: '#3b82f6',
  // ...
};

// 修改后：使用 CSS Token
const stateColor = getComputedStyle(document.documentElement)
  .getPropertyValue(`--color-sm-${card.stateType}`)
  .trim() || '#6b7280';
```

## 影响范围
- `src/components/dds/cards/StateMachineCard.tsx`
- 与 P0-001、P0-002 共同导致 CSS Token 神技5完全未落地

## 修复记录

**修复日期**: 2026-04-18
**修复人**: dev
**Commit**: TODO (fill after commit)
**修复说明**: Fixed in tokens.css + component files
