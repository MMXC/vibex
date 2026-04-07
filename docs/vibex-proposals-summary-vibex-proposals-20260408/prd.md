# PRD: VibeX Proposals Summary 2026-04-08

> **项目**: vibex-proposals-summary-vibex-proposals-20260408
> **目标**: 基于 5 Agent 53 条提案，按主题打包形成统一实施计划
> **来源**: 5 Agent 提案汇总（dev/analyst/architect/pm/tester/reviewer）
> **PRD 作者**: pm agent
> **日期**: 2026-04-08
> **版本**: v1.0

---

## 1. 执行摘要

### 背景
2026-04-08 完成第二轮提案收集，5 个 Agent 共提出 **53 条提案**（P0×16, P1×17, P2×18, P3×2）。提案来源分散（dev×14, tester×10, architect×9, reviewer×8, pm×7, analyst×5），同一根因被多人重复识别。

### 提案来源
| Agent | 提案数 | P0 | P1 | P2 | P3 |
|-------|--------|-----|-----|-----|-----|
| dev | 14 | 3 | 3 | 8 | 0 |
| architect | 9 | 3 | 3 | 3 | 0 |
| pm | 7 | 2 | 3 | 2 | 0 |
| tester | 10 | 2 | 3 | 3 | 2 |
| reviewer | 8 | 4 | 3 | 1 | 0 |
| analyst | 5 | 2 | 2 | 1 | 0 |
| **合计** | **53** | **16** | **17** | **18** | **2** |

### 目标
- P0: 止血（CF Workers 兼容、CORS/Snapshot、类型安全、测试覆盖、提案追踪）
- P1: 基础设施完善（UI 功能、状态治理、WebSocket、CI 稳定）
- P2: 长期技术债（架构拆分、Zustand 清理、模板库、Accessibility）

### 成功指标
- AC1: CF Workers 环境下 NotificationService 不抛出 `fs.*` 错误
- AC2: OPTIONS 返回 204，非 401
- AC3: `as any` 结果数从 25+ 降至 ≤ 5
- AC4: E2E CI `@ci-blocking` 测试执行（不跳过）
- AC5: 提案追踪 TRACKING.md 48h 内有 P0 被认领

---

## 2. Planning — 提案主题聚类

基于 analysis.md 的关联分析，53 条提案聚类为 7 大主题：

| 主题 | 提案数 | P0 | P1 | P2 | 代表提案 |
|------|--------|-----|-----|-----|---------|
| CF Workers 兼容性 | 6 | 3 | 2 | 1 | D-P0-2, D-P0-3 |
| CORS + Snapshot API | 3 | 2 | 1 | 0 | Ar-P0-1, A-P0-2 |
| 类型安全（as any）| 5 | 3 | 2 | 0 | Ar-P0-3, R-P0-3 |
| 测试覆盖恢复 | 8 | 4 | 2 | 2 | T-P0-1, R-P0-1 |
| Canvas UI 功能 | 10 | 2 | 4 | 4 | P-P0-1, P-P0-2 |
| Zustand 状态治理 | 6 | 2 | 2 | 2 | Ar-P0-2, A-P1-2 |
| 提案执行追踪 | 15 | 0 | 4 | 9 | A-P0-1, A-P1-1 |
| **合计** | **53** | **16** | **17** | **18** | |

---

## 3. Epic 拆分

### Epic 总览

| Epic | 名称 | 优先级 | 工时 | 来源主题 |
|------|------|--------|------|----------|
| E1 | 基础设施修复 | P0 | 5h | CF Workers + CORS |
| E2 | 数据完整性 | P0 | 8h | Snapshot API + 类型安全 |
| E3 | 测试覆盖恢复 | P0 | 6h | E2E CI + Hook 测试 |
| E4 | Canvas UI 修复 | P1 | 4h | 空数据兜底 + 删除按钮 |
| E5 | Zustand 状态治理 | P1 | 6h | 双仓库 + legacy 清理 |
| E6 | 提案执行追踪 | P1 | 2h | TRACKING.md + Changelog |
| E7 | 长期技术债 | P2 | 12h | WebSocket + 架构拆分 + 模板库 |
| **合计** | | | **43h** | |

---

### Epic 1: 基础设施修复（P0）

**根因**: CF Workers 不支持 Node.js 特有 API，但代码中大量使用了 `setInterval`、`fs.*`、`NotificationService.fs.*`。

**提案来源**: D-P0-2, D-P0-3, Ar-P0-1, D-P1-2, D-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S1.1 | CF Workers 运行时兼容 | 2h | NotificationService 无 fs.* 错误 |
| S1.2 | CORS OPTIONS 预检修复 | 1h | OPTIONS 返回 204，非 401 |
| S1.3 | Lock acquireLock TTL Bug | 1h | Lock 不被覆写，TTL 正确 |
| S1.4 | JWT_SECRET 缺失修复 | 1h | 缺失时拒绝 auth |

**S1.1 验收标准**:
- `expect(() => new NotificationService()).not.toThrow(/fs\./)` ✓
- `expect(window.setInterval).toBeDefined()` (CF Workers 环境) ✓

**S1.2 验收标准**:
- `expect(curl -X OPTIONS -I /v1/canvas/snapshots).toBe(204)` ✓

**S1.3 验收标准**:
- 并发 acquireLock → `expect(lock.ttl).toBe(resetValue)` ✓

**DoD**:
- [ ] CF Workers 环境下 NotificationService 初始化成功
- [ ] OPTIONS 返回 204 + CORS headers
- [ ] Lock 在高并发下 TTL 正确重置
- [ ] JWT_SECRET 缺失时 auth 返回 401

---

### Epic 2: 数据完整性（P0）

**根因**: Snapshot API 0/6 实现，schema 使用 `z.array(z.any())`，类型安全防线失效。

**提案来源**: A-P0-2, R-P0-3, R-P0-4, R-P1-3, Ar-P0-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S2.1 | Snapshot API 6 端点实现 | 4h | 201/200/204 响应 |
| S2.2 | Snapshot Schema Zod 校验 | 2h | 无效 payload 返回 400 |
| S2.3 | as any 消除 | 2h | 结果数从 25+ 降至 ≤5 |

**S2.1 验收标准**:
- `expect(POST /snapshots).toBe(201)` ✓
- `expect(GET /snapshots/latest).toMatchObject({ id: expect.any(String) })` ✓
- `expect(DELETE /snapshots/:id).toBe(204)` ✓

**S2.2 验收标准**:
- `expect(CreateSnapshotSchema.safeParse(invalid).success).toBe(false)` ✓
- `expect(POST /snapshots with invalid).toBe(400)` ✓

**S2.3 验收标准**:
- `expect(grep -r 'as any' src/ | wc -l).toBeLessThanOrEqual(5)` ✓

**DoD**:
- [ ] Snapshot 6 端点全部可调用
- [ ] 无效 payload 返回 400 + details
- [ ] `as any` 出现次数 ≤ 5
- [ ] DDD store hooks 统一类型导出

---

### Epic 3: 测试覆盖恢复（P0）

**根因**: 35+ E2E 测试被 `@ci-blocking` 跳过，Hook 测试完全缺失。

**提案来源**: T-P0-1, T-P0-2, R-P0-1, R-P0-2, R-P1-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S3.1 | E2E CI 修复 | 2h | @ci-blocking 测试执行 |
| S3.2 | Playwright 路径修复 | 1h | canvas-e2e 可独立运行 |
| S3.3 | useTreeToolbarActions 测试 | 1h | 3 tests pass |
| S3.4 | useCanvasPreview 测试 | 1h | canPreview 逻辑正确 |
| S3.5 | useAutoSave 边界测试 | 1h | 6 边界场景 pass |

**S3.1 验收标准**:
- `expect(grep '@ci-blocking' E2E tests).toBeExecuted()` (非 skipped) ✓

**DoD**:
- [ ] E2E CI 不再跳过 @ci-blocking 测试
- [ ] Playwright 路径指向正确目录
- [ ] `useTreeToolbarActions.test.ts` 和 `useCanvasPreview.test.ts` 存在且通过
- [ ] `useAutoSave.boundary.test.ts` 覆盖 6 个场景

---

### Epic 4: Canvas UI 修复（P1）

**根因**: 组件生成空数据无兜底，删除按钮未绑定。

**提案来源**: P-P0-1, P-P0-2, P-P1-1, P-P1-2, P-P1-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S4.1 | 空数据兜底 | 2h | EmptyState + Toast |
| S4.2 | 删除按钮绑定 | 1h | 三树 onDelete 正确 |
| S4.3 | 新手引导蒙层 | 1h | 3 步引导出现 |

**S4.1 验收标准**:
- `expect(screen.getByText(/组件生成失败/i)).toBeInTheDocument()` when components=[]
- `expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument()` ✓

**S4.2 验收标准**:
- 选中节点 → 点击删除 → `expect(screen.queryByText(selectedNode)).not.toBeInTheDocument()` ✓

**DoD**:
- [ ] flowId 为空时禁用"继续·组件树"按钮
- [ ] 空数据时显示 EmptyState（含重试）
- [ ] 三树 TreeToolbar onDelete 正确绑定
- [ ] 首次访问 Canvas 显示 3 步引导

---

### Epic 5: Zustand 状态治理（P1）

**根因**: 42 stores（7895 LOC），双仓库遗留，legacy store 清理不彻底。

**提案来源**: Ar-P0-2, A-P1-2, Ar-P1-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S5.1 | Zustand Audit Phase1 | 3h | stores/audit.md 存在 |
| S5.2 | canvas/stores/alias.ts | 2h | TypeScript 编译通过 |
| S5.3 | v1/canvas 拆分 | 1h | 文件行数 ≤ 200 |

**S5.1 验收标准**:
- `expect(fs.existsSync('stores/audit.md')).toBe(true)` ✓
- `expect(grep '重叠' stores/audit.md).toBeTruthy()` ✓

**S5.2 验收标准**:
- `expect(tsc --noEmit stores/canvas/stores/alias.ts).toBe(0)` ✓

**DoD**:
- [ ] `stores/audit.md` 包含状态重叠矩阵
- [ ] `alias.ts` 向后兼容，TypeScript 编译通过
- [ ] v1/canvas 路由文件 ≤ 200 行

---

### Epic 6: 提案执行追踪（P1）

**根因**: 4月6/7日提案零落地，缺乏追踪机制。

**提案来源**: A-P0-1, A-P1-1, A-P1-3

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S6.1 | TRACKING.md 创建 | 1h | 文件存在 |
| S6.2 | Changelog 补录 | 0.5h | 2026-04-06/07 条目存在 |
| S6.3 | CLAUDE.md 规范 | 0.5h | 规范存在 |

**S6.1 验收标准**:
- `expect(fs.existsSync('docs/proposals/TRACKING.md')).toBe(true)` ✓
- `expect(grep 'status:' docs/proposals/TRACKING.md | wc -l).toBeGreaterThan(20)` ✓

**DoD**:
- [ ] `docs/proposals/TRACKING.md` 包含 53 条提案
- [ ] 每条有 `status` + `assignee` 字段
- [ ] `CHANGELOG.md` 包含 2026-04-06/07 全部 Epic
- [ ] `CLAUDE.md` 包含 changelog 更新规范

---

### Epic 7: 长期技术债（P2）

**根因**: WebSocket 未集成、架构拆分、Accessibility 未达标。

**提案来源**: Ar-P1-2, Ar-P1-1, P-P2-1, P-P2-2, T-P3-1

**Story**:
| Story | 描述 | 工时 | 验收标准 |
|-------|------|------|----------|
| S7.1 | WebSocket 实时协作 | 5h | 多人协作状态同步 |
| S7.2 | TreeToolbar 共享抽象 | 4h | 三树减少 30% 代码 |
| S7.3 | Undo/Redo 验证 | 2h | Ctrl+Z 工作正常 |
| S7.4 | Accessibility 修复 | 1h | 颜色对比度达标 |

**DoD**:
- [ ] WebSocket 心跳正常（每 30s ping/pong）
- [ ] TreeToolbar 独立文件，三树减少 30% 重复代码
- [ ] Undo/Redo 链路正确
- [ ] 颜色对比度 WCAG AA 标准

---

## 4. 功能点汇总

| ID | 功能点 | Epic | 验收标准 | 页面集成 |
|----|--------|------|----------|----------|
| F1.1 | CF Workers 兼容 | E1 | expect().not.toThrow(fs) | 无 |
| F1.2 | CORS OPTIONS 修复 | E1 | expect(204).toBe(204) | 无 |
| F1.3 | Lock TTL 修复 | E1 | expect(lock.ttl).toBeCorrect | 无 |
| F2.1 | Snapshot 6 端点 | E2 | expect(201/200/204) | 无 |
| F2.2 | Zod schema 校验 | E2 | expect(400).toBe(400) | 无 |
| F2.3 | as any 消除 | E2 | expect(count).toBe ≤5 | 无 |
| F3.1 | E2E CI 修复 | E3 | expect(executed).not.toBeSkipped | 无 |
| F3.2 | Hook 测试 | E3 | expect(vitest).toBe(0) | 无 |
| F4.1 | EmptyState 兜底 | E4 | expect(text).toContain('失败') | 【需页面集成】 |
| F4.2 | 删除按钮绑定 | E4 | expect(deleted).toBe(true) | 【需页面集成】 |
| F5.1 | stores/audit.md | E5 | expect(exists) | 无 |
| F6.1 | TRACKING.md | E6 | expect(count).toBe(53) | 无 |
| F7.1 | WebSocket | E7 | expect(sync).toBe(true) | 无 |

---

## 5. 验收标准汇总

| ID | Given | When | Then |
|----|-------|------|------|
| AC1 | CF Workers | NotificationService 初始化 | 不抛出 fs.* 错误 |
| AC2 | OPTIONS | 跨域 preflight | 204 + CORS headers |
| AC3 | Snapshot API | POST /snapshots | 201 + 数据存入 |
| AC4 | as any 搜索 | grep 结果 | ≤ 5 处 |
| AC5 | E2E CI | 运行测试 | @ci-blocking 执行（非跳过） |
| AC6 | Hook 测试 | vitest run | 0 failures |
| AC7 | TRACKING.md | 48h 后检查 | 至少 1 个 P0 被认领 |
| AC8 | 新手引导 | 首次访问 Canvas | 3 步引导蒙层出现 |

---

## 6. DoD (Definition of Done)

### E1: 基础设施修复
- [ ] CF Workers 环境 NotificationService 初始化成功
- [ ] OPTIONS 返回 204 + CORS headers
- [ ] Lock 高并发下 TTL 正确

### E2: 数据完整性
- [ ] Snapshot 6 端点全部可调用
- [ ] Zod 校验正确拒绝无效 payload
- [ ] `as any` ≤ 5 处

### E3: 测试覆盖恢复
- [ ] E2E CI @ci-blocking 不跳过
- [ ] Hook 测试覆盖 useTreeToolbarActions/useCanvasPreview/useAutoSave

### E4: Canvas UI 修复
- [ ] EmptyState + Toast 兜底正常
- [ ] 三树删除按钮功能正常
- [ ] 新手引导 3 步完成

### E5: Zustand 状态治理
- [ ] stores/audit.md 存在
- [ ] alias.ts TypeScript 编译通过

### E6: 提案执行追踪
- [ ] TRACKING.md 包含 53 条提案
- [ ] Changelog 补录完整

### E7: 长期技术债
- [ ] WebSocket 实时协作
- [ ] TreeToolbar 独立抽取
- [ ] Undo/Redo 链路正确

---

## 7. 实施计划

### Sprint 1 (P0 止血, 5h)
| Epic | 内容 | 工时 |
|------|------|------|
| E1 | CF Workers + CORS + Lock | 5h |

### Sprint 2 (P0 数据完整性, 8h)
| Epic | 内容 | 工时 |
|------|------|------|
| E2 | Snapshot API + 类型安全 | 8h |

### Sprint 3 (P0 测试覆盖, 6h)
| Epic | 内容 | 工时 |
|------|------|------|
| E3 | E2E CI + Hook 测试 | 6h |

### Sprint 4 (P1 基础设施, 12h)
| Epic | 内容 | 工时 |
|------|------|------|
| E4 | Canvas UI 修复 | 4h |
| E5 | Zustand 治理 | 6h |
| E6 | 提案执行追踪 | 2h |

### Sprint 5 (P2 技术债, 12h)
| Epic | 内容 | 工时 |
|------|------|------|
| E7 | WebSocket + 架构 + Undo/Redo | 12h |

---

## 8. 非功能需求

| 需求 | 描述 |
|------|------|
| 性能 | CF Workers API 替换不引入额外延迟 |
| 兼容性 | Snapshot API 兼容历史数据格式 |
| 可测试性 | 所有功能有单元或集成测试覆盖 |

---

## 9. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| CF Workers 替换破坏现有功能 | 必须有单元测试保护，gstack 截图验证 |
| `as any` 消除产生连锁错误 | 使用 eslint-disable 渐进迁移，每次改一处 |
| E2E CI 修复暴露更多 flaky | 优先修复已知 5 个 flaky，逐步恢复 |

---

*文档版本: v1.0 | 最后更新: 2026-04-08*
