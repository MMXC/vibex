# Proposals Summary 2026-04-08

> **汇总日期**: 2026-04-08
> **汇总者**: Analyst Agent
> **数据来源**: 5 Agent 提案（dev/analyst/architect/pm/tester/reviewer）

---

## 提案来源统计

| Agent | 提案数 | P0 | P1 | P2 | P3 |
|-------|--------|-----|-----|-----|-----|
| dev | 14 | 3 | 3 | 8 | 0 |
| architect | 9 | 3 | 3 | 3 | 0 |
| pm | 7 | 2 | 3 | 2 | 0 |
| tester | 10 | 2 | 3 | 3 | 2 |
| reviewer | 8 | 4 | 3 | 1 | 0 |
| analyst | 5 | 2 | 2 | 1 | 0 |
| **合计** | **53** | **16** | **17** | **18** | **2** |

---

## P0 提案汇总（共 16 条）

### P0-1: CF Workers 运行时兼容性（跨 Dev/Architect 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| dev | D-P0-2 | `setInterval` 在 CF Workers V8 Isolates 中不工作 |
| dev | D-P0-3 | `NotificationService` 使用 `fs.*` API，Workers 不支持 |

**根因**: 实现时使用了 Node.js 特有 API，未考虑 Cloudflare Workers 运行时约束。

---

### P0-2: CORS Preflight 500（Dev/Architect/Analyst 交叉确认）

| 来源 | ID | 问题 |
|------|-----|------|
| architect | Ar-P0-1 | OPTIONS 命中 auth 中间件返回 401 |
| analyst | A-P0-2 | Snapshot CRUD 端点 0/6 实现，阻塞 Epic E4 |

**影响**: 跨域 POST 被阻断，Canvas 核心流程（contexts/flows/components）无法正常工作。

---

### P0-3: Zustand 状态碎片化（Architect/Analyst 交叉确认）

| 来源 | ID | 问题 |
|------|-----|------|
| architect | Ar-P0-2 | 42 stores (7895 LOC)，跨 store 同步导致 bug surface 扩大 |
| analyst | A-P1-2 | Zustand 双仓库遗留，canvas-split-hooks Epic 完成后未清理 |

---

### P0-4: `as any` 类型安全防线失效（Architect/Reviewer 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| architect | Ar-P0-3 | 生产代码 25+ 处 `as any`，TypeScript 类型安全防线失效 |
| reviewer | R-P0-3 | `useDDDStateRestore` 使用 `as any` 绕过类型检查 |
| reviewer | R-P1-3 | DDD store hooks 类型不一致导致 `as any` 传播链 |

---

### P0-5: 测试覆盖归零（Tester/Reviewer 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| tester | T-P0-1 | 35+ E2E 测试被 `@ci-blocking` 静默跳过，CI 覆盖率 0% |
| tester | T-P0-2 | Playwright `canvas-e2e` 项目路径指向不存在的 `./e2e` 目录 |
| reviewer | R-P0-1 | `useTreeToolbarActions` 无测试，破坏性重构风险高 |
| reviewer | R-P0-2 | `useCanvasPreview` 无测试，`isVisible` 硬编码 false |

---

### P0-6: CollaborationService Lock Bug（Dev 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| dev | D-P0-1 | `acquireLock` 覆写已存在 lock 时不重置 TTL，乐观锁失效 |

---

### P0-7: Canvas UI 功能缺失（PM 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| pm | P-P0-1 | `generateComponents` 空数据静默失败，无兜底 UI |
| pm | P-P0-2 | 删除按钮未完整绑定（仅 Flow 有 `onDelete`，Ctx/Component Tree 缺失） |

---

### P0-8: Snapshot Schema 无校验（Reviewer 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| reviewer | R-P0-4 | Snapshot API `z.array(z.any())` 无数据校验，可写任意数据 |

---

### P0-9: 提案执行率归零（Analyst 确认）

| 来源 | ID | 问题 |
|------|-----|------|
| analyst | A-P0-1 | 4月6/7日提案零落地，Sprint 规划公信力丧失 |

---

## P1 提案汇总（共 17 条）

| ID | 来源 | 问题 | 关联 P0 |
|----|------|------|---------|
| D-P1-1 | dev | JWT_SECRET 缺失静默放行 auth | P0-2 |
| D-P1-2 | dev | SSE buffer 边界分割 bug | — |
| D-P1-3 | dev | `acquireLock` 原子性问题 | P0-6 |
| Ar-P1-1 | architect | v1/canvas 单文件 387 行需拆分 | P0-3 |
| Ar-P1-2 | architect | Canvas 实时协作 WebSocket 未集成 | — |
| Ar-P1-3 | architect | legacy store 清理不彻底 | P0-3 |
| P-P1-1 | pm | 新手引导流程缺失 | — |
| P-P1-2 | pm | 项目搜索/过滤功能缺失 | — |
| P-P1-3 | pm | 需求模板库缺失 | — |
| T-P1-1 | tester | GitHub Actions E2E CI 缺失 | P0-5 |
| T-P1-2 | tester | Stryker mutation testing pnpm workspace 阻塞 | P0-5 |
| T-P1-3 | tester | 关键 Hook 无单元测试 | P0-5 |
| R-P1-1 | reviewer | `useAutoSave` 边界测试缺失 | P0-5 |
| R-P1-2 | reviewer | `useCanvasExport` `isExporting` 返回 ref 而非响应式 state | — |
| A-P1-1 | analyst | Changelog 断层（4/6、4/7 无记录） | A-P0-1 |
| A-P1-2 | analyst | Zustand 双仓库遗留未清理 | P0-3 |
| (空) | — | — | — |

---

## 跨 Agent 提案去重映射

| 主题 | 提案数 | 来源 |
|------|--------|------|
| CF Workers 兼容性 | 2 | D-P0-2, D-P0-3 |
| Snapshot API 缺失 | 2 | A-P0-2, R-P0-4 |
| Zustand 碎片化 | 3 | Ar-P0-2, A-P1-2, Ar-P1-3 |
| `as any` 传播链 | 3 | Ar-P0-3, R-P0-3, R-P1-3 |
| E2E CI 归零 | 3 | T-P0-1, T-P0-2, T-P1-1 |
| Hook 测试缺失 | 3 | R-P0-1, R-P0-2, T-P1-3 |
| 提案执行率 | 2 | A-P0-1, A-P1-1 |

---

## Sprint 规划建议

### Sprint 1（本周，P0 紧急，~5h）
| 优先级 | 提案 | 工时 | 来源 |
|--------|------|------|------|
| P0-6 | Lock TTL bug | 0.5h | D-P0-1 |
| P0-1 | CF Workers API 替换 | 1.5h | D-P0-2, D-P0-3 |
| P0-2 | CORS preflight 全局中间件 | 0.5h | Ar-P0-1 |
| P0-7 | 删除按钮绑定 + 空数据兜底 | 1h | P-P0-1, P-P0-2 |
| P0-5 | 修复 @ci-blocking 跳过问题 | 1.5h | T-P0-1, T-P0-2 |

### Sprint 2（下周，P1 推进，~8h）
| 优先级 | 提案 | 工时 | 来源 |
|--------|------|------|------|
| P0-2 | Snapshot CRUD 6端点 | 3h | A-P0-2, R-P0-4 |
| P0-3 | as any 消除 + Store 治理 | 3h | Ar-P0-3, R-P0-3 |
| P1 | JWT_SECRET/Auth 修复 | 1h | D-P1-1 |
| P1 | SSE buffer 边界修复 | 1h | D-P1-2 |

### Sprint 3（Tech Debt，P2，~12h）
| 优先级 | 提案 | 工时 | 来源 |
|--------|------|------|------|
| P0-3 | Zustand 状态合并 | 5h | Ar-P0-2 |
| P1 | Hook 测试补充 | 4h | R-P0-1, R-P0-2, T-P1-3 |
| P2 | E2E CI 恢复 | 3h | T-P1-1, T-P1-2 |

---

*数据截止: 2026-04-08 | 总计 53 提案 | P0×16, P1×17, P2×18, P3×2*
