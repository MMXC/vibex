# Spec: E5 - 认证中间件规划

## E5.1 前置依赖

**⚠️ Architect P0-3（后端路由重组）是前置依赖**
- 当前 61 个路由，认证覆盖分散
- P0-3 重组后，按 Bounded Context 分类 → 认证中间件可精确插入

## E5.2 方案概述

### 路由重组后（前置完成）

```
routes/
  auth/         → AuthContext → 需要认证中间件
  projects/     → ProjectContext → 需要认证中间件
  chat/         → ChatContext → 需要认证中间件
  public/       → 公开路由 → 跳过认证
```

### 认证中间件设计

```typescript
// middleware/auth.ts
interface AuthOptions {
  required: boolean;      // 是否强制认证
  roles?: Role[];         // 允许的角色
  resourceOwner?: boolean; // 是否验证资源所有权
}

// 使用示例
export const authMiddleware = async (req, res, options: AuthOptions) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) {
    if (options.required) return res.status(401).json({ error: { code: 'AUTH_001', message: '未登录' } });
    return; // 可选认证
  }
  
  const user = await verifyToken(token);
  if (!user) return res.status(401).json({ error: { code: 'AUTH_002', message: 'Token 无效' } });
  
  if (options.roles && !options.roles.includes(user.role)) {
    return res.status(403).json({ error: { code: 'AUTH_003', message: '权限不足' } });
  }
  
  return { user };
};
```

## E5.3 认证白名单

```typescript
// public routes（无需认证）
const PUBLIC_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/health',
  '/api/v1/public/templates',
];

// 检查白名单
const isPublic = PUBLIC_ROUTES.some(route => req.url.startsWith(route));
if (isPublic) return next(); // 跳过认证
```

## E5.4 工时估算

| 任务 | 工时 | 说明 |
|------|------|------|
| 认证中间件实现 | 6h | 基础中间件 + token 验证 |
| 白名单配置 | 2h | 61 个路由分类 + 白名单 |
| 资源所有权验证 | 3h | 可选增强（资源所属用户验证）|
| 安全评审 | 1h | Security Reviewer 评审 |
| **合计** | **12h** | |

## E5.5 风险

| 风险 | 缓解措施 |
|------|---------|
| P0-3 路由重组延迟 → 认证中间件阻塞 | 与 Architect 确认 P0-3 时间线 |
| 性能影响 | 中间件加计时器，P99 > 10ms 需要优化 |
