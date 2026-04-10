# Feature List — VibeX 认证重定向

**项目**: vibex
**基于**: Analyst 报告 (analysis.md)
**日期**: 2026-04-11
**Plan 类型**: feat
**Plan 深度**: Standard

---

## Feature List

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|----------|----------|
| F1.1 | httpClient 401 标记 | httpClient 401 响应时抛出 `AuthError` 标记，含 returnTo 信息，区分主动登出/被动过期 | AC-1, AC-6, R4 | 2h |
| F1.2 | Auth 事件广播 | 全局 window 事件 `auth:401` 携带 returnTo，触发页面跳转 | AC-1 | 1h |
| F1.3 | AuthContext/拦截器 | 全局监听 auth:401，保存 returnTo 到 sessionStorage，跳转 /auth | AC-1 | 2h |
| F2.1 | AuthForm returnTo 读取 | AuthForm 登录成功后从 sessionStorage 读取 returnTo，无则 fallback /dashboard | AC-2, AC-3, AC-8 | 1h |
| F2.2 | LoginDrawer returnTo | 第三方登录 drawer 同步支持 returnTo | AC-7 | 1h |
| F2.3 | Auth 页面守卫 | /auth 页面本身不触发 401 redirect（避免循环） | AC-4 | 30min |
| F3.1 | E2E 测试覆盖 | 覆盖 TC-004~TC-008（401 redirect、returnTo、OAuth、logout） | AC-1~8 | 3h |
| F4.1 | returnTo 白名单校验 | returnTo 必须以 `/` 开头且非外部域名，防止开放重定向 | AC-5, R3 | 1h |

**总工时**: ~11.5h

---

## Epic 划分

| Epic | 主题 | 包含 Story | 工时 |
|------|------|-----------|------|
| Epic 1 | 401 重定向核心机制 | F1.1, F1.2, F1.3 | 5h |
| Epic 2 | 登录成功跳转逻辑 | F2.1, F2.2, F2.3 | 2.5h |
| Epic 3 | 测试覆盖 | F3.1 | 3h |
| Epic 4 | 安全加固 | F4.1 | 1h |

---

## 依赖关系

```
Epic 1（核心）→ 先完成
Epic 2（跳转）→ 依赖 Epic 1 完成
Epic 3（测试）→ 依赖 Epic 1+2 完成
Epic 4（安全）→ 可与 Epic 2 并行
```

---

## 验收条件

- [ ] API 401 自动触发 redirect 到 /auth
- [ ] 登录成功后返回原页面（非硬编码 /dashboard）
- [ ] 登录页自身不触发 redirect 循环
- [ ] E2E 测试全通过
