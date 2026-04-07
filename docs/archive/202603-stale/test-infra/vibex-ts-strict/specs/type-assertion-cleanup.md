# Feature: Type Assertion Cleanup

## Jobs-To-Be-Done
- 作为**开发者**，我希望**消除所有 `as any` 类型断言**，以便**获得完整的类型安全保证**。

## User Stories
- US1: 扫描所有 `as any` 使用，生成清单
- US2: 逐个替换为正确的类型或 unknown
- US3: 验证替换后无编译错误

## Requirements
- [ ] (F2.1) 统计 `as any` 使用数量（基准）
- [ ] (F2.2) 按优先级排序：Store > API > 组件 > 工具
- [ ] (F2.3) Store 文件 `as any` 替换为正确类型（目标：0 个）
- [ ] (F2.4) API 调用 `as any` 替换为 ApiResponse<T>（目标：0 个）
- [ ] (F2.5) 组件 Props `as any` 替换为具体类型（目标：0 个）
- [ ] (F2.6) 工具函数 `as any` 替换为 unknown 或具体类型（目标：0 个）

## Technical Notes
- 替换策略：`as any` → `as unknown as T`（最小改动）→ 具体类型（最终目标）
- 第三方库类型：`// @ts-ignore` 或自定义 @types

## Acceptance Criteria
- [ ] `expect(exec('grep -rn "as any" src --include="*.ts" --include="*.tsx" | wc -l').trim()).toBe('0')`
- [ ] `expect(exec('npx tsc --noEmit 2>&1').exitCode).toBe(0)`
