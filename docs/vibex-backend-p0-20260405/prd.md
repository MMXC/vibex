# PRD: VibeX 后端 OPTIONS 请求修复

> **项目**: vibex-backend-p0-20260405  
> **目标**: 修复 OPTIONS 预检请求返回 HTTP 500 的问题  
> **分析者**: analyst agent  
> **PRD 作者**: pm agent  
> **日期**: 2026-04-05  
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
VibeX API 的所有 OPTIONS 预检请求返回 HTTP 500（Cloudflare 1101），导致浏览器跨域 POST/PUT/DELETE 请求被拦截，前端功能无法正常使用。

### 目标
- P0: 修复 OPTIONS 预检被 authMiddleware 拦截（调整注册顺序）
- P1: 全局 CORS middleware 显式处理 OPTIONS
- P1: NODE_ENV 检测修复（防止生产环境导入 Node.js 模块）
- P1: JWT_SECRET 缺失时明确错误提示

### 成功指标
- AC1: `OPTIONS /api/v1/projects` 返回 204
- AC2: OPTIONS 响应包含 `Access-Control-Allow-*` headers
- AC3: OPTIONS 无认证时返回 204（非 401）
- AC4: POST 跨域请求能通过预检

---

## 2. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 关联问题 |
|------|------|--------|------|----------|
| E1 | OPTIONS 预检拦截修复 | P0 | 0.5h | protected_.options 被 authMiddleware 拦截 |
| E2 | 全局 CORS + 环境修复 | P1 | 1h | NODE_ENV 未定义 + JWT_SECRET 错误处理 |
| **合计** | | | **1.5h** | |

---

### Epic 1: OPTIONS 预检拦截修复

**问题根因**: `protected_.options` 在 `authMiddleware` 之后注册到 `protected_`，导致 OPTIONS 请求先被 401 拦截。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | 调整 OPTIONS handler 注册顺序 | 0.5h | 见下方 AC |

**S1.1 验收标准**:
- `expect(OPTIONSResponse.status).toBe(204)` ✓
- `expect(OPTIONSResponse.headers.get('Access-Control-Allow-Origin')).toBe('*')` ✓
- 无 Authorization header 时 OPTIONS 返回 204（非 401）
- `protected_.options('/*', ...)` 在 `protected_.use('*', authMiddleware)` 之前注册

**DoD**:
- [ ] `src/routes/v1/gateway.ts` 中 `protected_.options` 移到 `authMiddleware` 之前
- [ ] `protected_.options` 设置 `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`
- [ ] curl 验证: `curl -X OPTIONS -I https://api.vibex.top/v1/projects` 返回 204
- [ ] curl 验证: 响应含 CORS headers

---

### Epic 2: 全局 CORS + 环境修复

**问题根因**: `index.ts` 中全局 CORS 中间件可能未正确处理所有路径的 OPTIONS；`NODE_ENV` 在生产环境为 undefined 导致 Node.js 模块误导入；JWT_SECRET 缺失时返回 500 而非明确错误。

**Story 清单**:

| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | 全局 CORS 显式处理 OPTIONS | 0.3h | 见下方 AC |
| S2.2 | NODE_ENV 修复 | 0.3h | 见下方 AC |
| S2.3 | JWT_SECRET 缺失处理 | 0.4h | 见下方 AC |

**S2.1 验收标准**:
- `expect(app.request('/any-path').method).toBe('OPTIONS')` → 响应 204 ✓
- `app.options('/*', handler)` 在 `app.use('*', cors())` 之后注册
- 所有路径的 OPTIONS 请求都返回 204

**S2.2 验收标准**:
- `expect(process.env.NODE_ENV).not.toBe('production')` 时才导入 `@hono/node-server` ✓
- `typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'` 检测
- wrangler 部署日志中无 `@hono/node-server` 导入记录

**S2.3 验收标准**:
- JWT_SECRET 缺失时返回 `{ error: 'Missing JWT_SECRET', code: 'CONFIG_ERROR' }` 非 500
- 启动时验证必需 secrets
- `expect(status).toBe(500)` 时消息明确指出配置缺失

**DoD**:
- [ ] `src/index.ts` 添加 `app.options('/*', (c) => c.text('', 204))`
- [ ] NODE_ENV 检测改为 `process.env?.NODE_ENV !== 'production'`
- [ ] JWT_SECRET 验证失败时返回明确错误消息
- [ ] jest 测试覆盖所有场景

---

## 3. 功能点汇总

| ID | 功能点 | 描述 | Epic | 验收标准 | 页面集成 |
|----|--------|------|------|----------|----------|
| F1.1 | OPTIONS handler 顺序调整 | protected_.options 在 authMiddleware 之前注册 | E1 | expect(status).toBe(204) | 无 |
| F2.1 | 全局 CORS OPTIONS 处理 | app.options('/*') 显式处理所有路径 | E2 | expect(status).toBe(204) for all paths | 无 |
| F2.2 | NODE_ENV 修复 | 安全检测防止 Node.js 模块误导入 | E2 | expect(productionBuild).not.toContain('@hono/node-server') | 无 |
| F2.3 | JWT_SECRET 错误处理 | 缺失时返回 CONFIG_ERROR 而非 500 | E2 | expect(error.code).toBe('CONFIG_ERROR') | 无 |

---

## 4. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | 发送 OPTIONS 请求 | `curl -X OPTIONS /api/v1/projects` | 返回 204 |
| AC2 | OPTIONS 响应 | 检查 headers | `Access-Control-Allow-Origin: *` |
| AC3 | OPTIONS 无认证 | 无 Authorization header | 返回 204（非 401） |
| AC4 | POST 跨域预检 | 浏览器发送 OPTIONS | 预检通过，POST 正常 |
| AC5 | 生产构建 | 检查打包产物 | 不含 `@hono/node-server` |
| AC6 | JWT_SECRET 缺失 | 启动 API | 返回明确配置错误（非 500） |

---

## 5. DoD (Definition of Done)

### Epic 1: OPTIONS 预检拦截修复
- [ ] `src/routes/v1/gateway.ts` 中 `protected_.options` 在 `authMiddleware` 之前注册
- [ ] CORS headers 在 OPTIONS 响应中设置
- [ ] `curl -X OPTIONS -I /v1/projects` 返回 204
- [ ] `curl -v` 验证无 401 返回

### Epic 2: 全局 CORS + 环境修复
- [ ] `src/index.ts` 添加 `app.options('/*', (c) => c.text('', 204))`
- [ ] `process.env?.NODE_ENV !== 'production'` 检测
- [ ] JWT_SECRET 验证失败返回 `CONFIG_ERROR`
- [ ] jest 测试全部通过

---

## 6. 实施计划

### Sprint 1 (1.5h)

| 阶段 | 内容 | 工时 | 产出 |
|------|------|------|------|
| Phase 1 | E1: OPTIONS handler 顺序调整 | 0.5h | gateway.ts 修复 |
| Phase 2 | E2.1: 全局 CORS OPTIONS 处理 | 0.3h | index.ts 添加 options 路由 |
| Phase 3 | E2.2: NODE_ENV + JWT_SECRET 修复 | 0.7h | index.ts 增强 |

### 依赖关系
- E2 依赖 E1（可选），可并行

---

## 7. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | 修改不引入额外延迟 |
| 兼容性 | 不破坏现有 GET/POST/PUT/DELETE 逻辑 |
| 安全性 | CORS headers 仅在 OPTIONS 时设置 |

---

## 8. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| 修改顺序破坏其他中间件 | 仅调整 `protected_.options` 位置，其他不变 |
| CORS headers 重复设置 | 检查现有 cors() 中间件，避免重复 |

---

*文档版本: v1.0 | 最后更新: 2026-04-05*
