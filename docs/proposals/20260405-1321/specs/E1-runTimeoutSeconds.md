# E1: runTimeoutSeconds 配置 - 详细规格

## S1.1 增加 runTimeoutSeconds 参数

### 目标
在所有 `sessions_spawn` 调用中增加 `runTimeoutSeconds` 参数，防止无限期运行。

### 实施方案
```bash
# common.sh 修改
spawn_task_session() {
  local agent_id=$1
  local task=$2
  local label=$3
  
  sessions_spawn \
    --task "$task" \
    --label "$label" \
    --runtime "subagent" \
    --agentId "$agent_id" \
    --mode "session" \
    --runTimeoutSeconds 1800 \  # ✅ 新增：30分钟超时
    2>&1 | head -3 &
  disown
}
```

### 验收断言
```bash
# 测试验证
grep -r "runTimeoutSeconds" /root/.openclaw/scripts/
# 期望：所有 spawn 调用包含 --runTimeoutSeconds 1800
```

### DoD Checklist
- [ ] `spawn_task_session()` 增加 `--runTimeoutSeconds 1800`
- [ ] 所有调用点增加参数
- [ ] 测试验证超时行为
