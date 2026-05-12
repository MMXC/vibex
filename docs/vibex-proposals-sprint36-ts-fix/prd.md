# PRD：Sprint36 TypeScript 编译错误修复

## 背景

Sprint36 所有 Epic 开发被 TypeScript 编译错误阻断。`pnpm exec tsc --noEmit` 返回 4 个类型错误（middleware.ts × 2, prototypeStore.ts × 1, fallbackStrategy.ts × 1），共 23 行输出。

## 目标

修复 TypeScript 类型错误，使 `tsc --noEmit` 零错误通过，解除 Sprint36 开发阻塞。

## 范围

### 修复文件
1. `vibex-fronted/src/stores/ddd/middleware.ts` — 行 150 附近
2. `vibex-fronted/src/stores/prototypeStore.ts` — 行 54 附近
3. `vibex-fronted/src/utils/design/fallbackStrategy.ts` — 行 215 附近

### 不涉及
- 不修改业务逻辑
- 不修改组件实现
- 不影响 E1 Epic 代码

## 验收标准

| 指标 | 目标 |
|------|------|
| `pnpm exec tsc --noEmit` | 零错误 |
| `pnpm lint` | 无新增 lint 错误 |
| E1 Epic RemoteCursor | 功能不受影响 |
