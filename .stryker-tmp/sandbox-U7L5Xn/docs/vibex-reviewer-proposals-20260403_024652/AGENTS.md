# VibeX Reviewer 提案 — Agent 协作指南

**项目**: vibex-reviewer-proposals-20260403_024652
**版本**: v1.0
**日期**: 2026-04-03
**角色**: Architect
**状态**: 协作指南完成

---

## 1. 执行决策

- **决策**: 已采纳
- **执行项目**: vibex-reviewer-proposals-20260403_024652
- **执行日期**: 2026-04-03

---

## 2. 任务派发

本项目 Sprint 3 共 4 个 Epic，11 个 Story，分为 **4 个阶段**派发给 **Dev Agent**。

### 2.1 派发计划

```
📌 任务派发: vibex-reviewer-proposals-20260403_024652

👥 派发 Agent: architect
📋 接收 Agent: dev
⏰ 派发时间: 2026-04-03
🎯 Sprint: Sprint 3 (Reviewer 审查质量提升)

阶段 1: E1 — CHANGELOG 规范落地 (2.5h)
  ├── Task 1.1: Frontend AGENTS.md CHANGELOG 章节 (1h)
  └── Task 1.2: Backend AGENTS.md CHANGELOG 规范同步 (0.5h)
  └── Task 1.3: CHANGELOG_CONVENTION.md 创建 (1h)

阶段 2: E2 — Pre-submit 检查脚本 (4h)
  ├── Task 2.1: pre-submit-check.sh 核心功能 (2h)
  └── Task 2.2: eslint-disable 监控增强 (1h)
  └── Task 2.3: CI 集成 pre-submit 检查 (1h)

阶段 3: E3 — Reviewer 驳回模板 (4h)
  ├── Task 3.1: AGENTS.md 驳回模板定义 (1h)
  └── Task 3.2: reports/INDEX.md 创建 (2h)
  └── Task 3.3: CI 自动追加机制 (1h)

阶段 4: E4 — 文档整理与宣贯 (0.5h)
  └── Task 4.1: README 更新 + 团队通知 (0.5h)
```

### 2.2 验收标准汇总

| Task | 验收标准 | 执行 Agent |
|------|---------|-----------|
| 1.1 | `expect(ag agents.md).toContain('CHANGELOG 规范')` 等 5 条 | Dev |
| 1.2 | `expect(backend agents.md).toContain('CHANGELOG 规范')` 等 2 条 | Dev |
| 1.3 | `expect(fs.existsSync('CHANGELOG_CONVENTION.md')).toBe(true)` 等 4 条 | Dev |
| 2.1 | `expect(fs.existsSync('scripts/pre-submit-check.sh')).toBe(true)` 等 5 条 | Dev |
| 2.2 | `expect(script).toContain('eslint-disable')` 等 3 条 | Dev |
| 2.3 | `expect(ci config).toContain('pre-submit-check.sh')` 等 2 条 | Dev |
| 3.1 | `expect(ag agents.md).toContain('❌ 审查驳回')` 等 4 条 | Dev |
| 3.2 | `expect(fs.existsSync('reports/INDEX.md')).toBe(true)` 等 4 条 | Dev |
| 3.3 | `expect(index auto script).toBeDefined() OR expect(ag agents.md).toContain('手动维护指南')` | Dev |
| 4.1 | `expect(readme.md).toContain('Reviewer 工作流')` 等 3 条 | Dev |

---

## 3. Agent 协作流程

### 3.1 Dev Agent 执行流程

```
📌 领取任务
├── 读取 ARCHITECT.md (本文件)
├── 读取 IMPLEMENTATION_PLAN.md
└── 按阶段顺序执行任务

📋 执行任务
├── 阶段 1: E1 — CHANGELOG 规范落地
│   ├── Task 1.1: 修改 vibex-fronted/AGENTS.md
│   ├── Task 1.2: 修改 vibex-backend/AGENTS.md
│   └── Task 1.3: 创建 vibex-fronted/CHANGELOG_CONVENTION.md
│
├── 阶段 2: E2 — Pre-submit 检查脚本
│   ├── Task 2.1: 创建 vibex-fronted/scripts/pre-submit-check.sh
│   ├── Task 2.2: 增强 eslint-disable 监控
│   └── Task 2.3: 创建 .github/workflows/pre-submit.yml
│
├── 阶段 3: E3 — Reviewer 驳回模板
│   ├── Task 3.1: 修改 vibex-fronted/AGENTS.md
│   ├── Task 3.2: 创建 vibex-fronted/reports/INDEX.md
│   └── Task 3.3: 创建 scripts/append-report-index.sh
│
└── 阶段 4: E4 — 文档整理
    └── Task 4.1: 修改 vibex-fronted/README.md + Slack 通知

🔍 自检
├── 运行 pre-submit-check.sh 验证
├── 对照验收标准逐项检查
└── 修复任何不达标项

✅ 任务完成
├── 发送完成消息到 #dev 频道
└── 等待 Reviewer 审查
```

### 3.2 Reviewer Agent 审查流程

```
📋 审查任务领取
├── 读取 PR 或分支 diff
└── 对照验收标准逐项检查

🔍 审查检查项
├── AGENTS.md 包含 CHANGELOG 规范章节
├── AGENTS.md 包含 Reviewer 驳回模板
├── CHANGELOG_CONVENTION.md 存在且格式正确
├── pre-submit-check.sh 可执行且逻辑正确
├── CI 配置包含 pre-submit 检查
├── reports/INDEX.md 包含历史报告索引
└── README.md 包含 Reviewer 工作流章节

✅ 审查通过
├── 写入 reports/RR-YYYYMMDD-NNN-epic-name.md
├── 更新 reports/INDEX.md
└── 通知 Coord

❌ 审查驳回
├── 使用标准化驳回模板
├── 包含具体修复命令
└── 发送驳回到 #dev 频道
```

### 3.3 Coord Agent 协调流程

```
📊 项目状态追踪
├── 监控 team-tasks 任务状态
├── 识别阻塞项并协调解决
└── 每周同步 Sprint 进度

📢 团队通知
├── Sprint 3 规范上线通知
├── 规范更新通知
└── Sprint 回顾通知
```

---

## 4. 文件变更清单

### 4.1 新建文件

| 文件路径 | 用途 | 创建者 |
|---------|------|--------|
| `vibex-fronted/CHANGELOG_CONVENTION.md` | CHANGELOG 格式规范 | Dev |
| `vibex-fronted/scripts/pre-submit-check.sh` | Pre-submit 检查脚本 | Dev |
| `vibex-fronted/.github/workflows/pre-submit.yml` | CI 集成 | Dev |
| `vibex-fronted/reports/INDEX.md` | 审查报告索引 | Dev |
| `vibex-fronted/scripts/append-report-index.sh` | INDEX 追加脚本（可选） | Dev |
| `vibex-fronted/ESLINT_DISABLES.md` | ESLint 豁免记录（Sprint 4） | Dev |

### 4.2 修改文件

| 文件路径 | 修改内容 | 修改者 |
|---------|---------|--------|
| `vibex-fronted/AGENTS.md` | CHANGELOG 规范章节 + 驳回模板 | Dev |
| `vibex-backend/AGENTS.md` | CHANGELOG 规范章节 | Dev |
| `vibex-fronted/README.md` | Reviewer 工作流章节 | Dev |

### 4.3 暂不修改

| 文件路径 | 原因 |
|---------|------|
| `.github/workflows/ci.yml` | Sprint 3 使用独立 pre-submit workflow |
| `package.json` | 暂不添加新依赖（脚本零依赖） |

---

## 5. 规范冲突解决

| 冲突场景 | 解决规则 |
|---------|---------|
| AGENTS.md 与其他文档冲突 | 以 AGENTS.md 为准（团队宪章） |
| CHANGELOG 路径歧义 | 以 AGENTS.md §CHANGELOG 规范为准 |
| eslint-disable 豁免争议 | 以 ESLINT_DISABLES.md 为准 |
| 报告格式争议 | 以 reports/INDEX.md §格式规范为准 |

---

## 6. 沟通频道

| 频道 | 用途 |
|------|------|
| #vibex-dev | Dev 日常沟通、任务领取、问题求助 |
| #vibex-reviewer | Reviewer 审查通知、驳回记录 |
| #vibex-architect | Architect 架构讨论、ADR 记录 |
| #vibex-coord | Coord 进度同步、阻塞上报 |

### 消息模板

**任务领取**:
```
📌 领取任务: vibex-reviewer-proposals-20260403_024652/<phase-name>
👤 Agent: dev
⏰ 时间: YYYY-MM-DD HH:MM
🎯 目标: <阶段目标>
```

**进度更新**:
```
🔄 进度更新: vibex-reviewer-proposals-20260403_024652/<phase-name>
📊 状态: Task X/Y 完成
📝 说明: <当前进展>
```

**任务完成**:
```
✅ 任务完成: vibex-reviewer-proposals-20260403_024652/<phase-name>
📦 产出物: <文件列表>
🔍 验证: <验收标准通过情况>
```

**审查驳回**:
```
❌ 审查驳回: vibex-reviewer-proposals-20260403_024652/<phase-name>
🔒 原因: <驳回原因>
📋 问题项: <具体问题>
🔧 修复命令: <具体命令>
📋 参考: AGENTS.md §<章节>
```

**审查通过**:
```
✅ 审查通过: vibex-reviewer-proposals-20260403_024652/<phase-name>
📦 产出物: <文件列表>
📝 备注: <可选备注>
```

---

## 7. Sprint 4 规划协调

Sprint 4 的 E5（Git Hooks）和 E6（ESLint 豁免治理）需要额外协调：

### 7.1 E5 Git Hooks 协调

- **时机**: Sprint 4 开始时
- **前提**: Sprint 3 规范验证有效
- **协调点**: 
  - Dev: 安装 husky + commitlint
  - Reviewer: 定义 commit message 格式规范
  - Coord: 通知团队新规范上线

### 7.2 E6 ESLint 豁免治理协调

- **时机**: Sprint 4 中期
- **前提**: E2-S2 已建立监控基线
- **协调点**:
  - Dev: 扫描现有豁免，分类处理
  - Reviewer: 定义豁免合理性标准
  - Tester: 验证修复后功能正常

---

## 8. 风险上报

遇到以下情况立即上报 Coord：

| 情况 | 严重程度 | 上报方式 |
|------|---------|---------|
| 规范与现有流程严重冲突 | 高 | 即时 Slack |
| 脚本在 CI 上行为不一致 | 高 | 即时 Slack |
| 团队成员不遵守规范 | 中 | 日常同步 |
| 规范需要调整 | 低 | 每日同步 |

---

## 9. 成功指标追踪

| 指标 | Sprint 3 目标 | 追踪方式 |
|------|--------------|---------|
| CHANGELOG 相关驳回次数 | 新 Epic ≤ 1 轮 | reports/INDEX.md 统计 |
| 平均审查轮次 | ≤ 1.5 轮/Epic | reports/INDEX.md 统计 |
| 驳回包含修复命令比例 | 100% | 抽查报告 |
| reports/INDEX.md 覆盖率 | 100% | 脚本验证 |
| pre-submit 脚本执行时间 | ≤ 120s | CI 日志 |
| eslint-disable 数量 | ≤ 20 | CI 监控 |

---

*Agent 协作指南完成。Dev Agent 可开始执行任务。*
