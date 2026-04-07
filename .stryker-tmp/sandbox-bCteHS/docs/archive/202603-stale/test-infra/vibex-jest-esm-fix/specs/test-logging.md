# Feature: Test Logging Noise Reduction

## Jobs-To-Be-Done
- 作为 **CI/CD 系统**，我需要测试输出中不包含应用级别的 `console.error` 日志，以便准确区分测试失败和正常错误日志。
- 作为 **开发者**，我需要在本地运行测试时输出清晰可读，不被预期的错误日志淹没。

## User Stories
- US1: 作为开发者，运行 `npm test` 时，错误处理测试路径中的 `console.error` 不会出现在终端输出中。
- US2: 作为 CI 系统，解析 JUnit/XML 测试报告时不会误报测试失败。

## Requirements
- [ ] (F1.1) 创建 `jest.setup.ts` 文件，统一 mock `console.error`
- [ ] (F1.2) 在 `jest.config.js` 中配置 `setupFilesAfterEnv` 指向该文件
- [ ] (F1.3) 验证 `npm test` 输出中无 `console.error` 干扰
- [ ] (F1.4) 确认所有 55 个测试套件、436 个测试仍然通过

## Technical Notes
- 使用 `jest.spyOn(console, 'error').mockImplementation(() => {})` 在 setup 文件中全局 mock
- 需在 `setupFilesAfterEnv`（Jest 27+）而非 `setupFiles` 中配置，确保测试环境已就绪
- 不影响开发环境日志，mock 仅在测试时生效

## Acceptance Criteria
- [ ] `npm test` 输出中 `Error fetching projects`、`Error creating project` 等日志不再出现（对应 F1.1、F1.2）
- [ ] `npm test` 结果：55 passed, 436 passed（对应 F1.3、F1.4）
- [ ] `jest.config.js` 包含 `setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']`（对应 F1.2）
