# PRD: task_manager.py 内置 curl 催办通知

> **任务**: task-manager-curl-integration/create-prd  
> **创建日期**: 2026-03-30  
> **PM**: PM Agent  
> **项目路径**: /root/.openclaw/vibex  
> **产出物**: /root/.openclaw/vibex/docs/task-manager-curl-integration/prd.md

---

## 1. 执行摘要

| 项目 | 内容 |
|------|------|
| **背景** | task_manager.py 无通知机制，任务流转依赖心跳被动发现，缺乏实时性 |
| **目标** | 在 phase1/phase2/update/claim 命令中嵌入 curl Slack 通知，实现任务流转实时推送 |
| **核心价值** | 减少等待时间，提升团队协作效率 |
| **成功指标** | 100% 任务流转在 5 秒内通知到对应 agent |

---

## 2. 功能需求

### F1: 新增通知模块

**描述**：在 task_manager.py 顶部新增通知模块，包含 AGENT_CHANNEL、AGENT_TOKEN、通知函数

**验收标准**：
```
expect('_curl_slack' in dir()).toBe(true);
expect('notify_new_task' in dir()).toBe(true);
expect('notify_stage_done' in dir()).toBe(true);
expect('notify_stage_rejected' in dir()).toBe(true);
```

### F2: phase1 执行后通知 analyst

**描述**：创建 phase1 任务链后，自动通知 analyst 频道

**验收标准**：
```
expect(curl_called_with.channel).toBe('C0ANZ3J40LT');
expect(curl_called_with.text).toContain('新任务 READY');
expect(curl_called_with.text).toContain('analyze-requirements');
```

### F3: phase2 执行后通知 dev

**描述**：创建 phase2 任务链后，自动通知 dev 频道

**验收标准**：
```
expect(curl_called_with.channel).toBe('C0AP92ZGC68');
expect(curl_called_with.text).toContain('新任务 READY');
expect(curl_called_with.text).toContain('dev-');
```

### F4: update done 通知下一环节

**描述**：`update <p> <s> done` 后，自动通知下一环节 agent

**验收标准**：
```
# 假设 stage A 完成，B 依赖 A
expect(curl_called_with.channel).toBe(AGENT_CHANNEL[B.agent]);
expect(curl_called_with.text).toContain('任务完成');
expect(curl_called_with.text).toContain('轮到你了');
```

### F5: update pending 驳回通知

**描述**：`update <p> <s> pending <reason>` 后，通知原 agent 驳回原因

**验收标准**：
```
expect(curl_called_with.channel).toBe(AGENT_CHANNEL[original_agent]);
expect(curl_called_with.text).toContain('任务被驳回');
expect(curl_called_with.text).toContain('<reason>');
```

### F6: curl 失败不阻塞

**描述**：curl Slack 失败时，仅 warn 不阻塞命令执行

**验收标准**：
```
expect(command_executed_successfully).toBe(true);
expect(stderr).toContain('⚠️ 通知发送失败');
```

---

## 3. UI/UX 流程

### 3.1 通知流程图
```
Agent A 执行 task_manager.py 命令
    ↓
task_manager.py 执行核心逻辑
    ↓
触发通知钩子
    ↓
curl Slack API
    ↓
Agent B 收到通知
```

### 3.2 通知场景

| 场景 | 触发命令 | 通知目标 | 内容 |
|------|----------|----------|------|
| 新任务创建 | phase1/phase2 | 首个执行者 | 📋 新任务 READY |
| 任务完成 | update done | 下一环节 | ✅ 任务完成，轮到你了 |
| 任务驳回 | update pending | 原 agent | ⚠️ 任务被驳回，原因: xxx |

---

## 4. Epic 拆分

### Epic 1: 通知模块开发（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S1.1 | 新增 AGENT_CHANNEL 和 AGENT_TOKEN 配置 | P0 | 0.5h |
| S1.2 | 实现 _curl_slack 基础函数 | P0 | 0.5h |
| S1.3 | 实现 notify_new_task 函数 | P0 | 0.5h |
| S1.4 | 实现 notify_stage_done 函数 | P0 | 1h |
| S1.5 | 实现 notify_stage_rejected 函数 | P0 | 0.5h |

### Epic 2: 命令集成（P0）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S2.1 | phase1 命令集成通知 | P0 | 1h |
| S2.2 | phase2 命令集成通知 | P0 | 1h |
| S2.3 | update done 命令集成通知 | P0 | 2h |
| S2.4 | update pending 命令集成通知 | P0 | 1h |

### Epic 3: 下游查找算法（P1）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S3.1 | 实现 get_downstream_agent 函数 | P1 | 1h |
| S3.2 | 处理无下游的边界情况 | P1 | 0.5h |

### Epic 4: 测试与验证（P1）

| Story | 描述 | 优先级 | 工时 |
|-------|------|--------|------|
| S4.1 | 独立脚本测试验证 | P1 | 2h |
| S4.2 | 集成到 task_manager.py | P1 | 0.5h |

---

## 5. 优先级矩阵

| 功能 | 价值 | 成本 | 优先级 |
|------|------|------|--------|
| F1 通知模块 | 高 | 低 | P0 |
| F2 phase1 通知 | 高 | 低 | P0 |
| F3 phase2 通知 | 高 | 低 | P0 |
| F4 update done 通知 | 高 | 中 | P0 |
| F5 update pending 通知 | 中 | 低 | P0 |
| F6 curl 失败处理 | 中 | 低 | P1 |

**决策**：Epic 1 + 2 为 P0，共 7.5h；Epic 3 + 4 为 P1，共 3.5h

---

## 6. 验收标准

### 6.1 代码检查
```bash
# 通知函数存在
grep -n "_curl_slack\|notify_" task_manager.py

# AGENT_CHANNEL 和 AGENT_TOKEN 定义
grep -n "AGENT_CHANNEL\|AGENT_TOKEN" task_manager.py
```

### 6.2 集成测试
```bash
# phase1 后 analyst 收到通知
python3 task_manager.py phase1 test-project "测试目标"
# 期望: curl 调用成功，analyst 频道收到消息

# update done 后下一 agent 收到通知
python3 task_manager.py update test-project stage-1 done
# 期望: curl 调用成功，下一 stage 的 agent 频道收到消息

# update pending 后原 agent 收到驳回通知
python3 task_manager.py update test-project stage-1 pending "原因"
# 期望: curl 调用成功，原 agent 频道收到驳回消息
```

### 6.3 失败处理测试
```bash
# 模拟 curl 失败
# 期望: 命令执行成功，stderr 有警告
```

---

## 7. 非功能需求

| 需求 | 要求 |
|------|------|
| 性能 | curl 调用 < 2s，超时 10s |
| 可靠性 | curl 失败不阻塞主流程 |
| 安全性 | userToken 存储在本地配置，不硬编码 |
| 可测试性 | 独立脚本测试后再集成 |

---

## 8. 依赖

| 依赖 | 来源 |
|------|------|
| Slack API | 外部服务 |
| task_manager.py | 现有脚本 |
| AGENT_TOKEN | 需配置 |

---

## 9. DoD (Definition of Done)

- [ ] 通知函数已实现并通过单元测试
- [ ] phase1/phase2/update 命令已集成通知
- [ ] curl 失败不影响主流程
- [ ] 独立脚本测试通过
- [ ] git commit + PR 已创建

---

## 10. 风险缓解

| 风险 | 缓解措施 |
|------|----------|
| userToken 过期 | curl 失败 warn only，不阻塞 |
| Slack API 429 限速 | 添加 retry(1次) + 10s timeout |
| 无下游时通知失败 | 找不到下游时跳过通知 |
