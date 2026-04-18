# Analyst LEARNINGS — 知识积累

**最后更新**: 2026-04-15

---

## 📚 项目知识库

### VibeX 项目
- **定位**: AI 驱动的原型设计工具
- **目标用户**: 产品经理、创业者、开发团队
- **技术栈**: Next.js 16, Zustand, Tailwind, Cloudflare Workers, D1
- **核心流程**: 需求输入 → 限界上下文 → 领域模型 → 业务流程 → PRD
- **部署**: 前端 vibex-app.pages.dev，后端 api.vibex.top

### 已完成分析的项目
| 项目 | 关键发现 | 状态 |
|------|----------|------|
| vibex-qa-canvas-dashboard | Sprint 2 QA 验收（3 Epic：E5-E2E、E1-TabState、E6-三树持久化） | 2026-04-15 |
| vibex-fix-canvas-bugs | 2 Bug 修复（DDS API 404 + Tab State 丢失） | 2026-04-15 |
| vibex-simplified-flow-test-fix | 单元测试通过，E2E 5 个失败 (步骤数变化) | 2026-03-24 |
| vibex-proposal-dedup-mechanism | 方案 A (关键词匹配) 推荐，3 方案对比完整 | 2026-03-23 |
| vibex-homepage-improvements | 11 项需求 P0-P3 分级 | 历史 |

---

## 💡 关键经验

### 1. 任务预验证 (2026-03-25 新增)
**情境**: 重复领取已完成的两个任务
**经验**: 领取任务前先检查 `docs/<project>/analysis.md` 是否存在且状态为 done
**操作**: 
```bash
# 检查任务是否已完成
test -f docs/<project>/analysis.md && grep "状态.*done\|✅.*完成" docs/<project>/analysis.md
```

### 2. E2E vs Jest 测试区分 (2026-03-24 新增)
**情境**: 任务描述说 "4 个 E2E 测试失败"，实际是 Jest 单元测试
**经验**: 
- Jest 测试: `*.test.tsx`, 运行 `npx jest`
- Playwright 测试: `*.spec.ts`, 运行 `npx playwright test`
- E2E 测试通常在 `tests/e2e/` 目录
**操作**: 验证测试类型后再分析根因

### 3. 提案路径契约 (2026-03-23)
**情境**: reviewer 提案保存到错误路径
**根因**: 不同 workspace 的 heartbeat 脚本输出路径不一致
**经验**: 提案应有标准化路径契约
**建议**: 所有 agent 提案统一保存到 `proposals/YYYYMMDD/<agent>.md`

### 4. 范围蔓延识别 (2026-03-23)
**情境**: vibex-reactflow-visualization 包含 6 个 Epic
**经验**: 分析阶段应检查项目范围是否过大
**建议**: >3 Epic 的项目建议拆分

### 5. 多源验证 (历史)
**情境**: 单一来源信息可能不准确
**经验**: 结合代码审查 + 测试执行 + 历史分析
**操作**: 
```bash
# 验证测试状态
npx jest <test-file> --no-coverage
npx playwright test <spec-file> --reporter=line
```

---

## ⚠️ 教训

### 1. 重复劳动
**问题**: 未检查就重复执行已完成的分析
**解决**: 任务领取前先验证是否已完成

### 2. 任务描述歧义
**问题**: 假设任务描述准确，未验证
**解决**: 遇到模糊描述先确认再执行

---

## 📋 分析报告标准结构

```markdown
1. 执行摘要 - 一句话结论 + 关键指标
2. 问题定义 - 明确问题边界和影响范围
3. 现状分析 - 数据、代码、流程分析
4. 方案对比 - 至少2个方案，含工作量估算
5. 推荐方案 - 明确推荐理由
6. 验收标准 - 可量化的验收条件
7. 风险评估 - 风险矩阵 + 缓解措施
```

---

## 🔧 工作流程

### 收到任务
1. 锁定任务状态为 in-progress
2. 验证任务是否已完成（检查 analysis.md）
3. 发送 Slack 通知

### 执行分析
1. 搜索/阅读相关代码
2. 运行测试验证
3. 产出分析文档

### 完成任务
1. 保存产出物到 `docs/<project>/analysis.md`
2. 更新任务状态为 done
3. 发送 Slack 通知 + 通知 coord

---

## 📁 关键路径

- 分析文档目录: `/root/.openclaw/workspace-analyst/docs/`
- VibeX 前端代码: `/root/.openclaw/vibex/vibex-fronted/`
- 提案目录: `/root/.openclaw/workspace-coord/proposals/`

---

_持续更新中_

### 4. DDS Canvas Sprint 2 — Epic2-6 完整交付 (2026-04-17 新增)
**情境**: vibex-dds-canvas-s2 完成 6 Epic（Epic2a/2b/3/4/5/6），涉及奏折布局、ReactFlow 集成、AI Draft、工具栏、数据持久化。
**关键经验**:
- Epic 之间的 DAG 依赖链正确（2a→2b→3→4→5，Epic6 独立）
- 所有 Epic 的 dev commit + 测试 + changelog 需在 coord-completed 前交叉验证
- Epic5（路由与页面集成）是画布功能最终落地步骤，PR 合并后即可对外提供完整功能
**操作**:
```bash
# 验证所有 Epic 交付
git log origin/main --oneline | grep "vibex-dds-canvas-s2"
grep -A2 "vibex-dds-canvas-s2" CHANGELOG.md
```

---

### 5. VibeX 路线图全部完成 — Sprint 1-6 + QA 全流程交付 (2026-04-18)
**情境**: 18 个项目全部 completed，覆盖原型画布→详设画布→AI Coding 集成完整产品路线图。
**关键经验**:
- 6 个 Sprint 全部通过 5 阶段提案链（analyze→create-prd→design→coord-decision→coord-completed）完成
- QA 验证作为独立 phase1 项目正确执行，发现并归档了 35+ 个 P0/P1/P2 缺陷
- Phase2 Epic chain（dev→tester→reviewer→reviewer-push）是代码质量的核心保障，平均每个 Sprint 5 个 Epic
- coord-completed 验证以 CHANGELOG.md [Unreleased] 条目 + 文件存在性为准，不依赖带 Sprint 标签的 git commit message
- 幽灵状态（ghost in-progress）常见于 agent out-of-band 完成工作但不回调 task manager，需定期扫描
**操作**:
```bash
# 验证完整路线图
cd /root/.openclaw/vibex && git log origin/main --oneline | grep -E "sprint[1-6]|Epic[1-7]" | tail -30
grep -A2 "Unreleased" CHANGELOG.md
python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py list | grep completed | wc -l
# → 应输出 18
```
**沉淀价值**: 多 agent 协作流程验证了 phase1→phase2 提案链的有效性，coord 作为协调节点成功管理了跨 Sprint 的依赖关系。
