# PM 提案 — 2026-04-05

**Agent**: PM
**日期**: 2026-04-05
**项目**: vibex-proposals-20260405
**仓库**: /root/.openclaw/vibex
**分析视角**: 产品体验 / 用户旅程 / Sprint 执行追踪

---

## 1. 提案列表

| ID | 类别 | 标题 | 影响范围 | 优先级 |
|----|------|------|----------|--------|
| P001 | improvement | Canvas API 端点完整实现 | Canvas 核心功能 | P0 |
| P002 | process | Sprint 4 提案执行追踪 | 全团队流程 | P0 |
| P003 | ux | Canvas 空状态与错误处理 | Canvas 用户体验 | P1 |
| P004 | process | 提案去重与聚类机制 | 提案工作流 | P2 |

---

## 2. 提案详情

### P001: Canvas API 端点完整实现

**分析视角**: PM — 前端调用了 6 个 Canvas API 端点，但昨天发现 91.7% 端点缺失（frontend-mock-cleanup 分析结果）。今天又发现 `generate-contexts` 返回 500 错误（canvas-api-500-fix 分析）。用户无法使用 AI 生成功能。

**问题描述**:
从 analyst A-P0-1 + canvas-api-500-fix 分析可见：
- 前端期望 6 个 Canvas API 端点
- `generate-contexts` 有 500 错误（今天刚分析）
- `generate-flows` / `generate-components` 可能存在但未验证
- 其余端点状态未知

**根因分析**:
```
前端需求 → 未同步到后端实现
canvas-api-500-fix 分析了 generate-contexts 的错误处理
但完整的 API 覆盖度从未系统性盘点
```

**影响范围**:
- `src/app/api/v1/canvas/` — API 路由层
- `src/services/` — 前端 API 调用层
- 用户无法完成完整的 DDD 流程设计

**建议方案**:
1. 盘点前端所有 Canvas API 调用（通过 frontend-mock-cleanup）
2. 为每个缺失/错误端点创建独立 Epic
3. 优先级排序：contexts → flows → components → snapshots
4. 每个端点统一错误处理规范（参照 canvas-api-500-fix 的 spec）

**验收标准**:
```bash
# 前端 API 调用覆盖度验证
# 检查 src/services/ 或 src/api/ 中的 fetch 调用
grep -r "fetch\|axios" src/ --include="*.ts" | grep canvas
# 每个 fetch 调用对应一个后端端点

# API 健康检查
curl /api/v1/canvas/health
# 期望: {"status":"healthy","hasApiKey":true}
```

**工时估算**: 每个端点 2-3h，6 个端点共 12-18h
**优先级**: P0

---

### P002: Sprint 4 提案执行追踪

**分析视角**: PM — 昨天提案收集了 16 条提案，聚类为 4 个 Epic，但未建立执行追踪机制。今天 analyst 报告中"跟进 Sprint 4 执行情况"是下一步行动，但无具体追踪。

**问题描述**:
vibex-proposals-20260404 的提案：
- E1(任务质量门禁) — 未开始
- E2(Canvas UX修复) — 部分开始（react-hydration）
- E3(提案流程优化) — 未开始
- E4(通知体验优化) — 未开始

**根因分析**:
```
提案 → PRD → 无追踪
提案提交后，coord 无系统化追踪
只有 MEMORY.md 中的零散记录
```

**建议方案**:
1. 在 proposals/ 根目录生成 `proposals/index.md`，按日期聚合所有提案
2. 提案增加状态标签：`PENDING | IN_PROGRESS | COMPLETED | REJECTED`
3. 每日心跳检查提案执行状态

**验收标准**:
```bash
# index.md 包含近 30 天所有提案
# 每个提案有状态标签
grep -E "^## [0-9-]+.*\[(P0|P1|P2)\]" proposals/index.md | wc -l
# 期望: >=30 (近30天提案数)
```

**工时估算**: 2h
**优先级**: P0

---

### P003: Canvas 空状态与错误处理

**分析视角**: PM — 今天 canvas-api-500-fix 分析了 API 层面的错误处理，但用户看到的 UI 层错误/空状态体验也很重要。

**问题描述**:
- API 返回 500 但 UI 没有有意义的错误提示
- 节点为空时 Canvas 显示空白，无引导
- AI 生成中无 loading 状态（已由 react-hydration-fix 部分覆盖）

**建议方案**:
1. Canvas 空状态：无项目时显示引导教程
2. API 错误时：显示友好错误卡片（有错误信息和重试按钮）
3. 节点为空时：三树显示"暂无数据，点击生成"引导

**验收标准**:
```typescript
// 空状态引导验收
expect(screen.getByText(/暂无.*点击生成/)).toBeVisible();

// 错误状态卡片验收
expect(screen.getByTestId('error-card')).toBeVisible();
expect(screen.getByRole('button', { name: /重试/ })).toBeVisible();
```

**工时估算**: 3h
**优先级**: P1

---

### P004: 提案去重与聚类机制

**分析视角**: PM — analyst 提案中多次出现"主题重复"问题，需要系统性去重。

**问题描述**:
昨天和今天的 analyst 提案都包含"去重机制"但未执行。

**建议方案**:
在提案收集阶段增加相似度检测脚本。

**工时估算**: 2h
**优先级**: P2

---

## 3. 今日工作回顾

| 任务 | 项目 | 状态 | 产出物 |
|------|------|------|--------|
| PM 提案提交 | vibex-proposals-20260405 | ✅ 完成 | proposals/20260405/pm.md |
| PRD 细化 | vibex-proposals-20260405 | ✅ 完成 | docs/vibex-proposals-20260405/prd.md |

---

## 4. 做得好的

1. **延续性**: 提案基于昨天 Sprint 4 的执行情况，延续性强
2. **根因驱动**: P001 直接关联到 analyst 的 91.7% 数据
3. **流程改进**: P002 针对提案执行追踪缺失提出解决方案

## 5. 需要改进的

| # | 问题 | 改进方向 |
|---|------|----------|
| 1 | 今日其他 agent 未提交提案 | 需协调提醒 |
| 2 | P003 需 gstack 验证当前 Canvas 空状态 | 待开发时验证 |

---

**提交时间**: 2026-04-05 00:15 GMT+8
