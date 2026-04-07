# PRD: vibex-backend 开发改进提案

**项目**: vibex-dev-proposals-vibex-proposals-20260411  
**版本**: v1.0  
**日期**: 2026-04-11  
**作者**: PM Agent  
**状态**: Draft

---

## 1. 执行摘要

### 背景
vibex-backend 处于活跃开发期，存在 43+ 处代码质量问题，包括：
- **日志污染**: `connectionPool.ts` 中 4 处 `console.log` 泄露敏感信息至生产 stdout
- **技术债务**: 6 个未完成的 TODO 散布于关键路由，5 个集中在 `project-snapshot.ts`（快照接口返回假数据）
- **健壮性缺陷**: AI 服务 JSON 解析未处理 markdown 包裹场景；异常处理缺乏熔断机制
- **可维护性差**: 9 处 `console.error` 缺乏结构化字段；~20+ `devDebug` 无法通过环境变量控制

这些问题直接影响生产可观测性、AI 生成可靠性、协作场景数据准确性。

### 目标
在 **13h** 工时内，分 **7 Phase** 渐进式修复以上所有问题，不引入大范围重构风险。

### 成功指标
| 指标 | 当前 | 目标 |
|------|------|------|
| `console.log` 数量（生产代码） | 4 | 0 |
| `console.error` 结构化覆盖率 | 0% | 100% |
| `devDebug` → `logger.debug` 替换率 | 0% | 100% |
| 未完成 TODO 数量（关键文件） | 6 | 0 |
| 遗留备份文件 | 1 | 0 |
| ai-service JSON 解析回归测试覆盖率 | 未覆盖 | 100% |

---

## 2. Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|----|--------|------|---------|------|
| F1 | 日志污染治理 | connectionPool.ts 4处 console.log 替换为结构化 logger | dev.md Proposal #1 | 1h |
| F2 | devDebug 统一 | ~20处 devDebug 调用统一为 logger.debug + LOG_LEVEL 控制 | dev.md Proposal #2 | 2h |
| F3 | 路由 console.error 结构化 | live-preview/prototype-preview 9处 console.error 替换并加 context | dev.md Proposal #4 | 2h |
| F4 | project-snapshot.ts 真实化 | 5个 TODO 替换为真实 D1 数据库查询 | dev.md Proposal #3 | 3h |
| F5 | 其他 TODO 清理 | clarification-questions/diagnosis/business-domain/prompts TODO 处理 | dev.md Proposal #3 | 2h |
| F6 | 遗留备份文件清理 | 删除 llm-provider.ts.backup-20260315235610 | dev.md Proposal #5 | 1h |
| F7 | connectionPool 异常处理增强 | 添加错误计数、阈值告警、熔断逻辑 | dev.md Proposal #6 | 2h |
| F8 | ai-service JSON 解析降级策略 | 支持 markdown 包裹 JSON 提取 + token 截断兜底 | dev.md Proposal #7 | 2h |
| **总计** | | | | **15h** |

---

## 3. Epic 拆分表

### Epic 1: 日志基础设施治理
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E1-S1 | connectionPool.ts console.log → logger | 1h | `expect(logger.info).toHaveBeenCalled()` 验证连接添加/移除/超时事件 |
| E1-S2 | devDebug 统一为 logger.debug | 2h | `LOG_LEVEL=info` 时 devDebug 输出为空；`LOG_LEVEL=debug` 时正常输出 |
| E1-S3 | 路由 console.error 结构化 | 2h | 所有 console.error 替换为 `logger.error(ctx)` 含 projectId/errorMsg |

### Epic 2: 技术债务清理
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E2-S1 | project-snapshot.ts 真实化 | 3h | 快照 API 返回 D1 数据库真实数据，单元测试验证 |
| E2-S2 | 其他 TODO 清理 | 2h | 剩余 1 个 TODO（prompts/flow-execution.ts:792）标记 `// TODO[YYYY-MM-DD]:` 或实现 |
| E2-S3 | 遗留备份文件清理 | 1h | `llm-provider.ts.backup-*` 文件已删除 |

### Epic 3: 健壮性增强
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E3-S1 | connectionPool 异常处理增强 | 2h | 连续 5 次消息处理失败触发 health check |
| E3-S2 | ai-service JSON 解析降级 | 2h | markdown 包裹的 JSON（如 ` ```json ... ``` `）正确解析，回归测试通过 |

### Epic 4: 收尾与验证
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|---------|
| E4-S1 | 全局日志规范检查 | 1h | 无新增 console.* 调用，CI 检查通过 |
| E4-S2 | 文档更新 | 1h | CHANGELOG 记录本次改进 |

---

## 4. 验收标准（expect() 断言）

### E1-S1: connectionPool.ts 日志
```ts
// Given: 新连接加入
// When: connectionPool.add(connection) 被调用
// Then: logger.info('connection_added', { connectionId, total: n }) 被调用（不含 console.log 输出）
expect(logger.info).toHaveBeenCalledWith('connection_added', expect.objectContaining({ connectionId: expect.any(String) }));
```

### E1-S2: devDebug 统一
```ts
// Given: LOG_LEVEL=info
// When: 任意 devDebug() 调用执行
// Then: 无输出
// Given: LOG_LEVEL=debug
// When: devDebug() 调用执行
// Then: logger.debug() 被调用
```

### E2-S1: project-snapshot.ts 真实数据
```ts
// Given: D1 数据库有 project id=123
// When: GET /api/project-snapshot?projectId=123
// Then: 返回数据与 D1 查询结果一致，非硬编码假数据
const result = await db.prepare('SELECT * FROM projects WHERE id = ?').bind('123').first();
expect(snapshot).toMatchObject({ id: result.id, name: result.name });
```

### E3-S1: 异常处理增强
```ts
// Given: handleMessage 连续失败 5 次
// When: 第 5 次 catch 触发
// Then: health check 被触发（logger.warn 或 explicit health check call）
```

### E3-S2: JSON 解析降级
```ts
// Given: AI 返回 '```json\n{"key": "value"}\n```'
// When: parseJSONWithRetry(response) 被调用
// Then: 返回 { key: "value" }（非 throw）
const markdownJson = '```json\n{"key": "value"}\n```';
expect(parseJSONWithRetry(markdownJson)).resolves.toEqual({ key: "value" });
```

---

## 5. Definition of Done

- [ ] 每个 Story 有对应的代码修改 + 测试用例
- [ ] 每个 Phase 作为独立 PR，可单独 review 和回滚
- [ ] Phase 1+2（P0 问题）优先合并，其余可与功能开发并行
- [ ] 所有 `console.log`/`console.error` 从生产代码中移除或通过 `NODE_ENV=production` 守卫
- [ ] `devDebug` 调用统一替换为 `logger.debug()`，可通过 `LOG_LEVEL` 环境变量控制
- [ ] `project-snapshot.ts` 快照接口返回真实 D1 数据库数据
- [ ] ai-service JSON 解析回归测试覆盖 markdown 包裹场景
- [ ] connectionPool 异常处理有阈值告警
- [ ] 遗留备份文件已删除
- [ ] CHANGELOG 已更新
- [ ] 无新增 lint 错误或 TypeScript 类型错误

---

## 6. 功能点汇总表（含页面/模块集成标注）

| 功能点 | 涉及模块 | 集成位置 | 类型 |
|--------|---------|---------|------|
| connectionPool.ts console.log 替换 | `services/websocket/connectionPool.ts` | WebSocket 连接管理 | 修复 |
| devDebug 统一 | `routes/plan.ts`, `routes/ddd.ts`, `routes/ai-design-chat.ts` | AI 路由层 | 重构 |
| 路由 console.error 结构化 | `routes/live-preview.ts`, `routes/prototype-preview.ts` | 预览路由 | 重构 |
| project-snapshot.ts 真实化 | `routes/project-snapshot.ts` | 项目快照 API | 修复 |
| 其他 TODO 处理 | `routes/clarification-questions.ts`, `routes/diagnosis.ts`, `routes/business-domain.ts`, `services/prompts/flow-execution.ts` | 多路由/服务 | 技术债务 |
| 遗留备份清理 | `services/llm-provider.ts.backup-20260315235610` | 文件系统 | 清理 |
| connectionPool 异常处理 | `services/websocket/connectionPool.ts` | WebSocket 异常管理 | 增强 |
| ai-service JSON 降级 | `services/ai-service.ts` | AI 服务编排 | 增强 |

---

## 7. 实施计划（Sprint 排期）

**总工时**: 15h（约 2 个工作日）

| Sprint | Phase | 内容 | 涉及文件 | 工时 | 优先级 |
|--------|-------|------|---------|------|--------|
| Sprint 1 | Phase 1 | connectionPool.ts console.log → logger | `services/websocket/connectionPool.ts` | 1h | P0 |
| Sprint 1 | Phase 2 | project-snapshot.ts 真实数据查询 | `routes/project-snapshot.ts` | 3h | P0 |
| Sprint 2 | Phase 3 | ai-service JSON 解析降级策略 | `services/ai-service.ts` | 2h | P1 |
| Sprint 2 | Phase 4 | devDebug 统一为 logger.debug | `routes/plan.ts`, `routes/ddd.ts`, `routes/ai-design-chat.ts` | 2h | P1 |
| Sprint 3 | Phase 5 | 路由 console.error 结构化 | `routes/live-preview.ts`, `routes/prototype-preview.ts` | 2h | P2 |
| Sprint 3 | Phase 6 | connectionPool 异常处理增强 | `services/websocket/connectionPool.ts` | 2h | P1 |
| Sprint 4 | Phase 7 | 遗留文件清理 + TODO 收尾 | 多文件 | 1h | P2 |
| Sprint 4 | Phase 8 | CHANGELOG 更新 + 全局检查 | 全局 | 1h | P1 |

**并行策略**: Phase 3-6 可与功能开发并行，Phase 1+2 优先完成。

**风险缓解**: 每个 Phase 独立 PR，优先 review 合并 P0 问题。
