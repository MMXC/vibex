# AGENTS.md — vibex-sprint7-fix

> **项目**: vibex-sprint7-fix
> **日期**: 2026-04-24
> **目标**: 修复 3 个 P0 BLOCKER 使 Sprint 7 可上线

---

## 角色分配

| Agent | 职责 | 阶段 |
|-------|------|------|
| **dev** | E2 + E5 + E1 代码实现 | Implementation |
| **tester** | 验收测试 + gstack QA | QA |
| **architect** | 架构设计评审 | Design → 已完成 |

---

## 全局约束

1. **Workers 兼容性**: 禁止 `Buffer` API；使用 `Uint8Array` + `ArrayBuffer`
2. **Firebase bundle**: 只导入 `firebase/database`，禁止 `firebase/app`
3. **Mock 降级兜底**: Firebase 未配置时自动降级，不阻断功能
4. **一次性下载**: KV download key 下载后立即删除
5. **as any 基线**: `grep -r "as any" --include="*.ts" | wc -l` ≤ 59，不新增
6. **E2/E5 可并行开发**: 两个 epic 无依赖，可分配给两个 dev

---

## Dev Agent 指令

### E2: Firebase Presence（Epic E2）

**工作目录**: `/root/.openclaw/vibex/vibex-fronted`

**Step 1: 安装 Firebase SDK**
```bash
cd /root/.openclaw/vibex/vibex-fronted
pnpm add firebase@^10.0.0
```

**Step 2: 重构 `src/lib/firebase/presence.ts`**

替换 TODO 为真实 RTDB 实现：
- `import { initializeApp, getDatabase } from 'firebase/database'`
- `import { ref, set, onValue, onDisconnect, remove } from 'firebase/database'`
- `ensureFirebase()` — 懒初始化 app + database
- `setPresence()` — `await set(ref(db, path), data)` + `await onDisconnect(ref).remove()`
- `subscribeToOthers()` — `return onValue(ref(db, path), callback)`
- `removePresence()` — `await remove(ref(db, path))`
- **Mock 降级**: 未配置时 `console.warn('[Presence] Firebase not configured — using mock')`

**Step 3: `usePresence` hook — visibilitychange 兜底**

在 useEffect cleanup 中添加：
```typescript
const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    removePresence(canvasId, userId).catch(logger.error);
  }
};
document.addEventListener('visibilitychange', handleVisibilityChange);
return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
```

**Step 4: 实现 `src/components/canvas/Presence/PresenceAvatars.tsx`**

参考 `specs/presence-avatars.md` 四态规范：
- 理想态: `others.length > 0` → 彩色圆形头像堆叠
- 空状态: `others.length === 0 && isConnected` → 两人图标 + "暂无协作者"
- 加载态: `!isConnected` → 3 个骨架屏圆形，shimmer 动画
- 错误态: `!isAvailable` → WiFi-off 图标 + tooltip

Props:
```typescript
interface PresenceAvatarsProps {
  canvasId: string;
  maxDisplay?: number; // 默认 5
}
```

**Step 5: 测试**
```bash
pnpm exec vitest run src/lib/firebase/presence.test.ts
pnpm exec playwright test tests/e2e/presence-mvp.spec.ts
```

**必须覆盖的测试用例**:
- [ ] Firebase configured → 写入 RTDB
- [ ] Firebase not configured → mock 降级 + console.warn
- [ ] onDisconnect 注册
- [ ] visibilitychange(hidden) → removePresence
- [ ] 多个用户 subscribe → 实时回调

---

### E5: Batch Export with Real DB（Epic E5）

**工作目录**: `/root/.openclaw/vibex/vibex-backend`

**Step 1: 创建 `src/services/ZipArchiveService.ts`**

```typescript
export class ZipArchiveService {
  async generateZip(components: ComponentExport[]): Promise<Uint8Array> {
    // JSZip generateAsync('blob') → ArrayBuffer → Uint8Array
    // 禁止使用 Buffer API
  }
}
```

**Step 2: 重构 `src/app/api/v1/projects/batch-export/route.ts`**

改动点：
1. 移除 `async function generateZip(): Promise<Buffer>` → 用 `ZipArchiveService`
2. 移除 mock 数据 → Prisma `findMany`
3. 移除 `zipData: zipBuffer.toString('base64')` → KV put + download URL
4. 保留 5MB 校验 + 100 组件上限

**Step 3: 创建 `src/app/api/v1/projects/batch-export/download/route.ts`**

```typescript
// GET /api/v1/projects/batch-export/download?key=<uuid>
// KV.get → delete → return application/zip
```

**Step 4: 更新 `wrangler.toml`**

```toml
[[kv_namespaces]]
binding = "EXPORT_KV"
id = "<run: wrangler kv:namespace create EXPORT_KV>"
preview_id = "<preview id>"
```

**Step 5: 实现 `src/components/import-export/BatchExportCard.tsx`**（前端）

参考 `specs/batch-export-card.md` 四态规范：
- 导出中: 按钮 spinner + "导出中..."
- 成功后: Toast + 下载链接（5min 倒计时提示）
- 失败后: Toast error + 重试按钮

**Step 6: 测试**
```bash
pnpm exec vitest run src/services/ZipArchiveService.test.ts
pnpm exec vitest run src/app/api/v1/projects/batch-export/route.test.ts
pnpm exec playwright test tests/e2e/batch-export.spec.ts
```

**必须覆盖的测试用例**:
- [ ] `generateZip` 返回 `Uint8Array`（非 Buffer）
- [ ] Prisma 查询返回真实组件
- [ ] KV put + 5min TTL
- [ ] Download endpoint 返回 zip + 删除 key
- [ ] >100 组件 → 400
- [ ] >5MB → 413

---

### E1: CI TypeScript Gate（Epic E1）

**工作目录**: `/root/.openclaw/vibex`

**Step 1: 扩展 `.github/workflows/test.yml`**（已有文件，添加新 job）

```yaml
jobs:
  typecheck:
    - run: pnpm exec tsc --noEmit
      working-directory: vibex-backend
    - run: pnpm exec tsc --noEmit
      working-directory: vibex-fronted

  as-any-baseline:
    - name: Check as any usage
      run: |
        COUNT=$(grep -r "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | wc -l)
        if [ "$COUNT" -gt 163 ]; then exit 1; fi
```

**Step 2: 验证**
```bash
# 确认 tsc exit 0
cd vibex-backend && pnpm exec tsc --noEmit
cd vibex-fronted && pnpm exec tsc --noEmit

# 确认 as any 不增加
grep -r "as any" vibex-fronted/src/ --include="*.ts" --include="*.tsx" | wc -l
# 输出应为 163 或更少
```

---

## Tester Agent 指令

### QA 验收（使用 gstack 技能）

**约束**: 必须使用 gstack `/browse` `/qa` `/qa-only` `/canary` 验证

**E2 QA Checklist**:
- [ ] Firebase SDK 初始化无 404（`/browse` 检查 network tab）
- [ ] RTDB 数据写入（需 Firebase test project 凭证，无凭证时验证 mock 降级）
- [ ] 页面卸载后 RTDB 数据清除
- [ ] `presence-mvp.spec.ts` E2E 全部通过

**E5 QA Checklist**:
- [ ] 选组件 → 导出 → 下载 ZIP → 解压验证 manifest.json 匹配（`/canary` 验证端到端）
- [ ] 下载链接 5 分钟后返回 404（验证 TTL）
- [ ] 101 组件返回 400
- [ ] `batch-export.spec.ts` E2E 全部通过

**E1 QA Checklist**:
- [ ] `.github/workflows/test.yml` push 后 CI 通过
- [ ] `as any` 不增加

---

## 环境变量要求

```env
# E2: Firebase（可选，未配置自动 mock 降级）
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# E5: KV binding（wrangler.toml 配置，无需 env）
# EXPORT_KV binding = "EXPORT_KV"
```

---

## 禁止事项

- ❌ 导入 `firebase/app`（完整 SDK，bundle 过大）
- ❌ `batch-export/route.ts` 返回 `zipData: Buffer.toString('base64')`
- ❌ 响应体内联 ZIP 数据（应返回 URL）
- ❌ 使用 `Buffer` API（Workers 不支持）
- ❌ 新增 `as any`（CI 会失败）

---

## 验收标准

| Epic | 验收条件 |
|------|---------|
| E2 | Firebase SDK 初始化无 404；RTDB 数据写入/清除；Mock 降级正常 |
| E5 | ZIP 解压 manifest 匹配；下载后 KV 删除；5MB/100 组件边界生效 |
| E1 | CI tsc gate exit 0；as any ≤ 59 |

---

## 产出清单

| 文件 | 负责 | 状态 |
|------|------|------|
| `vibex-fronted/src/lib/firebase/presence.ts` | dev | 需实现 |
| `vibex-fronted/src/components/canvas/Presence/PresenceAvatars.tsx` | dev | 需实现 |
| `vibex-fronted/tests/e2e/presence-mvp.spec.ts` | dev | 需更新 |
| `vibex-backend/src/services/ZipArchiveService.ts` | dev | 需创建 |
| `vibex-backend/src/app/api/v1/projects/batch-export/route.ts` | dev | 需重构 |
| `vibex-backend/src/app/api/v1/projects/batch-export/download/route.ts` | dev | 需创建 |
| `vibex-backend/wrangler.toml` | dev | 需更新 |
| `vibex-fronted/src/components/import-export/BatchExportCard.tsx` | dev | 需实现 |
| `.github/workflows/test.yml` | dev | 需扩展（新增 tsc gate + as any job） |
| `docs/vibex-sprint7-fix/architecture.md` | architect | ✅ 已完成 |
| `docs/vibex-sprint7-fix/IMPLEMENTATION_PLAN.md` | architect | ✅ 已完成 |
| `docs/vibex-sprint7-fix/AGENTS.md` | architect | ✅ 已完成 |
