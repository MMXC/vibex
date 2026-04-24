# VibeX Sprint 7 Implementation Plan

> **项目**: vibex-proposals-20260424
> **日期**: 2026-04-24
> **状态**: Draft

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E1: 后端 TS 债务清理 | E1-U1 ~ E1-U4 | 3/4 | E1-U1 |
| E2: 实时协作可行性验证 | E2-U1 ~ E2-U4 | 3/4 | E2-U1 |
| E3: Teams API 前端集成 | E3-U1 ~ E3-U4 | 4/4 | E3-U1 |
| E4: Import/Export 完整集成 | E4-U1 ~ E4-U2 | 2/2 | E4-U1 |
| E5: 多文件组件导出 | E5-U1 ~ E5-U2 | 2/2 | E5-U1 |
| E6: 性能可观测性落地 | E6-U1 ~ E6-U2 | 2/2 | E6-U1 |

---

## E1: 后端 TypeScript 债务清理

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | 修复 auth 签名不匹配 | ✅ | — | `getAuthUserFromRequest(request)` 调用签名统一为 1 参数（header 注入 env） |
| E1-U2 | 修复 `lib/db.ts` 泛型约束 | ✅ | — | `tsc --noEmit` 中 `Function` 类型约束错误归零 |
| E1-U3 | 修复 Prisma/CloudflareEnv 类型 | ✅ | — | `PrismaClient` 单例模式正确，`CloudflareEnv` 绑定无泄漏 |
| E1-U4 | CI 门禁：tsc + as any 监控 | ⬜ | E1-U3 | CI pipeline 包含 `tsc --noEmit` + `as any` grep 检查 |

### E1-U1 详细说明

**文件变更**：
- `vibex-backend/src/app/api/agents/route.ts`
- `vibex-backend/src/app/api/ai-ui-generation/route.ts`
- `vibex-backend/src/app/api/pages/route.ts`
- `vibex-backend/src/app/api/prototype-snapshots/route.ts`
- `vibex-backend/src/app/api/v1/templates/route.ts`
- `vibex-backend/src/lib/authFromGateway.ts`

**实现步骤**：
1. 修改 `getAuthUserFromRequest` 为单参数签名（`request: NextRequest`），内部从 header 读取 `x-env-jwt-secret` 或使用默认环境变量
2. 批量更新 5 个 route 文件的 auth 调用，移除 `env` 参数
3. 统一 `AuthUser` 类型（无 `success` 字段，使用非空断言）

**风险**：影响所有调用方，需同步修改所有 173 个 TS 错误关联文件。

---

### E1-U2 详细说明

**文件变更**：`vibex-backend/src/lib/db.ts`

**实现步骤**：
1. 找到 `Function` 类型约束行（约第 257/260/313/348/350 行）
2. 替换为 `(...args: unknown[]) => unknown` 或泛型约束
3. 修复 `tx` 参数的隐式 `any` 类型

**风险**：无，风险低。

---

### E1-U3 详细说明

**文件变更**：
- `vibex-backend/src/index.ts`
- `vibex-backend/src/lib/prisma.ts`（如存在）

**实现步骤**：
1. `CloudflareEnv` 类型添加 index signature：`[key: string]: unknown`
2. 或使用 `as unknown as Record<string, unknown>` 类型断言

**风险**：无，风险低。

---

### E1-U4 详细说明

**文件变更**：
- `.github/workflows/ci.yml`（如存在）
- `vibex-backend/package.json`

**实现步骤**：
1. 在 CI pipeline 添加 `pnpm exec tsc --noEmit`
2. 添加 `as any` grep 脚本：`grep -r "as any" src/ --include="*.ts" | wc -l`，与基线对比

---

## E2: 实时协作可行性验证

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | Firebase SDK 接入 | ✅ | — | Firebase SDK 正确初始化，无 404 资源，bundle size < 200KB |
| E2-U2 | Presence UI 层实现 | ✅ | E2-U1 | 页面显示在线用户头像（hardcode 数据验证 UI） |
| E2-U3 | 断线清除逻辑 | ✅ | E2-U2 | 刷新/页面卸载后 presence 数据正确清除 |
| E2-U4 | Architect 可行性评审 | ⬜ | E2-U3 | 架构文档确认 Firebase + Cloudflare Workers 可行性结论 |

### E2-U1 详细说明

**文件变更**：
- `vibex-fronted/src/lib/firebase.ts`（新建）
- `.env.local`（添加 Firebase env vars）

**实现步骤**：
1. 安装 `firebase`（ Realtime Database SDK，非 Firestore）
2. 创建 `firebase.ts` 初始化模块
3. 验证 SDK 无 404 资源（Playwright network 断言）

**风险**：Firebase + Cloudflare Workers 运行时兼容性 —— 先用 MVP 验证。

---

### E2-U2 详细说明

**文件变更**：
- `vibex-fronted/src/hooks/usePresence.ts`（新建）
- `vibex-fronted/src/components/canvas/PresenceAvatars.tsx`（新建）

**实现步骤**：
1. 实现 `setPresence(userId, page)` 写入 Realtime DB
2. 实现 `getOnlineUsers(teamId)` 读取当前在线用户
3. 实现 `usePresence()` hook 返回在线用户列表
4. 创建 `PresenceAvatars` 组件显示头像（先用 hardcode 数据验证 UI）

---

### E2-U3 详细说明

**文件变更**：`vibex-fronted/src/hooks/usePresence.ts`

**实现步骤**：
1. `useEffect` 中添加 `beforeunload` 监听器，清除 presence
2. 页面卸载时调用 `clearPresence()`
3. Playwright E2E 验证刷新后 presence 数据清除

---

## E3: Teams API 前端集成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E3-U1 | 团队列表页面 | ✅ | — | `/dashboard/teams` 页面显示团队列表，数据与 API 一致 |
| E3-U2 | 创建团队 Dialog | ✅ | E3-U1 | 创建团队表单可用，提交后列表更新（乐观更新） |
| E3-U3 | 成员管理面板 | ✅ | E3-U2 | 邀请/角色变更/删除操作均有 API 调用和错误处理 |
| E3-U4 | 权限分层 UI | ✅ | E3-U3 | owner > admin > member 分层 UI 控制生效 |

### E3-U1 详细说明

**文件变更**：
- `vibex-fronted/src/app/dashboard/teams/page.tsx`（新建）
- `vibex-fronted/src/components/teams/TeamList.tsx`（新建）

**实现步骤**：
1. 创建 `/dashboard/teams` 页面（Next.js App Router）
2. 使用 TanStack Query 的 `useQuery(['teams'])` 获取数据
3. 渲染 `TeamList` 组件

---

### E3-U2 详细说明

**文件变更**：
- `vibex-fronted/src/components/teams/CreateTeamDialog.tsx`（新建）
- `vibex-fronted/src/app/dashboard/teams/page.tsx`（更新）

**实现步骤**：
1. 创建 `CreateTeamDialog`（表单验证：name 1-100 chars，description max 500）
2. 使用 TanStack Query `useMutation` + 乐观更新
3. `onMutate`: 先更新 query cache → `onError`: 回滚 → `onSettled`: 刷新

**Pattern**: `vibex-fronted/src/components/delivery/ComponentTab.tsx` 已有类似乐观更新实现。

---

### E3-U3 详细说明

**文件变更**：
- `vibex-fronted/src/components/teams/TeamMemberPanel.tsx`（新建）
- `vibex-fronted/src/components/teams/RoleBadge.tsx`（新建）

**实现步骤**：
1. GET `/v1/teams/:id/members` 列出成员
2. POST 邀请成员，PUT 变更角色，DELETE 移除成员
3. 所有错误使用 `canvasLogger`（非 `console.error`）
4. Playwright E2E + console 监控验证无 error

---

### E3-U4 详细说明

**文件变更**：各 Team 组件更新权限条件渲染

**实现步骤**：
1. 当前用户角色从 query 结果中获取（团队详情 API 返回 `role`）
2. UI 控制：非 owner 隐藏删除按钮，非 admin 隐藏角色变更
3. API 层面：后端已有权限检查（owner only 可删除，admin+ 可变更角色），前端做 UI 增强

---

## E4: Import/Export 完整集成

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E4-U1 | Round-trip E2E 测试 | 🔄 | — | JSON + YAML 导入 → 导出 → 比对，无数据丢失 |
| E4-U2 | 文件大小限制 UI | 🔄 | E4-U1 | 5MB 限制前端拦截，非等文件显示友好错误 |

### E4-U1 详细说明

**文件变更**：
- `vibex-fronted/tests/e2e/import-export-roundtrip.spec.ts`（新建）

**实现步骤**：
1. 编写 Playwright E2E 测试：导入 JSON → 导出 → 比对 content hash
2. 编写 Playwright E2E 测试：导入 YAML（含特殊字符）→ 导出 → 比对
3. 验证数据完整性（无字段丢失，无格式变形）

---

### E4-U2 详细说明

**文件变更**：
- `vibex-fronted/src/components/FileImport.tsx`（更新）

**实现步骤**：
1. 前端 `input[type=file]` 添加 `accept=".json,.yaml,.yml"`
2. 上传前检查 `file.size > 5 * 1024 * 1024` → 显示友好错误
3. 后端二次验证（如后端已有 5MB 限制则跳过）

---

## E5: 多文件组件导出

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | 后端 ZipArchiveService | 🔄 | — | 可生成 10+ 组件 ZIP 包，总体积 < 5MB |
| E5-U2 | 前端批量导出 UI | 🔄 | E5-U1 | `ExportMenu` 增加批量导出选项，ZIP 可解压并导入 |

### E5-U1 详细说明

**文件变更**：
- `vibex-backend/src/services/ZipArchiveService.ts`（新建）
- `vibex-backend/src/app/api/components/export-batch/route.ts`（新建）

**实现步骤**：
1. 创建 `ZipArchiveService` 使用 `jszip` 生成 .zip
2. ZIP 内容：每个组件一个 JSON 文件 + `manifest.json`
3. 实现 `/v1/components/export-batch` API
4. 服务端校验：总组件数 ≤ 100，总体积 < 5MB

---

### E5-U2 详细说明

**文件变更**：
- `vibex-fronted/src/components/canvas/ExportMenu.tsx`（更新）

**实现步骤**：
1. `ExportMenu` 添加"导出全部组件为 ZIP"选项
2. 调用 `/v1/components/export-batch` 获取 signed URL
3. 触发浏览器下载
4. Playwright E2E：下载 ZIP → 解压 → 验证 manifest + 各组件 JSON

---

## E6: 性能可观测性落地

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E6-U1 | /health P50/P95/P99 | 🔄 | — | `/health` 端点返回 latency P50/P95/P99 指标 |
| E6-U2 | useWebVitals hook | 🔄 | E6-U1 | LCP > 4s / CLS > 0.1 时 console 告警，无误报 |

### E6-U1 详细说明

**文件变更**：
- `vibex-backend/src/app/api/health/route.ts`（新建）

**实现步骤**：
1. 创建 `/health` 端点（Cloudflare Workers 环境）
2. 使用 Cloudflare Analytics API 获取延迟 P50/P95/P99（如不可用，使用滑动窗口手动计算）
3. 返回 `{ latency_p50, latency_p95, latency_p99, uptime }`

---

### E6-U2 详细说明

**文件变更**：
- `vibex-fronted/src/hooks/useWebVitals.ts`（新建）

**实现步骤**：
1. 使用 `web-vitals` 库（或原生 PerformanceObserver）
2. 收集 LCP、CLS、FID
3. 阈值：`LCP > 4000ms || CLS > 0.1` → `canvasLogger.warn()`
4. Playwright E2E 验证无误报（正常页面不触发告警）

---

## 测试策略

### 测试框架
- **单元测试**: Vitest（vibex-fronted）+ Jest（vibex-backend）
- **E2E 测试**: Playwright（跨浏览器）

### 覆盖率要求
- 新增代码覆盖率 > 80%
- 关键路径 100% 覆盖

### 核心测试用例

| Epic | 测试用例 |
|------|---------|
| E1 | `tsc --noEmit` exit code = 0 |
| E1 | `as any` 引入量不增加（CI grep 基线比对） |
| E2 | Firebase SDK 初始化成功（无 404） |
| E2 | 在线用户头像可见（Playwright 断言） |
| E2 | 刷新后 presence 清除（Playwright） |
| E3 | Teams 列表 UI 渲染（Playwright） |
| E3 | 创建团队 + 乐观更新（Playwright） |
| E3 | 无 console.error（Playwright console 监控） |
| E4 | JSON round-trip（Playwright E2E） |
| E4 | YAML round-trip + 特殊字符（Playwright E2E） |
| E4 | 5MB 限制拦截（Playwright） |
| E5 | 10+ 组件 ZIP 生成（Playwright） |
| E5 | ZIP 可解压并导入（Playwright） |
| E6 | `/health` 返回 P50/P95/P99（curl + jq） |
| E6 | Web Vitals 无误报（Playwright） |

## 测试策略

### 测试框架
- **单元测试**: Vitest（vibex-fronted）+ Jest（vibex-backend）
- **E2E 测试**: Playwright（跨浏览器）

### 覆盖率要求
- 新增代码覆盖率 > 80%
- 关键路径 100% 覆盖

### 核心测试用例

| Epic | 测试用例 | 类型 |
|------|---------|------|
| E1 | `tsc --noEmit` exit code = 0 | CI |
| E1 | `as any` 引入量不增加（CI grep 基线比对） | CI |
| E2 | Firebase SDK 初始化成功（无 404） | Playwright E2E |
| E2 | 在线用户头像可见（Playwright 断言） | Playwright E2E |
| E2 | 刷新后 presence 清除（Playwright） | Playwright E2E |
| E2 | usePresence hook 边界条件 | Vitest 单元（⬜待补充） |
| E3 | Teams 列表 UI 渲染（Playwright） | Playwright E2E |
| E3 | 创建团队 + 乐观更新（Playwright） | Playwright E2E |
| E3 | 无 console.error（Playwright console 监控） | Playwright E2E |
| E3 | TeamMemberPanel 权限分支逻辑 | Vitest 单元（⬜待补充） |
| E4 | JSON round-trip（Playwright E2E） | Playwright E2E |
| E4 | YAML round-trip + 特殊字符（Playwright E2E） | Playwright E2E |
| E4 | 5MB 限制拦截（Playwright） | Playwright E2E |
| E5 | 10+ 组件 ZIP 生成（Playwright） | Playwright E2E |
| E5 | ZIP 可解压并导入（Playwright） | Playwright E2E |
| E5 | ZipArchiveService 边界条件（空数组/边界大小） | Vitest 单元（⬜待补充） |
| E6 | `/health` 返回 P50/P95/P99（curl + jq） | Playwright E2E |
| E6 | Web Vitals 无误报（Playwright） | Playwright E2E |

### 技术审查发现

| # | 问题 | 建议 | 状态 |
|---|------|------|------|
| R-1 | E2 依赖 E1 关系不正确 | E2 独立实施，不依赖 E1 | ✅ 已修复 |
| R-2 | E5 generateNodeStream() 不兼容 Workers | 改用 generateAsync('blob') | ✅ 已修复 |
| R-3 | 缺少 E2/E3/E5 单元测试 | 实现阶段补充 | ⬜ 待修复 |
| R-4 | E3 Teams 列表无分页 | 默认 page size = 20 | ✅ 已修复 |
| R-5 | E6 延迟计算实现模糊 | 添加滑动窗口 + MAX_SAMPLES | ✅ 已修复 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260424
- **执行日期**: 2026-04-24
- **架构审查**: ✅ 已通过技术审查，5 处问题全部修复