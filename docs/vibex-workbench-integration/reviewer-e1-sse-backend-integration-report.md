# Review Report: vibex-workbench-integration / reviewer-e1-sse-backend-integration

**Agent**: REVIEWER | **Date**: 2026-04-20
**Commit**: 1df3072 (refactor: 重建 vibex-workbench spec 系统（自举）)
**Status**: ✅ **PASSED** — Fixes verified, TS clean, build passes

---

## INV 镜子检查

- [ ] INV-0: ✅ 实际读了所有关键文件（sse.ts, sse_server.py, +page.svelte, WorkbenchShell.svelte）
- [ ] INV-1: ✅ SSE URL 变更 grep 过消费方（sse.ts + +page.svelte 都用了 VITE_SSE_URL）
- [ ] INV-2: ✅ 类型看了，语义看了，context 看了
- [ ] INV-4: ✅ SSE URL 分散在 2 处（sse.ts + +page.svelte），已有 `SSE_URL` 常量模式
- [ ] INV-5: ✅ SSE 重连逻辑复用背景清楚
- [ ] INV-6: ✅ 验证从事件流→store→UI 链路走通
- [ ] INV-7: ✅ SSE 跨模块边界明确（consumer 在 lib/sse.ts，page 导入使用）

---

## 一、Commit 验证

### 第一步：Epic Commit 范围
- 最新 commit: `1df3072` refactor: 重建 vibex-workbench spec 系统（自举）
- E1 epic commit: `3cfb49a` feat(E1): 完成 SSE Backend Integration Epic
- 审查范围: diff 0005f56^..1df3072（E1批准后 → 最新）

### 第二步：Epic 专项文件变更检查
```bash
git diff 0005f56^..1df3072 --name-only
```
✅ 有变更文件（E1功能相关 + 新增spec生成文件）

### 第三步：Commit Message 关联检查
- `1df3072`: "refactor: 重建 vibex-workbench spec 系统（自举）" — 无 E1 标识
- 但此 commit 不属于 E1 Epic，是 E1 批准后的后续工作
- ✅ E1 epic commit `3cfb49a` 包含 E1 标识

### 第四步：CHANGELOG.md 关联检查
✅ `CHANGELOG.md` 已包含 E1 详细条目

---

## 二、Code Review — 功能代码（1df3072 新引入）

### 🔴 Blocker 1: TypeScript Error — `Step` 类型未定义
- **文件**: `frontend/src/lib/generated/types.ts:8`
- **问题**: `GenerationJob` 接口引用了 `Step` 类型，但文件中未定义
```typescript
export interface GenerationJob {
  id: string;
  startedAt: Date;
  completedAt: Date | null;
  status: 'running' | 'done' | 'error';
  steps: Step[];  // ❌ TS2304: Cannot find name 'Step'
}
```
- **影响**: `pnpm exec tsc --noEmit` 失败，阻断构建
- **修复建议**: 在 `types.ts` 中添加 `Step` 接口定义，或从 `generated.ts` 导入

### 🔴 Blocker 2: `$effect` 订阅未清理 — 内存泄漏
- **文件**: `frontend/src/routes/workbench/+page.svelte:24-27`
```typescript
$effect(() => {
  const unsub = canvasStore.subscribe(s => { canvasNodes = s.nodes.length; });
  return unsub;  // Svelte 5: 这不是 cleanup 函数，不释放订阅
});
```
- **问题**: Svelte 5 的 `$effect` cleanup 必须返回 void 或调用 teardown。在 `.subscribe()` 场景下需直接调用 `unsub()`
- **正确写法**:
```typescript
$effect(() => {
  return canvasStore.subscribe(s => { canvasNodes = s.nodes.length; });
});
```
- **影响**: 每次 effect re-run 不释放旧订阅 → 内存泄漏 + 重复订阅

### 🟡 Issue 1: Pre-existing TS Error — `data.code` 类型过窄
- **文件**: `frontend/src/lib/stores/dsl-canvas-store.ts:128`
```typescript
const data = await res.json() as { mermaid: string };
const code = data.mermaid || data.code || '';  // TS2339: Property 'code' does not exist
```
- **注意**: 此错误在 E1 commit (3cfb49a) 已存在，非本次引入
- **修复建议**: `as { mermaid: string; code?: string }` 或用 `as any`

---

## 三、Code Review — E1 Epic 核心实现（确认通过）

> 以下是 E1 Epic 的 SSE 后端集成实现确认（基于 3cfb49a 原始代码 + 1df3072 无变更部分）

### ✅ E1-U1: SSE URL 环境变量化
- `sse.ts:87`: `import.meta.env.VITE_SSE_URL || 'http://localhost:33335'`
- `+page.svelte:12`: `const SSE_URL = import.meta.env.VITE_SSE_URL || 'http://localhost:33335'`
- `.env.example`: ✅ 存在，包含 `VITE_SSE_URL=http://localhost:33335`
- `.gitignore`: ✅ `.env` 已加入

### ✅ E1-U2: SSE 指数退避重连
- `sse.ts`: `delay = 3000 * Math.pow(2, this.retryCount)` — 正确
- 序列: 3s→6s→12s→24s→48s，maxRetries=5 ✅
- `disconnect()` 重置计数器 ✅
- `connect()` 重置计数器 ✅

### ✅ CF-2: 右栏宽度 320px
- `WorkbenchShell.svelte`: `grid-template-columns: 280px 1fr 320px` ✅

### ✅ CF-3: SSE 连接清理
- `+page.svelte`: `onDestroy(() => { sseConsumer.disconnect(); });` ✅

### ✅ CF-4: .env.example 模板
- `frontend/.env.example`: `VITE_SSE_URL=http://localhost:33335` ✅

### ✅ SSE Backend Mock Server
- 端口 33335 ✅
- GET `/api/sse/threads/<threadId>` ✅
- POST `/api/runs` ✅
- 自动 mock run 流（run→tool×3→artifact→completed）✅

---

## 四、安全检查

### 🟡 Security: SSE Server 监听 0.0.0.0
- `sse_server.py:233`: `server = ThreadedHTTPServer((HOST, PORT), SSEHandler)`，HOST=""
- Python `HTTPServer(('', PORT))` 等于 `0.0.0.0`（所有接口）
- ⚠️ 开发环境可接受，生产环境建议绑定 `127.0.0.1`
- 评分: 🟡 开发阶段低风险，但需文档注明

### ✅ 无注入/XSS/硬编码敏感信息

---

## 五、代码质量

### 🟡 auto-generated 组件均为空占位符
- `frontend/src/lib/generated/components/*.svelte` — 所有组件都是空 shell
- `frontend/src/lib/generated/stores.ts` — 定义了 stores 但主代码不用它们
- 评估: 这些是 spec→code 生成的初始版本，符合预期（渐进实现）
- 无负面影响，当前未使用

### ✅ CHANGELOG.md 更新完整
- E1 包含 CF-1~CF-4 + E1-U1 + E1-U2 + Backend + Frontend 描述 ✅

---

## 六、审查结论 — Resubmission (fa2fc5b)

### ✅ **PASSED**

Dev 提交了修复 commit `fa2fc5b fix(E1): 修复 Reviewer 驳回的 TS 错误和 SSE 内存泄漏`

#### 修复验证

| 问题 | 修复方案 | 状态 |
|------|---------|------|
| `Step` type undefined | 在 `types.ts` 添加 `Step` 接口 ✅ | ✅ |
| `$effect` cleanup 缺失 | 返回 cleanup 函数 ✅ | ✅ |
| `data.code` type narrow | 新建 `dsl-canvas-store.ts` 重新定义类型 ✅ | ✅ |
| 无 reconnect 前 disconnect | `sseConsumer.disconnect()` 先于 `connect()` ✅ | ✅ |
| `onDestroy` 与 `$effect` 并存 | 移除 `onDestroy`，cleanup 统一在 `$effect` ✅ | ✅ |

#### TS + Build 验证
```
$ cd frontend && pnpm exec tsc --noEmit  # 无输出 = ✅
$ pnpm build                             # ✓ built in 2.46s ✅
```

### E1 Epic 功能 — ✅ 全部通过

| 项目 | 结果 |
|------|------|
| CF-1 ~ CF-4 | ✅ tester 验证通过 |
| E1-U1 (环境变量化) | ✅ VITE_SSE_URL 替换完成 |
| E1-U2 (指数退避) | ✅ 3s→6s→12s→24s→48s，max 5 |
| CHANGELOG | ✅ 完整 |
| TS 编译 | ✅ 通过 |
| Vite 构建 | ✅ 通过 |
| SSE 后端 | ✅ Python mock server 代码审查通过 |

### Security
- 🟡 SSE Server 监听 `0.0.0.0:33335` — 开发阶段低风险，建议文档注明

### 新增文件审查
- `ChangeRouter.svelte` — 关键词匹配式 spec 路由组件，代码质量良好，无安全风险
- `dsl-canvas-store.ts` — 重写版，类型正确，无 `data.code` 问题
- `backend/vibex-backend` — Go 二进制文件（非源码）

---

**INV 检查**: ✅ 全部通过  
**审查结论**: ✅ **PASSED** — 可以合并  
**行动项**: Reviewer 负责更新 CHANGELOG + commit + push

### ⚠️ Push 问题
- Remote `git@github.com:compound-engineering/vibex-workbench.git` 不存在
- Commit `ee2714b` (CHANGELOG update) 已本地提交，无法 push
- **需要**: 创建远程仓库或更正 remote URL

### 本地状态
```
Commit ee2714b: docs: update changelog for vibex-workbench-integration E1 TS fixes
Branch: master → origin/??? (remote 不存在)
```
