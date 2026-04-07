# Analysis: 修复 reviewer-epic2-proposalcollection 失败问题

> **任务**: `reviewer-epic2-proposalcollection-fix / analyze-requirements`  
> **Analyst**: analyst  
> **分析时间**: 2026-03-23 09:25 (Asia/Shanghai)  
> **上游产物**: `proposals/20260323/reviewer.md` (缺失)  
> **实际产物**: `workspace-reviewer/proposals/20260323/reviewer-self-check.md` (正确内容，错误路径)

---

## 一、问题陈述

### 1.1 核心问题

**路径不匹配**：reviewer agent 在 2026-03-23 的提案自检中，将提案文件保存到了错误的路径：

| | 路径 |
|---|---|
| **预期路径** | `/root/.openclaw/vibex/docs/proposals/20260323/reviewer.md` |
| **实际路径** | `/root/.openclaw/workspace-reviewer/proposals/20260323/reviewer-self-check.md` |

这导致 `proposals-summary-20260323.md` 中 reviewer 状态显示为"⚠️ 未知"，协调层无法感知 reviewer 提案已提交。

### 1.2 证据

`proposals-summary-20260323.md` 中的提案收集状态表：

```
| reviewer | ⚠️ 未知 | — |
```

但 reviewer heartbeat 报告（05:37）已明确标注 reviewer 提案为 ✅ 已提交（内容：`reviewer-self-check.md`）。

---

## 二、根因分析

### 2.1 直接原因

reviewer 心跳脚本在提案收集阶段，将输出文件写入了 **workspace-reviewer 本地目录** (`workspace-reviewer/proposals/20260323/reviewer-self-check.md`)，而非 vibex 项目共享目录 (`vibex/docs/proposals/20260323/reviewer.md`)。

### 2.2 深层原因

| # | 根因 | 说明 |
|---|---|---|
| 1 | **agent workspace 隔离 vs 共享存储** | reviewer 有独立 workspace，但提案汇总脚本期望文件在 vibex/docs/proposals/ 下。workspace 隔离是安全设计，但缺乏跨 workspace 的文件发布机制 |
| 2 | **提案收集缺少路径契约** | reviewer 的提案收集流程没有明确指定"必须写入 vibex/docs/proposals/YYYYMMDD/reviewer.md"，只写了"保存到本地 proposals 目录" |
| 3 | **汇总脚本无法感知跨 workspace 文件** | `proposals-summary-20260323.md` 只能扫描 `vibex/docs/proposals/20260323/` 目录，无法访问 reviewer workspace |
| 4 | **status 自评与实际不符** | reviewer 自己标记为 ✅ 已提交，但协调层无法验证 |

---

## 三、业务影响

| 影响维度 | 程度 | 说明 |
|---|---|---|
| **协调感知** | 🟡 中 | coord 无法看到 reviewer 提案，导致今日提案收集不完整 |
| **提案汇总** | 🔴 高 | `proposals-summary-20260323.md` 缺少 reviewer 视角的洞察（8 Epic 全部完成、SSE 延迟问题等） |
| **后续派发** | 🟡 中 | 基于不完整汇总的决策可能导致遗漏 reviewer 发现的 P0/P1 问题（如 SSE 延迟优化建议） |
| **自检可信度** | 🟡 中 | agent 自评"已完成"但实际汇总层感知"未知"，系统出现认知不一致 |

---

## 四、技术方案选项

### 方案 A：路径契约强制化（推荐）

**思路**：修改 reviewer 心跳脚本，明确要求提案文件必须写入 vibex 项目目录，并复制一份到 workspace 本地。

**实现**：
```bash
# reviewer heartbeat 提案收集阶段
PROPOSAL_OUT="/root/.openclaw/vibex/docs/proposals/$(date +%Y%m%d)/reviewer.md"
mkdir -p "$(dirname "$PROPOSAL_OUT")"
# 生成内容到临时文件，然后同时：
# 1. cp 到 $PROPOSAL_OUT（协调层可见）
# 2. 保存到 workspace-reviewer/proposals/YYYYMMDD/reviewer.md（agent 本地存档）
```

**优点**：改动最小，路径契约明确  
**缺点**：需要为每个 agent 配置独立的 vibex 写权限路径

### 方案 B：统一提案汇总脚本增强

**思路**：保持 agent 本地存档不变，修改 `proposals-summary` 脚本，增加对各 agent workspace 的扫描。

```bash
# proposals-summary-20260323.sh 增强
for agent in analyst tester pm reviewer dev architect; do
  case $agent in
    reviewer) scan_path="/root/.openclaw/workspace-reviewer/proposals/20260323/" ;;
    tester)   scan_path="/root/.openclaw/workspace-tester/proposals/20260323/" ;;
    analyst)  scan_path="/root/.openclaw/vibex/docs/proposals/20260323/" ;;
    ...
  esac
  find "$scan_path" -name "*.md" -newer "$yesterday" ...
done
```

**优点**：不改变 agent 现有行为，汇总脚本适应现状  
**缺点**：汇总脚本变得脆弱，各 agent 命名规范不统一（如 reviewer 用 `reviewer-self-check.md`，analyst 用 `analyst-proposals.md`）

### 方案 C：建立标准化的跨 agent 文件引用协议

**思路**：定义 `~/.openclaw/proposals/YEARMMdd/agent-name.md` 作为统一提案入口，各 agent 在心跳时同步写入共享目录。

**优点**：路径完全统一，汇总脚本简洁  
**缺点**：需要较大改造，涉及多个 agent 的心跳脚本和路径配置

---

## 五、推荐方案

**选择：方案 A（路径契约强制化）**

理由：
1. **最小改动**：只需修改 reviewer 心跳脚本的提案输出路径
2. **契约清晰**：`vibex/docs/proposals/YYYYMMDD/{agent}.md` 作为唯一真实源
3. **向后兼容**：workspace 本地副本仍可保留，作为 agent 本地存档
4. **可扩展**：其他 agent（dev, architect）同样适用

---

## 六、验收标准

| # | 标准 | 测试方法 |
|---|---|---|
| V1 | reviewer 20260323 提案在 `vibex/docs/proposals/20260323/reviewer.md` 存在 | `test -f vibex/docs/proposals/20260323/reviewer.md` |
| V2 | proposals-summary-20260323.md 中 reviewer 状态变为 ✅ | grep "reviewer.*✅" proposals-summary-20260323.md |
| V3 | 今日（20260324）reviewer 心跳后，新提案写入正确路径 | `test -f vibex/docs/proposals/20260324/reviewer.md` |
| V4 | workspace-reviewer 本地存档与 vibex 共享文件内容一致 | diff 两个路径的文件 |

---

## 七、风险与约束

| 风险 | 缓解措施 |
|---|---|
| reviewer workspace 无 vibex 写权限 | 使用 `chmod` 或调整 openclaw 权限配置 |
| 批量改造影响其他 agent | 方案 A 仅影响 reviewer，逐步验证 |
| 历史提案汇总不完整 | 一次性补录 20260323 的 reviewer-self-check.md 内容到正确路径 |

---

## 八、待澄清项

1. **dev/architect 今日提案状态**：`proposals-summary-20260323.md` 显示两者均为"⚠️ 未知"，是否也需要分析？
2. **Reviewer heartbeat 脚本路径配置**：是否需要统一修改还是单独处理？
3. **文件权限**：reviewer agent 是否有写权限到 `vibex/docs/proposals/`？
