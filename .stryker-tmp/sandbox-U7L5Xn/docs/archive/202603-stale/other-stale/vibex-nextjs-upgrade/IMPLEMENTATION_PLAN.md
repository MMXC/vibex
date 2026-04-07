# IMPLEMENTATION_PLAN: vibex-nextjs-upgrade

> **项目**: vibex-nextjs-upgrade
> **版本**: 1.0
> **日期**: 2026-03-20
> **Architect**: Architect Agent

---

## 1. 项目背景

Next.js 16.1.6 → 16.2.0 紧急安全升级（P0: DoS + HTTP 请求走私），升级已由 Dev 完成，本次实施计划聚焦于验证闭环。

---

## 2. Phase 划分

本次为纯验证项目，仅一个 Phase。

### Phase 1: 升级验证闭环

**目标**: 确认 Next.js 16.2.0 已稳定运行，Sentry 监控正常

| 任务 | 负责 | 验收标准 | 依赖 |
|------|------|----------|------|
| `verify-build` | tester | `npm run build` Exit 0，35 页面全部构建 | - |
| `verify-types` | tester | `tsc --noEmit` 0 errors | verify-build |
| `verify-unit-tests` | tester | `npm test` 全部通过（≥1751 tests） | verify-build |
| `verify-sentry-prod` | tester | 手动验证生产环境 Sentry 收到测试错误报告 | verify-unit-tests |
| `verify-api-routes` | tester | 手动测试核心 API routes 响应正常 | verify-build |

---

## 3. 任务详情

### Task: `verify-build`

**描述**: 验证 Next.js 16.2.0 构建成功

**验收标准**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm run build
# 期望: Exit 0, 35/35 pages
```

**产出**: 构建日志截图

---

### Task: `verify-types`

**描述**: TypeScript 类型检查无错误

**验收标准**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npx tsc --noEmit
# 期望: Exit 0, 0 errors
```

**产出**: TypeScript 报告

---

### Task: `verify-unit-tests`

**描述**: 全量单元测试通过

**验收标准**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
npm test -- --ci
# 期望: ≥1751 tests, 0 failures
```

**产出**: 测试覆盖率报告

---

### Task: `verify-sentry-prod`

**描述**: 生产环境 Sentry 错误收集验证（手动）

**验收标准**:
1. 登录生产环境 VibeX
2. 触发一个已知的错误场景（如空模型预览）
3. 检查 Sentry Dashboard 是否在 5 分钟内收到错误报告
4. 验证错误堆栈包含正确的 source map 信息

**产出**: Sentry Dashboard 截图

---

### Task: `verify-api-routes`

**描述**: 核心 API Routes 功能验证（手动）

**验收标准**:
1. `/api/ddd/contexts` — 返回 200，响应结构正确
2. `/api/ddd/bounded-context` — 返回 200，响应结构正确
3. `/api/ddd/analysis` — 返回 200，响应结构正确

**产出**: API 测试截图/curl 日志

---

## 4. 风险与缓解

| 风险 | 级别 | 缓解措施 |
|------|------|----------|
| @sentry/nextjs 版本不兼容 | 中 | 监控 Sentry 运行时行为，如有问题立即升级 |
| Breaking change 未被发现 | 低 | 全量测试 + API routes 手动验证 |

---

## 5. 完成标准

所有 5 个验证任务通过 → 标记 `design-architecture` → `coord-decision` 完成 → 项目标记 completed

---

*Architect Agent | 2026-03-20*
