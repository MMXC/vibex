**Agent**: analyst
**日期**: 2026-04-25
**项目**: vibex-proposals-20260425
**仓库**: /root/.openclaw/vibex
**分析视角**: 可行性评估 + 风险矩阵 + 工期估算

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | analysis | Sprint 8 E1: 后端 TypeScript 债务完成扫尾 | backend | P0 |
| P002 | analysis | Sprint 8 E2: Firebase 实时协作生产验证 | vibex-next | P0 |
| P003 | analysis | Sprint 8 E3: Teams API 前端 + Import/Export 闭环 | vibex-next | P1 |
| P004 | improvement | Sprint 8 E4: PM 神技落地质量门禁 | 全项目 | P1 |

---

## 2. 提案详情

### P001: Sprint 8 E1: 后端 TypeScript 债务完成扫尾

**问题描述**:

Sprint 7 PRD 将 E1（后端 TS 债务清理）列为 P0，估算 173 个错误需 16-24h。Sprint 7 已交付 `tsc --noEmit` 基线记录，但到任务截止时（2026-04-20）：

1. CHANGELOG.md 中无 `tsc --noEmit exit code = 0` 的验证记录
2. 前端 `vibex-fronted` 的 `tsc --noEmit` 在 Sprint 7 期间有过 0 errors 记录，但后端 `vibex-backend` 的 173 个 TS 错误清理未出现在 CHANGELOG 中
3. EXECUTION_TRACKER.json 中 `TS-001`（Backend TypeScript Compilation Errors）仍标记为 `P?`，无关联任务

这意味着后端 TS 债务是**上一个 Sprint 未完成的工作**，不是新提案，是扫尾。

**影响范围**: `vibex-backend/src/`，所有新功能 PR 的 CI 构建

**验收标准**:
- [ ] `pnpm --filter vibex-backend exec tsc --noEmit` exit code = 0
- [ ] CI pipeline `tsc --noEmit` gate 通过
- [ ] `as any` 使用量不净增（允许合理用途 + 注释）

---

### P002: Sprint 8 E2: Firebase 实时协作生产验证

**问题描述**:

Sprint 7 将 Firebase 实时协作列为 P0。CHANGELOG 确认了以下交付：
- `src/lib/firebase/presence.ts` 真实接入 PresenceLayer
- ConflictBubble 冲突提示 UI 已实现
- 5s timeout + 单用户降级模式

**但是**：
1. `/health` 端点返回 P50/P95/P99 指标（AC-E6-1），Firebase SDK 初始化 + Presence 功能的**负载测试**未覆盖
2. 多人并发场景（5+ 用户同时 presence 更新）未经验证
3. Cloudflare Workers 环境中 Firebase Admin SDK 的**冷启动延迟**未量化
4. Architect 评审报告（Epic 2 Definition of Done 要求）未产出

**影响范围**: `/canvas` 页面，实时协作核心功能

**验收标准**:
- [ ] Firebase SDK 初始化时间 < 500ms（冷启动）
- [ ] 5 用户并发 presence 更新，端到端延迟 < 3s
- [ ] 断线/页面卸载后 presence 正确清除
- [ ] Architect 产出 Firebase + Cloudflare Workers 可行性评审报告

---

### P003: Sprint 8 E3: Teams API 前端 + Import/Export 闭环

**问题描述**:

两条独立 Epic（E3 Teams API 前端 + E4 Import/Export）在 Sprint 7 均为 P1，但均未进入 CHANGELOG 的 Sprint 7 交付成果。

**E3 Teams API 前端**（Sprint 7 PRD 估算 12-16h）:
- 后端 CRUD + 成员管理 + 权限分层已完成
- 前端消费从未实现，用户无法通过 UI 管理团队
- 需要：`/dashboard/teams` 列表 + 创建 Dialog + 成员管理面板

**E4 Import/Export 完整集成**（Sprint 7 PRD 估算 8-12h）:
- JSON/YAML parser 已完成
- 但 round-trip 端到端测试缺失（JSON 导出 → 重新导入 → 数据完全一致）
- 5MB 限制前端拦截未验证
- 错误状态 UI（解析失败/文件损坏）未充分验证

**影响范围**: `/dashboard/teams` 页面，Import/Export 导出功能

**验收标准**:
- [ ] `GET /v1/teams` 列表 UI 可正常渲染，数据与 API 响应一致
- [ ] 团队创建/邀请/删除操作均有 API 调用和错误处理
- [ ] JSON round-trip E2E 测试通过（导入 → 导出 → 比对，无数据丢失）
- [ ] YAML 含特殊字符转义 round-trip 通过
- [ ] 5MB 限制前端拦截，错误提示友好

---

### P004: Sprint 8 E4: PM 神技落地质量门禁

**问题描述**:

PM 神技落地评估（20260424 迭代日志）揭示了系统性缺陷：

1. **神技3（老妈测试）完全未落地**：PRD/Spec 中无用户情绪地图、迷路引导、空状态设计
2. **神技4（状态机）没有系统使用**：8 个 spec 中只有 E5 有错误态，无完整四态表
3. **神技5（原子化）使用不一致**：只有 E1/E4 使用了 Design Token，E2/E3/E6/E7/E8 硬编码色值
4. **PRD 模板本身不支持神技落地**：缺少"本质需求"、"本期不做"、"用户情绪地图"三个章节

**根本原因**: Coord 评审时未强制执行神技落地检查。当前评审只看 Epic/AC/DoD，不检查四态表、Design Token、情绪地图。

**影响范围**: 所有未来提案的 PRD/Spec 质量

**验收标准**:
- [ ] Coord 评审流程中增加"神技落地"检查清单（老妈测试 + 四态表 + Design Token）
- [ ] 新 PRD 的执行摘要包含"本期不做"清单
- [ ] 新 Spec 中 UI 变更类功能全部有四态表（空态/加载态/正常态/错误态）
- [ ] 新 Spec 中颜色全部使用 CSS Token，无硬编码色值

---

## 3. 相关文件

- 设计文档: `/root/.openclaw/vibex/docs/vibex-proposals-20260424/prd.md`
- 实施计划: `/root/.openclaw/vibex/docs/vibex-proposals-20260425/analysis.md`
- 执行追踪: `/root/.openclaw/vibex/proposals/EXECUTION_TRACKER.md`
- PM 神技评估: `/root/.openclaw/skills/pm-ux-ui-mastery/iterations/20260424.md`

---

## 根因分析

### P001: 后端 TS 债务未完成

**5Why 分析**:
- Why 1: 为什么后端 TS 债务未清理完？→ Sprint 7 容量不足，E1 和 E2 并行
- Why 2: 为什么容量不足？→ 173 个错误分散在多个文件，修复策略不清晰
- Why 3: 为什么修复策略不清晰？→ 没有按优先级排序，先修了容易的
- Why 4: 为什么没有优先级排序？→ 没有基线报告，按文件随机修
- Why 5: 为什么没有基线报告？→ 建立了基线（`baseline_errors.txt`），但没有转换为可执行的任务拆分

**证据**:
- CHANGELOG 中无 `tsc --noEmit` 通过记录
- EXECUTION_TRACKER.json 中 TS-001 仍为 `P?`，无任务关联
- Sprint 7 PRD 的 173 个错误文件列表未拆分给具体开发人员

---

### P002: Firebase 实时协作未完成生产验证

**5Why 分析**:
- Why 1: 为什么 Firebase 实时协作未完成生产验证？→ 实现了 MVP 但没有验证计划
- Why 2: 为什么没有验证计划？→ PM PRD 中只写了 MVP 范围，遗漏了验证 Epic
- Why 3: 为什么遗漏？→ PRD 的 DoD 没有要求 Architect 产出可行性报告
- Why 4: 为什么 DoD 缺失？→ PRD 模板没有强制要求"架构评审"作为 Epic 的 DoD
- Why 5: 为什么模板缺失？→ Analyst 评审时未提出"缺少架构验证里程碑"的风险

**证据**:
- CHANGELOG 有 Firebase presence 实现（commit 862fb85a）
- 但无 Architect 评审报告（Epic 2 DoD 要求）
- 无 Firebase + Cloudflare Workers 冷启动延迟量化数据

---

### P003: Teams API + Import/Export 未启动

**5Why 分析**:
- Why 1: 为什么 E3/E4 未启动？→ Sprint 7 规划为 P1，排在 E1/E2 之后
- Why 2: 为什么 E1/E2 占用全部容量？→ 16-24h（E1） + 8-12h（E2） = 24-36h 超出 Sprint 容量
- Why 3: 为什么 E1 估算如此高？→ 173 个错误分散，修复策略不清晰导致估算不准确
- Why 4: 为什么没有提前发现容量不足？→ PRD 优先级矩阵是估算，未与实际 Sprint 容量对齐
- Why 5: 为什么未对齐？→ Sprint 7 没有明确的容量上限（以人天计）

**证据**:
- Sprint 7 PRD 建议容量：E1+E2+E3 = 48-52h
- 但 CHANGELOG 中 Sprint 7 实际交付了 E1 部分（TS 债务开始清理）、E2（Firebase）、E3（Analytics）、E4（Delivery 集成）、E5（PRD 生成）、E6（12 个缺陷归档）
- 说明 PRD 的 Epic 拆分粒度太粗，实际是多个子任务并行

---

### P004: PM 神技落地系统性失败

**鱼骨图分析**（4M1E）:

```
PM 神技落地失败
├── 方法 (Method)
│   ├── PRD 模板缺少 3 个强制章节（本质需求/本期不做/情绪地图）
│   ├── Spec 模板缺少四态表强制要求
│   └── Coord 评审无神技落地检查点
├── 人 (Man)
│   ├── PM Agent 产出与模板不符
│   └── Coord 未执行强制检查
├── 测量 (Measurement)
│   └── 无神技落地验收指标
├── 机器 (Machine)
│   └── 无自动化检查脚本
└── 环境 (Environment)
    ├── 20260414 项目用模板A（Bug修复类）
    └── 20260422 项目神技全部落地（对比说明工具链有效）
```

**证据**:
- 20260422 的 `vibex-workbench` 神技全部落地（PRD 模板执行良好）
- 20260414 的 `vibex-pm-proposals-20260414` 神技全部未落地（PRD 模板未执行）
- 说明问题不是"skill 没能力"，是"coord 评审没有强制检查"

---

## 建议方案

### P001: 后端 TS 债务完成扫尾

**方案 A（推荐）: 优先级文件分组 + 并行任务分配**
- 按错误类型分组：routes > lib > services，3 个子任务并行
- 每个子任务有明确的退出标准（单个文件 `tsc --noEmit` 通过）
- 预计 16-20h
- 风险：循环依赖的 lib 文件可能导致后续文件无法单独通过

**方案 B: 全部文件统一修复**
- 一次性修复所有 173 个错误
- 风险：工时长（24-32h），中途无法交付中间成果
- 回滚计划：如果失败，用 `git stash` 恢复

---

### P002: Firebase 实时协作生产验证

**方案 A（推荐）: MVP 验证 + 条件性升级**
- 先验证 Firebase + Cloudflare Workers 可行性（冷启动 < 500ms）
- 5 用户并发测试
- Architect 评审后决定是否进入 Epic 2b（WebSocket 同步）
- 预计 8-12h
- 风险：Cloudflare Workers Firebase SDK 存在已知的冷启动限制（V8 isolate vs Node.js）

**方案 B: 直接进入生产实现**
- 跳过可行性验证，直接实现完整实时协作
- 风险：如果 Firebase 不兼容，需要大规模重构

---

### P003: Teams API 前端 + Import/Export 闭环

**方案 A（推荐）: 并行推进，Import/Export 优先**
- Teams API 前端和 Import/Export 并行，各 10-14h
- Import/Export 先做 E2E 测试（8h），边测边修
- 预计总 18-24h

**方案 B: 串行，Teams API 优先**
- 先 Teams API（14h），再 Import/Export（10h）
- 风险：Import/Export 用户价值更高（数据不丢失），串行顺序不对

---

### P004: PM 神技落地质量门禁

**方案 A（推荐）: Coord 评审增强 + 模板修复**
- Coord 评审流程增加 3 个检查点：四态表检查、Design Token 检查、情绪地图检查
- PRD 模板增加 3 个强制章节（神技1/2/3）
- 预计 4-6h（文档 + 流程变更）
- 风险：Coord 评审时间增加（每个 PRD 多 15-30min）

**方案 B: 自动化检查脚本**
- 用脚本自动检查 Spec 中是否有四态表、Design Token、情绪地图
- 优点：可量化，不依赖人工评审
- 缺点：实现需要 12-16h，且无法检查语义正确性

---

## 执行依赖

### P001: 后端 TS 债务完成扫尾
- [ ] 需要修改的文件: `vibex-backend/src/**/*.ts`
- [ ] 前置依赖: 无
- [ ] 需要权限: GitHub Actions CI 写权限
- [ ] 预计工时: 16-20h（Dev）
- [ ] 测试验证命令: `pnpm --filter vibex-backend exec tsc --noEmit && echo "PASS" || echo "FAIL"`

### P002: Firebase 实时协作生产验证
- [ ] 需要修改的文件: `vibex-next/src/lib/firebase/`, `vibex-next/src/components/collaboration/`
- [ ] 前置依赖: P001（TS 债务清理完成）
- [ ] 需要权限: GitHub Actions CI，Architect 评审
- [ ] 预计工时: 8-12h（Dev + Architect）
- [ ] 测试验证命令: `pnpm exec vitest run firebase.test.ts --coverage`

### P003: Teams API 前端 + Import/Export 闭环
- [ ] 需要修改的文件: `vibex-next/src/app/dashboard/teams/`, `vibex-next/src/components/delivery/`
- [ ] 前置依赖: 无（可与 P001/P002 并行）
- [ ] 需要权限: 无
- [ ] 预计工时: 18-24h（Dev）
- [ ] 测试验证命令: `pnpm exec vitest run delivery.test.ts && pnpm exec vitest run teams.test.ts`

### P004: PM 神技落地质量门禁
- [ ] 需要修改的文件: `~/.openclaw/skills/pm-ux-ui-mastery/`, `~/.openclaw/vibex/proposals/TEMPLATE.md`
- [ ] 前置依赖: 无
- [ ] 需要权限: 无
- [ ] 预计工时: 4-6h（PM + Analyst + Coord）
- [ ] 测试验证命令: 评审流程增加检查清单，暂无自动化命令

---

## 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-proposals-20260425
- **执行日期**: 2026-04-26
- **建议 Sprint 8 容量**: P001（16-20h）+ P002（8-12h）+ P003（18-24h）+ P004（4-6h）= 46-62h，建议按 P001+P002+P004 或 P001+P003+P004 分两批交付
