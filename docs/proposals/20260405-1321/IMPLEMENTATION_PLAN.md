# Implementation Plan: Subagent Timeout Recovery

> **项目**: subagent-timeout-strategy  
> **日期**: 2026-04-05  
> **总工时**: ~4h (Sprint 1: 1.5h + Sprint 2: 2.5h)  
> **依赖**: OpenClaw `sessions_spawn` 工具支持 `runTimeoutSeconds` 参数

---

## 1. Sprint 规划

### Sprint 1: 核心超时机制 (1.5h)

| Epic | Story | 任务 | 工时 | 交付物 | 顺序 |
|------|-------|------|------|--------|------|
| E1 | S1.1 | runTimeoutSeconds 配置 | 0.5h | `subagent-spawn.sh` | 1 |
| E2 | S2.1 | checkpoint.sh 脚本 | 0.5h | `checkpoint.sh` | 2 |
| E2 | S2.2 | recovery.sh 脚本 | 0.5h | `recovery.sh` | 3 |

### Sprint 2: WIP 保护与进度感知 (2.5h)

| Epic | Story | 任务 | 工时 | 交付物 | 顺序 |
|------|-------|------|------|--------|------|
| E3 | S3.1 | wip-commit.sh 脚本 | 1h | `wip-commit.sh` | 4 |
| E3 | S3.2 | wip-squash.sh 脚本 | 1h | `wip-squash.sh` | 5 |
| E4 | S4.1 | 进度报告协议 | 0.5h | `.subagent_progress` | 6 |

---

## 2. 详细任务分解

### Sprint 1

#### Task 1.1: subagent-spawn.sh

```bash
# 文件: /root/.openclaw/scripts/subagent-spawn.sh
# 依赖: 无
# 验证: sessions_spawn 调用包含 runTimeoutSeconds

# 步骤:
# 1. 创建脚本文件（参考 architecture.md 3.1.3）
# 2. chmod +x
# 3. 验证: sessions_spawn --help 或检查工具文档

# DoD:
# - [ ] 脚本存在且可执行
# - [ ] 默认超时 1800s
# - [ ] 创建初始 checkpoint.json
```

#### Task 1.2: checkpoint.sh

```bash
# 文件: /root/.openclaw/scripts/checkpoint.sh
# 依赖: 无
# 验证: checkpoint.json 存在且包含正确字段

# 步骤:
# 1. 创建 checkpoint.sh（参考 architecture.md 3.2.2）
# 2. 创建 /root/.openclaw/checkpoints/ 目录
# 3. 测试: 调用 checkpoint.sh step_test "test step"

# DoD:
# - [ ] 脚本存在且可执行
# - [ ] checkpoint.json 包含 project, taskId, steps, lastCheckpoint
# - [ ] git commit hash 被记录
# - [ ] modified files 列表被记录
```

#### Task 1.3: recovery.sh

```bash
# 文件: /root/.openclaw/scripts/recovery.sh
# 依赖: checkpoint.sh, checkpoint.json
# 验证: 从 checkpoint 恢复后继续执行

# 步骤:
# 1. 创建 recovery.sh（参考 architecture.md 3.2.3）
# 2. 测试: 创建 checkpoint → 模拟修改 → recovery.sh → 验证恢复

# DoD:
# - [ ] 脚本存在且可执行
# - [ ] git 状态恢复到 lastCommit
# - [ ] stash 被正确弹出
# - [ ] checkpoint 状态更新为 'recovered'
```

### Sprint 2

#### Task 2.1: wip-commit.sh

```bash
# 文件: /root/.openclaw/scripts/wip-commit.sh
# 依赖: git repository
# 验证: git log 包含 WIP commit

# 步骤:
# 1. 创建 wip-commit.sh（参考 architecture.md 3.3.2）
# 2. 在测试 repo 中创建修改
# 3. 调用 wip-commit.sh
# 4. 验证 git log

# DoD:
# - [ ] 脚本存在且可执行
# - [ ] git log 包含 "WIP:" 格式 commit
# - [ ] 无修改时跳过 commit
# - [ ] checkpoint 更新 wipCommit 字段
```

#### Task 2.2: wip-squash.sh

```bash
# 文件: /root/.openclaw/scripts/wip-squash.sh
# 依赖: wip-commit.sh, 至少 1 个 WIP commit
# 验证: main 分支无 WIP commits

# 步骤:
# 1. 创建 wip-squash.sh（参考 architecture.md 3.3.3）
# 2. 创建多个 WIP commits
# 3. 调用 wip-squash.sh
# 4. 验证 main 分支无 WIP，squash commit 存在

# DoD:
# - [ ] 脚本存在且可执行
# - [ ] 多个 WIP commits 合并为 1 个 squash commit
# - [ ] main 分支 git log 不含 "WIP:"
# - [ ] squash commit 包含所有修改
```

#### Task 2.3: 进度报告协议

```bash
# 文件: .subagent_progress (JSON)
# 路径: /root/.openclaw/subagents/<session_id>/
# 依赖: 无
# 验证: 父会话可读取进度

# 步骤:
# 1. 定义 .subagent_progress JSON schema
# 2. 在 subagent 模板中增加写入逻辑
# 3. 创建 subagent-progress-monitor.sh

# DoD:
# - [ ] .subagent_progress 包含所有必需字段
# - [ ] 父会话可通过文件读取进度
# - [ ] 超过 5 分钟无心跳触发告警
```

---

## 3. 测试计划

### 3.1 单元测试

```bash
# 测试覆盖:
# 1. checkpoint.sh 创建正确格式的 checkpoint.json
# 2. recovery.sh 正确恢复 git 状态
# 3. wip-commit.sh 创建正确格式的 commit message
# 4. wip-squash.sh 合并 WIP commits

# 测试命令:
bash /root/.openclaw/scripts/checkpoint.sh test_step "测试步骤"
test -f /root/.openclaw/checkpoints/default.json && echo "PASS" || echo "FAIL"
```

### 3.2 集成测试

```bash
# 测试场景: 模拟超时-恢复流程

# 1. 启动 subagent（带超时）
bash /root/.openclaw/scripts/subagent-spawn.sh "测试任务" 60 test_project test_task

# 2. 模拟子代理执行 + checkpoint
sleep 5
SUBAGENT_CHECKPOINT_FILE=/root/.openclaw/checkpoints/test_project_test_task.json \
  bash /root/.openclaw/scripts/checkpoint.sh step_1 "完成第一步"

# 3. 模拟超时（手动终止或等待）
# subagent 进程被 OpenClaw 终止

# 4. 恢复
bash /root/.openclaw/scripts/recovery.sh /root/.openclaw/checkpoints/test_project_test_task.json

# 5. 验证
git status --porcelain  # 应无未提交修改
```

### 3.3 E2E 测试

```bash
# Coord 派发 → Subagent 执行 → 超时 → 恢复 → 完成

# 验收标准:
# - 超时后 task_manager 显示 ready 状态
# - 恢复后从 checkpoint 继续
# - 最终 git log 无 WIP（已 squash）
```

---

## 4. 部署步骤

### 4.1 Sprint 1 部署

```bash
# 1. 创建目录
mkdir -p /root/.openclaw/checkpoints
mkdir -p /root/.openclaw/scripts

# 2. 部署脚本
cp subagent-spawn.sh /root/.openclaw/scripts/
cp checkpoint.sh /root/.openclaw/scripts/
cp recovery.sh /root/.openclaw/scripts/

# 3. 设置权限
chmod +x /root/.openclaw/scripts/subagent-spawn.sh
chmod +x /root/.openclaw/scripts/checkpoint.sh
chmod +x /root/.openclaw/scripts/recovery.sh

# 4. 验证
ls -la /root/.openclaw/scripts/*.sh
```

### 4.2 Sprint 2 部署

```bash
# 1. 部署 WIP 脚本
cp wip-commit.sh /root/.openclaw/scripts/
cp wip-squash.sh /root/.openclaw/scripts/
chmod +x /root/.openclaw/scripts/wip-*.sh

# 2. 部署进度监控
cp subagent-progress-monitor.sh /root/.openclaw/scripts/
chmod +x /root/.openclaw/scripts/subagent-progress-monitor.sh

# 3. 创建进度目录
mkdir -p /root/.openclaw/subagents
```

---

## 5. 回滚计划

| 场景 | 回滚动作 |
|------|----------|
| checkpoint.sh 异常 | 删除脚本，subagent 降级到无 checkpoint 模式 |
| wip-commit.sh 异常 | git reset --hard 到上一个已知 good commit |
| 全部异常 | 删除 `/root/.openclaw/scripts/subagent-*.sh` 和 `/root/.openclaw/checkpoints/` |

---

*本文档由 Architect Agent 生成 | 2026-04-05*
