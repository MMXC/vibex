# Epic8-TemplatesAPI 实现方案

## 背景
SPEC-09 定义了 `/api/templates` 公开模板市场列表 API。当前实现存在以下问题需要修复：

1. 缺少 `isPublic`、`usageCount`、`thumbnail` 数据库字段
2. 列表 API 未过滤 `isPublic = true`（应只返回公开模板）
3. GET /:id 中 `Flow` 表名应为 `FlowData`
4. 缺少测试覆盖

## 方案设计

### 方案A (推荐): 增量修复
- 创建 migration 004 添加缺失列
- 更新 Prisma schema
- 修复 templates.ts 逻辑
- 添加测试

### 实施步骤
1. 创建 `prisma/migrations/004_template_columns.sql`
2. 更新 `prisma/schema.prisma` 添加字段
3. 修复 `src/routes/templates.ts`:
   - `isPublic = true` 过滤
   - `Flow` → `FlowData` 表名
   - `isPublic` 从 DB 读取
   - `thumbnail` 字段处理
4. 创建 `src/routes/__tests__/templates.test.ts`
5. 运行验证

## 验收标准
- [ ] migration 004 创建
- [ ] Prisma schema 更新
- [ ] templates.ts 修复完成
- [ ] GET /api/templates 只返回 isPublic=true 的模板
- [ ] GET /api/templates/:id 正确返回 FlowData
- [ ] npm run build 通过
- [ ] npm test 通过
- [ ] IMPLEMENTATION_PLAN.md 更新
