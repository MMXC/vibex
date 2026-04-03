# Analysis: VibeX Architect 提案分析（Sprint 3 第二批）

**项目**: vibex-architect-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Analyst（需求分析师视角）

---

## 1. 业务场景分析（架构痛点）

### 1.1 Sprint 3 当前状态

| 项目 | 状态 | 备注 |
|------|------|------|
| E1 统一数据模型 | ✅ Done | NodeState 三树统一，Migration 3→4 |
| E2 后端版本化存储 | ✅ Done | CanvasSnapshot 表 + REST API |
| E3 自动保存 | ✅ Done | Debounce 2s + Beacon + SaveIndicator |
| **E4 同步协议** | ❌ **未完成** | 冲突检测 + UI 缺失 |
| canvasStore Facade | ⚠️ 部分完成 | 1513 行主文件仍存，stores/ 已拆分 |

### 1.2 架构质量基线

| 维度 | 现状 | 问题 |
|------|------|------|
| 代码规模 | `canvasStore.ts` 1513 行 | 单文件过大，维护成本高 |
| 类型安全 | 大量 `any` 类型 | TypeScript strict 未启用 |
| 测试覆盖 | Jest + Playwright 混用 | 职责边界模糊，beacon/rAF 无法 Jest 测试 |
| API 契约 | 后端 `/v1/canvas/snapshots` | 缺少契约测试，前后端格式漂移风险 |
| 并发安全 | 无冲突检测 | 多用户并发编辑无保护 |

### 1.3 昨日提案与今日提案的关系

| 昨日提案（已覆盖） | 今日新发现 | 关联性 |
|-------------------|-----------|--------|
| canvasStore 拆分策略 | canvasStore Facade 清理 | 延续，Facade 1513 行仍需治理 |
| 状态持久化分层 | E4 同步协议缺失 | 持久化最后一环未闭合 |
| CSS 规范 | API 契约测试缺失 | 新发现的质量盲区 |
| ADR 决策记录 | TS Strict 模式 | Dev 提案引发的架构需求 |

---

## 2. 核心 JTBD（架构视角）

| # | JTBD | 用户/角色 | 质量属性 | 紧迫度 |
|---|------|---------|---------|--------|
| **A1** | 完成 E4 同步协议，使多用户并发编辑有冲突检测与解决机制 | Dev（实现者）/ PM（期望功能完整性）| 数据一致性、可靠性 | P0 |
| **A2** | 清理 canvasStore Facade，将 1513 行主文件降至 < 300 行，消除技术债务积累 | Dev（日常开发者）| 可维护性、可测试性 | P1 |
| **A3** | 启用 TypeScript Strict 模式，将 `any` 类型减少 80%，提升类型安全基线 | Dev（全栈开发者）| 可靠性、可维护性 | P1 |
| **A4** | 建立前后端 API 契约测试，防止 `/v1/canvas/snapshots` 格式漂移 | Dev/Tester | 可靠性、跨团队协作 | P2 |
| **A5** | 统一前端测试策略，明确 Jest（单元/集成）与 Playwright（E2E）的边界 | Tester/Dev | 测试效率、CI 稳定性 | P2 |

---

## 3. 技术方案选项

### 方案 A：A1 + A2 打包实施（推荐）

**范围**: E4 同步协议 + canvasStore Facade 清理

**方案描述**:
1. **E4 Sync Protocol（4-6h）**
   - 在 `useAutoSave` 中添加 `version` 字段到 snapshot 请求
   - 后端 `snapshots.ts` 增加乐观锁检查（`localVersion < serverVersion → 409`）
   - 前端添加 `ConflictDialog` 冲突解决对话框（Keep Local / Accept Server / Merge）
2. **Facade 清理（3-4h）**
   - 分析 `canvasStore.ts` 剩余 1513 行，识别未迁移逻辑
   - 将 `CascadeUpdateManager`、直接定义的状态/动作迁移到对应 stores/
   - 逐步移除 `canvasStore.ts`，最终仅保留 re-export 和全局初始化逻辑

**工时估算**: 7-10h

**优势**:
- E4 是 canvas-json-persistence 最后缺失的 Epic，与 Facade 清理有协同效应（都涉及 store 重构）
- Facade 清理降低 E4 实现的复杂度
- 一次性解决两个高优先级技术债

**劣势**:
- 工时较长，单次 Sprint 无法完成所有
- 风险：Facade 清理可能影响现有组件引用

---

### 方案 B：A3 独立实施（TypeScript Strict 模式）

**范围**: 启用 TypeScript Strict + 修复前 50 个高频 `any`

**方案描述**:
1. 修改 `tsconfig.json`，启用 `strict: true` + `noImplicitAny: true`
2. 扫描全库 `any` 类型，按引用次数排序，取前 50 个高频项
3. 逐文件修复，优先处理 `lib/` 和 `components/` 核心目录
4. 在 CI 中增加 `tsc --strict` 检查，禁止新增 `@ts-ignore`（除非必要 review）

**工时估算**: 6-8h

**优势**:
- 独立性强，不依赖其他 Epic
- 类型安全是长期技术债，早做早收益
- 可分阶段实施（先 `noImplicitAny`，再 `strictNullChecks`）

**劣势**:
- 8h 工时对单个 Sprint 偏重
- 修复过程中可能引入 regression

---

### 方案 C：A4 独立实施（API 契约测试）

**范围**: 建立 `@那年夏天/vibex` API 契约测试层

**方案描述**:
1. 使用 **Pact** 或 **OpenAPI + Prism** 建立契约测试
2. 对 `/v1/canvas/snapshots` (POST/GET) 和 `/v1/canvas/rollback` 定义契约
3. Consumer（前端）：在 `tests/contracts/` 编写消费者测试，验证 API 响应格式
4. Provider（后端）：CI 中运行 provider 测试，确保后端响应符合契约
5. 集成到 GitHub Actions，PR 级别 blocking

**工时估算**: 4-5h

**优势**:
- 防止前后端 API 格式漂移
- 契约测试可在代码实际运行前发现问题
- 支持 Mock/Stub，降低集成测试依赖

**劣势**:
- 引入新工具（Pact），有学习曲线
- 当前 API 端点较少，ROI 有限

---

### 方案对比矩阵

| 维度 | 方案 A (E4+Facade) | 方案 B (TS Strict) | 方案 C (API 契约) |
|------|-------------------|-------------------|------------------|
| **工时** | 7-10h | 6-8h | 4-5h |
| **优先级** | P0 | P1 | P2 |
| **可测试性** | 高 | 高 | 中 |
| **风险** | 中（regression）| 中（类型修复）| 低（增量引入）|
| **依赖关系** | 无外部依赖 | 无外部依赖 | 需 API 稳定 |
| **长期价值** | 高 | 高 | 中 |
| **Sprint 适配** | Sprint 4 | Sprint 4 或 5 | Sprint 5+ |

---

## 4. 可行性评估

### 4.1 技术可行性

| 提案 | 可行性 | 依据 |
|------|--------|------|
| E4 Sync Protocol | ✅ 高 | 后端 Prisma 已有 version 字段，API 层已有 snapshot 端点，E4 仅需加乐观锁逻辑 |
| canvasStore Facade 清理 | ✅ 中 | stores/ 已拆分，剩余逻辑需逐行审查迁出，有一定 regression 风险 |
| TypeScript Strict 模式 | ✅ 高 | 分阶段引入，每阶段独立可测，不会阻塞开发 |
| API 契约测试 | ✅ 中 | Pact 生态成熟，但需学习成本，当前 API 数量较少 |

### 4.2 资源可行性

| 提案 | 所需资源 | 现状 | 缺口 |
|------|---------|------|------|
| E4 Sync Protocol | Dev (1人) | Dev 在 Sprint 3 | 无缺口 |
| canvasStore Facade | Dev (1人) | Dev 在 Sprint 3 | 无缺口 |
| TypeScript Strict | Dev (1人) | Dev 在 Sprint 3 | 无缺口 |
| API 契约测试 | Dev + Tester | Tester 可配合 | 无显著缺口 |

---

## 5. 初步风险识别

### 5.1 风险矩阵

| 风险 ID | 描述 | 概率 | 影响 | 风险等级 | 缓解策略 |
|---------|------|------|------|---------|---------|
| **R1** | E4 Sync Protocol Facade 清理后 regression | 中 | 高 | 🟡 中 | 每个迁移 commit 独立测试，覆盖率 > 80% |
| **R2** | TS Strict 模式引入大量编译错误，阻塞 CI | 高 | 高 | 🔴 高 | 分阶段启用，设置 2 周宽限期 |
| **R3** | 契约测试与当前 API 格式不兼容，需改后端 | 低 | 中 | 🟢 低 | 先建 mock 层，再逐步替换真实 API |
| **R4** | Facade 清理工时超预期（1513 行难以分割） | 中 | 中 | 🟡 中 | 先做增量分析（哪些行属于哪个 store），再执行 |
| **R5** | 多 Sprint 并行提案过多，Dev 资源稀释 | 高 | 中 | 🟡 中 | 控制在 1-2 个高优先级提案/Sprint |

### 5.2 关键依赖

```
方案 A（E4 + Facade）依赖链:
  Sprint 4 Day 1-2: canvasStore Facade 分析 + 迁移
  Sprint 4 Day 3-5: E4 冲突检测后端 + 前端 Dialog
  Sprint 4 Day 5: 集成测试 + CI 验证
```

---

## 6. 验收标准（具体可测试）

### A1: E4 同步协议

- [ ] `useAutoSave` hook 在保存时携带 `version` 字段
- [ ] 后端检测 `localVersion < serverVersion` 时返回 HTTP 409
- [ ] 前端在收到 409 时渲染 `ConflictDialog` 组件
- [ ] `ConflictDialog` 提供三个选项：Keep Local / Accept Server / Merge
- [ ] 冲突解决后，`version` 更新为 `serverVersion + 1`
- [ ] Playwright E2E 测试覆盖冲突场景（`conflict*.spec.ts`）

### A2: canvasStore Facade 清理

- [ ] `canvasStore.ts` 行数从 1513 行减少至 < 300 行
- [ ] 所有组件引用逐个切换到 `stores/` 中的模块（`useContextStore` 等）
- [ ] `canvasStore.ts` 保留 re-export 兼容层，不直接定义状态
- [ ] 迁移后 5 次 `npm test` 全部通过（无 regression）

### A3: TypeScript Strict 模式

- [ ] `tsconfig.json` 中 `strict: true` 已启用
- [ ] `tsc --noEmit` 编译错误数 ≤ 50（初始目标）
- [ ] `grep -c "@ts-ignore" src/` 新增 `@ts-ignore` 数量 = 0
- [ ] CI 中 `tsc --strict` 作为独立 step 运行

### A4: API 契约测试

- [ ] `tests/contracts/` 目录包含至少 3 个 Pact 测试文件
- [ ] `/v1/canvas/snapshots` POST/GET 接口有契约定义
- [ ] GitHub Actions 中契约测试在 PR 级别运行
- [ ] 契约破坏时 CI 返回非 0 退出码

### A5: 测试策略统一

- [ ] `docs/TESTING_STRATEGY.md` 文档明确 Jest（单元/集成）与 Playwright（E2E）的边界
- [ ] `beacon`、`requestAnimationFrame` 相关测试迁移到 Playwright
- [ ] `npm test` 不再包含 `waitForTimeout` 硬编码等待

---

## 7. 建议路线图

| Sprint | 实施内容 | 优先级 | 工时 |
|--------|---------|--------|------|
| **Sprint 4** | A1: E4 Sync Protocol + A2: Facade 清理 | P0 | 7-10h |
| **Sprint 5** | A3: TypeScript Strict 模式（Phase 1: noImplicitAny） | P1 | 3-4h |
| **Sprint 6** | A3: TypeScript Strict 模式（Phase 2: strict）+ A5: 测试策略统一 | P1 | 3-4h |
| **Sprint 7+** | A4: API 契约测试（API 稳定后启动） | P2 | 4-5h |

---

## 8. 结论

从架构视角，Sprint 3 已完成 canvas-json-persistence 的三个核心 Epic（E1-E3），E4 同步协议是必须填补的最后一块拼图。canvasStore Facade 清理是昨日 canvasStore 拆分提案的延续，1513 行主文件需要进一步治理。TypeScript Strict 模式和 API 契约测试是长期技术债，可在后续 Sprint 逐步解决。

**建议 Sprint 4 优先实施方案 A（A1+A2 打包），预计工时 7-10h，可系统性解决并发冲突和架构臃肿两个核心问题。**

---

*本文档由 Analyst Agent 生成于 2026-04-03 02:55 GMT+8*
*参考：vibex-architect-proposals-20260402_201318（昨日提案）、proposals/20260403/dev.md（Dev 今日提案）*
