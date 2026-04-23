# AGENTS.md — VibeX Sprint 7 开发约束

> **项目**: vibex-proposals-20260424
> **日期**: 2026-04-24
> **适用范围**: E1 ~ E6 所有开发 Agent

---

## 开发规范速查

### 必读文档

| 文档 | 位置 | 说明 |
|------|------|------|
| CLAUDE.md | `CLAUDE.md` | 技术栈、命令、设计规范 |
| DESIGN.md | `DESIGN.md` | 设计系统（颜色/字体/间距/动效） |
| architecture.md | `docs/vibex-proposals-20260424/architecture.md` | 本 Sprint 技术架构 |
| IMPLEMENTATION_PLAN.md | `docs/vibex-proposals-20260424/IMPLEMENTATION_PLAN.md` | Unit 派发队列 |

### 技术栈（来自 CLAUDE.md）

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端 | Next.js 16.2.0 + React 19 | App Router |
| 状态 | Zustand 4.5.7 | skipHydration 方案 |
| API 客户端 | TanStack Query 5.90.21 | 缓存 + 乐观更新 |
| 后端 | Cloudflare Workers + Hono 4.12.5 | 边缘部署 |
| 数据库 | Cloudflare D1 + Prisma 5.22 | SQLite at edge |
| 实时 | Firebase Realtime DB SDK | Presence MVP |
| 测试 | Playwright 1.59 + Vitest 4.1.2 | E2E + 单元 |

---

## Sprint 7 专项约束

### E1: TS 债务清理红线

- **禁止**在 E1 工作范围内引入 `as any`（除 Zustand store accessor，需加注释 `// safe: Zustand store accessor`）
- **禁止**绕过 `tsc --noEmit` 检查（`ignoreBuildErrors` 配置不应用于新代码）
- 修改 auth 调用前，**必须**更新 `lib/authFromGateway.ts` 签名，然后批量更新所有调用方
- 每个文件修复后，**必须**运行 `pnpm exec tsc --noEmit` 验证

### E2: Firebase MVP 约束

- **仅使用** Firebase Realtime Database（`firebase/database`），不引入 Firestore
- **禁止** WebSocket 同步（属于 Epic 2b，延期）
- presence 数据存储路径：`/presence/{teamId}/{userId}`
- TTL：60s 无心跳自动过期
- Firebase config 从 `NEXT_PUBLIC_FIREBASE_*` 环境变量读取（**不硬编码**）

### E3: Teams 前端约束

- 所有 API 错误使用 `canvasLogger.error()`（**禁止** `console.error`）
- 组件路径：`src/components/teams/TeamList.tsx`、`TeamMemberPanel.tsx`、`CreateTeamDialog.tsx`、`RoleBadge.tsx`
- 页面路径：`src/app/dashboard/teams/page.tsx`
- TanStack Query 悲观更新模式：`onMutate` → `onError` 回滚 → `onSettled` 刷新
- 权限分层：owner > admin > member，UI 层防御性检查（后端已有检查，前端增强）

### E4: Import/Export 约束

- 前端上传前检查 `file.size > 5 * 1024 * 1024`（5MB），超限显示友好错误
- YAML 特殊字符转义（特别是 `:`、`#`、`|` 在块标量中）
- Playwright E2E round-trip 测试：导入 → 导出 → content hash 比对

### E5: 批量导出约束

- ZIP 生成使用 `jszip`（已有依赖）
- ZIP 内容：每个组件一个 JSON 文件 + `manifest.json`
- 服务端校验：总组件数 ≤ 100，总体积 < 5MB
- signed URL 有效期 5 分钟

### E6: 性能可观测性约束

- `/health` 端点 P50/P95/P99 使用 Cloudflare Analytics 数据（如不可用则手动计算滑动窗口）
- Web Vitals 阈值：`LCP > 4000ms || CLS > 0.1`（非激进标准）
- metrics 数据保留 5 分钟 TTL

---

## 测试策略

### E2E 测试文件规范

| Epic | 测试文件 | 说明 |
|------|---------|------|
| E2 | `vibex-fronted/tests/e2e/presence-mvp.spec.ts` | Firebase SDK 初始化、头像显示、断线清除 |
| E3 | `vibex-fronted/tests/e2e/teams-ui.spec.ts` | 列表/创建/成员管理/权限分层 |
| E4 | `vibex-fronted/tests/e2e/import-export-roundtrip.spec.ts` | JSON + YAML round-trip |
| E5 | `vibex-fronted/tests/e2e/batch-export.spec.ts` | ZIP 生成 + 解压验证 |
| E6 | `vibex-backend/tests/health-api.spec.ts` | /health P50/P95/P99 |

### CI 门禁（E1 相关）

```bash
# 类型检查
pnpm --filter vibex-backend exec tsc --noEmit

# as any 监控
grep -r "as any" vibex-backend/src/ --include="*.ts" | wc -l  # 与基线对比
```

---

## 常用命令

```bash
# 后端类型检查
cd vibex-backend && pnpm exec tsc --noEmit

# 前端开发
cd vibex-fronted && pnpm dev

# 前端构建
cd vibex-fronted && pnpm build

# 前端 E2E
cd vibex-fronted && pnpm test:e2e

# 前端单元测试
cd vibex-fronted && pnpm test:unit

# 类型检查 + Lint
cd vibex-fronted && pnpm run lint
```

---

## 上线地址

- **前端**: https://vibex-app.pages.dev
- **API**: https://api.vibex.top

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260424
- **执行日期**: 2026-04-24