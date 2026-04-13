# VibeX Canvas QA Fix — 经验沉淀

> **项目**: vibex-canvas-qa-fix
> **完成日期**: 2026-04-13
> **状态**: ✅ 完成（E4 测试 commit 待 push）

---

## 问题回顾

### Bug #1: React Error #300 — SSR/CSR Hydration 不匹配
- **症状**: 直接访问 `/canvas` 触发 "Something went wrong"
- **根因**: Zustand persist middleware 在 SSR 时尝试访问 `window.localStorage`，导致水合不匹配
- **修复**: 5 个 canvas store 添加 `skipHydration: true` + `CanvasPage.tsx` mount 时手动 `rehydrate()`
- **涉及文件**: contextStore, flowStore, componentStore, uiStore, sessionStore, CanvasPage.tsx

### Bug #2: 版本历史 API 404
- **症状**: 点击"历史"按钮时 `GET /api/canvas/snapshots` 返回 404
- **根因**: `api-config.ts` 的 snapshots 端点缺少 `/v1/` 前缀
- **修复**: `snapshots: '/v1/canvas/snapshots'`
- **验证**: `curl /api/v1/canvas/snapshots` → 401（路由存在，非 404）

### Bug #3: Tab 标签页全部 disabled
- **症状**: context/flow/component Tab 全部 locked
- **根因**: `contextStore` 的 `phase` 默认值为 `'input'`，TabBar guard 基于 phase 控制可用性
- **修复**: `contextStore` 默认 `phase: 'context'`
- **注意**: TabBar.tsx 守卫逻辑正确，无需修改

---

## 关键教训

### 1. Zustand Persist + SSR 必须用 skipHydration
```typescript
// ✅ 正确
persist(
  (set, get) => ({ ... }),
  { name: 'store-key', skipHydration: true }
)

// 在客户端手动 rehydrate
useEffect(() => {
  useStore.persist.rehydrate?.()
}, [])
```

### 2. API 路径前缀 /v1/ 是必须的
Cloudflare Workers 路由统一使用 `/v1/` 前缀。API 配置中必须保持一致。

### 3. TabBar phase 守卫基于 contextStore 而非 sessionStore
TabBar 读取的是 `contextStore.phase`，不是 `sessionStore`。新建用户 contextStore 默认值决定 Tab 可用性。

### 4. 测试是信息缺口，非阻塞项
Epic4 测试是 QA 工程师发现的信息缺口（无单元测试覆盖），reviewer 判断为非阻塞项。但实际执行时仍有测试 commit，需要确保测试 commit 也 push 到远程。

---

## 技术债务

### 1. Epic4 测试 commit 未 push
- **Commit**: `a4ece62f` (skipHydration + API config tests, vitest 20/20)
- **状态**: 仅在本地，未 merge/push 到 origin/main
- **操作**: 建议后续合并或在下次迭代中补充

---

## 代码质量

| 检查项 | 结果 |
|--------|------|
| TypeScript (tsc --noEmit) | ✅ |
| Build (pnpm build) | ✅ |
| Vitest (20/20) | ✅ |
| Changelog 更新 | ✅ (Epic 1-3) |
| 远程 Push | ⚠️ (E4 未 push) |

---

## 时间记录

| Epic | 工时 | 状态 |
|------|------|------|
| E0 前置验证 | ~0.5h | ✅ |
| E1 Hydration | ~3h | ✅ |
| E2 API 路径 | ~0.5h | ✅ |
| E3 Tab phase | ~0.5h | ✅ |
| E4 测试 | ~1h | ✅ (pending push) |
| **合计** | **~5.5h** | ✅ |

---

*沉淀时间: 2026-04-13*
