# VibeX API 输入验证层 — 实施计划

**项目**: api-input-validation-layer
**版本**: v1.0
**日期**: 2026-04-03

---

## 执行决策
- **决策**: 已采纳
- **执行项目**: 待 coord 创建项目并绑定
- **执行日期**: 2026-04-03

---

## 1. Sprint 分批计划

### Sprint 1: Zod 验证基础设施（~4h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| S1.1 | Zod 验证框架 | dev | 2h | 无 |
| S1.2 | 标准化错误响应 | dev | 1h | S1.1 |
| S1.3 | 中间件集成 | dev | 1h | S1.1 |

**Sprint 1 交付物**:
- `src/lib/api-validation.ts` 可导出
- 所有 400 错误返回统一格式
- 中间件在 `/api/*` 路由生效

---

### ✅ Sprint 2: 安全高风险路由（~7h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| ✅ S2.1 | GitHub 路径注入防护 | dev | 2h | E1 ✅ |
| ✅ S2.2 | Chat API Prompt Injection | dev | 3h | E1 ✅ |
| ✅ S2.3 | Plan API Prompt Injection | dev | 2h | E1 ✅ |

**Sprint 2 交付物**:
- `/api/github/*` 路由通过 3+ 攻击 payload 测试
- `/api/chat` 通过 2+ injection payload 测试
- `/api/plan/*` 通过长度限制测试

---

### Sprint 3: 中风险路由 + 容错（~8h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| ✅ S3.1 | Auth 路由验证 | dev | 2h | E1 ✅ |
| ✅ S3.2 | Projects 路由验证 | dev | 2h | E1 ✅ |
| ✅ S3.3 | Canvas 路由验证 | dev | 2h | E1 ✅ |
| ✅ S4 | JSON.parse 容错 | dev | 2h | E1 ✅ |

**Sprint 3 交付物**:
- Auth、Projects、Canvas 路由 100% 覆盖
- 所有 malformed JSON 返回 400 而非 500

---

### Sprint 4: 自动化测试覆盖（~5h）

| # | Story | 负责人 | 工时 | 依赖 |
|---|-------|--------|------|------|
| ✅ S5.1 | Schema 单元测试 | tester | 2h | E2 ✅ |
| ✅ S5.2 | API Contract 测试 | tester | 2h | E2+E3 ✅ |
| ✅ S5.3 | 安全攻击测试 | tester | 1h | E2 ✅ |

**Sprint 4 交付物**:
- Schema 测试覆盖率 100%
- 所有高风险路由有 Contract 测试

---

## 2. 开发顺序

```
Phase 1: 基础设施（不破坏现有功能）
    withValidation() 函数
    ValidationError 类
    标准化错误响应格式
    
Phase 2: 高风险路由（逐步替换）
    先在测试分支替换 /api/chat
    验证无误后替换 /api/github/*
    
Phase 3: 中风险路由（批量应用）
    Auth → Projects → Canvas 依次验证
    
Phase 4: 容错 + 测试
    JSON.parse 扫描和修复
    单元测试 + Contract 测试
```

---

## 3. 开发约束

### 3.1 Zod Schema 规范

```typescript
// ✅ 正确：导出 TypeScript 类型
export const chatMessageSchema = z.object({ ... });
export type ChatMessage = z.infer<typeof chatMessageSchema>;

// ❌ 错误：使用 as any
const unsafe = data as any;
```

```typescript
// ✅ 正确：使用 .refine() 提供友好错误
.refine((msg) => !detectInjection(msg), {
  message: 'Message contains suspicious content',
})

// ❌ 错误：直接 .refine() 返回 boolean
.refine((msg) => !detectInjection(msg)) // 无错误信息
```

```typescript
// ✅ 正确：使用 .strict() 拒绝额外字段
export const registerSchema = z.object({ ... }).strict();

// ❌ 错误：允许额外字段
export const registerSchema = z.object({ ... }); // 默认可选 extra
```

### 3.2 路由改造规范

```typescript
// ✅ 正确：使用 withValidation 包装
app.post('/api/chat',
  withValidation(null, chatMessageSchema, async (c) => {
    const { message, sessionId } = c.validatedData.body;
    return c.json(await chatService.send({ message, sessionId }));
  })
);

// ❌ 错误：直接读取 body
app.post('/api/chat', async (c) => {
  const { message } = await c.req.json(); // 无验证
});
```

### 3.3 JSON.parse 安全规范

```typescript
// ✅ 正确：try-catch 保护
let data: unknown;
try {
  data = JSON.parse(rawBody);
} catch {
  return c.json({ success: false, error: 'Invalid JSON' }, 400);
}

// ❌ 错误：裸 JSON.parse
const data = JSON.parse(rawBody); // 可能 500
```

---

## 4. 关键里程碑

| 里程碑 | 日期 | 交付物 |
|--------|------|--------|
| M1: 基础设施就绪 | Sprint 1 结束 | withValidation 可用 |
| M2: 安全路由上线 | Sprint 2 结束 | GitHub + Chat + Plan 安全 |
| M3: 全路由覆盖 | Sprint 3 结束 | Auth/Projects/Canvas + 容错 |
| M4: 测试通过 | Sprint 4 结束 | Contract 测试 100% |

---

*实施计划版本: v1.0 | 架构师: Architect Agent | 日期: 2026-04-03*
