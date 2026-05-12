# 分析文档：Sprint36 TypeScript 编译错误修复

**版本**: v1.0
**日期**: 2026-05-12
**作者**: Hermes Coord

## 问题概述

`pnpm exec tsc --noEmit` 在 `/root/.openclaw/vibex/vibex-fronted/` 目录下报 23 行 TypeScript 错误，阻止所有 Epic 的开发工作通过 `tsc --noEmit 零错误` 约束。

## 受影响文件

| 文件 | 错误数 | 行号 | 错误类型 |
|------|--------|------|----------|
| `src/stores/ddd/middleware.ts` | 2 | 150 | 空对象索引 |
| `src/stores/prototypeStore.ts` | 1 | 54 | 泛型约束违反 |
| `src/utils/design/fallbackStrategy.ts` | 1 | 215 | 空对象属性访问 |

## 根因分析

### 1. `middleware.ts` — 空对象类型索引
```typescript
// 行 150 附近
const node = {};  // 类型推断为 {}
node['modelMermaidCode'] = ...      // TS7053: 无法索引空对象
node['selectedModelIds'] = ...       // TS7053: 同上
```

**根因**：用空对象字面量 `{}` 作为动态状态容器，TypeScript 无法推导属性访问。

**修复方向**：为状态对象添加明确的接口定义（如 `interface NodeState {}`），或使用 `Record<string, unknown>`。

### 2. `prototypeStore.ts` — 泛型约束违反
```typescript
// 行 54 附近
type EmptyNodeExtra = {};  // 空对象类型
function getNode<T extends string>(id: T)  // T 必须满足 string 约束
```
**根因**：`EmptyNodeExtra` 不满足 `string` 约束（空对象不是 string）。

**修复方向**：移除泛型约束，或修正类型定义。

### 3. `fallbackStrategy.ts` — 空对象 `.length` 访问
```typescript
// 行 215 附近
const config = {};  // 类型推断为 {}
config.length        // TS2339: 属性 'length' 不存在于 {}
```
**根因**：空对象无 `.length` 属性。

**修复方向**：确认 config 的实际类型，添加正确的类型注解。

## 技术风险

- **低风险**：修复仅涉及类型注解，不改变运行时行为
- **影响范围**：仅限上述 3 个文件，不影响其他 Epic 代码

## 验收标准

- [ ] `pnpm exec tsc --noEmit` 在 `/root/.openclaw/vibex/vibex-fronted/` 下零错误
- [ ] 原有功能（E1 Epic RemoteCursor 等）不受影响
- [ ] 不引入新的 lint 错误

## 修复优先级

**P0 — 阻断所有 Sprint36 开发，必须优先修复**
