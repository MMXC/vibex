# AGENTS.md: VibeX Backend Fixes 2026-04-10

> **项目**: vibex-backend-fixes-20260410  
> **作者**: Architect  
> **日期**: 2026-04-10  
> **版本**: v1.0

---

## 1. 角色定义

| 角色 | 负责人 | 职责范围 |
|------|--------|----------|
| **Dev** | @dev | Auth 中间件 + XSS + Validation 实现 |
| **Reviewer** | @reviewer | 安全审查 + 代码审查 |
| **Tester** | @tester | 安全测试 + 集成测试 |
| **Architect** | @architect | 架构设计 + 风险评估 |

---

## 2. Dev Agent 职责

### 2.1 任务分配

| Task | 描述 | 工时 | 依赖 |
|------|------|------|------|
| T0.1 | Auth 中间件 | 3h | — |
| T0.2 | XSS 修复 | 3h | — |
| T1.1 | Zod Schema | 2h | T0.1 |
| T1.2 | Validation 中间件 | 2h | T1.1 |
| T1.3 | 全局错误处理 | 2h | T1.1 |

### 2.2 提交规范

```bash
# 格式: <type>(<scope>): <ticket> <description>
# 示例:
git commit -m "security(auth): T0.1 add withAuth middleware for API routes"
git commit -m "fix(xss): T0.2 sanitize MermaidRenderer with DOMPurify"
git commit -m "feat(validation): T1.1 add Zod schemas for canvas API"
git commit -m "middleware(validate): T1.2 add validateBody middleware"
```

### 2.3 禁止事项

| 禁止模式 | 正确替代 |
|---------|---------|
| `dangerouslySetInnerHTML={{ __html: raw }}` | `<SafeHTML html={raw} />` |
| `catch (error) {}` | `catch (error) { if (error instanceof AppError) throw error; }` |
| 无认证直接访问 request | 必须通过 `withAuth` 包装 |
| `JSON.parse(request.body)` 无校验 | 使用 `validateBody(schema)` 中间件 |

---

## 3. Reviewer Agent 职责

### 3.1 安全审查清单

**每个 PR 必须通过**:

```bash
# S-01: Auth 中间件覆盖检查
grep -rn "withAuth" vibex-backend/src/app/api/v1/ | wc -l
# 应 ≥ 14（所有受保护路由）

# S-02: 无 dangerouslySetInnerHTML 裸用
grep -rn "dangerouslySetInnerHTML" vibex-fronted/src/ | grep -v "SafeHTML"
# 应无输出

# S-03: JWT secret 不能硬编码
grep -rn "JWT_SECRET.*=.*'" vibex-backend/src/ | grep -v "process.env\|env."
# 应无输出

# S-04: 输入校验 Schema 存在
grep -rn "Schema" vibex-backend/src/lib/schemas/
# 应 >0 结果
```

### 3.2 驳回条件

1. PR 引入新的 `dangerouslySetInnerHTML` 裸用
2. API 路由缺少 `withAuth` 包装
3. 新增 `catch (error) {}` 无 instanceof
4. JWT secret 硬编码
5. 新增 `as any`

---

## 4. Tester Agent 职责

### 4.1 安全测试用例

```typescript
// tests/security/auth.test.ts

describe('Auth Security', () => {
  it('should reject request without Authorization header', async () => {
    for (const path of PROTECTED_PATHS) {
      const res = await fetch(path, { method: 'POST' });
      expect(res.status).toBe(401);
    }
  });

  it('should reject request with malformed Bearer token', async () => {
    const res = await fetch('/api/v1/chat', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid' },
    });
    expect(res.status).toBe(401);
  });

  it('should reject expired token', async () => {
    const expiredToken = await createExpiredToken();
    const res = await fetch('/api/v1/chat', {
      headers: { 'Authorization': `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
  });
});
```

### 4.2 XSS 测试用例

```typescript
// tests/security/xss.test.ts

describe('XSS Prevention', () => {
  const XSS_PAYLOADS = [
    '<img src=x onerror=alert(1)>',
    '<script>alert(1)</script>',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
  ];

  it('should sanitize XSS payloads in MermaidRenderer', async () => {
    for (const payload of XSS_PAYLOADS) {
      const res = await fetch('/api/v1/canvas/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ projectId: '1', prompt: payload }),
      });
      const html = await res.text();
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('onload');
      expect(html).not.toContain('<script>');
    }
  });
});
```

### 4.3 Validation 测试用例

```typescript
// tests/validation/input.test.ts

describe('Input Validation', () => {
  it('should reject empty projectId', async () => {
    const res = await fetch('/api/v1/canvas/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ projectId: '', prompt: 'test' }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject prompt exceeding max length', async () => {
    const longPrompt = 'a'.repeat(10001);
    const res = await fetch('/api/v1/canvas/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ projectId: '1', prompt: longPrompt }),
    });
    expect(res.status).toBe(400);
  });

  it('should reject unexpected fields (strict mode)', async () => {
    const res = await fetch('/api/v1/canvas/generate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ projectId: '1', prompt: 'test', unknownField: 'value' }),
    });
    expect(res.status).toBe(400);
  });
});
```

---

## 5. Definition of Done

### 5.1 Sprint DoD

- [ ] 所有 14+ 受保护 API 路由添加 `withAuth` 中间件
- [ ] 豁免路由（/health, /auth/*）无需 token 正常访问
- [ ] MermaidRenderer 使用 `<SafeHTML>` 无 `dangerouslySetInnerHTML` 裸用
- [ ] 所有 API 路由使用 Zod Schema 校验
- [ ] 所有 catch 块有 `instanceof AppError` 判断
- [ ] 安全测试全部通过

### 5.2 安全测试 DoD

| 测试 | 目标 |
|------|------|
| Auth bypass attempts | 0 成功 |
| XSS payloads sanitized | 100% |
| Invalid input validation | 100% 返回 400 |

---

## 6. 文件清单

| 文件 | 路径 | 负责人 |
|------|------|--------|
| errors.ts | `vibex-backend/src/lib/` | Dev |
| jwt.ts | `vibex-backend/src/lib/auth/` | Dev |
| auth.ts | `vibex-backend/src/lib/middleware/` | Dev |
| validate.ts | `vibex-backend/src/lib/middleware/` | Dev |
| schemas/*.ts | `vibex-backend/src/lib/schemas/` | Dev |
| SafeHTML.tsx | `vibex-fronted/src/components/` | Dev |

---

*文档版本: v1.0 | 最后更新: 2026-04-10*
