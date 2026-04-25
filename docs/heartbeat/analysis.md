# VibeX Sprint 8 — 需求分析报告

**任务**: heartbeat/analyze-requirements
**日期**: 2026-04-25
**分析**: analyst
**状态**: ✅ 分析完成

---

## 执行摘要

Sprint 8 定位为债务清理 + 质量门禁 + 可行性验证冲刺，不引入新功能架构。四个 Epic 目标清晰，工时合计 **13.5d**，依赖关系合理。核心风险在于 P002 Firebase SDK 升级方案的可行性评审（P002-S1）是否需要更长时间，以及 P002-S4 Analytics Dashboard 的页面集成工作量被低估。

**结论：有条件推荐**。建议 P002-S1（Firebase 可行性评审）先于其他 P002 Story 执行，若 Architect 评审结论为"不可行"，P002 需重新设计或降级。

---

## 1. 业务场景分析

### 1.1 当前状态

VibeX 已完成 Sprint 1–7 交付：
- Canvas 三树（上下文/流程/组件）统一数据模型
- Delivery 交付中心（DDL 生成、跨画布导航）
- Dashboard（含 Analytics 看板）
- Firebase Presence 实时在线状态（REST API 方案）
- Teams API 前后端集成
- Import/Export 多文件批量导出（ZIP）

### 1.2 Sprint 8 驱动因素

| 债务类型 | 具体问题 | 影响 |
|----------|----------|------|
| 技术债 | 143 个 TS 编译错误，Cloudflare Workers 类型缺失 | CI 构建不稳定，TS gate 形同虚设 |
| 质量债 | PM 神技（Design Token/四态表/情绪地图）落地系统性失败 | 每次提案质量参差不齐，Coord 重复劳动 |
| 功能风险 | Firebase SDK 升级未经验证；Import/Export 无 round-trip E2E | 数据丢失风险未量化，协作功能扩展受限 |

### 1.3 目标用户

- **内部开发团队**：需要稳定的 CI 构建和类型安全
- **PM 用户**：需要高质量的 PRD/SPEC 输出规范
- **最终用户（间接）**：受益于更稳定的 Canvas 协作功能和 Analytics 数据

---

## 2. 核心 Jobs-To-Be-Done（JTBD）

**JTBD-1**：团队需要在 CI 中运行 `tsc --noEmit` 并得到零错误通过
**JTBD-2**：Architect 需要在 Sprint 8 内验证 Firebase SDK 升级可行性，不接受未知风险
**JTBD-3**：测试团队需要对 Import/Export 关键路径建立自动化 E2E 覆盖
**JTBD-4**：PM 需要 Coord 评审强制执行四态表/Design Token/情绪地图规范
**JTBD-5**：团队需要 Analytics Dashboard 展示用户行为数据（页面访问/组件创建/导出）

---

## 3. 技术方案选项

### 3.1 P001 TypeScript 债务清理

**方案 A：安装 `@cloudflare/workers-types` + 批量类型修复（推荐）**
- 安装 `@cloudflare/workers-types@^4.20250415.0`
- 按错误类型分批修复（WebSocketPair / API Response / PrismaClient / unknown/any / 枚举）
- 策略：Batch 1 快速止血 → Batch 2/3 精确修复
- 优点：风险低、见效快，143 个错误大部分随类型包自动消除
- 缺点：剩余精确修复仍需逐文件手工处理

**方案 B：仅修复 `tsconfig.json`，类型错误留待后续 Sprint**
- 不修复具体类型错误，仅安装类型包
- 优点：最快完成 P001 表面目标
- 缺点：CI tsc gate 仍会失败，Sprint 8 结束后债务加倍

**评估**：方案 A 为主，方案 B 仅作为 P001-S2 的下策（当 2d 内无法完成全部 143 个修复时，可考虑提交部分修复 + 后续跟进任务）。

### 3.2 P002 Firebase 实时协作可行性验证

**方案 A：保持 REST API 方案（保守，推荐）**
- 继续使用 `presence.ts` REST API + EventSource
- 不引入 `firebase/app` 完整 SDK
- 优点：零 bundle 体积增长，已在生产验证
- 缺点：无法使用 Firebase SDK 的高级特性（离线持久化、Firestore 等）

**方案 B：升级到 Firebase Admin SDK（需可行性验证）**
- Admin SDK 仅在后端使用，不进 Workers bundle
- 优点：支持更多 Firebase 功能
- 缺点：Cloudflare Workers 环境运行 Admin SDK 存在冷启动性能问题（需实测 < 500ms）

**方案 C：引入 HocusPocus / PartyKit 替代方案**
- 优点：原生 WebSocket，无 Firebase 供应商锁定
- 缺点：新增供应商依赖，Sprint 8 时间窗口内无法完成充分验证

**评估**：方案 A 为基线，方案 B 的可行性由 P002-S1（Architect 评审）决定。若 Architect 评审结论为"可行且性能达标"，则在 Sprint 8 末期尝试；否则保持 REST API。

### 3.3 P003 Teams + Import/Export 测试覆盖

**方案 A：Playwright E2E round-trip 测试（推荐）**
- JSON round-trip：导出 → 删除 → 导入 → JSON.stringify 对比
- YAML round-trip：含特殊字符（`: # | 多行）边界测试
- 5MB 文件限制前端拦截：Playwright 模拟超大文件上传
- 优点：真实浏览器环境，端到端验证
- 缺点：执行速度慢于 Vitest 单元测试

**方案 B：Vitest 单元测试（补充）**
- 测试 YAML 序列化/反序列化函数
- 测试文件大小校验函数
- 优点：执行快，可快速反馈
- 缺点：无法验证完整 API 集成路径

**评估**：A + B 组合。Playwright E2E 覆盖端到端路径，Vitest 覆盖边界 case 和函数级逻辑。

---

## 4. 可行性评估

| Epic | 技术难度 | 工时估算 | 依赖 | 可行性 |
|------|----------|----------|------|--------|
| P001 | 低 | 3d | 无 | ✅ 高 |
| P002 | 中（取决于 S1 结论） | 5d | P001 完成后更准确 | ⚠️ 待定 |
| P003 | 中 | 3.5d | 无（可并行） | ✅ 高 |
| P004 | 低 | 2d | 无（可并行） | ✅ 高 |

**整体可行性**：高。P001/P003/P004 无技术障碍，P002 的可行性取决于 Architect 评审结论。

---

## 5. 初步风险识别

### 5.1 风险矩阵

| ID | 风险 | 可能性 | 影响 | 风险等级 | 缓解措施 |
|----|------|--------|------|----------|----------|
| R1 | P002-S1 Firebase 可行性评审结论为"不可行" | 中 | 高 | 🔴 高 | S1 先于其他 P002 Story 执行，预留 Architect 评审时间（1d）；若不可行，P002 降级为"Sprint 9 重新设计" |
| R2 | P001-S2 143 个 TS 错误修复超2d | 高 | 中 | 🟡 中 | 预分三批修复（Batch 1 快速止血 60% 错误），若2d内无法完成，提交部分修复并创建 follow-up |
| R3 | P002-S4 Analytics Dashboard 页面集成工作量被低估 | 中 | 中 | 🟡 中 | P002-S4 标注"需页面集成"，提前与 frontend 确认 UI 设计稿 |
| R4 | P003-S2/S3 round-trip 测试发现数据格式不兼容 | 低 | 高 | 🟡 中 | 先用现有导出数据跑一遍 round-trip，识别格式问题再写测试 |
| R5 | P004 Coord 检查点更新影响现有评审流程 | 低 | 低 | 🟢 低 | P004-S1 作为第一优先级（2d内完成），评审清单更新后告知全体成员 |

### 5.2 单点故障识别

- **P001-S1/S2**：依赖 dev 对 TypeScript 的熟练度，建议分配给 Sprint 7 已参与 TS 相关工作的成员
- **P002-S1**：仅 Architect 可完成，若 Architect 资源不足，P002 整体延后

---

## 6. 验收标准

### P001 TypeScript 债务清理

- [ ] `cd vibex-backend && pnpm exec tsc --noEmit` exit code = 0
- [ ] GitHub Actions CI 中 `tsc --noEmit` gate 通过率 100%
- [ ] 143 个 TS 编译错误归零

### P002 Firebase 实时协作可行性验证

- [ ] Architect 产出 `docs/architecture/firebase-feasibility-review.md`，含冷启动性能数据
- [ ] Firebase SDK init 时间 < 500ms（Playwright E2E 测量）
- [ ] Presence 更新延迟 < 1s（单用户）
- [ ] `/dashboard` 页面 Analytics widget 可见（`isVisible('.analytics-widget')`）

### P003 Teams + Import/Export 测试覆盖

- [ ] JSON round-trip E2E：导出 → 删除 → 导入，JSON 内容完全一致
- [ ] YAML round-trip E2E：含特殊字符（`: # | 多行`）round-trip 无转义丢失
- [ ] 5MB 文件上传被前端拦截，提示"文件大小超出 5MB 限制"

### P004 PM 神技质量门禁建立

- [ ] Coord 评审流程包含四态表检查点
- [ ] Coord 评审流程包含 Design Token 无硬编码色值检查
- [ ] Coord 评审流程包含情绪地图存在性检查
- [ ] PRD 模板包含"本期不做"清单章节
- [ ] SPEC 模板包含四态表、Design Token、情绪地图路径引用

---

## 7. Research 补充

### 7.1 历史经验（docs/solutions/）

**Multi-Epic DAG Pipeline Coordination（2026-04-24）**
- 每个 Epic 独立 pipeline：dev → tester → reviewer → reviewer-push
- Coord-decision 作为统一入口，一次性 gate 所有 Epic
- DAG 依赖强制顺序执行（Epic2 blocked by Epic1 reviewer-push）
- **关键教训**：CHANGELOG 必须在 reviewer 阶段更新，否则 CONDITIONAL PASS
- **关键教训**：Phantom Epic 检测 — 无代码产出的 Epic 需在 coord-decision 阶段合并或删除

**Sprint6/Sprint7 QA 规律（2026-04-18）**
- QA Sprint 每次都发现 mock stub 未替换（`mockAgentCall`、`loadMockData` 等）
- 根因：dev Sprint 中 stub 允许并行工作，但 Sprint 结束后成为持久障碍
- 规则：Sprint 关闭时，无未追踪的 TODO；所有 stub 必须有替换计划或验收通过

**Canvas 组件状态逻辑错误（2026-04-17）**
- `isActive` vs `status` 语义混淆导致 7 个 UI bug（4+ 个项目重复出现）
- 核心规则：按钮 gate 应使用 `status === 'confirmed'` 而非 `isActive !== false`
- 异步错误处理：`handleResponseError` 必须是 async（非 sync-returning-Promise）
- Unmount 清理：异步状态操作必须清理，避免组件卸载后状态泄漏

**Sprint5 多 Store 聚合（2026-04-18）**
- deliveryStore 作为只读聚合层，统一消费 prototypeStore + DDSCanvasStore
- 聚合层必须单向只读；任何源 Store 变更都会静默破坏聚合逻辑
- 跨画布导航：DeliveryNav（横向） + CanvasBreadcrumb（纵向）配合

### 7.2 Git History 分析（最近 80 commits）

**Sprint7 完成情况（2026-04-24）**

| Epic | 内容 | 模式 |
|------|------|------|
| E1 | 后端 TS 债务清理（197→28 错误） | 清理/回归 |
| E2 | Firebase Presence MVP（REST，零 SDK） | 新集成 |
| E3 | Teams API 前端（CRUD + UI） | 新功能 |
| E4 | Import/Export 完整集成 | 新功能 |
| E5 | 批量导出（ZIP，KV 存储） | 新功能 |
| E6 | 性能可观测性（/health、WebVitals） | 基础设施 |

**Sprint 历史规律**
- Sprint2(Spec Canvas) → Sprint3(Prototype) → Sprint4(Spec+QA) → Sprint5(Delivery) → Sprint6(AI Coding) → Sprint7(Integration) → Sprint8(Debt+Feasibility)
- 持续多 Epic DAG 协调，Epic 间有依赖关系
- CHANGELOG 每次 commit 必更新
- CI TypeScript gate 在 Sprint7（E1）加入 — 重大质量门禁
- `as any` 基线清理持续进行（197 个 TS 错误在 Sprint7 开始时）
- Firebase 从 mock → 真实 SDK 在 Sprint7 落地

**反复出现的 issue**
- `isActive` vs `status` 语义 bug（Canvas 组件状态）
- Unmount 时异步状态泄漏
- Phantom completions（子代理超时未 commit）
- Stub 替换不及时

### 7.3 关键教训对 Sprint 8 的影响

1. **P002 Firebase 可行性评审必须先于其他 P002 Story 执行** — 参照 Phantom Epic 检测逻辑，无可行方案的 Epic 应该在 coord-decision 阶段识别，而不是到开发阶段才发现
2. **P003 round-trip E2E 测试可能发现格式不兼容** — 参照 Sprint6 QA 规律，mock 数据路径和真实数据路径的差异在 QA 阶段才暴露，提前用真实数据跑一遍可以早发现问题
3. **P001 TS 错误修复参考 Sprint7 E1 经验** — Sprint7 已完成一次 TS 债务清理（197→28），P001 是对剩余错误的处理，复用同样的分批修复策略
4. **P004 Coord 检查点对 CHANGELOG 纪律有强化作用** — 参照 Multi-Epic DAG Coordination 中的 CONDITIONAL PASS 机制

---

## 8. 驳回条件检查

- [x] 需求模糊无法实现 → PRD 清晰，Epic/Story 拆分完整
- [x] 缺少验收标准 → 每项功能有具体可测试的 expect() 断言
- [x] 未执行 Research → 子代理已完成，Research 节已补充

---

## 执行决策

- **决策**: 待评审
- **执行项目**: 无（Coord 决策后绑定）
- **执行日期**: 待定

---

## 附录：Epic 工时汇总

| Epic | Story | 工时 | 累计 |
|------|-------|------|------|
| P001 | S1 类型包安装 | 0.5d | 0.5d |
| P001 | S2 TS 错误修复 | 2d | 2.5d |
| P001 | S3 CI tsc gate | 0.5d | 3d |
| P002 | S1 Architect 评审 | 1d | 1d |
| P002 | S2 Firebase 冷启动 | 1d | 2d |
| P002 | S3 Presence 延迟 | 1d | 3d |
| P002 | S4 Analytics Dashboard | 1.5d | 4.5d |
| P002 | S5 SSE bridge | 0.5d | 5d |
| P003 | S1 Teams API 验证 | 1d | 1d |
| P003 | S2 JSON round-trip | 1d | 2d |
| P003 | S3 YAML round-trip | 1d | 3d |
| P003 | S4 5MB 限制 | 0.5d | 3.5d |
| P004 | S1 Coord 检查点 | 1d | 1d |
| P004 | S2 PRD 模板 | 0.5d | 1.5d |
| P004 | S3 SPEC 模板 | 0.5d | 2d |
| **合计** | | **13.5d** | |
