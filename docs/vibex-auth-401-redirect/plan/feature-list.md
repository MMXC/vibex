# VibeX 401 自动重定向 — Feature List & Planning

**项目**: vibex-auth-401-redirect / create-prd
**来源**: analysis.md (analyze-requirements)
**日期**: 2026-04-13
**状态**: Planning 完成

---

## Feature List

| ID | 功能名 | 描述 | 根因关联 | 工时 |
|---|---|---|---|---|
| F1.1 | canvasApi.ts dispatch auth:401 | `handleResponseError` 401 分支 dispatch 事件 + location.href 跳转 | R5: canvasApi.ts 缺事件分发 | 1h |
| F1.2 | returnTo 白名单校验 | `returnTo` 必须以 `/` 开头，非外部域名 | R5: 开放重定向防护 | 0.5h |
| F2.1 | AuthProvider 挂载 | `layout.tsx` 挂载 `AuthProvider`，使 `auth:401` 监听器生效 | R1: AuthProvider 未挂载 | 0.5h |
| F3.1 | LeftDrawer catch 兜底 | catch 块中 401 手动跳转，监听 auth:401 兜底 | R2: 独立最后防线 | 0.5h |
| F4.1 | 其他 canvasApi.ts 调用点 | snapshot/restore 等调用点自动受益（通过 Layer 1 修复） | R2: 范围覆盖 | 0h（已被 F1.1 覆盖） |
| F5.1 | 现有 returnTo 登录跳转 | `auth/page.tsx` 登录成功后读 returnTo 跳转（已实现，验证即可） | 登录后返回原页 | 0.5h |
| F6.1 | E2E 测试覆盖 | 新增 auth-redirect 场景覆盖 AC-1~AC-7 | 测试覆盖 | 1.5h |

**总工时**: 4.5h

---

## Epic/Story 划分

### Epic 1: canvasApi.ts 401 事件分发修复
- S1.1: `handleResponseError` 401 分支修复（对应 F1.1）
- S1.2: returnTo 白名单校验（对应 F1.2）

### Epic 2: AuthProvider 挂载与全局监听
- S2.1: `layout.tsx` 挂载 AuthProvider（对应 F2.1）

### Epic 3: LeftDrawer 兜底 + 测试
- S3.1: LeftDrawer catch 兜底（对应 F3.1）
- S3.2: 现有 returnTo 逻辑验证（对应 F5.1）
- S3.3: E2E 测试覆盖（对应 F6.1）

---

## 关键设计决策

- **方案选择**: 方案 A — 三层联动防御
  - Layer 1: canvasApi.ts 修复事件分发
  - Layer 2: AuthProvider 挂载
  - Layer 3: LeftDrawer 兜底
- **推荐理由**: 三层防御，任一层失效均有兜底；彻底解决 canvasApi.ts 与 client.ts 的 401 处理不一致
- **关键发现**: `useAuth.tsx` 中的 `auth:401` 监听器是死代码（AuthProvider 未挂载）
- **关键发现**: `auth/page.tsx` 登录后硬编码 `router.push('/dashboard')`，需改为读 returnTo

---

*Planning 输入: analysis.md (analyze-requirements)*
*Planning 输出: docs/vibex-auth-401-redirect/plan/feature-list.md*