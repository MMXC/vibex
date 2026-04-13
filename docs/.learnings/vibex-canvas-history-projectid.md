# VibeX Canvas History projectId 链路修复 — 经验沉淀

> **项目**: vibex-canvas-history-projectid
> **完成日期**: 2026-04-14
> **问题类型**: ui_bug + integration_issue
> **状态**: ✅ 完成
> **Epic 数**: 4（Phase1 止血 / Phase2 深度 / Epic1 Stories / Epic2 Stories）

---

## 问题回顾

### 原始问题

Canvas 画布点击"历史"按钮 → `GET /api/v1/canvas/snapshots?projectId=xxx` 返回 400，原因是 projectId 从 URL 参数读取后流转链路断裂，导致 projectId 为空或 undefined。

### 根因

**Phase1 止血**：`useVersionHistory` 依赖 URL 参数获取 projectId，但 Canvas 内部导航时 URL 参数丢失。

**Phase2 深度修复**：CanvasPage URL 注入 projectId 作为第二来源，contextStore 作为主来源，形成兜底链路。

---

## 解决方案

### Phase1 — 止血修复

```ts
// 止血：让 VersionHistoryPanel 从 contextStore 读取 projectId
// 不依赖 URL 参数，避免内部导航时丢失
const projectId = contextStore.currentProjectId;
await canvasApi.listSnapshots(projectId);
```

### Phase2 — 深度修复

```ts
// CanvasPage.tsx — URL 注入 projectId 到 contextStore
useEffect(() => {
  if (searchParams.has('projectId')) {
    contextStore.setProjectId(searchParams.get('projectId'));
  }
}, [searchParams]);

// 形成兜底链路：
// contextStore.projectId（主） → URL searchParams（次） → null（兜底）
```

---

## 核心教训

### 教训 1：URL 参数不适合作为组件内部状态来源

**问题模式**（❌）：
```ts
// URL 参数在 Canvas 内部导航时会丢失
const projectId = searchParams.get('projectId');
```

**正确模式**（✅）：
```ts
// Zustand store 作为主来源，URL 参数作为初始注入
const projectId = contextStore.projectId || searchParams.get('projectId');
```

**原则**：跨组件共享的状态应放在全局 store（Zustand），URL 参数只用于初始加载来源。

---

### 教训 2：两阶段修复策略

| 阶段 | 策略 | 目标 |
|------|------|------|
| Phase1 止血 | 最小改动，快速止血 | 让 projectId 从 store 读取，不依赖 URL |
| Phase2 深度 | 完善链路，覆盖所有入口 | URL 注入 store，内部导航不丢失 |

---

### 教训 3：Stories 层测试是质量保障

Epic1/Epic2 各有 Stories 层验收：
- S1.3：projectId 变化自动重载
- S1.4：E2E 测试覆盖
- S2.1/S2.2/S2.3：Phase2 URL 注入全覆盖

Stories 层确保功能在真实场景下可用，而非仅靠单元测试。

---

## 预防措施

1. **跨组件共享状态必须放在 Zustand store**，禁止通过 URL 参数在组件间传递
2. **Canvas 内部导航时 URL 参数会丢失**，任何从 URL 读取的共享状态必须有 store 兜底
3. **两阶段修复**：止血（最小改动）+ 深度修复（完善链路），止血不能代替深度修复
4. **每个 API 调用点必须验证 projectId 存在**，空 projectId 应返回 400 而非 401

---

## 相关文档

- `docs/vibex-canvas-history-projectid/architecture.md` — 技术设计
- `docs/vibex-canvas-history-projectid/prd.md` — 产品需求文档
- `docs/vibex-canvas-history-projectid/analysis.md` — 根因分析
- `docs/.learnings/vibex-canvas-auth-fix.md` — 401 错误 UI 差异化（相关：历史功能）
