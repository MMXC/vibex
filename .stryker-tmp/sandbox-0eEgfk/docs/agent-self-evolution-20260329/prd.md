# Agent Self-Evolution PRD — 2026-03-29

**项目**: agent-self-evolution-20260329
**作者**: create (subagent)
**日期**: 2026-03-29
**状态**: WIP → Draft

---

## 1. 背景与目标

本 PRD 基于 `analysis.md` 的分析结论，为 `agent-self-evolution-20260329` 项目定义各 Agent 的改进方向、优先级与验收标准。

**核心目标**：
- 修复 P0 部署问题（`/canvas` 生产环境 404）
- 建立 Epic 规模标准化流程（P1）
- 增强 Tester 主动贡献能力（P2）
- 升级 Phase 文件格式（P3）

---

## 2. 优先级矩阵

| ID | 功能点 | 负责人 | 优先级 | 工作量 | 依赖 |
|----|--------|--------|--------|--------|------|
| E1 | 修复 `/canvas` 生产环境 404 | Dev | **P0** | 0.5h | 无 |
| E2 | Epic 规模标准化（3-5 功能点/Epic） | Analyst | **P1** | 0.5h | 无 |
| E3 | Tester 主动扫描 E2E 报告 | Tester | **P2** | 1h | E2 |
| E4 | Phase 文件格式升级（`__FINAL__` 标记） | Dev | **P3** | 0.5h | 无 |

---

## 3. 功能点详细规格

### E1. P0 修复：Canvas 生产环境 404

**问题描述**：
`/canvas` 源代码完整但生产环境返回 404。Next.js 路由配置或 Vercel 部署配置未包含 `/canvas` 页面。

**影响**：
- 所有用户无法访问 VibeX 的核心交互页面
- DDD 三树建模（CardTree/FlowCanvas/MermaidCanvas）无法触达用户

**验收标准**：
```
expect(gstack.get("/canvas").status).toBe(200)
// 或
expect(response.body).toContain("CardTree") // 或任意画布标识元素
```

**DoD**：
- [ ] 生产环境 `https://[domain]/canvas` 返回 200
- [ ] 三套画布（CardTree/FlowCanvas/MermaidCanvas）均可正常渲染
- [ ] gstack browse 截图验证页面内容非 404 错误页
- [ ] Vercel deployment 日志无路由报错

**实现步骤**：
1. 检查 `pages/canvas.tsx` 或 `app/canvas/page.tsx` 是否存在
2. 检查 `vercel.json` 或 `next.config.js` 路由配置
3. 确认 Vercel 部署包含最新 build
4. 若配置缺失，补充路由并触发 redeploy

**Spec 文档**：`specs/e1-canvas-deploy-fix.md`

---

### E2. P1 Epic 规模标准化

**问题描述**：
`vibex-canvas-feature-gap-20260329` 包含 18 个功能点，超出常规 Epic 规模（3-5 个），导致 Reviewer/Tester 无法评估工作规模。

**验收标准**：
```
# Analyst 创建 Epic 时验证
# 功能点总数应在 3-5 之间
# 可用以下命令验证
expect(epic_feature_count).toBeGreaterThanOrEqual(3)
expect(epic_feature_count).toBeLessThanOrEqual(5)
```

**DoD**：
- [ ] Analyst HEARTBEAT.md 增加「Epic 规模自检」逻辑
- [ ] 每个 Epic 功能点数量控制在 3-5 个
- [ ] 超出规模时自动拆分并创建 sub-Epic
- [ ] 更新 Analyst SOUL.md 记录此规范

**实现步骤**：
1. 修改 Analyst `HEARTBEAT.md`：创建 Epic 前检查功能点数量
2. 若功能点 > 5，按优先级排序并拆分为 sub-Epic
3. 命名规范：`[project] Epic[N]-[name]` 如 `canvas-feature-gap Epic1-UndoRedo`
4. 写入 SOUL.md 作为 Analyst 的固定工作准则

**Spec 文档**：`specs/e2-epic-scale-standardization.md`

---

### E3. P2 Tester 主动扫描 E2E 报告

**问题描述**：
Tester 在 Dev 单边 Epic 日无主动贡献（最近 24h 无新阶段文件），依赖事件驱动模式缺乏主动扫描机制。

**验收标准**：
```
# Tester 扫描 ~/.gstack/reports/ 目录
# 若有新报告则自动分析
# 扫描逻辑
import os
reports_dir = "~/.gstack/reports/"
new_reports = [f for f in os.listdir(reports_dir) if f.endswith(".html")]
for report in new_reports:
    # 分析报告并输出摘要到 phase 文件
```

**DoD**：
- [ ] Tester `HEARTBEAT.md` 增加「扫描 `~/.gstack/reports/`」逻辑
- [ ] 扫描间隔：每 15 分钟一次（与心跳一致）
- [ ] 发现新报告时自动生成分析 phase 文件
- [ ] phase 文件写入 `docs/[project]-tester-epic[N]/`
- [ ] 测试通过率低于 80% 时触发告警

**实现步骤**：
1. 修改 Tester `HEARTBEAT.md`：添加报告扫描逻辑
2. 使用 `gstack browse` 解析 HTML 报告结构
3. 提取关键指标：测试通过率、失败用例列表、性能数据
4. 生成 phase 文件：`[project]-tester-epic[N]-[timestamp].md`
5. 若测试失败率 > 20%，在 phase 文件中标记 `⚠️ 需要关注`

**Spec 文档**：`specs/e3-tester-proactive-scanning.md`

---

### E4. P3 Phase 文件格式升级

**问题描述**：
Phase 文件有多次重复执行记录（同一文件有多个 `[任务完成]` 块），导致文件膨胀和读取复杂性。

**验收标准**：
```
# Phase 文件规范
# 1. 文件头部包含 __METADATA__ 块
# 2. 任务完成后写入 __FINAL__ 标记
# 3. __FINAL__ 之后的追加内容无效
```

**DoD**：
- [ ] 定义标准 Phase 文件模板（见下方模板）
- [ ] 所有 agent HEARTBEAT.md 更新为使用 `--overwrite` 模式
- [ ] 现有 phase 文件添加 `__FINAL__` 标记（不修改内容）
- [ ] 读取时只解析 `__FINAL__` 标记之前的最新块

**Phase 文件模板**：
```markdown
# Phase: [Epic Name] — [Timestamp]

## Metadata
__PROJECT__: [project-name]
__EPIC__: [epic-id]
__AGENT__: [agent-name]
__START__: [ISO timestamp]
__FINAL__: [ISO timestamp]  <!-- 仅在最终完成时写入 -->

## 执行摘要
[1-3 行总结]

## 详细记录
[可追加的详细记录]

<!--
__FINAL__ 标记后的内容在读取时应被忽略
-->
```

**实现步骤**：
1. 在 `vibex/scripts/` 创建 `phase-file-template.md`
2. 更新所有 agent HEARTBEAT.md 中的 phase 文件写入逻辑
3. 使用 `--overwrite` 而非追加模式
4. 批量为现有 phase 文件添加 `__FINAL__` 标记（仅追加，不改内容）

**Spec 文档**：`specs/e4-phase-file-format.md`

---

## 4. 功能点汇总表

| ID | 功能点 | 描述 | 验收标准 | 需页面集成 |
|----|--------|------|----------|------------|
| E1 | Canvas 部署修复 | 修复 `/canvas` 生产 404 | `expect(gstack.get("/canvas")).status === 200` | 否（路由/部署配置）|
| E2 | Epic 规模标准化 | 限制 3-5 功能点/Epic | `expect(count).toBeBetween(3, 5)` | 否（流程规范）|
| E3 | Tester 主动扫描 | 扫描 E2E 报告目录 | 发现新报告自动生成 phase 文件 | 否（文件处理）|
| E4 | Phase 文件格式升级 | `__FINAL__` 标记+overwrite | 文件膨胀率 < 10%/月 | 否（文件规范）|

---

## 5. 验收测试

| 功能点 | 验收方式 | 验证方法 |
|--------|----------|----------|
| E1 | gstack browse 访问 `/canvas` | 截图 + status code 断言 |
| E2 | Epic 创建后功能点数量检查 | 人工抽查 + CI 检查 |
| E3 | 在 `~/.gstack/reports/` 放入测试报告 | 观察 phase 文件是否生成 |
| E4 | 多次执行同一 agent 任务 | 观察 phase 文件大小增长 < 10% |

---

## 6. DoD（项目级）

- [ ] E1 完成且验证通过（gstack 截图证据）
- [ ] E2 完成且 Analyst SOUL.md 已更新
- [ ] E3 完成且 Tester HEARTBEAT.md 已更新
- [ ] E4 完成且 `phase-file-template.md` 已创建
- [ ] 所有 Spec 文档已写入 `specs/` 目录

---

## 7. 排期

| 功能点 | 预计工时 | 建议执行人 |
|--------|----------|-----------|
| E1 | 0.5h | Dev（立即执行）|
| E2 | 0.5h | Analyst |
| E3 | 1h | Tester |
| E4 | 0.5h | Dev |

**总工时**: 2.5h

---

*本 PRD 由 create agent 基于 analysis.md 生成*  
*生成时间: 2026-03-29 09:15 UTC+8*
