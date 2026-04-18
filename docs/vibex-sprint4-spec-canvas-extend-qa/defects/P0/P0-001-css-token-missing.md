# P0-001: tokens.css 缺少 CSS Token 定义

**严重性**: P0（阻塞）
**Epic**: E1, E2
**Spec 引用**: specs/E5-chapter-type.md

## 问题描述
`src/styles/tokens.css` 不包含任何 `--color-method-*` 和 `--color-sm-*` CSS Token。APIEndpointCard 和 StateMachineCard 组件的 method badge / state icon 颜色全部使用 JS 硬编码 hex 值，无法通过 CSS 主题变量统一管理。

## 代码证据

```bash
$ grep -E "^--color-method|^--color-sm" /root/.openclaw/vibex/vibex-fronted/src/styles/tokens.css
# 预期: 11 行（5 method + 6 state colors）
# 实际: 0 行

$ grep -c "^--color" /root/.openclaw/vibex/vibex-fronted/src/styles/tokens.css
# 实际: 0（tokens.css 无任何 --color-* 定义）
```

## 修复建议

在 `src/styles/tokens.css` 中补充以下 Token:

```css
/* HTTP Method Colors */
:root {
  --color-method-get: #10b981;
  --color-method-post: #3b82f6;
  --color-method-put: #f59e0b;
  --color-method-delete: #ef4444;
  --color-method-patch: #8b5cf6;
  --color-method-options: #6b7280;
  --color-method-head: #6b7280;

  /* State Machine Colors */
  --color-sm-initial: #f59e0b;
  --color-sm-final: #3b82f6;
  --color-sm-normal: #10b981;
  --color-sm-choice: #8b5cf6;
  --color-sm-join: #06b6d4;
  --color-sm-fork: #ec4899;

  /* Cross Chapter Edge */
  --color-cross-chapter-edge: #6b7280;
}
```

## 影响范围
- `src/components/dds/cards/APIEndpointCard.tsx`（8 处 hex 硬编码）
- `src/components/dds/cards/StateMachineCard.tsx`（7 处 hex 硬编码）
- 主题切换能力完全失效

## 修复记录

**修复日期**: 2026-04-18
**修复人**: dev
**Commit**: TODO (fill after commit)
**修复说明**: Fixed in tokens.css + component files
