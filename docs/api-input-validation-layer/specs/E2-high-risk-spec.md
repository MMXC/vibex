# E2 Spec: 安全高风险路由

## S2.1 GitHub 路径注入防护

### Schema
```typescript
const githubPathSchema = z.object({
  owner: z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid owner format'),
  repo: z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid repo format'),
  path: z.string().regex(/^[a-zA-Z0-9_./-]+$/, 'Invalid path format'),
});
```

### 攻击测试 Payload
```typescript
const attackPayloads = [
  '../../../etc/passwd',
  '..\\..\\windows\\system32',
  'repo<script>alert(1)</script>',
  "'; DROP TABLE users; --",
];
```

## S2.2 Chat API Prompt Injection 防护

### Schema
```typescript
const INJECTION_KEYWORDS = [
  'SYSTEM_PROMPT',
  '##Instructions',
  '/system',
  'You are now',
  '[SYSTEM]',
  '>>>>>',
];

const chatMessageSchema = z.object({
  message: z.string()
    .max(10000, 'Message too long (max 10000 chars)')
    .refine(
      (msg) => !INJECTION_KEYWORDS.some(kw => msg.includes(kw)),
      { message: 'Message contains suspicious keywords' }
    ),
  sessionId: z.string().uuid(),
});
```

## S2.3 Plan API Prompt Injection 防护

### Schema
```typescript
const planAnalyzeSchema = z.object({
  requirement: z.string()
    .min(1, 'Requirement cannot be empty')
    .max(50000, 'Requirement too long (max 50000 chars)'),
  projectId: z.string().uuid().optional(),
});
```
