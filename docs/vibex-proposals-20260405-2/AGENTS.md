# AGENTS.md — vibex-proposals-20260405-2 开发约束

**项目**: vibex-proposals-20260405-2
**日期**: 2026-04-05
**仓库**: /root/.openclaw/vibex

---

## 1. E1: Zod Schema 约束

```typescript
// ✅ 正确：使用 Zod schema
import { z } from 'zod';
const schema = z.object({ generationId: z.string() });
const result = schema.safeParse(obj);

// ❌ 错误：手写字段判断
if (typeof obj.sessionId === 'string') return true;  // ← 禁止
```

---

## 2. 错误码规范

```typescript
// ✅ 正确：使用统一错误码
return NextResponse.json(
  { success: false, data: null, error: 'AI 服务错误', code: 'AI_SERVICE_ERROR' },
  { status: 500 }
);

// ❌ 错误：裸错误信息
return NextResponse.json({ success: false, error: 'something went wrong' });
```

---

## 3. 代码审查清单

### E1
- [ ] 使用 `schema.safeParse()` 而非手写 validator
- [ ] Schema 定义在 `packages/types/src/api/canvas.ts` 共享

### E2
- [ ] `mock-coverage` 命令覆盖所有 Canvas API

### E3
- [ ] 所有 API 错误包含 `code` 字段

### E4
- [ ] `calculate_priority` 为纯函数（无副作用）

---

*本文档由 Architect Agent 生成于 2026-04-05 02:29 GMT+8*
