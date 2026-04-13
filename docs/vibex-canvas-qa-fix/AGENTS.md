# AGENTS.md — VibeX Canvas QA 修复项目编码规范

> **项目**: vibex-canvas-qa-fix
> **版本**: 1.0
> **日期**: 2026-04-13

---

## 1. 项目约束

### 1.1 变更范围（红线内）

本次迭代 **仅限** 以下文件：

| 文件 | 允许操作 | Story |
|------|----------|-------|
| `src/lib/canvas/stores/contextStore.ts` | 修改 persist config + phase 默认值 | E1.1 + E3.1 |
| `src/lib/canvas/stores/flowStore.ts` | 修改 persist config | E1.2 |
| `src/lib/canvas/stores/componentStore.ts` | 修改 persist config | E1.3 |
| `src/lib/canvas/stores/uiStore.ts` | 修改 persist config | E1.4 |
| `src/lib/canvas/stores/sessionStore.ts` | 修改 persist config | E1.5 |
| `src/components/canvas/CanvasPage.tsx` | 新增 useEffect rehydrate | E1.6 |
| `src/lib/api-config.ts` | 修改 snapshots 路径 | E2.1 |
| `src/lib/canvas/stores/__tests__/skipHydration.test.ts` | 新增测试文件 | E4.1 |
| `src/lib/__tests__/api-config.test.ts` | 新增测试文件 | E4.2 |

### 1.2 禁止变更范围

以下文件/模块 **不得修改**（本次迭代锁死）：

- `src/components/canvas/TabBar.tsx`（守卫逻辑只读）
- `src/lib/canvas/stores/*.test.ts`（现有 store 测试文件）
- 其他 canvas store 文件（如 `confirmDialogStore.ts`）
- `src/lib/canvas/api-canvas.ts`（Canvas API 调用层）
- `src/lib/canvas/stores/index.ts`（store 导出汇总，除非新增导出）

### 1.3 技术栈锁定

| 技术 | 版本要求 | 约束理由 |
|------|----------|----------|
| Zustand | 4.5.7（已有） | persist middleware API 稳定 |
| React | 19.x（已有） | CanvasPage 使用 hooks |
| TypeScript | strict（已有） | 非功能性要求 |
| Vitest | latest（已有） | 现有测试框架 |
| Playwright | latest（已有） | 现有 E2E 框架 |

---

## 2. 代码规范

### 2.1 skipHydration 规范

```typescript
// ✅ 正确：persist config 增加 skipHydration: true
{
  name: 'vibex-context-store',
  skipHydration: true,  // ← 必须
}

// ❌ 错误：只写 name，不加 skipHydration
{ name: 'vibex-context-store' }

// ❌ 错误：添加到错误的层级
persist(
  (set, get) => ({ ... }),
  { name: 'vibex-context-store', skipHydration: true }  // ← 第二个参数！
)
```

### 2.2 CanvasPage rehydrate 规范

```typescript
// ✅ 正确：空依赖数组，只执行一次
useEffect(() => {
  useContextStore.persist.rehydrate();
  useFlowStore.persist.rehydrate();
  useComponentStore.persist.rehydrate();
  useUIStore.persist.rehydrate();
  useSessionStore.persist.rehydrate();
}, []);  // ← 空数组！

// ❌ 错误：依赖数组非空，导致重复 rehydrate
useEffect(() => {
  useContextStore.persist.rehydrate();
}, [someDependency]);
```

### 2.3 API 路径规范

```typescript
// ✅ 正确：snapshots 路径含 /v1/ 前缀
snapshots: '/v1/canvas/snapshots',

// ❌ 错误：缺少 /v1/ 前缀
snapshots: '/canvas/snapshots',

// 确认一致性：snapshot 和 restoreSnapshot 必须与 snapshots 格式一致
snapshot: (id: string) => `/v1/canvas/snapshots/${id}`,        // 含 /v1/
restoreSnapshot: (id: string) => `/v1/canvas/snapshots/${id}/restore`, // 含 /v1/
```

### 2.4 Default phase 规范

```typescript
// ✅ 正确：默认 phase 为 'context'
phase: 'context',

// ❌ 错误：默认 phase 为 'input'（这是 bug 根因）
phase: 'input',
```

---

## 3. 安全红线（🚨 绝对禁止）

### 🚨 红线 1: 禁止修改 TabBar.tsx 的守卫逻辑

```
TabBar.tsx 第 54-57 行的 phase 守卫逻辑只读
```

- ❌ 修改 `if (tabIdx > phaseIdx)` 的判断条件
- ❌ 删除守卫逻辑
- ❌ 修改 `PHASE_ORDER` 数组

### 🚨 红线 2: 禁止修改已有 store 的状态结构

```
本次只改 persist config 和 phase 默认值
```

- ❌ 修改 store 的 state interface
- ❌ 添加或删除 state 字段
- ❌ 修改已有 Zustand middleware 链

### 🚨 红线 3: 禁止删除现有 useEffect

```
CanvasPage.tsx 已有 useEffect，新增不替换
```

- ❌ 删除现有的 useEffect（即使看起来是 no-op）
- ❌ 在 rehydrate useEffect 中添加其他副作用

### 🚨 红线 4: 禁止修改其他 canvas store

```
只改 5 个 canvas store（context/flow/component/ui/session）
```

- ❌ 修改 `confirmDialogStore.ts`
- ❌ 修改 `messageBridge.ts`
- ❌ 修改 `index.ts` 导出

---

## 4. Git 提交规范

### 4.1 Commit Message 格式

```
fix(canvas-hydration): add skipHydration to contextStore
fix(canvas-hydration): add skipHydration to flowStore
fix(canvas-hydration): add skipHydration to componentStore
fix(canvas-hydration): add skipHydration to uiStore
fix(canvas-hydration): add skipHydration to sessionStore
fix(canvas-hydration): add rehydrate useEffect in CanvasPage
fix(canvas-api): add /v1/ prefix to snapshots endpoint
fix(canvas-tab): default phase to 'context' for new users
test(canvas-qa): add skipHydration and API config tests
```

---

## 5. 代码审查清单（Reviewer 用）

### 5.1 必查项

- [ ] `grep "skipHydration: true" src/lib/canvas/stores/*.ts` 输出 5 行
- [ ] `grep "rehydrate" src/components/canvas/CanvasPage.tsx` 有输出
- [ ] `grep "/v1/canvas/snapshots" src/lib/api-config.ts` 有输出
- [ ] `grep "phase: 'context'" src/lib/canvas/stores/contextStore.ts` 有输出（E3 目标文件是 contextStore）
- [ ] TabBar.tsx 未被修改
- [ ] 无其他 canvas store 被修改
- [ ] `pnpm vitest run` 全绿
- [ ] `pnpm build` 无报错

### 5.2 E2E 覆盖确认

- [ ] TC-001: 直接访问 /canvas 无 Error #300
- [ ] TC-002: 5 stores 均有 skipHydration 配置
- [ ] TC-003: snapshots API 返回非 404
- [ ] TC-004: 新用户 context Tab 可用

---

*编码规范: ✅ 完成*
*Next: Dev 按规范实现 → Reviewer 按清单审查*

---

## 6. QA Server 命令（Tester 用）

### 6.1 qa:server — 手动 QA 调试

```bash
pnpm qa:server
# 或: ./scripts/qa-server.sh start
```

- 构建 standalone 模式（middleware + API routes 正常工作）
- 启动 server on http://localhost:3000
- Ctrl+C 停止，自动清理

### 6.2 test:e2e:qa — CI E2E 测试

```bash
pnpm test:e2e:qa
```

- standalone build → 启动 server → Playwright E2E → 清理

### 6.3 技术细节

- `next.config.js` 原生支持 `NEXT_OUTPUT_MODE=standalone` 环境变量
- standalone 输出路径: `.next/standalone/vibex-fronted/server.js`
- 注意: `next.config.js` 优先级高于 `next.config.ts`
