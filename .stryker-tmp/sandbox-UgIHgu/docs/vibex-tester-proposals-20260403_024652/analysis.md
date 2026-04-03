# Analysis: Tester Proposals — Sprint 3 测试质量深化

**日期**: 2026-04-03
**Agent**: analyst
**项目**: vibex-tester-proposals-20260403_024652
**参考基准**: 昨日提案 `vibex-tester-proposals-20260402_201318`（已覆盖 DoD 约束、遗留驳回项、Store 覆盖率、E2E 基础覆盖、tester 早期介入、状态同步）

---

## 1. 业务场景分析（测试痛点）

### 1.1 当前测试质量全貌

| 层级 | 范围 | 测试文件数 | 覆盖率 | 痛点 |
|------|------|-----------|--------|------|
| Backend API | 所有 API Route | 279 | 高（路由级） | 无 contract 测试，前后端 API 契约依赖人工对齐 |
| Frontend Hooks | `src/hooks/` | 20+ | 中 | 大量 hooks 有测试，但未覆盖边界条件和异步错误 |
| Frontend E2E | Canvas 核心交互 | 10+ | 中低 | **不稳定**（flaky），`canvas-phase2.spec.ts` 等偶发失败 |
| Store 层 | Canvas stores | 部分 | 低 | sessionStore 无测试（遗留），新拆分 store 无强制覆盖率要求落实 |
| 组件层 | Canvas 组件 | 极少 | 极低 | Canvas 三树组件（`BoundedContextTree`、`ComponentTree` 等）基本无测试 |

### 1.2 核心痛点识别

**痛点 1: 测试有效性无法量化（突变测试缺失）**
昨天提案的 Epic 3（Store 覆盖率）设定了行覆盖率目标（≥80%），但**覆盖率 ≠ 测试有效性**。一个覆盖率 80% 的测试套件可能全是假阳性（assertion 永远通过）。VibeX 缺乏突变测试（mutation testing）机制，无法验证测试套件是否真正能捕获缺陷。

**痛点 2: E2E 测试不稳定（flaky）**
当前 E2E 测试（`canvas-phase2.spec.ts`、`canvas-undo-redo.spec.ts` 等）偶发失败。根本原因：
- 无 retry 机制（Playwright 默认 retry=0）
- 无 flaky 检测和自动隔离机制
- CI 环境中网络延迟导致偶发超时
- 无测试稳定性监控（谁都不知道哪条测试现在是稳定的）

**痛点 3: 前后端 API 契约不一致**
前端 `services/api/` 下有独立的 mock 测试文件（如 `domain-entity.test.ts`、`requirement.test.ts`），但它们与后端实际 API 路由（`/api/domain-model/[projectId]`、`/api/requirement` 等）的字段契约没有自动化验证。人工对齐导致"前端以为字段是 X，后端实际返回 Y"的 bug。

**痛点 4: Canvas 性能回归风险**
三树组件在 50+ 节点时存在性能隐患（拖拽卡顿、节点展开慢）。现有测试完全不覆盖性能指标，无法在 PR 层面发现性能退化。

**痛点 5: 测试数据管理混乱**
当前测试数据分散在各个 `.test.ts` 文件中，mock 对象硬编码，测试之间无共享 fixtures，导致：
- 测试数据重复定义
- 真实 API 字段变更时，mock 数据同步困难
- 测试可读性差

---

## 2. 核心 JTBD（测试工程师视角）

| # | JTBD | 触发场景 | 紧迫度 |
|---|------|---------|--------|
| J1 | **验证测试有效性** — 需要确认我的测试套件真的能抓住 bug，而不是自欺欺人的高覆盖 | Epic 3 Store 覆盖率完成后，想知道覆盖率数字是否有意义 | P1 |
| J2 | **消除 flaky 测试噪声** — 减少 CI 误报，让 tester 不被假失败消耗精力 | E2E 测试通过率 70-80%，但有 20-30% 是 flaky，不是真正的 bug | P0 |
| J3 | **锁定前后端 API 契约** — 消除"字段名改了但 mock 没改"导致的隐蔽 bug | 前端改了一个 API 字段，后端没同步，测试没发现，上线后报表错 | P1 |
| J4 | **建立性能护栏** — 在每次 PR 级别发现 Canvas 性能退化，而不是上线后用户投诉 | ReactFlow 拖拽在某些分支变慢了，CI 完全没感知 | P1 |
| J5 | **统一测试数据管理** — 用 factories 替代散落各处的 hardcoded mocks，提升测试可维护性 | 新增一个测试要 copy-paste 30 行 mock 数据 | P2 |

---

## 3. 技术方案选项

### 方案 A: 全量工具链建设（激进路线）

**方向**：
- E1: 突变测试集成（`stryker-mutator`）
- E2: Flaky Test 监控 + Playwright retry 配置
- E3: API Contract 测试（Pact 或自制 JSON Schema 验证）
- E4: Canvas Performance 测试（Playwright + Chrome DevTools Protocol）
- E5: 测试数据 Factory 建设（factory-bot-ts）

**优点**：全面解决所有痛点，技术债务一次性清理  
**缺点**：工时高（5-6 人天），需要跨 agent 协作（dev + tester），对现有测试改动大

**工时估算**：
| Epic | 工时 | 负责 |
|------|------|------|
| E1 突变测试 | 1.5d | dev + tester |
| E2 Flaky 治理 | 1d | tester + dev |
| E3 Contract 测试 | 1.5d | dev + tester |
| E4 Performance 测试 | 1d | dev + tester |
| E5 Factory 建设 | 1d | dev |
| **合计** | **6d** | |

---

### 方案 B: 聚焦 P0 痛点（稳健路线）

**方向**：
- E1: Flaky Test 治理（Playwright retry + stability report）— **立即消除 CI 噪声**
- E2: API Contract 快速对齐（JSON Schema 生成 + 自动化校验）— **消除隐蔽 bug**
- E3: 测试有效性初探（抽样突变测试，只测核心 store）— **验证 Epic 3 成果**

**优点**：聚焦最高 ROI 的两个痛点，工时可控（2.5d），不破坏现有测试  
**缺点**：性能测试和 factory 建设推迟，遗留部分技术债务

**工时估算**：
| Epic | 工时 | 负责 |
|------|------|------|
| E1 Flaky 治理 | 1d | tester + dev |
| E2 Contract 测试 | 1d | dev + tester |
| E3 突变测试（抽样） | 0.5d | tester |
| **合计** | **2.5d** | |

---

### 方案 C: 测试数据优先（基础设施路线）

**方向**：
- E1: 测试数据 Factory 建设（ts-auto-mock 或 factory-bot-ts）
- E2: 将现有 hardcoded mocks 迁移到 factories
- E3: Contract 测试（基于 factories 生成 JSON Schema）

**优点**：长期收益高，为所有后续测试提供高质量数据基础  
**缺点**：不直接解决 flaky 和有效性量化问题

**工时估算**：3d（全部）

---

### 方案对比

| 维度 | 方案A（全量） | 方案B（稳健） | 方案C（基础设施） |
|------|------------|------------|----------------|
| 覆盖痛点 | 5/5 | 3/5 | 2/5 |
| 工时 | 6d | 2.5d | 3d |
| 风险 | 高（范围大，依赖多） | **低**（聚焦已知痛点） | 中（factory 迁移量大） |
| 立即收益 | 中（6d 后全面改善） | **高**（2.5d 后 CI 噪声消除） | 低（基础设施，不直接改善可见指标） |
| 推荐度 | ⭐⭐ | **⭐⭐⭐** | ⭐⭐ |

**推荐方案 B（稳健路线）**，理由：
1. Flaky 测试是 tester 当前最高频的痛苦来源（直接消耗 tester 精力）
2. Contract 测试解决的是"测试通过了但实际坏了"的隐蔽问题
3. 2.5d 工时与 Sprint 3 节奏匹配，可在一周内完成
4. 方案 A 可作为 Sprint 4 测试深化的候选

---

## 4. 可行性评估

### 方案 B 技术可行性

| Epic | 技术可行性 | 依赖 | 备注 |
|------|----------|------|------|
| E1 Flaky 治理 | ✅ 高 | Playwright（已安装） | 只需配置 `retries` 和 `workers`，新增 stability report 脚本 |
| E2 Contract 测试 | ✅ 高 | Jest（已安装）+ 后端 route tests（279 个） | 可复用现有 backend route tests 生成 Schema，覆盖核心 API |
| E3 突变测试（抽样） | ✅ 中 | stryker-mutator | 建议仅对 canvasStore、contextStore 抽样突变测试，限制范围 |

### 关键依赖

1. **dev agent** 参与：E1 需要 dev 确认 flaky 原因（是代码问题还是测试问题），E2 需要 dev 提供 API Schema
2. **现有 E2E spec 文件**：可直接复用，无需从零编写
3. **Backend route tests**：可作为 Contract 测试的数据源

### 潜在障碍

- Flaky 测试的根因可能是前端代码 bug 而非测试问题，需要 dev 介入排查
- Contract 测试需要后端 route tests 覆盖所有字段，否则 Schema 不完整
- 突变测试运行时间较长（每 Epic 约 5-10 分钟），需配置在 CI 慢速套件中

---

## 5. 初步风险识别

### 风险矩阵

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Flaky 测试根因是代码 bug，不是测试问题 | 高 | 中 | 先识别是 timing 问题（加 wait）还是代码问题（report 给 dev） |
| Contract 测试 Schema 覆盖不全 | 中 | 高 | 仅覆盖高频 API，字段变更时更新 Schema |
| 突变测试运行时间过长，拖慢 CI | 中 | 低 | 仅对核心 store 抽样，设置 10 分钟超时 |
| dev 资源不足，E1/E2 协同开发延迟 | 中 | 中 | E1 的 Playwright retry 配置 tester 可独立完成 |
| 测试数据 factory 建设推迟导致后续测试维护成本高 | 低 | 中 | 记录在 Epic backlog，在 Sprint 4 安排 |

### 优先级决策

```
P0: Flaky 测试治理（影响 tester 效率，立即行动）
P1: Contract 测试（消除隐蔽 bug，Sprint 3 可完成）
P2: 突变测试抽样验证（Sprint 4 或 Sprint 3 末期）
P3: Factory 建设（长期技术债务，Sprint 4+）
```

---

## 6. 验收标准（可测试）

### E1: Flaky Test 治理

- [ ] `playwright.config.ts` 中 `retries: 2`（CI 环境）
- [ ] `playwright.config.ts` 中 `workers: 1`（消除并行 flaky）
- [ ] E2E 测试连续 3 次运行 passRate ≥ 95%
- [ ] 新增 `scripts/test-stability-report.sh`：输出 flaky 测试名单（pass 但有 retry）
- [ ] HEARTBEAT 或 daily report 中记录 E2E 通过率

### E2: API Contract 测试

- [ ] 核心 API（domain-model、requirement、flow）生成 JSON Schema
- [ ] 前端 `services/api/` 下 mock 数据与 Schema 一致性校验通过
- [ ] Schema 变更触发 CI 失败（前端未同步）
- [ ] 核心 API contract 测试用例 ≥ 20 条

### E3: 突变测试（抽样）

- [ ] `contextStore.test.ts` 和 `canvasStore` 核心路径完成突变测试
- [ ] 突变测试 kill rate ≥ 70%（证明测试有效性）
- [ ] 不满足 kill rate 的测试路径补充 assertion
- [ ] 突变测试结果记录到 `docs/test-quality-report.md`

---

## 7. 实施建议

### Sprint 3 排期建议

```
Day 1 (04-03): E1 Flaky 治理
  - 上午: Playwright 配置 + 连续运行基线
  - 下午: 识别 flaky 根因，report 给 dev

Day 2 (04-04): E2 Contract 测试
  - 上午: 生成核心 API JSON Schema
  - 下午: 前端 mock 对齐 + 校验通过

Day 3 (04-07): E3 突变测试 + 整体验收
  - 上午: 抽样 store 突变测试
  - 下午: 验收清单检查 + 文档更新
```

### 与昨日提案的关系

| 昨日 Epic | 今日 Epic | 关系 |
|-----------|-----------|------|
| Epic 3 (Store 覆盖率 ≥80%) | E3 (突变测试) | **互补**：覆盖率解决"测了多少"，突变解决"测得是否有效" |
| Epic 4 (Canvas E2E 基础) | E1 (Flaky 治理) | **递进**：先建立 E2E，再稳定 E2E |
| Epic 1 (DoD 约束) | E2 (Contract 测试) | **深化**：DoD 要求更新测试，Contract 要求测试内容正确 |

---

## 8. 结论

方案 B（稳健路线）在 2.5 人天内解决 tester 最高优先级的两个痛苦：Flaky 测试噪声和 API 契约隐蔽 bug。与昨日提案形成互补关系，共同构成 Sprint 3 测试深化闭环：覆盖率（Epic 3）→ 有效性（E3 今日）→ 稳定性（E1）→ 正确性（E2）。

**建议**：采纳方案 B，优先执行 E1 + E2，E3 作为 sprint 末期验收项。
