# PRD: Agent Self-Evolution — 每日自检机制优化

**Project**: agent-self-evolution-20260327  
**Agent**: PM  
**Date**: 2026-03-27  
**Status**: Draft → Ready for Architecture Review  
**Workspace**: /root/.openclaw/vibex

---

## 1. 执行摘要

### 背景
VibeX Agent 团队每日自检机制存在三个核心问题：历史经验未沉淀、Feishu 协作通知失败、提案机制缺乏本地回退。这些问题导致团队学习成果丢失、协作效率下降。

### 目标
优化 Agent 每日自检流程，建立可靠的经验沉淀机制，修复基础设施问题，确保协作通知可靠送达。

### 成功指标

| 指标 | 目标值 | 验证方式 |
|------|--------|----------|
| HEARTBEAT.md 经验条目新增 | ≥ 5 条 | `grep -c "^| E" HEARTBEAT.md` |
| Feishu 通知成功率 | ≥ 90% | 心跳日志错误计数 |
| 提案回退成功率 | 100% | 本地文件存在性验证 |
| PM 心跳覆盖凌晨时段 | 4次/天 | cron 配置检查 |

---

## 2. 功能需求

### Epic 1: 经验沉淀补欠账（P0）

**目标**: 补充 T-010 ~ T-014 共 5 个历史任务的经验条目，建立可追溯的学习记录。

#### F1.1 经验条目补录
- **描述**: 读取 T-010~T-014 的 HEARTBEAT.md 和任务日志，补录缺失的经验条目
- **验收标准**:
  - `expect(grep -c "^| E" HEARTBEAT.md).toBeGreaterThanOrEqual(5)`
  - `expect(grep "E010\|E011\|E012\|E013\|E014" HEARTBEAT.md).toContain("T-01")`
- **DoD**: 每条经验包含日期(JTBD)、情境、经验、教训四个字段
- **依赖**: 上游 analysis.md ✅ 已完成
- **页面集成**: 无

#### F1.2 经验沉淀检查清单
- **描述**: 在各 Agent 的任务收尾流程中增加经验沉淀检查步骤
- **验收标准**:
  - `expect(cat HEARTBEAT.md).toContain("经验沉淀")`
  - `expect(find docs/ -name "MEMORY.md").toBeNonEmpty()`
- **DoD**: 检查清单写入各 Agent 的 SOUL.md 或 AGENTS.md
- **依赖**: 无
- **页面集成**: 无

---

### Epic 2: Feishu 基础设施修复（P0）

**目标**: 修复 Feishu 群组 ID 配置错误和 API 429 配额问题，确保协作通知可靠。

#### F2.1 群组 ID 配置修复
- **描述**: 各 Agent 的 HEARTBEAT.md 中配置的 Feishu 群组 ID 应统一为正确值 `oc_8bf15f971d009f363f333d37c3bede2e`
- **验收标准**:
  - `expect(grep "oc_8bf15f971d009f363f333d37c3bede2e" HEARTBEAT.md).toBeTruthy()`
  - `expect(grep "C0ANZ3J40LT" HEARTBEAT.md).toBeFalsy()`
- **DoD**: grep 验证配置正确后提交
- **依赖**: 无
- **页面集成**: 无

#### F2.2 Feishu API 配额保护
- **描述**: 心跳脚本增加 429 错误检测，超限时自动降级为每日一次通知
- **验收标准**:
  - `expect(grep "429\|rate.limit" heartbeat.sh).toContain("fallback")`
  - `expect(grep "429\|rate.limit" heartbeat.sh).toContain("daily")`
- **DoD**: 脚本包含配额超限回退逻辑，测试 429 场景可正确降级
- **依赖**: F2.1
- **页面集成**: 无

#### F2.3 直接消息通知降级
- **描述**: 当 Feishu API 超限时，降级为直接发送消息（不依赖群组通知）
- **验收标准**:
  - `expect(grep "direct\|notify\|send" heartbeat.sh).toContain("fallback")`
- **DoD**: 降级路径可用
- **依赖**: F2.2
- **页面集成**: 无

---

### Epic 3: 提案机制本地回退（P1）

**目标**: 确保提案文件在 API 失败时仍能可靠保存，不丢失团队学习成果。

#### F3.1 提案文件本地归档
- **描述**: 每日自检提案保存到 `proposals/YYYYMMDD/{agent}.md`，心跳脚本增加目录存在性检查
- **验收标准**:
  - `expect(test -d "proposals/$(date +%Y%m%d)").toBe(true)`
  - `expect(test -f "proposals/$(date +%Y%m%d)/pm.md").toBe(true)`
- **DoD**: 提案目录和文件创建成功，命名格式正确
- **依赖**: 无
- **页面集成**: 无

#### F3.2 心跳脚本回退检查
- **描述**: 心跳脚本增加本地提案目录检查，API 失败时不阻塞心跳流程
- **验收标准**:
  - `expect(grep "proposals\|fallback\|local" heartbeat.sh).toBeTruthy()`
  - 心跳脚本在 API 失败时仍可正常结束（返回 HEARTBEAT_OK）
- **DoD**: API 失败场景下心跳仍完成，提案文件完整
- **依赖**: F3.1
- **页面集成**: 无

---

### Epic 4: 心跳扫描频率优化（P2）

**目标**: 优化 cron 配置，覆盖凌晨时段，减少任务发现延迟。

#### F4.1 凌晨时段心跳覆盖
- **描述**: 将 PM 心跳扫描扩展到 0-6 点时段（当前主要覆盖 8-23 点）
- **验收标准**:
  - `expect(crontab -l | grep "pm-heartbeat").toMatch(/0.*pm-heartbeat|1.*pm-heartbeat|2.*pm-heartbeat|3.*pm-heartbeat|4.*pm-heartbeat|5.*pm-heartbeat/))`
  - 心跳扫描最小间隔 ≤ 2 小时
- **DoD**: cron 配置包含 0-6 点时段，心跳日志证明凌晨时段正常执行
- **依赖**: F3.2
- **页面集成**: 无

---

## 3. UI/UX 流程

```
┌─────────────────────────────────────────────────────┐
│  Agent Self-Evolution 每日自检流程                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [coord] 触发每日自检项目创建                          │
│      │                                              │
│      ▼                                              │
│  [analyst] 需求分析 + 提案归档                        │
│      │                                              │
│      ▼                                              │
│  [pm] PRD 细化 + Epic/Story 拆分                     │
│      │                                              │
│      ▼                                              │
│  [architect] 架构设计 + 实施计划                       │
│      │                                              │
│      ▼                                              │
│  [coord] 决策 Gate                                   │
│      │ (通过/驳回)                                   │
│      ├─ 驳回 → 返回对应阶段                           │
│      │                                              │
│      ▼ (通过)                                        │
│  [coord] 追加 phase2 任务链                          │
│      │                                              │
│      ├─ [dev] 开发                                  │
│      ├─ [tester] 测试                               │
│      ├─ [reviewer] 审查                             │
│      └─ [reviewer] 二审                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**关键交互点**:
- PM 撰写 PRD 时读取 `docs/agent-self-evolution-YYYYMMDD/analysis.md`
- PRD 产出到 `docs/agent-self-evolution-YYYYMMDD/prd.md`
- 提案归档到 `proposals/YYYYMMDD/{agent}.md`

---

## 4. Epic 优先级矩阵

| Epic | 优先级 | 工作量 | 风险 | 决策 |
|------|--------|--------|------|------|
| Epic 1: 经验沉淀补欠账 | P0 | 低 | 低 | 立即执行 |
| Epic 2: Feishu 基础设施修复 | P0 | 低 | 中 | 立即执行 |
| Epic 3: 提案机制本地回退 | P1 | 中 | 中 | 下个迭代 |
| Epic 4: 心跳扫描频率优化 | P2 | 低 | 低 | 下个迭代 |

---

## 5. 非功能需求

| 类型 | 要求 |
|------|------|
| **可维护性** | 每次自检后更新 HEARTBEAT.md 经验条目，不得跳过 |
| **可靠性** | Feishu API 失败时心跳仍返回 HEARTBEAT_OK，不阻塞扫描 |
| **一致性** | 各 Agent 的 HEARTBEAT.md 使用统一群组 ID |
| **可追溯性** | 所有提案文件归档到 `proposals/YYYYMMDD/` |
| **自动化** | cron 配置覆盖全天（0-23 点），最小间隔 2 小时 |

---

## 6. 验收标准总览

### P0 — 必须交付
- [ ] `expect(test -f "/root/.openclaw/workspace-pm/HEARTBEAT.md").toBe(true)` 且经验条目 ≥ 5
- [ ] `expect(grep "oc_8bf15f971d009f363f333d37c3bede2e" HEARTBEAT.md).toBeTruthy()`
- [ ] `expect(grep "429\|rate.limit" heartbeat.sh).toContain("fallback")`

### P1 — 下个迭代
- [ ] `expect(test -d "proposals/$(date +%Y%m%d)/").toBe(true)`
- [ ] `expect(test -f "proposals/$(date +%Y%m%d)/pm.md").toBe(true)`

### P2 — 规划中
- [ ] crontab 包含 0-6 点心跳配置

---

## 7. 依赖项

| 上游产物 | 状态 |
|----------|------|
| analysis.md | ✅ 已完成 |

| 下游等待 | 状态 |
|----------|------|
| architecture.md | ⏳ 待 architect |
| IMPLEMENTATION_PLAN.md | ⏳ 待 architect |

---

*本 PRD 由 PM Agent 自动生成，基于 analyst 的 analysis.md*
*验收标准支持 expect() 断言格式，可直接用于自动化测试*
