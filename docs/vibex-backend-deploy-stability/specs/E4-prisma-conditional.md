# E4: Prisma 条件加载 - 详细规格

## S4.1 环境检测逻辑

### 目标
确保 PrismaClient 仅在本地开发环境加载，生产环境使用 D1 原生 API。

### 现状问题

```typescript
// src/lib/db.ts - 问题代码
class PrismaPoolManager {
  private client: PrismaClient | null = null;
  
  async getClient() {
    this.client = new PrismaClient(); // ❌ 生产环境也加载
  }
}
```

### 实施方案

```typescript
// src/lib/db.ts - 重构后

// 环境检测
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_WORKERS = typeof globalThis.caches !== 'undefined';

// PrismaClient 仅在非生产环境加载
let prismaClient: PrismaClient | null = null;

async function getPrismaClient(): Promise<PrismaClient | null> {
  if (IS_PRODUCTION) {
    return null; // 生产环境不使用 Prisma
  }
  
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    });
  }
  
  return prismaClient;
}

// D1 原生 API（生产环境使用）
async function d1Query(sql: string, params?: any[]) {
  // 从 Hono context 传入 env.DB (D1Database)
  // 具体实现由调用方传入
}

// 统一的数据库接口
export async function dbOperation(
  operation: 'findFirst' | 'findMany' | 'create' | 'update' | 'delete',
  options: {
    model?: string;
    where?: Record<string, any>;
    data?: Record<string, any>;
    env?: { DB: D1Database };
  }
) {
  if (IS_PRODUCTION && options.env?.DB) {
    // 生产环境：使用 D1 API
    // 需将 Prisma 查询转换为原生 SQL
    return d1Execute(options.env.DB, operation, options);
  } else {
    // 开发环境：使用 Prisma
    const client = await getPrismaClient();
    if (!client || !options.model) {
      throw new Error('Prisma client not available');
    }
    return (client as any)[options.model][operation](options);
  }
}
```

### 迁移指南（可选，后续工作）

如需完全迁移到 D1，可参考：

```typescript
// Prisma to D1 转换示例

// Prisma:
const user = await prisma.user.findFirst({
  where: { id: userId }
});

// D1:
const result = await env.DB.prepare(
  'SELECT * FROM User WHERE id = ?'
).bind(userId).first();

const user = result.results[0];
```

### 验收断言

```typescript
// __tests__/db.test.ts

describe('Prisma Conditional Loading', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should not load PrismaClient in production', async () => {
    process.env.NODE_ENV = 'production';
    
    // 重新导入模块
    const db = await import('../src/lib/db');
    
    const client = await db.getPrismaClient();
    expect(client).toBeNull();
  });

  it('should load PrismaClient in development', async () => {
    process.env.NODE_ENV = 'development';
    
    const db = await import('../src/lib/db');
    
    const client = await db.getPrismaClient();
    expect(client).toBeDefined();
  });

  it('should use D1 API in production', async () => {
    process.env.NODE_ENV = 'production';
    
    const mockD1 = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue({ id: 1, name: 'test' })
        })
      })
    };
    
    const db = await import('../src/lib/db');
    const result = await db.dbOperation('findFirst', {
      model: 'user',
      where: { id: 1 },
      env: { DB: mockD1 as any }
    });
    
    expect(mockD1.prepare).toHaveBeenCalled();
  });
});
```

### 打包验证

```bash
# 检查生产打包产物中是否包含 PrismaClient
npx wrangler deploy --dry-run 2>&1 | grep -i prisma
# 预期：无输出（Prisma 不在生产构建中）

# 或检查产物大小
ls -la dist/worker.js
# 预期：不应包含 Prisma 相关代码
```

### DoD Checklist

- [ ] `db.ts` 中添加 `process.env.NODE_ENV === 'production'` 检测
- [ ] 生产环境返回 `null` 或使用 `env.DB.prepare()`
- [ ] 开发环境正常加载 PrismaClient
- [ ] jest 测试通过
- [ ] wrangler 部署日志中无 PrismaClient 加载记录
- [ ] 【可选】wrangler.toml 中配置 `ignored_inline_data` 排除 Prisma

### 风险缓解

| 风险 | 缓解 |
|------|------|
| Prisma 迁移遗漏导致生产环境崩溃 | 添加 `IS_PRODUCTION` 强制检测 |
| D1 API 与 Prisma 语义不一致 | 单元测试覆盖两种环境 |
