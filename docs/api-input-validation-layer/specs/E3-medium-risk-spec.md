# E3 Spec: 中风险路由覆盖

## S3.1 Auth 路由验证

### Register Schema
```typescript
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase')
    .regex(/[a-z]/, 'Password must contain lowercase')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  name: z.string().min(1).max(100),
});
```

## S3.2 Projects 路由验证

```typescript
const createProjectSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .transform(s => s.trim())
    .refine(s => s.length > 0, 'Name cannot be only whitespace'),
  userId: z.string().uuid('Invalid user ID'),
  description: z.string().max(500).optional(),
});
```

## S3.3 Canvas Generate 验证

```typescript
const canvasGenerateSchema = z.object({
  pageIds: z.array(z.string()).min(1, 'At least one pageId required'),
  projectId: z.string().uuid(),
  options: z.object({
    includeComponents: z.boolean().default(true),
    includeFlows: z.boolean().default(true),
  }).optional(),
});
```
