# AGENTS.md: fix-epic1-topic-tracking

**Agent**: Architect  
**日期**: 2026-03-25  
**项目**: fix-epic1-topic-tracking  
**受众**: Dev Agent（实现者）

---

## 1. Dev Agent 工作指令

### 1.1 必须完成的任务

| # | 任务 | 产出文件 | 验收标准 |
|---|------|----------|---------|
| D1 | 重构 `create_thread_and_save` | `common.sh` | 移除 `\|\| true`，添加 exit code 检查 |
| D2 | 添加 `_degrade_to_normal_message` 辅助函数 | `common.sh` | 降级路径不产生循环调用 |
| D3 | 增强 `feishu_self_notify` 错误处理 | `common.sh` | 发送失败时输出 ⚠️ 告警 |
| D4 | analyst-heartbeat.sh 添加话题追踪 (P2) | `analyst-heartbeat.sh` | analyst 心跳不报错 |
| D5 | 创建测试脚本 | `test-topic-tracking.sh` | 覆盖 3 个核心场景 |
| D6 | 手动验证 5 个场景 | - | 所有场景通过 |

### 1.2 必须遵守的约束

| # | 约束 | 说明 |
|---|------|------|
| C1 | **不改变函数签名** | `create_thread_and_save`、`feishu_self_notify` 的参数和返回值语义不变 |
| C2 | **不引入新依赖** | 只使用 `bash`、`jq`、`grep`、`sed`、`openclaw` |
| C3 | **降级路径安全** | `_degrade_to_normal_message` 不能再次调用 `save_task_thread_id`，避免循环 |
| C4 | **保留向后兼容** | analyst-heartbeat.sh 的改动不影响现有功能（P2 可选） |
| C5 | **日志格式一致** | 告警用 `⚠️` 前缀，降级用 `⚠️ 降级为普通消息` |
| C6 | **git commit 规范** | 提交信息: `fix(heartbeat): remove silent failure in create_thread_and_save` |

### 1.3 驳回红线

以下情况将驳回实现，需要重新设计：

- `create_thread_and_save` 仍然静默吞掉错误（存在 `|| true`）
- 降级路径产生无限递归或循环调用
- 改动破坏现有 dev 心跳功能（正常运行变报错）
- 未覆盖 3 个核心测试场景
- 引入了新的 bash 执行依赖（如 python3、awk 非必要使用）

---

## 2. Reviewer Agent 检查清单

### 2.1 代码审查要点

- [ ] `create_thread_and_save` 中不再有 `|| true` 静默错误
- [ ] exit code 检查逻辑正确（`$?` 或 `local exit_code=$?`）
- [ ] `_degrade_to_normal_message` 内部不调用 `save_task_thread_id`
- [ ] `feishu_self_notify` 在发送失败时输出 `⚠️` 告警
- [ ] 所有 echo 输出使用 `>&2` 重定向到 stderr
- [ ] analyst-heartbeat.sh 改动不影响原有逻辑（P2 开关控制）

### 2.2 功能审查要点

- [ ] 场景 1（正常）: msg_id 提取成功，写入 HEARTBEAT.md
- [ ] 场景 2（Bot 不在群）: exit 1，输出告警，降级消息发送
- [ ] 场景 3（无 msg_id）: 输出 ⚠️ 告警，降级消息发送
- [ ] 场景 4（dev 心跳）: 任务领取后话题创建成功
- [ ] 场景 5（analyst 心跳）: 不报错，话题追踪已激活

---

## 3. 测试命令

### 3.1 本地测试

```bash
# 1. 验证 common.sh 语法
bash -n /root/.openclaw/scripts/heartbeats/common.sh

# 2. 运行测试脚本
bash /root/.openclaw/scripts/heartbeats/test-topic-tracking.sh

# 3. 手动触发 dev 心跳
cd /root/.openclaw/scripts/heartbeats && bash dev-heartbeat.sh

# 4. 检查 HEARTBEAT.md 话题区域
grep -A 5 "TASK_THREADS" /root/.openclaw/workspace-dev/HEARTBEAT.md
```

### 3.2 Mock 测试说明

测试脚本使用 `export -f` 将 mock 函数导出到子 shell，确保测试隔离。

---

## 4. 提交规范

```bash
# 提交格式
git add -A
git commit -m "fix(heartbeat): remove silent failure in create_thread_and_save

- 移除 || true，静默错误改为显式告警
- 添加降级机制：失败时 fallback 到普通消息
- analyst-heartbeat.sh 支持话题追踪 (P2)
- 添加 test-topic-tracking.sh 测试脚本

Closes: #p1-8"
```

---

## 5. 工作目录

| 文件 | 路径 |
|------|------|
| common.sh | `/root/.openclaw/scripts/heartbeats/common.sh` |
| analyst-heartbeat.sh | `/root/.openclaw/scripts/heartbeats/analyst-heartbeat.sh` |
| 测试脚本 | `/root/.openclaw/scripts/heartbeats/test-topic-tracking.sh` (新建) |
| Dev workspace | `/root/.openclaw/workspace-dev` |
| Vibex 项目 | `/root/.openclaw/vibex` |
