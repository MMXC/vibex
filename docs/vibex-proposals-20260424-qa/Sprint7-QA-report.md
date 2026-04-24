# Sprint 7 QA 分析报告

> **项目**: vibex-proposals-20260424-qa
> **Analyst**: analyst
> **日期**: 2026-04-24
> **状态**: 🔴 有条件通过（3 个严重问题需修复）

---

## 执行摘要

Sprint 7 六个 Epic 源码文件基本存在，CHANGELOG 与 IMPLEMENTATION_PLAN 状态一致。但发现 **3 个严重问题（🔴 BLOCKER）** 和若干中等/轻微问题：

| 级别 | 数量 | 说明 |
|------|------|------|
| 🔴 BLOCKER | 3 | E2 Firebase 未接入、E5 后端无真实 DB、E1 残留大量 TS 错误 |
| 🟠 中 | 4 | U4 未完成、E4/E5 测试为占位桩、E6 后端单元测试缺失 |
| 🟡 轻微 | 5 | 文件路径偏差、tsc --noEmit 基线未建立 |

---

## 1. CHANGELOG vs IMPLEMENTATION_PLAN 一致性检查

**结论**: ✅ 一致

| Epic | IMPLEMENTATION_PLAN | CHANGELOG [Unreleased] | 一致 |
|------|---------------------|----------------------|------|
| E1-U1-U3 | ✅ 3/4 done | ✅ 3 entries | ✅ |
| E1-U4 | ⬜ 未开始 | ⬜ 无 | ✅ |
| E2-U1-U3 | ✅ 3/4 done | ✅ 3 entries | ✅ |
| E2-U4 | ⬜ Architect review | ⬜ 无 | ✅ |
| E3-U1-U4 | ✅ 4/4 done | ✅ 4 entries | ✅ |
| E4-U1-U2 | 🔄 2/2 in-progress | ✅ 2 entries | ✅ |
| E5-U1-U2 | 🔄 2/2 in-progress | ✅ 2 entries | ✅ |
| E6-U1-U2 | 🔄 2/2 in-progress | ✅ 2 entries | ✅ |

---

## 2. 源码文件存在性检查

### 2.1 E1: TS 债务清理

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `lib/authFromGateway.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `app/api/agents/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `app/api/ai-ui-generation/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `app/api/pages/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `app/api/prototype-snapshots/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `app/api/v1/templates/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `lib/db.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `.github/workflows/ci.yml` | E1-U4 依赖 | ❌ 不存在 | 🔴 |

**E1 签名验证**:
```typescript
// authFromGateway.ts — ✅ 重载签名正确
export function getAuthUserFromRequest(request: NextRequest): AuthResult;
export function getAuthUserFromRequest(request: NextRequest, jwtSecret: string): AuthUser | null;

// routes — ✅ 调用方使用 { success, user } 解构（AuthResult 路径）
const { success, user } = getAuthUserFromRequest(request);
```

**TS 错误现状**:
- E1 相关文件（authFromGateway + 34 个 route）: ✅ 0 错误
- **全局残留**: 143 个 TS 错误（websocket、flow-execution、openapi、notifier 等，非 E1-E6 范围）
- `as any` 使用量: 59 处（无基线比对）

### 2.2 E2: Firebase Presence MVP

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `src/lib/firebase.ts` | ✅ 指定 | ❌ 不存在（见下） | 🟠 |
| `src/lib/firebase/presence.ts` | 替代路径 | ✅ 存在 | ✅ |
| `src/hooks/usePresence.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/components/canvas/PresenceAvatars.tsx` | ✅ 指定 | ❌ 不存在（见下） | 🟠 |
| `src/components/canvas/Presence/PresenceAvatars.tsx` | 替代路径 | ✅ 存在 | ✅ |
| `tests/e2e/presence-mvp.spec.ts` | ✅ 指定 | ✅ 存在 | ✅ |

**🔴 BLOCKER — E2 Firebase 未接入**:

```typescript
// src/lib/firebase/presence.ts
if (isFirebaseConfigured()) {
  // TODO: 真实 Firebase 实现
  // const presenceRef = ref(database, `presence/${canvasId}/${userId}`);
  // await set(presenceRef, presenceUser);
  canvasLogger.default.debug('[Firebase Presence] setPresence (mock):', presenceUser);
} else {
  // Mock 模式 — 内存存储，tab 间不共享
  mockPresenceDb[canvasId][userId] = presenceUser;
}
```

**实际状态**:
- Firebase SDK **未安装**（`package.json` 无 `firebase` 依赖）
- 代码使用 **mock 内存存储**（注释: "后端真实接入时替换为"）
- AGENTS.md R-1 技术审查结论"Firebase SDK 是纯前端"与实际不符 — SDK 本身根本未装
- E2E 测试 `presence-mvp.spec.ts` 只测 mock 行为，不测 Firebase

### 2.3 E3: Teams 前端

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `src/app/dashboard/teams/page.tsx` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/components/teams/TeamList.tsx` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/components/teams/TeamMemberPanel.tsx` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/components/teams/CreateTeamDialog.tsx` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/components/teams/RoleBadge.tsx` | ✅ 指定 | ✅ 存在 | ✅ |
| `tests/e2e/teams-ui.spec.ts` | ✅ 指定 | ✅ 存在 | ✅ |

**约束合规检查**:
- ✅ 使用 `canvasLogger.error()`（非 `console.error`）
- ✅ TanStack Query 乐观更新（`onMutate` → `onError` → `onSettled`）
- ✅ 权限分层 UI（owner > admin > member 颜色区分）

### 2.4 E4: Import/Export

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `tests/e2e/import-export-roundtrip.spec.ts` | ✅ 指定 | ✅ 存在（92 行） | 🟠 |
| `src/components/FileImport.tsx` | ✅ 指定 | ❌ 不存在（见下） | 🟠 |
| `src/components/import-export/FileImport.tsx` | 实际路径 | ✅ 存在 | — |
| `src/lib/import-export.ts` | ✅ 指定 | ❌ 不存在（是目录） | 🟠 |
| `src/lib/import-export/api.ts` | 实际路径 | ✅ 存在（172 行） | — |

**🟠 问题 — E4 测试为占位桩**:

```typescript
// import-export-roundtrip.spec.ts
test('E4-U1: Import card renders without crash', async ({ page }) => {
  // In MVP, we test the components can be imported without crash
  expect(true).toBe(true);  // ← 桩测试，无实际断言
});

test('E4-U1: File validation rejects oversized files', async ({ page }) => {
  // This is tested via unit test pattern, not E2E in MVP
  expect(true).toBe(true);  // ← 桩测试
});
```

AGENTS.md 定义的核心测试用例（JSON round-trip、YAML + 特殊字符、5MB 限制）**均未实现**。

**backend `import-export.test.ts`**: ✅ 存在，12 个实际测试用例，覆盖 JSON/YAML round-trip、5MB 限制。

### 2.5 E5: Batch Export

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `src/services/ZipArchiveService.ts` | ✅ 指定 | ❌ 不存在 | 🔴 |
| `src/app/api/components/export-batch/route.ts` | ✅ 指定 | ❌ 不存在（见下） | 🟠 |
| `src/app/api/v1/projects/batch-export/route.ts` | 实际路径 | ✅ 存在 | — |
| `src/components/canvas/ExportMenu.tsx` | ✅ 指定 | ❌ 不存在（见下） | 🟠 |
| `src/components/canvas/features/ExportMenu.tsx` | 实际路径 | ✅ 存在 | — |
| `src/components/import-export/BatchExportCard.tsx` | 实际路径 | ✅ 存在 | — |
| `tests/e2e/batch-export.spec.ts` | ✅ 指定 | ✅ 存在（75 行） | 🟠 |

**🔴 BLOCKER — E5 后端无真实数据**:

```typescript
// batch-export/route.ts
// In MVP, we return mock data (no actual DB query)
// Full implementation would:
// 1. Query DB for components
// 2. Validate each component belongs to projectId
// 3. Generate ZIP
// 4. Upload to storage (Cloudflare R2 or similar)
// 5. Return signed URL with 5min expiry

const mockComponents: BatchExportComponent[] = body.componentIds.slice(0, 5).map(...);
// Returns zipData as base64 inline (not signed URL)
zipData: zipBuffer.toString('base64'),
```

**问题汇总**:
- ❌ 无真实 DB 查询（`batch-export/route.ts` 第 96 行注释确认）
- ❌ 不返回 signed URL（违反 AGENTS.md 约束："服务端校验 → signed URL 有效期 5 分钟"）
- ❌ `generateZip` 返回 `Buffer`（Cloudflare Workers 不支持 Node.js Buffer API）
- ❌ `ZipArchiveService` 不存在（代码在 `route.ts` 内联）
- 🟠 E2E 测试为占位桩（`expect(true).toBe(true)`）

**技术审查 R-2 复查**: `generateAsync('base64')` ✅（Workers 兼容），但返回 `Buffer` 类型在 Workers 环境会运行时错误。

### 2.6 E6: Performance Observability

| 文件 | AGENTS.md 路径 | 实际存在 | 状态 |
|------|---------------|---------|------|
| `src/app/api/health/route.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `src/hooks/useWebVitals.ts` | ✅ 指定 | ✅ 存在 | ✅ |
| `tests/health-api.spec.ts` | AGENTS.md: vibex-backend | ❌ 不存在 | 🟠 |
| `tests/e2e/health-api.spec.ts` | 实际位置 | ✅ 存在（110 行） | ✅ |

**实现检查**:
- ✅ `/health` 端点存在，滑动窗口 P50/P95/P99 实现
- ✅ Web Vitals 阈值 LCP>4000ms、CLS>0.1 告警实现
- ✅ `MAX_SAMPLES = 1000` 硬上限存在
- 🟠 后端单元测试缺失（AGENTS.md R-3 要求）
- 🟠 E2E 测试在 frontend 而非 backend（轻微路径偏差）

---

## 3. 边界 Case 识别（QA 重点验证项）

### E2 Firebase MVP
| Case | 风险 | 建议 |
|------|------|------|
| Firebase SDK 未安装，mock 数据无法验证真实行为 | 🔴 高 | 修复 BLOCKER 后重测 |
| mock tab 间不共享（`mockPresenceDb` 是单 tab 内存） | 🟠 中 | 多 tab 协作场景需真实 Firebase |
| `beforeunload` 在移动端不可靠 | 🟡 低 | 补充 `visibilitychange` 兜底 |

### E4 Import/Export
| Case | 风险 | 建议 |
|------|------|------|
| YAML 块标量（`\|`/`>`）特殊字符转义 | 🟠 中 | E2E 需覆盖 |
| YAML 注释注入（`#` 开头行） | 🟠 中 | 安全验证 |
| 文件 > 5MB 前端拦截 | ✅ 已实现 | Playwright 断言确认 |
| JSON round-trip content hash 比对 | 🟠 中 | E2E 需实现 |

### E5 Batch Export
| Case | 风险 | 建议 |
|------|------|------|
| 100 组件边界（MAX 100） | 🟠 中 | 需 101 组件超限测试 |
| 5MB 总大小限制 | 🟠 中 | 需接近 5MB 边界测试 |
| `Buffer` 在 Workers 运行时错误 | 🔴 高 | 修复 BLOCKER 后验证 |
| signed URL 5 分钟过期 | 🟠 中 | 时钟偏移测试 |

### E1 TS Debt
| Case | 风险 | 建议 |
|------|------|------|
| websocket 模块 0 个 Cloudflare Workers 类型 | 🟠 中 | 确认 DurableObject 类型来源 |
| flow-execution 泛型约束 30+ TS 错误 | 🟡 低 | 非 E1 范围，可忽略 |
| `as any` 基线未建立 | 🟡 低 | E1-U4 完成前无法量化 |

### E6 Performance
| Case | 风险 | 建议 |
|------|------|------|
| MAX_SAMPLES=1000 滑动窗口溢出丢弃 | 🟡 低 | 压力测试验证 |
| `/health` 在冷启动时无历史数据 | 🟡 低 | 首次请求返回 0 值需告知 |
| Web Vitals CLS 误报（字体加载） | 🟡 低 | Playwright E2E 无误报验证 |

---

## 4. 风险矩阵

| # | Epic | 风险描述 | 可能性 | 影响 | 级别 | 缓解 |
|---|------|---------|--------|------|------|------|
| R-B1 | E2 | Firebase SDK 未安装，mock 实现无法验证真实行为 | 🔴 确认 | 🔴 严重 | 🔴 BLOCKER | 修复后 Playwright + 真实 Firebase RTDB 测试 |
| R-B2 | E5 | 后端无真实 DB 查询，signed URL 未实现，无法上线 | 🔴 确认 | 🔴 严重 | 🔴 BLOCKER | E5-U1 重构为真实实现 |
| R-B3 | E1 | 143 个 TS 错误残留（非 E1 范围但影响构建） | 🟠 中 | 🟠 中 | 🟠 中 | 评估 E1 范围外错误是否阻塞发布 |
| R-M1 | E5 | `Buffer` 在 Cloudflare Workers 运行时错误 | 🟠 中 | 🔴 严重 | 🔴 BLOCKER | 改用 `ReadableStream` 返回 |
| R-M2 | E4 | E2E 测试全为占位桩，无法验证 Import/Export | 🟠 中 | 🟠 中 | 🟠 中 | 补充 JSON/YAML round-trip E2E |
| R-M3 | E5 | E2E 测试为占位桩，无法验证 ZIP 导出 | 🟠 中 | 🟠 中 | 🟠 中 | 补充批量导出 E2E |
| R-M4 | E6 | 后端单元测试缺失（AGENTS.md R-3 要求） | 🟠 中 | 🟡 低 | 🟡 低 | 补充 health-api 单元测试 |
| R-L1 | E2/E3/E6 | U4 Architect review 未完成 | 🟡 低 | 🟡 低 | 🟡 低 | Coord 推进 Architect review |
| R-L2 | E1 | CI gate 未实现，tsc --noEmit 和 as any 监控无门禁 | 🟡 低 | 🟡 低 | 🟡 低 | 完成 E1-U4 |

---

## 5. 依赖分析

```
E1-U4 (CI gate) → 依赖 E1-U3 ✅
E2-U4 (Architect review) → 依赖 E2-U1-U3 ✅
E3-U4 (Architect review) → 依赖 E3-U1-U3 ✅
E4-U2 → 依赖 E4-U1 ✅
E5-U2 → 依赖 E5-U1 ⚠️ E5-U1 有 BLOCKER
E6-U2 → 依赖 E6-U1 ✅
```

**阻塞链**: E5-U2 被 E5-U1 BLOCKER 阻塞。

---

## 6. 结论

### 评审结论：有条件通过（Conditional）

**通过条件**（修复优先级顺序）:

1. **🔴 P0 — E2 Firebase BLOCKER**: 安装 `firebase` 包，实现真实 Firebase RTDB 接入，移除 mock 模式
2. **🔴 P0 — E5 后端 BLOCKER**: 重构 `batch-export/route.ts` 为真实 DB 查询 + signed URL，`Buffer` → `ReadableStream`
3. **🔴 P0 — E1 TS 残留**: 评估 143 个非 E1 范围 TS 错误是否阻塞发布；建立 `as any` 基线
4. **🟠 P1 — E4/E5 E2E 占位桩**: 补充 Playwright E2E 测试（JSON/YAML round-trip、ZIP 导出）
5. **🟠 P1 — E6 后端单元测试**: 补充 `health-api.spec.ts`
6. **🟡 P2 — E1-U4 CI gate**: 实现 `.github/workflows/ci.yml`

### 量化评估

| 维度 | 得分 | 说明 |
|------|------|------|
| 源码完整性 | 85% | E5 后端、E2 Firebase 不完整 |
| 约束合规性 | 75% | E2 违反 AGENTS.md（Firebase 真实接入约束）|
| 测试覆盖率 | 50% | E4/E5 E2E 为占位桩 |
| CI 门禁 | 0% | E1-U4 未实现 |
| CHANGELOG 同步 | 100% | ✅ 完全一致 |

---

## 执行决策

- **决策**: 有条件通过
- **执行项目**: vibex-proposals-20260424-qa
- **执行日期**: 待修复 P0 问题后重新评审
- **下一步**: Coord 分配 P0 修复任务 → Dev 修复 → Analyst 复验

---

## 附录：文件路径偏差汇总

| AGENTS.md 预期路径 | 实际路径 |
|--------------------|---------|
| `src/lib/firebase.ts` | `src/lib/firebase/presence.ts` |
| `src/components/canvas/PresenceAvatars.tsx` | `src/components/canvas/Presence/PresenceAvatars.tsx` |
| `src/components/FileImport.tsx` | `src/components/import-export/FileImport.tsx` |
| `src/lib/import-export.ts` | `src/lib/import-export/api.ts`（目录）|
| `src/services/ZipArchiveService.ts` | 内联于 `batch-export/route.ts` |
| `src/components/canvas/ExportMenu.tsx` | `src/components/canvas/features/ExportMenu.tsx` |
| `src/app/api/components/export-batch/route.ts` | `src/app/api/v1/projects/batch-export/route.ts` |
| `vibex-backend/tests/health-api.spec.ts` | `vibex-fronted/tests/e2e/health-api.spec.ts` |
