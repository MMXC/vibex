# PRD: vibex-sprint7-fix — Sprint 7 P0 BLOCKER 修复

> **项目**: vibex-sprint7-fix
> **PM**: pm
> **日期**: 2026-04-24
> **状态**: Draft

---

## 1. 执行摘要

### 背景

Sprint 7 完成后 QA 发现 3 个 P0 BLOCKER，阻止发布：

| # | Epic | BLOCKER | 严重性 |
|---|------|---------|--------|
| B1 | E2 | Firebase SDK 未安装，代码仅有 mock 占位 | 🔴 严重 |
| B2 | E5 | 后端无真实 DB 查询，无 signed URL，Buffer API 运行时错误 | 🔴 严重 |
| B3 | E1 | 143 个 TS 错误残留（全部在 E1-E6 范围外，不阻塞发布） | 🟠 中 |

### 目标

修复 3 个 P0 BLOCKER，使 Sprint 7 产出可上线。

### 成功指标

| 指标 | 目标 |
|------|------|
| Firebase SDK 初始化 | `pnpm add firebase@^10.0.0` 成功，bundle 无 404 |
| E2 真实 RTDB 接入 | Playwright 验证 RTDB 有数据写入 |
| E5 真实 DB 查询 | Prisma 查询返回真实组件数据 |
| E5 signed URL | 返回 `/api/v1/projects/batch-export/download?key=...`，5 分钟过期 |
| E1 CI gate | `.github/workflows/ci.yml` 存在，`pnpm exec tsc --noEmit` exit 0 |
| as any 基线 | `grep -r "as any" src/ --include="*.ts" \| wc -l` ≤ 59 |

---

## 2. Epic 拆分

### 2a. 本质需求穿透（神技1：剥洋葱）

#### Epic E2: Firebase Presence 真实接入
- **用户的底层动机是什么？**：在 Canvas 协作时，实时看到其他人在场，避免重复编辑同一节点
- **去掉现有方案，理想解法是什么？**：Firebase RTDB 的 pub/sub 机制天然适合 presence 场景（轮询太慢，WebSocket 太重）
- **这个 Epic 解决了什么本质问题？**：协作时不知道谁在线 → 实时感知队友存在

#### Epic E5: 批量导出真实数据 + signed URL
- **用户的底层动机是什么？**：导出组件包用于备份或迁移
- **去掉现有方案，理想解法是什么？**：服务端直接生成 ZIP 并提供下载链接，不在响应体里内联 base64
- **这个 Epic 解决了什么本质问题？**：mock 数据无法验证导出链路，base64 内联有大文件限制

#### Epic E1: TS 债务清理 + CI gate
- **用户的底层动机是什么？**：开发时不被 TS 错误阻断，构建质量有门禁
- **去掉现有方案，理想解法是什么？**：CI 中跑 `tsc --noEmit`，`as any` 有基线监控
- **这个 Epic 解决了什么本质问题？**：143 个 TS 错误在 E1-E6 范围外但持续累积，需建立基线防止恶化

### 2b. 最小可行范围（神技2：极简主义）

#### E2 本期必做 / 不做
| 分类 | 内容 | 理由 |
|------|------|------|
| **本期必做** | 安装 firebase@^10.0.0，只导入 `firebase/database` | 只接入 RTDB，不碰 Auth/Storage |
| **本期必做** | 真实 RTDB 读写替代 mock | 验证 Firebase 连接性 |
| **本期必做** | `onDisconnect().remove()` + `visibilitychange` 兜底 | 断线清除，防止 stale data |
| **本期不做** | Firebase Auth（登录态复用现有 JWT） | 超出 P0 范围 |
| **本期不做** | Firebase Storage（文件上传） | 超出 P0 范围 |
| **暂缓** | 多 tab 真实 Firebase 同步（需 Firebase test project 凭证） | 凭证未就绪时可 mock 降级 |

#### E5 本期必做 / 不做
| 分类 | 内容 | 理由 |
|------|------|------|
| **本期必做** | Prisma 真实 DB 查询替代 mock | 核心功能验证 |
| **本期必做** | `Uint8Array`（Workers 兼容）替代 `Buffer` | 运行时错误修复 |
| **本期必做** | Cloudflare KV 存储 + fetch URL（5min TTL）| signed URL 等效实现 |
| **本期不做** | Cloudflare R2 signed URL（需 Infra 协调）| 超出本期能力 |
| **本期不做** | 导出进度实时推送（SSE） | 超出 P0 范围 |

#### E1 本期必做 / 不做
| 分类 | 内容 | 理由 |
|------|------|------|
| **本期必做** | `.github/workflows/ci.yml`（tsc gate + as any grep）| CI 门禁建立 |
| **本期必做** | `as any` 基线记录 = 59 | 量化基线 |
| **本期不做** | 修复 143 个 TS 错误（全部在 E1-E6 范围外） | 非 Sprint 7 范围，另起 tech debt |
| **暂缓** | ESLint `@typescript-eslint/no-explicit-any` 升为 error | 影响面大，需分阶段 |

### 2c. 用户情绪地图（神技3：老妈测试）

> 本次修复为后端/BFF 层，用户无直接感知页面。但涉及以下 UI 变更点：

#### PresenceAvatars 组件（E2 关联）
- **用户进入 canvas 时**：期待看到队友头像，确认协作状态
- **用户迷路时**：看不到头像，不知道有没有人在线 → 引导文案 "暂无协作者"
- **出错时**：`isAvailable === false` 时显示降级图标 + tooltip "实时同步暂不可用"

#### BatchExportCard 组件（E5 关联）
- **用户点击导出时**：期待下载 ZIP 包
- **用户等待时**：显示骨架屏进度（非转圈）
- **出错时**：toast 提示错误类型（"组件数据获取失败" / "压缩包超限"）

### 2d. UI状态规范（神技4：状态机 — Spec阶段应用）

> 以下为 Spec 要求，详见 `specs/` 目录

| 组件 | 理想态 | 空状态 | 加载态 | 错误态 |
|------|--------|--------|--------|--------|
| PresenceAvatars | 显示彩色头像 + 名称 | 插图 + "暂无协作者" | 骨架屏（头像占位） | 降级图标 + tooltip |
| BatchExportCard | 全选/单选勾选 + 导出按钮 | "选择组件后导出" 文案 | 骨架屏（卡片列表） | toast 错误 |
| ExportDownloadToast | 显示文件名 + 大小 + 下载链接 | — | — | "导出失败，请重试" |

---

## 3. Feature List（Planning 输出）

| ID | 功能点 | 描述 | 根因关联 | 工时估算 |
|----|--------|------|---------|---------|---------|
| F1.1 | E2-B1: Firebase SDK 安装 | `pnpm add firebase@^10.0.0`，只用 `firebase/database` 子模块 | R-B1 | 0.5h |
| F1.2 | E2-B2: 真实 RTDB 接入 | 重构 `presence.ts`：`initializeApp` + `getDatabase` + `ref/set/onValue/onDisconnect` | R-B1 | 1h |
| F1.3 | E2-B3: visibilitychange 兜底 | `document.addEventListener('visibilitychange')` 替代 `beforeunload` | 移动端 beforeunload 不可靠 | 0.5h |
| F1.4 | E2-B4: E2E 测试更新 | `presence-mvp.spec.ts` 增加真实 Firebase 验证用例（降级时跳过） | R-F2 | 0.5h |
| F2.1 | E5-B1: ZipArchiveService 创建 | 提取 `src/services/ZipArchiveService.ts`，`generateAsync('blob')` → `ArrayBuffer` → `Uint8Array` | R-M1 | 1h |
| F2.2 | E5-B2: 真实 DB 查询 | `batch-export/route.ts` 用 Prisma 替代 mock，`take: 100` 限制 | R-B2 | 0.5h |
| F2.3 | E5-B3: KV 存储 + fetch URL | `env.EXPORT_KV.put(key, zipBytes, {expirationTtl: 300})` → 返回 download URL | R-B2 | 1h |
| F2.4 | E5-B4: Download endpoint | `GET /api/v1/projects/batch-export/download?key=` → KV fetch + 一次性删除 | 无 | 0.5h |
| F2.5 | E5-B5: Wrangler KV 配置 | `wrangler.json` 添加 `EXPORT_KV` namespace 绑定 | R-F3 | 0.5h |
| F2.6 | E5-B6: E2E 测试更新 | `batch-export.spec.ts` 替换占位桩为真实断言 | R-M3 | 0.5h |
| F3.1 | E1-B1: CI gate 实现 | `.github/workflows/ci.yml`：tsc --noEmit + as any grep，exit 非0则失败 | R-L2 | 0.5h |
| F3.2 | E1-B2: as any 基线记录 | `docs/vibex-sprint7-fix/AS_ANY_BASELINE.md`：记录基线 = 59，监控不增加 | 无 | 0.25h |
| F3.3 | E1-B3: tsc 基线记录 | 记录 Sprint 7 相关文件 E1-E6 范围 TS 错误 = 0 | 无 | 0.25h |

**总工时**: E2(2.5h) + E5(3.5h) + E1(1h) = **7h**

---

## 4. Epic/Story 表格

### Epic E2: Firebase Presence 真实接入

| Story ID | 描述 | 工时 | 验收标准 |
|---------|------|------|---------|
| E2-S1 | Firebase SDK 安装 + 子模块配置 | 0.5h | `package.json` 含 `firebase@^10.0.0`；bundle 中只有 `firebase/database` 无完整 SDK |
| E2-S2 | 真实 RTDB 读写实现 | 1h | `setPresence` 写入 RTDB `/presence/{canvasId}/{userId}`；`subscribeToOthers` 实时回调 |
| E2-S3 | 断线清除兜底 | 0.5h | `onDisconnect().remove()` 注册；`visibilitychange` 监听页面隐藏清除 presence |
| E2-S4 | E2E 测试覆盖 | 0.5h | Playwright 验证：SDK 初始化无 404；RTDB 有数据写入（test project） |

**本质需求**: 协作时实时感知队友存在，解决"不知道有没有人在看"的问题
**最小范围**: 只做 RTDB presence，不做 Auth/Storage
**情绪地图**: 进入 canvas → 期待看到头像 → 无头像时显示引导

### Epic E5: 批量导出真实数据 + signed URL

| Story ID | 描述 | 工时 | 验收标准 |
|---------|------|------|---------|
| E5-S1 | ZipArchiveService 创建（Workers 兼容） | 1h | `Uint8Array` 返回值；`generateAsync('blob')` + `arrayBuffer()`；无 `Buffer` API |
| E5-S2 | Prisma 真实 DB 查询 | 0.5h | `prisma.component.findMany` 查询，返回真实组件数据 |
| E5-S3 | KV 存储 + download URL | 1h | `EXPORT_KV.put`（5min TTL）；返回 `/api/v1/projects/batch-export/download?key=` |
| E5-S4 | Download endpoint | 0.5h | KV fetch + 一次性删除；`Content-Type: application/zip` |
| E5-S5 | Wrangler KV 配置 | 0.5h | `wrangler.json` 含 `EXPORT_KV` binding；`wrangler deploy` 不报错 |
| E5-S6 | E2E 测试覆盖 | 0.5h | JSON round-trip；5MB 限制；100 组件边界 |

**本质需求**: 导出的 ZIP 是真实数据，提供有时限下载链接
**最小范围**: KV 暂存（不依赖 R2）；Prisma 查询（不依赖外部存储服务）
**情绪地图**: 点击导出 → 期待下载 → 等待时骨架屏 → 成功下载 / 失败 toast

### Epic E1: TS 债务清理 + CI gate

| Story ID | 描述 | 工时 | 验收标准 |
|---------|------|------|---------|
| E1-S1 | CI gate 实现 | 0.5h | `.github/workflows/ci.yml` 存在；`pnpm exec tsc --noEmit` 作为 gate 步骤 |
| E1-S2 | as any 基线建立 | 0.25h | `AS_ANY_BASELINE.md` 记录基线 = 59；CI 中 `grep -c "as any"` 监控 |
| E1-S3 | TS 错误范围评估 | 0.25h | 143 个错误全部在 E1-E6 范围外（已确认），无需本期修复 |

**本质需求**: CI 有门禁，防止新 TS 错误引入，建立 as any 基线
**最小范围**: 只建 CI gate + 记录基线，不修复 143 个历史错误
**情绪地图**: Dev 提 PR → CI 跑 tsc → 通过则安心 / 失败则立刻知道问题

---

## 5. 验收标准（expect() 断言）

### E2-S1: Firebase SDK 安装
```typescript
// E2-S1: Firebase SDK 安装 + 子模块配置
expect('firebase').toBeDefined(); // package.json 含 firebase
// bundle 分析（手动验证或 size-limit）：
// expect(firebaseAppBundleSize).toBeLessThan(100_000); // 只用 database 子模块
expect(typeof window !== 'undefined' || true).toBe(true); // Next.js SSR 兼容
```

### E2-S2: 真实 RTDB 读写
```typescript
// E2-S2: setPresence 写入 RTDB
expect(typeof setPresence).toBe('function');
// 集成测试（需 Firebase test project）：
// const testCanvasId = `test-canvas-${Date.now()}`;
// await setPresence(testCanvasId, 'test-user', 'Test User');
// const presenceRef = ref(database, `presence/${testCanvasId}/test-user`);
// const snapshot = await get(presenceRef);
// expect(snapshot.val()).toMatchObject({ userId: 'test-user', name: 'Test User' });
```

### E2-S3: 断线清除
```typescript
// E2-S3: onDisconnect 注册 + visibilitychange
expect(typeof onDisconnect).toBe('function'); // Firebase onDisconnect API 存在
// Playwright 测试：
// await page.goto('/canvas/test');
// await page.evaluate(() => { document.dispatchEvent(new Event('visibilitychange')); });
// await page.waitForTimeout(1000);
// expect(presenceDataCleared).toBe(true);
```

### E5-S1: ZipArchiveService Workers 兼容
```typescript
// E5-S1: Uint8Array 返回
expect(typeof ZipArchiveService).toBe('function');
// expect(Uint8Array).toBeDefined(); // 不依赖 Buffer
// const service = new ZipArchiveService(mockEnv);
// const result = await service.generateZip([mockComponent]);
// expect(result).toBeInstanceOf(Uint8Array);
```

### E5-S2: Prisma 真实查询
```typescript
// E5-S2: 组件查询返回真实数据
// 集成测试：
// const components = await prisma.component.findMany({ where: { id: { in: componentIds } } });
// expect(components.length).toBeGreaterThan(0); // 有真实数据
// expect(components[0]).toHaveProperty('id');
// expect(components[0]).toHaveProperty('data');
```

### E5-S3: KV 存储 + fetch URL
```typescript
// E5-S3: KV 存储，5 分钟过期
// const key = crypto.randomUUID();
// await env.EXPORT_KV.put(key, zipBytes, { expirationTtl: 300 });
// const stored = await env.EXPORT_KV.get(key, 'arrayBuffer');
// expect(stored).not.toBeNull();
// expect(stored.byteLength).toBeGreaterThan(0);
```

### E5-S4: Download endpoint
```typescript
// E5-S4: 一次性下载，KV 删除
// const response = await fetch(`/api/v1/projects/batch-export/download?key=${key}`);
// expect(response.headers.get('Content-Type')).toBe('application/zip');
// expect(response.ok).toBe(true);
// const afterData = await env.EXPORT_KV.get(key, 'arrayBuffer');
// expect(afterData).toBeNull(); // 一次性删除
```

### E1-S1: CI gate
```typescript
// E1-S1: CI 中 tsc gate
// 在 CI 中运行：
// pnpm exec tsc --noEmit
// expect(exitCode).toBe(0);
```

### E1-S2: as any 基线
```typescript
// E1-S2: as any 不增加
// pnpm exec tsc --noEmit  # E1 相关文件
// grep -r "as any" src/ --include="*.ts" | wc -l
// expect(count).toBeLessThanOrEqual(59);
```

---

## 6. Definition of Done

### E2: Firebase Presence 真实接入

- [ ] `pnpm add firebase@^10.0.0` 成功
- [ ] `presence.ts` 使用 `import { ... } from 'firebase/database'`，无完整 SDK 导入
- [ ] `setPresence` 写入 RTDB `/presence/{canvasId}/{userId}`
- [ ] `subscribeToOthers` 实时回调其他用户
- [ ] `onDisconnect().remove()` 在 setPresence 时注册
- [ ] `visibilitychange` 监听器在页面隐藏时清除 presence
- [ ] 未配置 Firebase 时降级 mock（不阻断功能）
- [ ] `presence-mvp.spec.ts` 有真实 Firebase 验证用例
- [ ] `pnpm exec tsc --noEmit` 通过（无新 TS 错误引入）

### E5: 批量导出真实数据 + signed URL

- [ ] `src/services/ZipArchiveService.ts` 存在，`generateZip` 返回 `Uint8Array`
- [ ] `batch-export/route.ts` 用 Prisma 真实查询（无 mock）
- [ ] `EXPORT_KV.put(key, zipBytes, {expirationTtl: 300})` 存储成功
- [ ] `download/route.ts` 返回 `Content-Type: application/zip`，下载后 KV 数据删除
- [ ] 返回 URL 格式：`/api/v1/projects/batch-export/download?key=<uuid>`
- [ ] 5MB 总大小限制（`zipBytes.length > 5 * 1024 * 1024` → 413）
- [ ] 100 组件上限（`components.length > 100` → 400）
- [ ] `wrangler.json` 含 `EXPORT_KV` binding
- [ ] `batch-export.spec.ts` 替换占位桩为真实断言
- [ ] `pnpm exec tsc --noEmit` 通过

### E1: TS 债务清理 + CI gate

- [ ] `.github/workflows/ci.yml` 存在
- [ ] CI 中 `pnpm exec tsc --noEmit` 作为 gate 步骤（exit 非0则失败）
- [ ] CI 中 `grep -r "as any" src/ --include="*.ts" | wc -l` 监控，值 > 59 则警告
- [ ] `docs/vibex-sprint7-fix/AS_ANY_BASELINE.md` 记录基线 = 59
- [ ] E1 相关文件（authFromGateway + routes/）TS 错误 = 0

---

## 7. 技术约束

### 环境变量（必须配置）

```env
# E2: Firebase（未配置时自动降级 mock）
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# E5: Cloudflare KV
EXPORT_KV=  # wrangler.json 中绑定
```

### Wrangler 配置

```json
// wrangler.json 或 wrangler.toml
{
  "kv_namespaces": [
    { "binding": "COLLABORATION_KV", "id": "..." },
    { "binding": "NOTIFICATION_KV", "id": "..." },
    { "binding": "EXPORT_KV", "id": "..." }  // 新增
  ]
}
```

### 禁止

- ❌ 导入 `firebase/app`（完整 SDK，bundle 过大）
- ❌ `batch-export/route.ts` 中返回 `zipData: Buffer.toString('base64')`
- ❌ 在响应体中内联 ZIP 数据（应返回 URL）
- ❌ 使用 Node.js `Buffer` API（Workers 不支持）

### 允许

- ✅ `firebase/database` 子模块
- ✅ JSZip `generateAsync('blob')` + `arrayBuffer()` → `Uint8Array`
- ✅ Cloudflare KV 暂存 + fetch URL（5 分钟 TTL）
- ✅ mock 降级（Firebase 未配置时）

---

## 8. 依赖关系图

```
E2-S1 (Firebase 安装)
  └─ E2-S2 (RTDB 接入) ← 依赖 S1
       └─ E2-S3 (断线清除) ← 依赖 S2
            └─ E2-S4 (E2E 测试) ← 依赖 S2

E5-S1 (ZipArchiveService)
  └─ E5-S2 (Prisma 查询) ← 独立，可并行
       └─ E5-S3 (KV 存储) ← 依赖 S1+S2
            ├─ E5-S4 (Download endpoint) ← 依赖 S3
            └─ E5-S5 (Wrangler 配置) ← 独立
       └─ E5-S6 (E2E 测试) ← 依赖 S3+S4

E1-S1 (CI gate)
  └─ E1-S2 (as any 基线) ← 依赖 S1
  └─ E1-S3 (TS 评估) ← 独立

E2 和 E5 可并行开发
E1 独立
```

---

## 9. 产出清单

| 文件 | 说明 |
|------|------|
| `docs/vibex-sprint7-fix/prd.md` | 本文档 |
| `docs/vibex-sprint7-fix/analysis.md` | 来自 `vibex-proposals-20260424-qa/Sprint7-fix-analysis.md` |
| `docs/vibex-sprint7-fix/plan.md` | Feature List 表格 |
| `docs/vibex-sprint7-fix/specs/presence-avatars.md` | PresenceAvatars 组件四态规格 |
| `docs/vibex-sprint7-fix/specs/batch-export-card.md` | BatchExportCard 组件四态规格 |
| `docs/vibex-sprint7-fix/AS_ANY_BASELINE.md` | as any 基线记录 |
| `vibex-fronted/src/services/ZipArchiveService.ts` | 新建，Workers 兼容 ZIP 生成服务 |

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-sprint7-fix
- **执行日期**: 2026-04-24
- **前提条件**: E2 需 Firebase test project 凭证（未就绪时可 mock 降级）；E5 需 EXPORT_KV namespace 绑定
