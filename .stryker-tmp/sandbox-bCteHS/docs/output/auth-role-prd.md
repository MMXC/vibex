# PRD: 用户角色权限检查

**项目**: VibeX Auth Role Check
**版本**: 1.0
**日期**: 2026-03-04
**作者**: Analyst Agent

---

## 1. 概述

### 1.1 项目背景

VibeX 当前认证体系仅验证用户身份，未实现角色权限控制。所有已登录用户对项目有相同的访问权限，存在安全隐患。

### 1.2 项目目标

- 实现 RBAC (Role-Based Access Control) 模型
- 在 JWT Token 中包含角色信息
- 提供权限检查中间件

---

## 2. 现状分析

### 2.1 当前认证架构

**文件**: `vibex-backend/src/lib/auth.ts`

```typescript
// JWT Payload - 仅包含用户身份
export interface JWTPayload {
  userId: string;
  email: string;
  // ❌ 缺少 role 字段
}

// requireRole 函数 - 未实现
export function requireRole(requiredRole: 'admin'): (c: AuthContext, next: Next) => Promise<Response | void> {
  return async (c: AuthContext, next: Next): Promise<Response | void> => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }

    // TODO: Add role field to JWTPayload and check user role
    // For now, this is a placeholder for future RBAC implementation
    
    await next();  // ❌ 未实现权限检查
  };
}
```

### 2.2 数据库现状

**User 表** (`migrations/0001_initial.sql`):
```sql
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password TEXT NOT NULL,
  avatar TEXT,
  createdAt TEXT DEFAULT (datetime('now')),
  updatedAt TEXT DEFAULT (datetime('now'))
  -- ❌ 缺少 role 字段
);
```

### 2.3 协作者角色系统

**已存在的角色定义** (`routes/collaboration.ts`):
```typescript
type CollaboratorRole = 'owner' | 'admin' | 'editor' | 'viewer';

const ROLE_PERMISSIONS: Record<CollaboratorRole, string[]> = {
  owner: ['read', 'write', 'delete', 'manage', 'invite'],
  admin: ['read', 'write', 'delete', 'manage', 'invite'],
  editor: ['read', 'write', 'invite'],
  viewer: ['read'],
};
```

**⚠️ 问题**: 协作者角色仅针对单个项目，不是全局用户角色。

---

## 3. 功能需求

### 3.1 全局用户角色

设计两级角色体系：

| 角色级别 | 作用域 | 示例 |
|---------|--------|------|
| **全局角色** | 整个系统 | `super_admin`, `user`, `guest` |
| **项目角色** | 单个项目 | `owner`, `admin`, `editor`, `viewer` |

**全局角色定义**:
```typescript
type GlobalRole = 'super_admin' | 'user' | 'guest';

const GLOBAL_ROLE_PERMISSIONS = {
  super_admin: ['manage_all_projects', 'manage_users', 'system_settings'],
  user: ['create_project', 'manage_own_projects'],
  guest: ['view_public_projects'],
};
```

### 3.2 JWT Token 扩展

```typescript
// 修改 JWTPayload
export interface JWTPayload {
  userId: string;
  email: string;
  role: GlobalRole;        // ✅ 新增
  permissions: string[];   // ✅ 新增（可选）
}
```

### 3.3 数据库修改

```sql
-- 添加 role 字段到 User 表
ALTER TABLE User ADD COLUMN role TEXT DEFAULT 'user';

-- 创建角色迁移
-- migration: 0006_user_role.sql
```

### 3.4 权限检查中间件

```typescript
// 全局角色检查
export function requireGlobalRole(requiredRole: GlobalRole): Middleware {
  return async (c, next) => {
    const user = c.get('user');
    if (!user || !hasRole(user.role, requiredRole)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}

// 项目角色检查
export function requireProjectRole(
  projectId: string,
  requiredPermission: string
): Middleware {
  return async (c, next) => {
    const user = c.get('user');
    const userRole = await getProjectRole(user.userId, projectId);
    
    if (!hasPermission(userRole, requiredPermission)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  };
}
```

---

## 4. 技术方案

### 4.1 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      Authentication                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Login     │  │  Register   │  │   Token Refresh     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Authorization                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Global Role Check                    │    │
│  │  super_admin | user | guest                          │    │
│  └─────────────────────────────────────────────────────┘    │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                 Project Role Check                   │    │
│  │  owner | admin | editor | viewer                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `migrations/0006_user_role.sql` | 新增：添加 role 字段迁移 |
| `lib/auth.ts` | 修改：扩展 JWTPayload，实现 requireRole |
| `routes/auth/register.ts` | 修改：注册时设置默认角色 |
| `routes/auth/login.ts` | 修改：登录时返回角色信息 |
| `routes/users.ts` | 新增：管理员用户管理 API |

### 4.3 API 设计

#### 获取当前用户角色
```http
GET /api/auth/me
Authorization: Bearer {token}

Response:
{
  "user": {
    "id": "user-1",
    "email": "user@example.com",
    "name": "张三",
    "role": "user"
  }
}
```

#### 更新用户角色（管理员）
```http
PATCH /api/admin/users/{userId}/role
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "super_admin"
}
```

---

## 5. 实现计划

### Phase 1: 数据库迁移 (P0)

| 任务 | 说明 | 预估 |
|------|------|------|
| 1.1 | 创建 migration 文件 | 0.5h |
| 1.2 | 执行数据库迁移 | 0.5h |
| 1.3 | 验证迁移结果 | 0.5h |

### Phase 2: 认证模块修改 (P0)

| 任务 | 说明 | 预估 |
|------|------|------|
| 2.1 | 扩展 JWTPayload 类型 | 0.5h |
| 2.2 | 修改 generateToken 函数 | 0.5h |
| 2.3 | 修改 login/register 接口 | 1h |
| 2.4 | 实现 requireRole 中间件 | 1h |

### Phase 3: 项目权限集成 (P1)

| 任务 | 说明 | 预估 |
|------|------|------|
| 3.1 | 实现 requireProjectRole 中间件 | 1h |
| 3.2 | 为项目相关 API 添加权限检查 | 2h |
| 3.3 | 权限测试 | 1h |

---

## 6. 验收标准

### 功能验收

- [ ] User 表新增 role 字段
- [ ] JWT Token 包含角色信息
- [ ] requireRole 中间件正确拒绝无权限请求
- [ ] 登录返回角色信息
- [ ] 项目 API 受角色保护

### 安全验收

- [ ] 无角色用户无法访问管理接口
- [ ] Token 篡改被正确检测
- [ ] 权限检查无法被绕过

---

## 7. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 现有 Token 失效 | 用户需重新登录 | 提供过渡期，兼容旧 Token |
| 权限配置错误 | 功能不可用 | 提供默认权限配置 |
| 性能影响 | 权限检查延迟 | 使用缓存优化 |

---

## 8. 参考资料

- 现有认证: `vibex-backend/src/lib/auth.ts`
- 协作者角色: `vibex-backend/src/routes/collaboration.ts`
- 数据库迁移: `vibex-backend/migrations/`

---

*文档版本: 1.0*
*创建时间: 2026-03-04 01:20*
*作者: Analyst Agent*