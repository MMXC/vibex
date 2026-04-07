# 心跳报告 Slack Blocks 模板使用指南

**项目**: heartbeat-template-optimization  
**文档作者**: Analyst Agent  
**日期**: 2026-03-16  
**版本**: v2.0

---

## 一、概述

本模板用于生成格式化的心跳报告，发送到 Slack #coord 频道。

### 1.1 模板位置

```
/root/.openclaw/workspace-coord/templates/heartbeat-report-blocks-v2.json
```

### 1.2 特点

- ✅ 使用 Slack Blocks 格式
- ✅ 表格化项目列表
- ✅ 必检项目状态一目了然
- ✅ 支持动态变量填充
- ✅ 颜色/图标状态编码

---

## 二、模板结构

### 2.1 报告布局

```
┌─────────────────────────────────────────────┐
│ 📊 Heartbeat Report [2026-03-16 20:30]      │  ← Header
├─────────────────────────────────────────────┤
│ 状态: ✅ HEARTBEAT_OK │ 活跃项目: 3 个      │  ← 摘要区
│ 待办事项: 2 项       │ 异常: 0 个           │     (Fields)
├─────────────────────────────────────────────┤
│ 📋 活跃项目                                  │  ← 项目表格
│ | 项目 | Agent | 阶段 | 进度 |              │
│ |------|-------|------|------|              │
│ | vibex-frontend | dev | in-progress | 3/5 |│
├─────────────────────────────────────────────┤
│ ⚡ 本轮决策                                  │  ← 决策内容
│ • 派发 vibex-mermaid 给 Dev                  │
├─────────────────────────────────────────────┤
│ 🔍 必检项目                                  │  ← 检查点表格
│ | 项目 | 状态 | 产出物 |                    │
│ |------|------|--------|                    │
│ | 推送验证 | ✅ 正常 | bf7cdc8 |            │
│ | 检查清单 | ✅ Dev ✅ Tester | - |         │
│ | 测试覆盖 | 99.2% | test-results/ |        │
├─────────────────────────────────────────────┤
│ ⏱️ 耗时: 1m 23s │ 📦 待命计数: 1/3          │  ← Context
│ 🕐 生成时间: 2026-03-16 20:30               │
└─────────────────────────────────────────────┘
```

### 2.2 Slack Blocks 组件

| 组件 | 用途 | 位置 |
|------|------|------|
| `header` | 报告标题 | 顶部 |
| `section.fields` | 4 列状态摘要 | 摘要区 |
| `section.text` | 项目列表/决策内容 | 详情区 |
| `divider` | 分隔线 | 区域分隔 |
| `context` | 辅助信息 | 底部 |

---

## 三、使用方法

### 3.1 快速使用

```bash
# 使用填充脚本
/root/.openclaw/workspace-coord/scripts/fill-heartbeat-template-v2.sh \
  HEARTBEAT_OK \
  "派发 vibex-mermaid 给 Dev" \
  "1m 23s" \
  "1/3" \
  5
```

### 3.2 手动填充

```bash
# 读取模板
TEMPLATE=$(cat /root/.openclaw/workspace-coord/templates/heartbeat-report-blocks-v2.json)

# 替换变量
FILLED=$(echo "$TEMPLATE" | \
  sed "s/{timestamp}/$(date '+%Y-%m-%d %H:%M')/g" | \
  sed "s/{status}/HEARTBEAT_OK/g" | \
  sed "s/{status_emoji}/✅/g" | \
  sed "s/{active_projects}/3 个/g" | \
  sed "s/{pending_items}/2 项/g" | \
  sed "s/{anomalies}/0 个/g")

# 发送到 Slack
openclaw message send --channel slack --target C0AG6F818DD --blocks "$FILLED"
```

### 3.3 变量列表

| 变量 | 说明 | 示例值 | 数据源 |
|------|------|--------|--------|
| `{timestamp}` | 报告时间 | 2026-03-16 20:30 | `date '+%Y-%m-%d %H:%M'` |
| `{status}` | 状态 | HEARTBEAT_OK | 心跳结果 |
| `{status_emoji}` | 状态图标 | ✅ | 状态映射 |
| `{active_projects}` | 活跃项目数 | 3 个 | `task_manager.py list` |
| `{pending_items}` | 待办事项数 | 2 项 | `cat PENDING.md` |
| `{anomalies}` | 异常数 | 0 个 | `grep -c 'failed\|blocked'` |
| `{project_list_table}` | 项目表格 | 见下方 | `task_manager.py list --format table` |
| `{decisions}` | 决策内容 | 派发任务... | Step 2 决策 |
| `{duration}` | 耗时 | 1m 23s | 执行时间 |
| `{idle_count}` | 待命计数 | 1/3 | `.idle-counter` |
| `{push_status}` | 推送状态 | ✅ 正常 | `git status` |
| `{checklist_status}` | 检查清单状态 | ✅ Dev ✅ Tester | 检查清单文件 |
| `{test_coverage}` | 测试覆盖率 | 99.2% | coverage report |

---

## 四、状态映射

### 4.1 状态图标

| 状态 | 图标 | 颜色 |
|------|------|------|
| HEARTBEAT_OK | ✅ | 绿色 #36a64f |
| 需关注 | 🟡 | 黄色 #daa038 |
| 异常 | 🔴 | 红色 #dc3545 |

### 4.2 状态判断规则

```json
{
  "good": "status == HEARTBEAT_OK && anomalies == 0",
  "warning": "anomalies > 0 || pending_items > 5",
  "danger": "status != HEARTBEAT_OK"
}
```

---

## 五、表格格式

### 5.1 活跃项目表格

```markdown
| 项目 | Agent | 阶段 | 进度 |
|------|-------|------|------|
| vibex-frontend | dev | in-progress | 3/5 |
| vibex-phase1-infra | architect | pending | 0/4 |
```

### 5.2 必检项目表格

```markdown
| 项目 | 状态 | 产出物 |
|------|------|--------|
| 推送验证 | ✅ 正常 | bf7cdc8 |
| 检查清单 | ✅ Dev ✅ Tester | dev-checklist.md |
| 测试覆盖 | 99.2% | test-results/ |
| 产出物 | ✅ analysis.md | prd.md, architecture.md |
```

---

## 六、最佳实践

### 6.1 发送时机

- ✅ 每次 Coord 心跳执行后发送
- ✅ 有重要决策时发送
- ⚠️ 避免过于频繁（如每分钟）

### 6.2 内容原则

- **简洁**: 核心信息一目了然
- **准确**: 数据来源可靠
- **可操作**: 异常项有明确处理建议

### 6.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| 表格显示错乱 | 检查 Markdown 语法，确保 `\|` 转义 |
| 变量未替换 | 检查变量名拼写，使用 `sed -i` |
| Slack 不显示 | 检查 JSON 格式，使用 `jq .` 验证 |

---

## 七、版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-03-16 | 初始版本，基础 Slack Blocks |
| v2.0 | 2026-03-16 | 新增表格格式、必检项目、状态映射 |

---

## 八、参考文档

- [Slack Block Kit 文档](https://api.slack.com/block-kit)
- [HEARTBEAT.md](/root/.openclaw/workspace-coord/HEARTBEAT.md)
- [需求分析报告](/root/.openclaw/vibex/docs/heartbeat-report-template/analysis.md)

---

**产出物**: `/root/.openclaw/vibex/docs/heartbeat-template-optimization/template-usage-guide.md`