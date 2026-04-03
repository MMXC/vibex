# 心跳报告 Slack Blocks 模板需求分析

**项目**: heartbeat-report-template  
**分析师**: Analyst Agent  
**日期**: 2026-03-16  
**状态**: ✅ 分析完成

---

## 执行摘要

**需求**: 设计 Slack Blocks 格式的心跳报告模板，提升可读性和信息密度。

**核心诉求**: 用户希望一眼看清系统状态、关键决策和待处理事项。

**推荐方案**: 使用 Slack Block Kit 的 Section、Fields、Divider 组件，采用「摘要卡 + 详情折叠」结构。

---

## 一、用户核心诉求分析

### 1.1 用户想看到什么？

| 信息类型 | 优先级 | 说明 |
|----------|--------|------|
| **整体状态** | P0 | 系统是否健康？有无异常？ |
| **活跃项目** | P0 | 有哪些任务在进行？进度如何？ |
| **决策内容** | P1 | 本轮心跳做了什么决策？ |
| **待办事项** | P1 | 有什么需要关注的？ |
| **异常告警** | P0 | 有无阻塞/失败需要处理？ |

### 1.2 当前格式问题

**当前格式**：
```
📊 Heartbeat Report [YYYY-MM-DD HH:MM]
├─ Step 1: 状态扫描
│  ├─ 活跃项目: X 个
│  ├─ 待办事项: Y 项
│  └─ 异常状态: Z 个
├─ Step 2: 决策与派发
...
```

**问题**：
| 问题 | 影响 |
|------|------|
| 树状结构在 Slack 显示不美观 | 可读性差 |
| 信息密度低 | 需要滚动查看 |
| 缺少视觉层次 | 重点不突出 |
| 无交互元素 | 无法展开/折叠 |

### 1.3 期望效果

- **一眼看懂**：无需滚动即可获取核心信息
- **层次分明**：重要信息突出，次要信息折叠
- **视觉友好**：使用颜色、图标区分状态
- **可交互**：支持展开详情

---

## 二、Coord 工作模式分析

### 2.1 HEARTBEAT.md 四步骤

| 步骤 | 职责 | 核心输出 |
|------|------|----------|
| **Step 1: 状态扫描** | 检查系统状态 | 活跃项目数、待办事项、异常状态 |
| **Step 2: 决策与派发** | 分析问题并决策 | 决策内容、参考文档、推送验证 |
| **Step 3: 协作通知** | 唤醒 Agent | 派发任务、通知方式 |
| **Step 4: 自我驱动** | 提案与进化 | 待命计数、触发动作 |

### 2.2 报告内容映射

```
心跳报告结构:
├── 摘要区 (一眼看懂)
│   ├── 状态指示 (HEARTBEAT_OK / ⚠️ 需关注)
│   ├── 活跃项目数
│   ├── 待办事项数
│   └── 异常状态数
├── 详情区 (可折叠)
│   ├── Step 1 详情: 项目列表
│   ├── Step 2 详情: 决策内容
│   ├── Step 3 详情: 派发任务
│   └── Step 4 详情: 自我驱动
└── 操作区
    └── 查看完整报告链接
```

---

## 三、Slack Blocks 最佳实践

### 3.1 推荐组件

| 组件 | 用途 | 示例 |
|------|------|------|
| **Section** | 主要内容区块 | 状态摘要、项目列表 |
| **Fields** | 多列布局 | 状态指标并排显示 |
| **Divider** | 分隔线 | 区分不同区域 |
| **Context** | 辅助信息 | 时间戳、说明文字 |
| **Actions** | 交互按钮 | 查看详情、执行操作 |
| **Header** | 标题 | 报告标题 |

### 3.2 视觉设计原则

- **颜色编码**：
  - ✅ 绿色 → 正常/完成
  - 🟡 黄色 → 警告/待处理
  - 🔴 红色 → 错误/阻塞
  - 🔵 蓝色 → 信息/进行中

- **图标使用**：
  - 📊 报告
  - ✅ 完成
  - ⚠️ 警告
  - ❌ 错误
  - 📋 任务
  - 🔄 进行中

### 3.3 信息密度平衡

| 区域 | 密度 | 内容 |
|------|------|------|
| 摘要区 | 高 | 核心指标、状态 |
| 详情区 | 中 | 项目列表、决策内容 |
| 操作区 | 低 | 链接、按钮 |

---

## 四、模板设计方案

### 4.1 方案 A：紧凑卡片式（推荐）

**特点**：一眼看清核心状态，详情可展开

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "📊 Heartbeat Report [2026-03-16 20:30]"
      }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*状态*\\n✅ HEARTBEAT_OK" },
        { "type": "mrkdwn", "text": "*活跃项目*\\n3 个" },
        { "type": "mrkdwn", "text": "*待办事项*\\n2 项" },
        { "type": "mrkdwn", "text": "*异常*\\n0 个" }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*📋 活跃项目*\\n• vibex-frontend (coord 阶段)\\n• vibex-phase1-infra (dev 阶段)\\n• agent-self-evolution (6/6 完成)"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*⚡ 本轮决策*\\n• 派发 vibex-mermaid-render 给 Dev\\n• 唤醒 Analyst 检查提案"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "context",
      "elements": [
        { "type": "mrkdwn", "text": "⏱️ 耗时: 1m 23s | 📦 待命计数: 1/3 | 📄 查看完整报告" }
      ]
    }
  ]
}
```

### 4.2 方案 B：分层折叠式

**特点**：按步骤分块，每块可展开

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "📊 Heartbeat Report" }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "✅ *系统状态正常* | 活跃项目 3 | 待办 2 | 异常 0"
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🔍 Step 1: 状态扫描*\\n```\\n项目: vibex-frontend (active)\\n项目: vibex-phase1-infra (active)\\n待办: PEND-001, PEND-002\\n```"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*⚡ Step 2: 决策与派发*\\n```\\n决策: 派发 mermaid-render 任务\\n参考: protocols/quality-governance.md\\n验证: commit abc1234 ✅\\n```"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🔔 Step 3: 协作通知*\\n```\\n唤醒: Dev, Analyst\\n方式: Slack ✅\\n```"
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*🚀 Step 4: 自我驱动*\\n```\\n待命计数: 1/3\\n触发动作: 无\\n```"
      }
    }
  ]
}
```

### 4.3 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| A: 紧凑卡片式 | 信息密度高、一眼看清 | 详情不够详细 | ⭐⭐⭐⭐⭐ |
| B: 分层折叠式 | 结构清晰、与 HEARTBEAT.md 对应 | 信息分散、需滚动 | ⭐⭐⭐⭐ |

**推荐方案 A**，核心信息一目了然。

---

## 五、容易忽略的检查点（⚠️ 关键新增）

### 5.1 历史教训

根据 MEMORY.md 历史记录，以下检查点曾被遗漏导致问题：

| 检查点 | 历史问题 | 发生次数 | 影响 |
|--------|----------|----------|------|
| **代码推送验证** | 本地有 commit 但未推送 | 4 次 | 用户看不到代码 |
| **远程 commit 状态** | 标记 completed 但远程无代码 | 2 次 | 虚假完成 |
| **检查清单完整性** | Dev/Tester 未提交检查清单 | 3 次 | 质量失控 |
| **产出物文件存在性** | 任务 done 但文件不存在 | 2 次 | 虚假完成 |
| **项目完成标准** | 缺少推送/检查清单/测试 | 多次 | 需返工 |

### 5.2 必检项目清单

**Step 2 决策与派发阶段必须验证**：

```bash
# 1. 远程仓库同步状态
git fetch origin
git log origin/main --oneline -1

# 2. 任务状态与实际产出匹配
python3 /root/.openclaw/skills/team-tasks/scripts/task_manager.py status <project> --json
ls -la /root/.openclaw/vibex/docs/<project>/

# 3. 检查清单完整性
find /root/.openclaw -name "*-checklist.md" -newer /root/.openclaw/workspace-coord/.last-heartbeat

# 4. 覆盖率/测试结果
cat /root/.openclaw/vibex/vibex-fronted/coverage/coverage-summary.json

# 5. 阻塞任务检测
grep -r "failed\|blocked" /root/.openclaw/workspace-coord/team-tasks/
```

### 5.3 项目完成标准验证（强制）

**标记 completed 前必须满足**：

```
✅ completed = 有远程 commit + 有检查清单 + 测试通过

验证命令：
1. git log origin/main --oneline -1 | grep <功能关键词>
2. test -f docs/<project>/dev-checklist.md
3. test -f docs/<project>/tester-checklist.md
4. npm test -- --passWithNoTests
```

### 5.4 虚假完成检测流程

```
任务标记 done
    ↓
验证产出文件
    ├─ 文件存在 → 继续
    └─ 文件不存在 → 🔴 驳回，标记 pending
              ↓
         通知 agent 重新执行
```

### 5.5 报告中必须包含的检查点状态

| 检查项 | 报告显示 | 格式 |
|--------|----------|------|
| 远程 commit | 推送验证结果 | `⚠️ 推送验证: abc1234 ✅` 或 `🔴 未推送` |
| 检查清单 | 完整性状态 | `📋 检查清单: Dev ✅ Tester ✅` |
| 测试状态 | 通过率 | `🧪 测试: 99.2% (1342/1350)` |
| 产出物 | 文件存在性 | `📦 产出物: analysis.md ✅` |

---

## 六、实施建议

### 6.1 模板配置

```bash
# 心跳报告模板配置文件
/root/.openclaw/workspace-coord/templates/heartbeat-report-blocks.json
```

### 6.2 发送命令

```bash
# 使用 openclaw message send 发送 Slack Blocks
openclaw message send --channel slack --target C0AG6F818DD \
  --blocks "$(cat /root/.openclaw/workspace-coord/templates/heartbeat-report-blocks.json)"
```

### 6.3 动态变量

模板中需要替换的变量：

| 变量 | 来源 | 示例 |
|------|------|------|
| `{timestamp}` | `date '+%Y-%m-%d %H:%M'` | 2026-03-16 20:30 |
| `{status}` | 心跳结果 | HEARTBEAT_OK |
| `{active_projects}` | `task_manager.py list` | 3 个 |
| `{pending_items}` | `cat PENDING.md` | 2 项 |
| `{anomalies}` | `grep "failed\|blocked"` | 0 个 |
| `{decisions}` | Step 2 决策内容 | 派发任务... |
| `{idle_count}` | `.idle-counter` 文件 | 1/3 |
| `{push_verification}` | `git log origin/main -1` | abc1234 ✅ 或 🔴 未推送 |
| `{checklist_status}` | 检查清单文件检查 | Dev ✅ Tester ✅ |
| `{test_coverage}` | 测试覆盖率报告 | 99.2% |

---

## 七、验收标准

### 7.1 功能验收

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| HR-001 | 报告使用 Slack Blocks 格式 | 验证 Slack 显示效果 |
| HR-002 | 核心状态一目了然 | 用户反馈无需滚动即可获取核心信息 |
| HR-003 | 信息层次分明 | 重要信息突出显示 |
| HR-004 | 与 HEARTBEAT.md 四步骤对应 | 内容完整覆盖 |
| HR-005 | 支持动态变量替换 | 验证变量正确填充 |

### 7.2 检查点验收（新增）

| ID | 验收标准 | 测试方法 |
|----|----------|----------|
| HR-006 | **远程 commit 验证**必须显示 | 模拟未推送场景，验证报告显示 🔴 |
| HR-007 | **检查清单状态**必须显示 | 模拟缺失检查清单，验证报告显示警告 |
| HR-008 | **虚假完成检测**流程正确 | 任务 done 但文件不存在 → 驳回 |
| HR-009 | **项目完成标准**验证完整 | completed 必须有推送+检查清单+测试 |
| HR-010 | **产出物文件**存在性验证 | 文件不存在时报告显示 🔴 |

### 7.3 视觉验收

- [ ] 使用颜色编码区分状态
- [ ] 使用图标增强可读性
- [ ] 信息密度适中
- [ ] 在手机端显示正常
- [ ] **检查点状态醒目显示（新增）**

---

## 八、工作量估算

| 阶段 | 内容 | 工时 |
|------|------|------|
| 1 | 需求分析、模板设计 | 1h |
| 2 | Slack Blocks JSON 模板编写 | 1h |
| 3 | 动态变量替换脚本 | 1h |
| 4 | 检查点验证脚本（新增） | 1h |
| 5 | 测试验证 | 0.5h |
| **总计** | | **4.5h** |

---

## 九、下一步行动

1. **PM**: 创建 PRD，细化 Slack Blocks 结构 + 检查点清单
2. **Architect**: 设计模板文件结构和检查点验证机制
3. **Dev**: 实现模板、发送脚本、检查点验证脚本

---

**产出物**: `/root/.openclaw/vibex/docs/heartbeat-report-template/analysis.md`