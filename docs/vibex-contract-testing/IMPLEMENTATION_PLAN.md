# IMPLEMENTATION_PLAN: vibex-contract-testing

## 依赖
packages/types 需先就绪（Epic 1）

## 实施顺序
Epic 1 → Epic 2 → Epic 3, 4 可并行

## 实施步骤

### Epic 1: Schema 定义
1. 创建 packages/types/api/canvas.ts
2. 定义 ContextSchema, GenerateFlowsRequestSchema 等
3. 写 schema 单元测试

### Epic 2: 后端校验中间件 ✅
1. 创建 validate.ts 中间件 (canvas-validation.ts)
2. 修改 generateFlows.ts 集成校验 (route.ts)
3. 写中间件单元测试 (canvas-validation.test.ts, 14 tests ✅)

### Epic 3: 前端 response 校验
1. 修改 canvasApi.ts parseResponse
2. 写 canvasApi 响应校验测试

### Epic 4: CI 契约测试
1. 创建 __tests__/contract/ 目录
2. 写 MSW 契约测试
3. 更新 jest.config.ts 添加 contract project
4. 验证 CI blocking 机制

## 验收
- npm test:contract 通过
- generateFlows confirmed=false → 400
- CI 契约测试 blocking merge
