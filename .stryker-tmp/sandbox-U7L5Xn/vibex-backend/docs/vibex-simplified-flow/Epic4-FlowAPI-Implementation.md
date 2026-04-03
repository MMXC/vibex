# Epic4-FlowAPI 实现方案

## 背景
`vibex-simplified-flow` 项目中的 FlowAPI (Epic4) 需要实现完整的业务流程 CRUD 持久化。目前 `flow.ts` 已有 generate/GET/PUT 端点，但存在以下问题：
1. generate 不保存 flow 到 DB
2. 节点类型字段不匹配 SPEC-02
3. 缺少 `checked`, `editable` (node) 和 `animated` (edge) 字段
4. 没有 domainIds 过滤逻辑
5. 缺少 DELETE 端点

## 现有代码结构
- `src/routes/flow.ts` — FlowAPI 路由 (generate/GET/PUT)
- `prisma/schema.prisma` — `FlowData` model 已存在
- `src/lib/db.ts` — queryDB/executeDB/queryOne 工具

## 影响范围
- `src/routes/flow.ts` — 主文件修改
- `src/types/simplified-flow.ts` — 类型定义已对齐，无需修改

## 方案设计

### 方案A: 修改现有 flow.ts (推荐)
- 更新类型定义对齐 SPEC-02
- 增强 generate 端点：fetch domains + save to DB
- 添加 DELETE 端点
- 修改量小，风险低

### 方案B: 重写 flow.ts
- 完全重写以完全对齐 SPEC-02
- 工作量大，不推荐

## 实施步骤

### 1. 更新类型定义 (flow.ts 内部)
对齐 SPEC-02:
```typescript
interface FlowNode {
  id: string
  name: string
  type: 'start' | 'end' | 'process' | 'decision'  // 'task'→'process'
  domainId?: string
  position: { x: number; y: number }
  description?: string
  checked: boolean      // 新增
  editable: boolean    // 新增
}

interface FlowEdge {
  id: string
  source: string
  target: string
  label?: string
  animated: boolean    // 新增
  checked: boolean     // 新增
}
```

### 2. 更新 POST /api/flow/generate
- 解析 `domainIds` 和 `userId` (SPEC-02 要求必填)
- Fetch domain names from DB for context
- 增强 AI prompt 使用已保存的 domain 信息
- 在 `done` 事件中保存 flow 到 DB
- Validation: domainIds 为空返回 400
- 新增 SSE 事件: `start`, `thinking` (带 domainCount)

### 3. 添加 DELETE /api/flow
- DELETE /api/flow?id=xxx

## 验收标准
- [ ] npm run build 通过
- [ ] npm test 通过
- [ ] flow.ts 类型对齐 SPEC-02
- [ ] generate 端点保存 flow 到 DB
- [ ] DELETE 端点存在
- [ ] commit 包含方案链接
