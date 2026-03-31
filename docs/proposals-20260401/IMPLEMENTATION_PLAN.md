# Implementation Plan: proposals-20260401

**Agent**: Architect
**日期**: 2026-04-01
**版本**: v1.0
**状态**: 设计完成

---

## 执行摘要

本实施计划覆盖 7 个 Epic，共 69.5h 工时，分 3 个 Sprint 执行。E1/E2/E3 可立即并行启动，Sprint 1 后半启动 E4，Sprint 2-3 并行执行 E5/E6/E7。

---

## Sprint 划分

```
Sprint 1（本周，4/1-4/3）
  ├─ P0 并行: E1 (3.5h) + E2 (7h) + E3 (2h)
  └─ P0 串行: E4 (8h) [依赖 E3]

Sprint 2（4/7-4/11）
  ├─ E5: Quality Process (19h)
  └─ E6: Competitive Analysis (13h)

Sprint 3（4/14-4/18）
  └─ E7: Architecture Evolution (17h)
```

---

## E1: 开发环境阻塞修复（3.5h）

### 负责: Dev
### 依赖: 无
### 启动: Sprint 1 Day 1

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E1-T1 | Backend TS pre-test 修复 | 1.5h | `vibex-backend/tsconfig.json` | `npm test --workspace backend` 全绿 |
| E1-T2 | Frontend TS pre-test 修复 | 1h | `vibex-frontend/tsconfig.json` | `npx tsc --noEmit` 0 error |
| E1-T3 | task_manager.py 文件锁 Bug | 1h | `scripts/task_manager.py` | 并发 3 路 claim 无死锁 |

### 关键路径
```
E1-T1: 检查 backend/tsconfig.json strict 设置 → 调整 exclude/compilerOptions
E1-T2: 检查 frontend/tsconfig.json → 同步 strict 级别
E1-T3: 重构 task_manager.py 文件锁逻辑 → 加 try-finally 超时保护
```

### 验收测试
```bash
# 本地验证
npm run pretest --workspace vibex-backend
npm run pretest --workspace vibex-frontend
python3 scripts/task_manager_test_concurrency.py
```

---

## E2: 协作质量防护（7h）

### 负责: Dev + PM
### 依赖: 无
### 启动: Sprint 1 Day 1
### 状态: ✅ **已完成** (commit: `f04cc10c`)

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 | 状态 |
|---|------|------|---------|---------|------|
| E2-T1 | JSON 越权编辑防护 | 3h | `scripts/task_manager.py` (LockRequired 类) | 无锁调用 `update` 抛出 `LockRequired` | ✅ |
| E2-T2 | 自检报告路径规范 | 2h | `scripts/selfcheck_validator.py` (validate_report_path) | 所有报告路径符合 `proposals/YYYYMMDD/` | ✅ |
| E2-T3 | 重复通知过滤 | 2h | `scripts/task_manager.py` (_is_notif_duplicate) | 30min 内同内容不重复发送 | ✅ |

### 实现说明

**E2-T1** — `LockRequired` 异常类在 `cmd_update` 中触发：当任务状态为 `pending` 且尝试更新为 `done/failed/skipped` 时抛出。
- `--skip-lock` 参数（coord 专用）可绕过检查
- 示例：`task_manager.py update proposals-20260401 dev-e2-collab-quality done` → `LockRequired`

**E2-T2** — `validate_report_path()` 函数在 `selfcheck_validator.py` 中实现：
- 要求路径包含 `proposals/YYYYMMDD/` 正则匹配
- 集成到 `validate_selfcheck()`，路径错误导致验证失败
- 示例：`proposals/analyst.md` → ❌, `proposals/20260401/analyst.md` → ✅

**E2-T3** — 去重机制基于 `channel_id + text` SHA256 hash，30min TTL：
- `_is_notif_duplicate()` 检查缓存
- `_record_notif()` 在 Slack 发送成功后记录
- `.notif_dedup.json` 持久化（无锁不阻塞主流程）
- 重复通知输出 `⏭️ 通知去重（30min 内已发送）` 日志

### 验收测试
```bash
# E2-T1: LockRequired 验证
python3 scripts/task_manager.py update proposals-20260401 dev-e2-collab-quality done
# → 🔒 LockRequired: 任务当前状态为 'pending'，必须先被 claim

# E2-T2: 路径验证
python3 scripts/selfcheck_validator.py /tmp/test.md  # /tmp 无 proposals/YYYYMMDD
# → ❌ 报告路径必须包含 proposals/YYYYMMDD/ 目录

# E2-T3: 去重验证（见 task_manager._is_notif_duplicate 单元测试）
```

---

## E3: Canvas 选区 Bug 修复（2h）

### 负责: Dev
### 依赖: 无
### 启动: Sprint 1 Day 1

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E3-T1 | 选区过滤逻辑修复 | 1.5h | `vibex-frontend/src/stores/simplifiedFlowStore.ts` | deselect 后请求不包含已取消节点 |
| E3-T2 | E2E 测试覆盖 | 0.5h | `e2e/canvas-selection.spec.ts` | Playwright 场景覆盖 |

### 关键路径
```
E3-T1: 分离 selectedNodeIds 和 confirmed → deselect 只清 selectedNodeIds
E3-T2: Playwright 录制或编写 E2E 场景
```

### 验收测试
```typescript
// stores/simplifiedFlowStore.test.ts
test('deselect clears selectedNodeIds but not confirmed flag', () => {
  store.selectNode('A')
  store.confirmSelection()
  store.deselectNode('A')
  // selectedNodeIds = [] (已清空)
  // confirmed = true (保持)
})
```

---

## E4: 画布引导体系（8h）

### 负责: Dev
### 依赖: E3
### 启动: Sprint 1 Day 2（E3 完成后）

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E4-T1 | 新用户引导流程 | 3h | `components/guidance/OnboardingOverlay.tsx` | 首次打开 30s 内触发，引导完成率 ≥ 80% |
| E4-T2 | 快捷键提示栏 | 2h | `components/guidance/ShortcutBar.tsx` | 可折叠/展开 |
| E4-T3 | 节点 Tooltip | 2h | `components/guidance/NodeTooltip.tsx` | 响应时间 < 200ms |
| E4-T4 | 性能优化 | 1h | 现有组件优化 | 引导系统不影响 Canvas FPS |

### 关键路径
```
E4-T1: localStorage 检测首次 → Overlay 遮罩 + 目标高亮 + 步骤气泡
E4-T2: 可折叠工具栏 → Zustand 控制显示态
E4-T3: mouseenter 延迟加载 → React.memo 优化
```

### 验收测试
```typescript
test('E4-S1: first-time user triggers guidance within 30s', async () => {
  await page.goto('/canvas')
  await page.waitForSelector('.onboarding-overlay', { timeout: 30000 })
})

test('E4-S3: tooltip latency < 200ms', async () => {
  await page.hover('.flow-node')
  const start = Date.now()
  await page.waitForSelector('.node-tooltip')
  expect(Date.now() - start).toBeLessThan(200)
})
```

---

## E5: 质量流程改进（19h）

### 负责: Tester + Dev
### 依赖: 无
### 启动: Sprint 2 Day 1

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E5-T1 | Playwright 测试规范 | 6h | `e2e/CONVENTIONS.md` + 重构测试文件 | ≥ 5 个 CI-blocking 用例，命名规范 |
| E5-T2 | CI 覆盖率 Gate | 3h | `.github/workflows/ci.yml` | coverage < 80% 时 CI 失败 |
| E5-T3 | 两阶段审查 SOP | 3h | `docs/process/two-phase-review.md` | SOP 可执行，reviewer 确认 |
| E5-T4 | 验收标准明确化 | 2h | `templates/story-template.md` | 所有新 Story 含 `expect()` 格式 |
| E5-T5 | KPI 量化体系 | 5h | `docs/kpi-dashboard.md` | Dashboard 可更新 |

### 关键路径
```
E5-T1: Playwright 配置 → page object 模式 → 5+ CI-blocking 测试
E5-T2: GitHub Actions coverage check step → 失败则 exit 1
E5-T5: notion 或独立 Markdown dashboard → 手动/自动更新
```

### 验收测试
```bash
# CI Gate 验证
npx playwright test --reporter=line
# 验证 coverage
npx jest --coverage && node scripts/coverage-check.js 80
```

---

## E6: 竞品与市场分析（13h）

### 负责: PM + Analyst
### 依赖: 无
### 启动: Sprint 2 Day 1（可与 E5 并行）

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E6-T1 | 竞品功能对比矩阵 | 4h | `docs/competitive-matrix.md` | ≥ 5 个竞品，含截图引用 |
| E6-T2 | 用户旅程图分析 | 6h | `docs/user-journey-map.md` | 5+ 关键场景，痛点明确 |
| E6-T3 | 用户细分与定价策略 | 3h | `docs/pricing-strategy.md` | ≥ 3 个定价方案 |

### 数据采集方法
```bash
# gstack browse 自动化采集竞品截图
browse --url https://cursor.com --screenshot cursor-home.png
browse --url https://copilot.microsoft.com --screenshot copilot-home.png
# ...
```

### 验收
- 竞品矩阵含截图/功能对比表格
- 旅程图用 Mermaid 绘制
- 定价方案含免费/Pro/Enterprise

---

## E7: 架构演进（17h）

### 负责: Dev + Architect
### 依赖: 无
### 启动: Sprint 3 Day 1

### 任务拆分

| # | 任务 | 工时 | 产出文件 | 验收标准 |
|---|------|------|---------|---------|
| E7-T1 | React Flow 性能优化 | 6h | `src/components/nodes/*` + `src/stores/*` | 100 节点 FPS ≥ 30 |
| E7-T2 | 架构文档版本化 | 3h | `docs/architecture/domain.md` | 所有章节有 `@updated` 日期 |
| E7-T3 | API Route 服务层拆分 | 6h | `src/services/*` | API route 无直接 DB 调用 |
| E7-T4 | canvasApi 响应校验 | 2h | `lib/schemas/canvas.ts` | Zod schema 验证通过 |

### E7-T1 详细步骤
```
Step 1: 测量基准 FPS（当前值）
Step 2: 对所有 custom node 组件加 React.memo
Step 3: 对所有 node 类型添加 useCallback handlers
Step 4: 配置 React Flow viewport culling
Step 5: 添加 Immer middleware 到 Zustand stores
Step 6: 再次测量 FPS，验证 ≥ 30
```

### E7-T3 详细步骤
```
Step 1: 列出所有 API routes
Step 2: 识别直接操作 DB 的 routes
Step 3: 提取 DB 操作到对应的 Service 类
Step 4: 将 routes 改为调用 Service（参数传入）
Step 5: 编写 Service 层单元测试
Step 6: 验证原有 E2E 测试仍通过
```

### 验收测试
```bash
# FPS 测试
npx playwright test e2e/flow-perf.spec.ts

# API 拆分验证
npx jest tests/unit/services/

# Schema 验证
npx jest tests/unit/schemas/canvas.test.ts
```

---

## 工时汇总

| Epic | 工时 | Sprint | 可并行 |
|------|------|--------|--------|
| E1 | 3.5h | Sprint 1 | ✅ |
| E2 | 7h | Sprint 1 | ✅ | 已完成 (f04cc10c)
| E3 | 2h | Sprint 1 | ✅ |
| E4 | 8h | Sprint 1 后半 | ❌ (依赖 E3) |
| E5 | 19h | Sprint 2 | ✅ |
| E6 | 13h | Sprint 2 | ✅ |
| E7 | 17h | Sprint 3 | ✅ |
| **合计** | **69.5h** | **约 3 周** | |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| E4 引导系统与 Canvas 交互冲突 | 中 | 中 | E3 修复后先跑通引导，再做集成测试 |
| E7-T3 API 拆分影响现有功能 | 中 | 高 | 每个 route 拆分前写回归测试 |
| E5 CI Gate 误报（coverage 抖动） | 中 | 低 | 设置合理的 coverage 阈值 |
| E6 竞品数据采集被反爬 | 低 | 中 | 使用 gstack browse + 降级策略 |

---

*计划版本: v1.0 | 生成时间: 2026-04-01*
