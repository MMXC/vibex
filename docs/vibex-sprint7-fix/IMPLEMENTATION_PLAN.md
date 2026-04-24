# vibex-sprint7-fix — Implementation Plan

> **项目**: vibex-sprint7-fix
> **角色**: Architect
> **日期**: 2026-04-24
> **状态**: Ready for Implementation

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint7-fix
- **执行日期**: 2026-04-24

---

## Unit Index

| Epic | Units | Status | Next |
|------|-------|--------|------|
| E2: Firebase Presence | E2-U1 ~ E2-U5 | 4/5 | E2-U5 |
| E5: Batch Export + KV | E5-U1 ~ E5-U6 | 0/6 | E5-U1 |
| E1: CI TypeScript Gate | E1-U1 ~ E1-U2 | 0/2 | E1-U1 |

**并行策略**: E2、E5 完全独立，可并行派发给两个 dev。E1 独立，可并行。

---

## E2: Firebase Presence 真实接入

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E2-U1 | Firebase SDK 安装 | ✅ | — | `pnpm add firebase@^10.0.0` 成功；bundle 只含 `firebase/database` |
| E2-U2 | presence.ts 真实 RTDB 接入 | ✅ | E2-U1 | `setPresence` 写入 RTDB `/presence/{canvasId}/{userId}`；未配置时 mock 降级 |
| E2-U3 | visibilitychange 兜底清除 | ✅ | E2-U2 | `visibilityState === 'hidden'` 时 `removePresence` 被调用；`onDisconnect` 已注册 |
| E2-U4 | PresenceAvatars 组件四态 | ✅ | E2-U2 | 理想/空/加载/错误四态覆盖；最多显示 5 个头像 |
| E2-U5 | E2E 测试覆盖 | ⬜ | E2-U2, E2-U3 | Playwright 验证 RTDB 写入；mock 降级时跳过真实 Firebase |

### E2-U1 详细说明

**命令**:
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm add firebase@^10.0.0
```

**约束**: 只导入 `firebase/database`，禁止 `firebase/app`

**验证**: `grep "from 'firebase/" src/lib/firebase/presence.ts` 应只含 `firebase/database`

---

### E2-U2 详细说明

**文件变更**: `vibex-fronted/src/lib/firebase/presence.ts`

**实现步骤**:
1. 移除 `// TODO: 真实 Firebase 实现` 注释
2. 添加 `import { initializeApp, getDatabase } from 'firebase/database'`
3. 添加 `import { ref, set, onValue, onDisconnect, remove } from 'firebase/database'`
4. 实现 `ensureFirebase()` — 懒初始化 singleton app + database
5. `setPresence()` 调用 `await set(ref(db, path), data)` + `await onDisconnect(ref).remove()`
6. `subscribeToOthers()` 返回 `onValue(ref(db, path), callback)` 的 unsubscribe 函数
7. `removePresence()` 调用 `await remove(ref(db, path))`
8. 未配置 Firebase 时保留 mock 降级 + `console.warn`

**风险**: 无严重风险；mock 降级兜底

---

### E2-U3 详细说明

**文件变更**: `vibex-fronted/src/lib/firebase/presence.ts` — `usePresence` hook

**实现步骤**:
1. 在 `useEffect` return cleanup 中添加 `visibilitychange` 监听
2. `document.visibilityState === 'hidden'` 时调用 `removePresence`
3. cleanup 函数中移除监听器

```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    removePresence(canvasId, userId).catch(canvasLogger.default.error);
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
return () => {
  unsubscribeRef.current?.();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  removePresence(canvasId, userId).catch(canvasLogger.default.error);
};
```

**风险**: 无

---

### E2-U4 详细说明

**文件变更**: `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx`（新建）

**实现步骤**:
1. 使用 `usePresence(canvasId, userId, name)` 获取 `others`
2. 四态分支：`isAvailable === false` → 错误态；`!isConnected` → 加载态；`others.length === 0` → 空状态；其余 → 理想态
3. 头像使用 `others[i].color` 作为背景色，显示首字母
4. `maxDisplay` prop 控制最多显示数量，默认 5

**风险**: 无

---

### E2-U5 详细说明

**文件变更**: `vibex-fronted/tests/e2e/presence-mvp.spec.ts`

**实现步骤**:
1. 添加 `isFirebaseConfigured` 检查：配置时测 RTDB，未配置时验证 mock 降级
2. RTDB 测试需要 Firebase test project 凭证；凭证缺失时 `test.skip`

**风险**: 中 — Firebase test project 凭证未就绪时跳过

---

## E5: Batch Export with Real DB + KV

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E5-U1 | ZipArchiveService 创建 | ⬜ | — | `generateZip()` 返回 `Uint8Array`（非 Buffer）；JSZip `generateAsync('blob')` + `arrayBuffer()` |
| E5-U2 | batch-export/route.ts 真实 DB 查询 | ⬜ | E5-U1 | Prisma `findMany` 查询返回真实组件；移除 mock 数据；保留 100 组件上限 + 5MB 校验 |
| E5-U3 | KV 暂存 + download URL | ⬜ | E5-U1, E5-U2 | `EXPORT_KV.put(key, zipBytes, {expirationTtl: 300})` 存储；返回 `/api/v1/projects/batch-export/download?key=` |
| E5-U4 | download/route.ts 一次性下载 | ⬜ | E5-U3 | KV.get → 一次性 delete → 返回 `application/zip`；已下载/过期返回 404 |
| E5-U5 | Wrangler EXPORT_KV binding | ⬜ | — | `wrangler.toml` 新增 `EXPORT_KV` namespace；`wrangler deploy` 不报错 |
| E5-U6 | BatchExportCard 组件四态 | ⬜ | E5-U3 | 理想/空/加载/错误四态；下载链接 5 分钟倒计时提示；Toast 错误提示 |

### E5-U1 详细说明

**文件变更**: `vibex-backend/src/services/ZipArchiveService.ts`（新建）

**实现步骤**:
1. 创建 `src/services/` 目录（如不存在）
2. 实现 `ZipArchiveService` 类，`generateZip(components)` → `Promise<Uint8Array>`
3. `blob.arrayBuffer()` → `new Uint8Array(arrayBuffer)`
4. manifest.json 包含 exportDate、componentCount、components 索引
5. 每个组件存为 `{id}.json`

**风险**: 无

---

### E5-U2 详细说明

**文件变更**: `vibex-backend/src/app/api/v1/projects/batch-export/route.ts`

**实现步骤**:
1. 移除内联 `generateZip()` 函数 → 改用 `ZipArchiveService`
2. 移除 `Buffer` → 改用 `Uint8Array`
3. 移除 mock 数据 → `env.DB.prepare(SELECT ... WHERE id IN ...)`.bind(...).all()
4. 保留 `MAX_COMPONENTS=100` 和 `MAX_ZIP_SIZE=5MB` 校验
5. 保留 400/413 错误响应

**D1 查询语法**（Wrangler 格式）:
```typescript
const placeholders = idList.map((_, i) => `$${i + 1}`).join(', ');
const dbResult = await env.DB.prepare(
  `SELECT id, name, type, data, version, updated_at as updatedAt
   FROM components WHERE id IN (${placeholders}) AND project_id = $${idList.length + 1}
   LIMIT ${MAX_COMPONENTS}`
).bind(...idList, body.projectId).all<{
  id: string; name: string; type: string; data: string;
  version: number; updatedAt: string;
}>();
```

**风险**: 无

---

### E5-U3 详细说明

**文件变更**: `vibex-backend/src/app/api/v1/projects/batch-export/route.ts`

**实现步骤**:
1. 在 `generateZip` 成功后，校验大小
2. `const key = \`batch-export:\${crypto.randomUUID()}\``
3. `await env.EXPORT_KV.put(key, zipBytes, { expirationTtl: 300 })`
4. 返回 `{ success: true, downloadUrl: \`/api/v1/projects/batch-export/download?key=\${key}\`, expiresAt, componentCount, sizeBytes }`

**风险**: 中 — `EXPORT_KV` namespace 未创建时运行时 500；E5-U5 先完成可规避

---

### E5-U4 详细说明

**文件变更**: `vibex-backend/src/app/api/v1/projects/batch-export/download/route.ts`（新建）

**实现步骤**:
1. `GET` 方法，query param 取 `key`
2. `const data = await env.EXPORT_KV.get(key, 'arrayBuffer')`
3. `!data` → 404
4. `await env.EXPORT_KV.delete(key)` — 一次性
5. `new NextResponse(data, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="vibex-components.zip"' } })`

**风险**: 无

---

### E5-U5 详细说明

**文件变更**: `vibex-backend/wrangler.toml`

**实现步骤**:
```bash
cd /root/.openclaw/vibex/vibex-backend
wrangler kv:namespace create EXPORT_KV
# 输出: id = "xxxxxxxxxxxx"
```

**wrangler.toml 添加**:
```toml
[[kv_namespaces]]
binding = "EXPORT_KV"
id = "<wrangler kv:namespace create EXPORT_KV 输出 id>"
preview_id = "<preview id>"
```

**风险**: 中 — `wrangler deploy` 时 id 占位未替换会失败

---

### E5-U6 详细说明

**文件变更**: `vibex-fronted/src/components/import-export/BatchExportCard.tsx`（新建）

**实现步骤**:
1. 接收 `projectId` 和 `selectedComponents` props
2. 导出中: `isExporting` state → 按钮 spinner + "导出中..."
3. 成功后: Toast + 下载链接 + 5min 倒计时文案
4. 失败后: Toast error + 重试按钮
5. 空状态: 无选中组件时显示 "选择组件后导出" 文案

**风险**: 无

---

## E1: CI TypeScript Gate

| ID | Name | Status | Depends On | Acceptance Criteria |
|----|------|--------|-----------|---------------------|
| E1-U1 | CI workflow tsc gate | ⬜ | — | `.github/workflows/ci.yml` 存在；`pnpm exec tsc --noEmit` 作为 gate；exit 非0则 CI fail |
| E1-U2 | as any 基线建立 | ⬜ | E1-U1 | `grep -r "as any" --include="*.ts" | wc -l` ≤ 59；CI 中监控检查 |

### E1-U1 详细说明

**文件变更**: `.github/workflows/ci.yml`（新建）

**实现步骤**:
1. `on: [push, pull_request]` 触发
2. job `typecheck`: `pnpm exec tsc --noEmit` 作用于 `vibex-backend` 和 `vibex-fronted`
3. job `as-any-baseline`: `grep -r "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | wc -l` ≤ 59

**注意**: 现有 `.github/workflows/test.yml` 存在；可在其中新增 job 而非创建新文件

**风险**: 低

---

### E1-U2 详细说明

**文件变更**: `.github/workflows/ci.yml`（在 E1-U1 中已覆盖）

`AS_ANY_BASELINE.md` 已存在，基线值 59。

---

## 执行顺序

```
并行派发:
├─ dev-A: E2-U1 → E2-U2 → E2-U3 → E2-U4 → E2-U5
├─ dev-B: E5-U5 → E5-U1 → E5-U2 → E5-U3 → E5-U4 → E5-U6
└─ dev-C: E1-U1 → E1-U2（可随时开始，无依赖）

注: E5-U3 依赖 E5-U1+E5-U2，E5-U4 依赖 E5-U3
    E2-U3 依赖 E2-U2，E2-U4/E2-U5 依赖 E2-U2
```

---

## 性能影响评估

| 操作 | 评估 |
|------|------|
| Firebase SDK bundle (database only) | +30KB gzipped；可接受 |
| RTDB onValue listener | 每 canvas 每用户 1 次；低频，数据量小 |
| KV.put per export | 1 次写入，O(1) |
| KV.delete per download | 1 次读写，O(1)，TTL 兜底 |
| ZIP generateAsync (100 组件) | ~500ms CPU-bound；可接受 |
| E2/E5 单元测试覆盖率目标 | >80% |

---

## 验收标准汇总

| Epic | 验收条件 |
|------|---------|
| E2 | Firebase SDK 初始化无 404；RTDB 数据写入；Mock 降级正常；`pnpm exec tsc --noEmit` 通过 |
| E5 | ZIP 解压 manifest 匹配；下载后 KV 删除；5MB/100 组件边界生效；`pnpm exec tsc --noEmit` 通过 |
| E1 | CI tsc gate exit 0；as any ≤ 59 |

---

## 驳回红线检查

- [x] 架构设计可行（Firebase RTDB + KV fetch URL 均为成熟方案）
- [x] 接口定义完整（E2: presence.ts API + E5: POST/GET endpoints）
- [x] IMPLEMENTATION_PLAN.md 存在（本文档）
- [x] AGENTS.md 存在（`docs/vibex-sprint7-fix/AGENTS.md`）
- [x] Unit Index 完整（E2-U1~E5-U6, E1-U1~E1-U2）
- [x] 测试策略明确（Vitest + Playwright，覆盖率目标 >80%）
