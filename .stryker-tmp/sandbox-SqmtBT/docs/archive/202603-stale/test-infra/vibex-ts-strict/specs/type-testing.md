# Feature: Type Test Coverage

## Jobs-To-Be-Done
- 作为**开发者**，我希望**有类型级别的测试**，以便**确保关键类型的正确性**。

## User Stories
- US1: 为 Store 类型添加单元测试
- US2: 为 API 响应类型添加类型测试
- US3: 使用 `tsd` 进行静态类型测试

## Requirements
- [ ] (F4.1) 安装 `@tsd` 类型测试工具
- [ ] (F4.2) Store 类型测试：验证类型正确性
- [ ] (F4.3) API 响应类型测试：验证 ApiResponse<T> 结构
- [ ] (F4.4) 组件 Props 类型测试：验证 props 传递正确性

## Technical Notes
- 使用 `@tsd/tsd` 进行静态类型测试
- 测试文件命名：`*.test-d.ts`

## Acceptance Criteria
- [ ] `expect(exec('npx tsd 2>&1').exitCode).toBe(0)`
- [ ] `expect(fs.existsSync('src/**/*.test-d.ts')).toBe(true)`
