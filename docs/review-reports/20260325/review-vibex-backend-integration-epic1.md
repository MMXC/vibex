# 审查报告 — Epic1: 后端三树生成 API (vibex-backend-integration-20260325)

**Agent**: reviewer
**Commit**: `974c5571`
**审查时间**: 2026-03-25 21:44
**工作目录**: `/root/.openclaw/vibex`

---

## 📋 结论: ⚠️ **CONDITIONAL PASS**

代码架构清晰、安全性良好，但存在 **API 响应与前端类型不匹配**问题，前端调用这些 API 时会收到错误字段名导致运行时失败。

---

## 🔴 Blocker: API 响应字段与前端类型不匹配

### 1. `sessionId` vs `generationId`

**前端 types.ts 期望**:
```typescript
GenerateContextsOutput {
  sessionId: string;  // ← 前端类型定义
  confidence: number;
}

GenerateFlowsOutput {
  sessionId: string;  // ← 前端类型定义
  confidence: number;
}
```

**后端 route.ts 返回**:
```typescript
// generate-contexts/route.ts
return NextResponse.json({ generationId: sessionId, ... });  // ← 返回 generationId

// generate-flows/route.ts
return NextResponse.json({ generationId, ... });  // ← 返回 generationId
```

前端调用 `response.sessionId` 会得到 `undefined`。

### 2. Flows 嵌套结构

**前端期望**:
```typescript
flows: Array<{
  name: string;
  contextId: string;
  description?: string;
  steps: Array<{ name: string; actor: string; description: string; order: number; }>;
}>
```

**后端实际返回**:
```typescript
flows: BusinessFlowResponse[]  // = { id, name, contextId, description, steps, confidence }
```
后端多返回了 `id` 和 `confidence` 字段（可接受），但前端类型缺少这两个字段可能引发 TypeScript 严格模式问题。

### 3. Components API 字段

**前端期望**:
```typescript
GenerateComponentsOutput {
  components: Array<{
    api?: { method: string; path: string; params: string[] };  // 单个 api 对象
  }>;
}
```

**后端实际返回**:
```typescript
components: ComponentResponse[]  // = { apis: ComponentApi[] }  (apis 数组)
```
前端期望 `api` 对象，后端返回 `apis` 数组。字段名和类型都不同。

### 4. Prisma Schema 字段名

**Prisma schema**:
```prisma
model CanvasBoundedContext {
  ctxType String  // ← 数据库字段
}
```

**前端 types.ts**:
```typescript
BoundedContextNode {
  type: 'core' | 'supporting' | 'generic' | 'external';  // ← 前端期望
}
```
字段名不匹配 (`ctxType` vs `type`)。前端读取 `node.type` 会得到 `undefined`。

---

## ✅ 做得好的地方

| 检查项 | 结果 |
|--------|------|
| Prisma schema valid | ✅ `prisma validate` 通过 |
| TypeScript 编译 | ✅ backend + frontend 均无 errors |
| ESLint | ✅ backend 0 errors (3 warnings), frontend 0 errors (1 warning) |
| SQL 注入 | ✅ Prisma ORM 参数化查询 |
| XSS | ✅ API routes 无 DOM 操作 |
| 输入验证 | ✅ `body?.xxx` 检查 + 400 错误返回 |
| 错误处理 | ✅ try/catch + 500 错误返回 |
| 代码注释 | ✅ 所有 route 都有 JSDoc |
| ADR 合规 | ✅ API 前缀 `/api/canvas/` 符合 ADR-003 |

---

## 🟡 建议（非阻塞）

### 1. 未使用变量（ESLint warnings）
```typescript
// generate-components/route.ts:15
'BusinessFlow' is defined but never used

// generate-components/route.ts:143
'truncated' is assigned but never used

// generate-flows/route.ts:78
'_sessionId' is assigned but never used
```
建议修复以保持代码整洁。

### 2. Prisma 命名约定
`CanvasFlowStep` 的 relation 字段 `canvasFlow` 与模型名 `CanvasFlow` 大小写不匹配：
```prisma
canvasFlow CanvasFlow @relation(...)  // 字段名应为首字母小写: canvasFlow
```
Prisma 惯例是首字母小写驼峰，建议改为 `canvasFlow`。

### 3. 组件数量截断未通知
`generate-components` 截断超过 20 个组件为 20 个：
```typescript
const rawComponents = result.data.slice(0, 20);
const truncated = result.data.length > 20;  // 但 truncated 未使用
```
前端无法知道数据被截断了，建议返回 `totalCount` 字段（已定义但后端未返回）。

---

## 📊 验收检查

| 检查项 | 状态 |
|--------|------|
| TypeScript 编译 | ✅ backend + frontend 0 errors |
| ESLint | ✅ backend + frontend 0 errors |
| Prisma schema | ✅ 验证通过 |
| API 类型匹配 | ❌ **不匹配** |
| Prisma 字段名匹配 | ❌ `ctxType` vs `type` |
| 测试覆盖 | ✅ commit 验证通过 (39 canvasStore tests) |
| 安全漏洞 | ✅ |
| changelog 更新 | ⏳ 待更新 |

---

## 💡 修复建议

### 修复 API 响应（优先级 P0）

**generate-contexts/route.ts**:
```typescript
// 将 generationId 改为 sessionId，或让前端使用 generationId
```

**generate-flows/route.ts**:
```typescript
// 同上 + 确保 steps 字段名与前端匹配
```

**generate-components/route.ts**:
```typescript
// 将 components[].apis 数组改为 api 对象
// 或统一前端类型使用 apis 数组
```

### 修复 Prisma + 前端类型（优先级 P1）

统一 `ctxType` → `type`，在 Prisma query 层做字段映射，或在前端 store 层做转换。

