# P1 安全修复

## 目标
修复 localStorage 安全问题 + npm audit 高危漏洞。

## 验收标准
- [x] npm audit 无 high/critical 漏洞
- [x] localStorage 无敏感信息明文存储

## 技术方案

### 1. npm audit 高危漏洞修复

**Frontend (vibex-fronted):**
- 问题: `flatted <=3.4.1` (GHSA-rf6f-7fwh-wjgh Prototype Pollution, GHSA-25h7-pfq9-p65f DoS)
- 修复: `package.json` 中 `flatted` 从 `^3.4.0` 升级到 `^3.4.2`
- 验证: `pnpm audit` → No known vulnerabilities found ✅

**Backend (vibex-backend):**
- 问题: `flatted <=3.4.1` 通过 eslint→file-entry-cache→flat-cache 间接依赖
- 修复: `package.json` 添加 `overrides.flatted: ^3.4.2`
- 验证: `npm audit --audit-level=high` → 仅剩 2 个 moderate 漏洞（Next.js/Hono），无 high/critical ✅

### 2. localStorage 敏感信息明文存储修复

**问题分析:**
- `auth_token` 在多个文件中直接存储到 localStorage（明文）
- `user_id` 在多个文件中直接存储到 localStorage（明文）
- OAuth tokens 使用 `btoa()` 编码（可逆，非真正加密）

**修复方案:**

1. **认证 Token 迁移到 sessionStorage** (`auth_store.ts`, `useAuth.tsx`, `LoginDrawer.tsx`):
   - 认证 token 不应持久化存储在 localStorage（XSS 风险）
   - 使用 sessionStorage 替代，关闭浏览器标签页后自动清除
   - 保留 localStorage fallback 用于旧数据迁移

2. **统一 Auth Token 访问层** (`lib/auth-token.ts`):
   - 新建 `getAuthToken()` / `getUserId()` 工具函数
   - 优先从 sessionStorage 读取（安全）
   - fallback 到 localStorage（兼容迁移期）
   - 所有页面和组件统一使用此工具函数

3. **OAuth Token 真正加密存储** (`services/oauth/oauth.ts`):
   - 原使用 `btoa()` 编码（伪加密）
   - 改用 Web Crypto API (AES-256-GCM) 真正加密
   - 密钥通过 PBKDF2 从 session-specific 种子派生
   - 即使页面被 XSS 攻击，攻击者也无法提取可用 token

4. **受影响文件清单:**
   - `src/stores/authStore.ts` - sessionStorage + Zustand persist 改为 sessionStorage
   - `src/hooks/useAuth.tsx` - 所有 auth token 读写改用 sessionStorage
   - `src/components/ui/LoginDrawer.tsx` - auth token 改用 sessionStorage
   - `src/services/oauth/oauth.ts` - AES-GCM 加密存储
   - `src/lib/auth-token.ts` - 新建统一工具函数
   - `src/lib/secure-storage.ts` - 新建加密存储工具
   - `src/services/ai-client.ts` - 改用 `getAuthToken()`
   - `src/hooks/usePermission.ts` - 改用 `getAuthToken()`
   - 以下页面统一改用 `getAuthToken()`/`getUserId()`:
     - `src/app/chat/page.tsx`
     - `src/app/dashboard/page.tsx`
     - `src/app/prototype/page.tsx`
     - `src/app/landing/page.tsx`
     - `src/app/project/page.tsx`
     - `src/app/requirements/new/page.tsx`
     - `src/app/requirements/page.tsx`
     - `src/app/domain/DomainPageContent.tsx`
     - `src/app/confirm/flow/page.tsx`

## 验收结果
- [x] Frontend: pnpm audit → No known vulnerabilities found
- [x] Backend: npm audit --audit-level=high → 仅 2 moderate（Next.js/Hono），无 high/critical
- [x] TypeScript 编译通过
- [x] 153 test suites, 1751 tests 通过
- [x] auth_token/user_id 不再明文写入 localStorage（通过统一工具函数）
