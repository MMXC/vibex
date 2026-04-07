# Canvas API Tracker

**文档**: proposals/canvas-api-tracker.md
**生成时间**: 2026-04-05 03:27 GMT+8
**维护**: 每次 Canvas API 端点变更后更新

## 端点列表

| 端点 | 方法 | 状态 | AI 实现 | 覆盖率 | 最后更新 | 负责人 |
|------|------|------|---------|--------|---------|---------|
| `/api/v1/canvas/generate-contexts` | POST | ✅ real | `createAIService()` MiniMax | — | 2026-04-05 | dev |
| `/api/v1/canvas/generate-flows` | POST | ✅ real | `createAIService()` MiniMax | — | 2026-04-05 | dev |
| `/api/v1/canvas/generate-components` | POST | ✅ real | `createAIService()` MiniMax | — | 2026-04-05 | dev |
| `/api/v1/canvas/health` | GET | ✅ real | env check | — | 2026-04-05 | dev |

## 覆盖率计算

- **Real AI**: 4/4 = 100%
- **Mock**: 0/4 = 0%

> 注: health 端点检查 API Key 存在性，属于配置验证而非 AI 调用。

## 端点详情

### generate-contexts
- **路径**: `vibex-backend/src/app/api/v1/canvas/generate-contexts/route.ts`
- **输入**: `{ requirementText: string, projectId?: string }`
- **输出**: `{ success, contexts, generationId, confidence }`
- **验证**: Zod schema (`GenerateContextsResponseSchema`) ✅
- **错误码**: `CanvasAPIError` 统一结构 ✅

### generate-flows
- **路径**: `vibex-backend/src/app/api/v1/canvas/generate-flows/route.ts`
- **输入**: `{ requirementText: string, contexts: BoundedContext[] }`
- **输出**: `{ success, flows, confidence }`
- **验证**: Zod schema (`GenerateFlowsResponseSchema`) ✅
- **错误码**: `CanvasAPIError` 统一结构 ✅

### generate-components
- **路径**: `vibex-backend/src/app/api/v1/canvas/generate-components/route.ts`
- **输入**: `{ flows: BusinessFlow[], projectId?: string }`
- **输出**: `{ success, components, confidence }`
- **验证**: Zod schema (`GenerateComponentsResponseSchema`) ✅
- **错误码**: `CanvasAPIError` 统一结构 ✅

### health
- **路径**: `vibex-backend/src/app/api/v1/canvas/health/route.ts`
- **输入**: 无
- **输出**: `{ success, healthy, message }`
- **验证**: 3 tests ✅

## 更新日志

| 日期 | 变更 | 负责人 |
|------|------|---------|
| 2026-04-05 | 初始化 tracker，4 个端点均为 real AI | dev |
