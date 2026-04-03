# PRD: VibeX Phase 2 核心功能

**项目**: vibex-phase2-core-20260316
**版本**: 1.0
**日期**: 2026-03-16
**角色**: PM
**状态**: Draft

---

## 1. 执行摘要

### 背景

VibeX Phase 1 已完成基础设施优化（React Query、E2E测试、覆盖率提升至61.47%）。Phase 2 聚焦三个核心功能：
1. **数据库集成** - 从 Cloudflare D1 迁移到 Supabase PostgreSQL
2. **API Gateway** - 统一认证、限流、监控
3. **实时协作基础设施** - WebSocket、在线状态、协作锁

### 目标

| 目标 | 指标 |
|------|------|
| 数据库迁移 | 100% 数据完整性，0 丢失 |
| API Gateway | 认证覆盖率 100%，限流生效 |
| 实时协作 | WebSocket 可用性 ≥ 99% |

### 成功指标

| 指标 | 目标值 |
|------|--------|
| 数据迁移成功率 | ≥ 99.9% |
| API 响应延迟 P99 | < 500ms |
| WebSocket 连接稳定性 | ≥ 99% |
| 用户认证成功率 | ≥ 99% |

---

## 2. 功能需求

### F1: 数据库集成 (Supabase)

**描述**: 将现有 Cloudflare D1 数据迁移到 Supabase PostgreSQL

#### F1.1 数据迁移

- AC1.1: 实现 D1 到 Supabase 的数据映射（User/Project/Message/FlowData/Agent/Page/Collaboration）
- AC1.2: 支持双写阶段，新数据同时写入 D1 和 Supabase
- AC1.3: 迁移后数据校验，验证记录数一致

#### F1.2 实时数据同步

- AC1.4: Supabase Realtime 订阅功能正常
- AC1.5: 多客户端数据变更实时同步

#### F1.3 认证集成

- AC1.6: Supabase Auth 认证流程正常
- AC1.7: 保留 JWT 回退方案

---

### F2: API Gateway 设计

**描述**: 统一 API 网关，支持认证、限流、监控

#### F2.1 认证中间件

- AC2.1: 所有 API 请求经过 JWT 认证
- AC2.2: 无 Token 请求返回 401
- AC2.3: 用户身份注入到请求上下文

#### F2.2 限流器

- AC2.4: 认证接口限流 10次/分钟/IP
- AC2.5: AI 对话限流 20次/分钟/用户
- AC2.6: 普通 CRUD 限流 100次/分钟/用户

#### F2.3 日志与监控

- AC2.7: 请求/响应日志完整记录
- AC2.8: 统一错误响应格式

#### F2.4 版本管理

- AC2.9: 支持 /v1/* 和 /v2/* 路由前缀

---

### F3: 实时协作基础设施 Phase 1

**描述**: WebSocket 通信、在线状态、协作锁

#### F3.1 WebSocket 连接

- AC3.1: WebSocket 连接正常建立
- AC3.2: 心跳检测机制正常
- AC3.3: 断开自动重连

#### F3.2 在线状态

- AC3.4: 用户上线/下线状态正确同步
- AC3.5: 在线列表实时更新

#### F3.3 协作锁

- AC3.6: 资源锁定/释放功能正常
- AC3.7: 超时自动释放防止死锁
- AC3.8: 锁定冲突正确处理

---

## 3. Epic 拆分

### Epic 1: 数据库集成 (Supabase)

**负责人**: Dev | **优先级**: P0 | **预估**: 5 人日

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S1.1 | 创建 Supabase 项目和数据库 Schema | expect(db.tables).toContainAll(['users', 'projects', 'messages', 'flows']) |
| S1.2 | 实现数据迁移脚本 | expect(migratedCount).toEqual(originalCount) |
| S1.3 | 双写阶段实现 | expect(supabaseData).toEqual(d1Data) |
| S1.4 | Supabase Auth 集成 | expect(auth.login()).resolves.toBeTruthy() |
| S1.5 | 实时订阅功能验证 | expect(realtimeSubscription.status).toBe('subscribed') |

---

### Epic 2: API Gateway 设计

**负责人**: Dev | **优先级**: P0 | **预估**: 3 人日

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S2.1 | 认证中间件实现 | expect(requestWithoutToken).toReturn(401) |
| S2.2 | 限流器实现 (Token Bucket) | expect(rateLimitExceeded).toReturn(429) |
| S2.3 | 日志中间件实现 | expect(logEntry).toContain(['method', 'path', 'status']) |
| S2.4 | 统一错误处理 | expect(errorResponse).toMatchSchema(errorSchema) |
| S2.5 | API 版本路由 | expect(/v1\/api/).toRoute(v1Handler), expect(/v2\/api/).toRoute(v2Handler) |

---

### Epic 3: 实时协作基础设施

**负责人**: Dev | **优先级**: P1 | **预估**: 5 人日

**Stories**:

| ID | Story | 验收标准 |
|----|-------|----------|
| S3.1 | WebSocket 服务器搭建 | expect(wsConnection.status).toBe('open') |
| S3.2 | 心跳检测实现 | expect(heartbeatInterval).toBe(30000) |
| S3.3 | 自动重连机制 | expect(reconnectAfter(100)).resolves.toBeConnected() |
| S3.4 | 在线状态服务 | expect(presenceChange).toBroadcastToAllClients() |
| S3.5 | 协作锁服务 | expect(lockAcquire).toSucceed(), expect(lockConflict).toReturn(409) |
| S3.6 | 消息广播服务 | expect(messageSent).toReceiveOn(otherClient) |

---

## 4. UI/UX 流程

### 4.1 用户登录流程

```
用户打开应用
    ↓
Supabase Auth 登录页
    ↓
输入邮箱/密码 或 OAuth
    ↓
认证成功 → 获取 JWT Token
    ↓
Token 存入 Cookie/LocalStorage
    ↓
后续请求携带 Token
```

### 4.2 实时协作流程

```
用户 A 进入项目
    ↓
建立 WebSocket 连接
    ↓
发送上线状态
    ↓
用户 B 进入项目
    ↓
WebSocket 推送 A 的在线状态
    ↓
A 编辑内容 → 广播到 B
    ↓
B 屏幕实时更新
```

---

## 5. 非功能需求

| 类别 | 要求 |
|------|------|
| 性能 | API 响应延迟 P99 < 500ms |
| 可用性 | WebSocket 可用性 ≥ 99% |
| 安全 | 所有数据传输使用 TLS |
| 兼容性 | Chrome / Edge / Firefox 最新版 |
| 成本 | 监控 Supabase 用量，优化查询 |

---

## 6. 依赖项

| 依赖 | 说明 |
|------|------|
| Supabase | PostgreSQL + Auth + Realtime |
| Cloudflare Workers | API 运行时 |
| Cloudflare Durable Objects | WebSocket 有状态服务 |

---

## 7. 实施计划

| 阶段 | 任务 | 预估工时 |
|------|------|----------|
| Phase 1 | Supabase 项目创建 + Schema 设计 | 1 人日 |
| Phase 2 | 数据迁移脚本 + 双写 | 2 人日 |
| Phase 3 | Auth 集成 + 实时订阅 | 2 人日 |
| Phase 4 | API Gateway 中间件 | 2 人日 |
| Phase 5 | WebSocket 服务器 | 3 人日 |
| Phase 6 | 在线状态 + 协作锁 | 2 人日 |
| Phase 7 | 测试 + 部署 | 2 人日 |

**总计**: 14 人日

---

## 8. 验收 CheckList

### 数据库集成
- [ ] DB-001: 数据完整迁移
- [ ] DB-002: 用户登录正常
- [ ] DB-003: 项目 CRUD 正常
- [ ] DB-004: 消息历史完整
- [ ] DB-005: 实时订阅生效

### API Gateway
- [ ] GW-001: 认证中间件生效
- [ ] GW-002: 限流功能正常
- [ ] GW-003: 日志完整记录
- [ ] GW-004: 错误格式统一
- [ ] GW-005: 版本路由正常

### 实时协作
- [ ] RT-001: WebSocket 连接正常
- [ ] RT-002: 在线状态正确
- [ ] RT-003: 协作锁正常
- [ ] RT-004: 消息同步正常
- [ ] RT-005: 自动重连正常

---

## 9. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 数据迁移丢失 | 低 | 高 | 双写验证 + 校验和比对 |
| WebSocket 不稳定 | 中 | 高 | 心跳 + 自动重连 |
| 限流误杀 | 中 | 中 | 动态限流 + 白名单 |
| API Gateway 瓶颈 | 低 | 高 | Cloudflare Edge 分布式 |

---

**DoD (Definition of Done)**:
1. 所有 Epic 完成并通过测试
2. E2E 测试通过
3. 文档更新（架构图、API 文档）
4. 无阻断性 bug
5. 部署到生产环境
