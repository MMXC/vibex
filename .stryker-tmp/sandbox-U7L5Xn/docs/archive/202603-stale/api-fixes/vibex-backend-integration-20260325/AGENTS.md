# AGENTS.md — VibeX 三树画布后端对接

**项目**: vibex-backend-integration-20260325
**Epic**: Epic 1 — 后端三树生成 API

## 验收命令

```bash
# 前端 TypeScript 检查
cd vibex-fronted && pnpm tsc --noEmit

# 前端 Build
cd vibex-fronted && pnpm build

# 前端测试
cd vibex-fronted && npx jest "canvasStore" --no-coverage

# 后端 TypeScript 检查
cd vibex-backend && npx tsc --noEmit
```

## Epic 1 验收标准

- [x] POST /api/canvas/generate-contexts — 限界上下文生成
- [x] POST /api/canvas/generate-flows — 业务流程生成
- [x] POST /api/canvas/generate-components — 组件树生成
- [x] Prisma schema — 4个新模型
- [x] canvasApi.ts — 扩展3个新方法
- [x] 前端 types.ts — 新增类型定义
- [x] TypeScript 0 errors
- [x] Build ✅
- [x] 39 canvasStore tests ✅

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/canvas/generate-contexts` | POST | 从需求文本生成限界上下文 |
| `/api/canvas/generate-flows` | POST | 从上下文生成业务流程 |
| `/api/canvas/generate-components` | POST | 从流程生成组件 |

## 关键文件

- 后端: `vibex-backend/src/app/api/canvas/generate-{contexts,flows,components}/route.ts`
- 前端: `vibex-fronted/src/lib/canvas/api/canvasApi.ts`
- 数据库: `vibex-backend/prisma/schema.prisma`
