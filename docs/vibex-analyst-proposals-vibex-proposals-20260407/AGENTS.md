# AGENTS.md — Vibex Proposals 2026-04-07

## 开发约束

### 代码规范
```typescript
// E3: flowId 必须使用 zod schema 验证
import { z } from 'zod';
const FlowIdSchema = z.string().regex(/^flow-[a-z0-9-]+$/);
```

### 测试规范
```typescript
// 每个 Epic 必须有测试
describe('OPTIONS handler', () => {
  it('returns 204 with CORS headers', async () => {
    const res = await fetch('/api/v1/projects', { method: 'OPTIONS' });
    expect(res.status).toBe(204);
  });
});
```

### 禁止事项
- ❌ 硬编码 flowId 格式
- ❌ SSE 流无超时
- ❌ 重复 test-notify 未去重

*Architect Agent | 2026-04-07*
