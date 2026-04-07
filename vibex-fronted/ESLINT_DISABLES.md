# ESLint Disable 豁免记录

**版本**: v1.0
**日期**: 2026-04-03
**维护者**: @reviewer
**复查周期**: 每 Sprint 审查一次

---

## 概述

本文件记录了 `vibex-fronted` 项目中所有 `eslint-disable` 注释的豁免情况。
每次新增豁免必须同步更新本文件，复查状态为 ⚠️ NEEDS FIX 的条目需在当前 Sprint 内修复。

**当前总数**: 17 条
**复查状态分布**: ✅ LEGIT 9 条 | ⚠️ NEEDS FIX 4 条 | ⚠️ QUESTIONABLE 4 条

---

## 豁免记录表

| # | 文件路径 | 行号 | 规则 | 分类 | 理由 | 复查状态 |
|---|---------|------|------|------|------|---------|
| 1 | src/app/preview/page.tsx | 12 | @typescript-eslint/no-explicit-any | ✅ LEGIT | 类型别名绕过 BusinessFlow 联合类型兼容问题，第三方类型定义不完整 | ✅ APPROVED |
| 2 | src/components/homepage/steps/StepProjectCreate.tsx | 12 | @typescript-eslint/no-explicit-any | ✅ LEGIT | 同上，AnyBusinessFlow 类型别名处理联合类型兼容 | ✅ APPROVED |
| 3 | src/components/homepage/steps/StepBusinessFlow.tsx | 11 | @typescript-eslint/no-explicit-any | ✅ LEGIT | 同上，统一 BusinessFlow 两种变体的类型兼容 | ✅ APPROVED |
| 4 | src/test-utils/component-test-utils.tsx | 73 | @typescript-eslint/ban-ts-comment | ✅ LEGIT | React 19 类型已知问题，`@ts-ignore` 是合理的类型兼容性处理 | ✅ APPROVED |
| 5 | src/components/canvas/edges/RelationshipConnector.tsx | 53 | react-hooks/refs | ✅ LEGIT | 性能关键路径：在 render 阶段查询 DOM 位置，推迟会导致布局抖动。已标注清晰理由 | ✅ APPROVED |
| 6 | src/components/canvas/edges/RelationshipConnector.tsx | 67 | react-hooks/refs | ✅ LEGIT | 同上，获取容器位置计算 SVG 偏移，必须在 render 阶段同步执行 | ✅ APPROVED |
| 7 | src/lib/canvas/__tests__/useCanvasSession.test.tsx | 18 | react/function-component-definition | ✅ LEGIT | 测试工具函数包装器，合理的测试代码特殊处理 | ✅ APPROVED |
| 8 | src/hooks/useCanvasHistory.ts | 154 | react-hooks/exhaustive-deps | ✅ LEGIT | mount 时执行一次，无需依赖（初始化逻辑） | ✅ APPROVED |
| 9 | src/hooks/canvas/useAutoSave.ts | 220 | react-hooks/exhaustive-deps | ✅ LEGIT | mount 时执行一次，依赖 `projectId` 在 deps 中已注明 | ✅ APPROVED |
| 10 | src/stores/ddd/init.ts | 51 | react-hooks/rules-of-hooks | ⚠️ RISKY | 动态 `require('react')` 在 Zustand store 初始化时加载 hooks ⚠️ 违反 ESLint rules-of-hooks | ⚠️ NEEDS FIX |
| 11 | src/stores/ddd/init.ts | 53 | react-hooks/rules-of-hooks | ⚠️ RISKY | 同上，useEffect 从动态 require 获取 ⚠️ 违反 ESLint rules-of-hooks | ⚠️ NEEDS FIX |
| 12 | src/lib/canvas/search/SearchIndex.ts | 166 | @typescript-eslint/no-require-imports | ⚠️ NEEDS FIX | 动态 require zustand store，反模式，应改为静态 import | ⚠️ NEEDS FIX |
| 13 | src/lib/canvas/search/SearchIndex.ts | 168 | @typescript-eslint/no-require-imports | ⚠️ NEEDS FIX | 同上，useContextStore 的动态 require | ⚠️ NEEDS FIX |
| 14 | src/components/chat/SearchFilter.tsx | 120 | @typescript-eslint/no-unused-vars | ⚠️ NEEDS FIX | `maxPreviewResults` 参数声明但未使用，应删除或实现该功能 | ⚠️ NEEDS FIX |
| 15 | src/lib/versioned-storage/index.ts | 24 | @typescript-eslint/no-unused-vars | ⚠️ QUESTIONABLE | Zustand module declaration 扩展，interface 参数为 declaration merge 需要 | ⚠️ REVIEW |
| 16 | src/hooks/canvas/useCanvasExport.ts | 18 | @typescript-eslint/no-unused-vars | ⚠️ NEEDS FIX | 类型导入仅用于 JSDoc 注释引用，应使用 `@type` JSDoc 或删除并用注释描述 | ⚠️ NEEDS FIX |
| 17 | src/types/api-generated.ts | 11 | @typescript-eslint/no-empty-object-type | ⚠️ NEEDS FIX | 空接口作为 placeholder，注释说明需运行 generate:types 填充，应用 `Record<string, never>` 或注释掉 | ⚠️ NEEDS FIX |

---

## 分类说明

### ✅ LEGIT（已批准）
豁免理由充分，当前实现合理，无需修改。

### ⚠️ NEEDS FIX（需修复）
当前存在合理的替代方案，应在当前 Sprint 内修复：
- **#10-11** (`init.ts`): 动态 `require('react')` 模式有稳定性风险，建议重构为标准的 React hook 调用
- **#12-13** (`SearchIndex.ts`): 动态 `require` 应改为静态 import
- **#14** (`SearchFilter.tsx`): 未使用参数应删除
- **#16** (`useCanvasExport.ts`): 未使用导入应删除或改用 `@type` JSDoc
- **#17** (`api-generated.ts`): 空接口应替换为明确的类型或移除

### ⚠️ REVIEW（待评估）
需要进一步评估：
- **#15** (`versioned-storage/index.ts`): Zustand module declaration 扩展中 `StoreMutators<S, A>` 参数 S 和 A 在 declaration merge 时可能是必需的，具体需进一步评估

---

## 豁免准则

符合以下场景之一的豁免视为合理：

1. **第三方库类型缺失**: 外部库类型定义不完整，无法通过正常手段补全
2. **性能关键路径**: DOM 测量等必须在 render 阶段同步执行的操作
3. **测试工具代码**: 测试 wrapper、mock 等合理使用
4. **明确的初始化逻辑**: mount 时执行一次的 effect，已在注释中标注

---

## 更新记录

| 日期 | 版本 | 更新内容 | 更新人 |
|------|------|---------|-------|
| 2026-04-03 | v1.0 | 初始版本，扫描 17 条豁免记录 | @dev |
