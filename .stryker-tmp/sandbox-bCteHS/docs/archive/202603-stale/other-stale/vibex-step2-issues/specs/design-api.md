# Feature: 设计流程 API 持久化

## Jobs-To-Be-Done
- 作为用户，我希望设计流程的数据能在页面刷新后自动恢复，以便我能随时中断、切换标签页后继续工作。

## User Stories
- US1: 作为用户，我希望刷新页面后数据不丢失（从 API 恢复）
- US2: 作为用户，我希望每次保存后，下次访问能自动加载上次数据
- US3: 作为开发者，我需要一个解耦的 API 层服务设计流程，不依赖首页 DDD API

## Requirements
- [ ] (F3.1) 设计 `/api/design/clarification`、`/api/design/bounded-context` 等 RESTful 接口
- [ ] (F3.2) GET 接口返回当前步骤数据（无数据返回空对象 `{}`）
- [ ] (F3.3) POST 接口接收并持久化步骤数据，返回保存成功状态
- [ ] (F3.4) `designStore` 添加 `load(step)` 和 `save(step)` 方法，对接 API
- [ ] (F3.5) 页面挂载时（useEffect）自动调用 `load()` 恢复数据

## Technical Notes
- API 路径: `/api/design/[step]`，支持 GET/POST 方法
- 数据模型: ClarificationRound, DomainEntity, BusinessFlow 等已在 designStore.ts 定义
- 存储后端: 可先用内存/文件存储，后期迁移到数据库

## Acceptance Criteria
- [ ] AC1: 刷新 `/design/bounded-context` 页面后，数据从 GET /api/design/bounded-context 恢复
- [ ] AC2: 手动调用 save() 后，GET 接口返回最新保存数据
- [ ] AC3: expect(JSON.parse(response.body)).toEqual(expect.objectContaining({boundedContexts: expect.any(Array)}))
- [ ] AC4: 无网络时优雅降级（使用 localStorage 兜底）
