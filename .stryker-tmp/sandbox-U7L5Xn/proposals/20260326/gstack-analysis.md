# GStack 提案分析报告
**日期**: 2026-03-26 11:50
**分析框架**: 问题验证 → 方案审查 → 风险评估 → 测试计划

---

## 1. 问题真实性验证 ✅

### 现状分析（已读取源码）

**问题文件**: `task_manager.py` 第 153-166 行

```python
# 读 — 无锁
with open(path) as f:
    return json.load(f)

# 写 — 无锁，直接覆盖
with open(path, "w") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
```

**并发场景**:
```
Agent A: read  → JSON {version: 3, tasks: [...]}
Agent B: read  → JSON {version: 3, tasks: [...]}   ← 同时读
Agent A: write → JSON {version: 4, tasks: A修改}   ← A先写
Agent B: write → JSON {version: 4, tasks: B修改}   ← B后写，覆盖A
```

**现有项目文件验证**:
```
检查了 3 个项目 JSON，0 个有 version 字段
→ 确认：当前实现完全无并发保护
```

**触发条件**:
- `coord-heartbeat-v9.sh` 每 5 分钟触发
- 各 agent 心跳各自调用 `task_manager.py`
- 高并发时段（多个 agent 同时心跳）→ 高损坏概率

**结论**: 问题真实，等级 P1 ✅

---

## 2. 方案审查：CLI + 乐观锁

### 方案设计

| 组件 | 实现 |
|------|------|
| 存储 | 每个项目一个 JSON，加顶层 `version` 字段 |
| 读 | `task_state.sh read <project>` → 返回当前 JSON + version |
| 写 | `task_state.sh update <project> <task_id> <status> --expect <version>` |
| 冲突处理 | bash 脚本自动重试（最多 3 次，指数退避）|

### 可行性评估

| 维度 | 评分 | 说明 |
|------|------|------|
| bash 兼容性 | 🟢 优秀 | 纯 bash wrapper，可复用现有脚本风格 |
| 侵入性 | 🟢 低 | 新增文件，不改现有 `task_manager.py` |
| 并发安全 | 🟢 强 | compare-and-swap，原子性有保障 |
| 回滚成本 | 🟢 低 | 只改 2 个新文件，旧逻辑保留 |

### 潜在风险

| 风险 | 等级 | 缓解 |
|------|------|------|
| 3 次重试都失败 | 🟡 低 | 第 3 次失败后返回 `CONFLICT`，agent 需人工介入 |
| 重试风暴 | 🟡 低 | 指数退避 (100ms → 200ms → 400ms) 抑制 |
| JSON 文件本身损坏 | 🔴 低 | 每次写入前做 JSON 合法性校验，失败则不覆盖 |
| version 字段初始值缺失 | 🟡 低 | 迁移脚本给现有文件统一加 `version: 0` |

---

## 3. 验收标准

### 必须通过

- [ ] 10 个 agent 同时调用 `task_state.sh update` 无数据损坏
- [ ] `task_state.sh` 所有子命令（read/update/list/validate）输出正确
- [ ] 现有 `task_manager.py` 命令兼容（不做破坏性修改）
- [ ] JSON 历史数据 100% 迁移完成（version 字段补全）
- [ ] 冲突返回 `CONFLICT: version mismatch` 并附重试建议
- [ ] pytest 覆盖率 100%（正常路径 + 冲突路径 + 错误路径）

### 性能基准

- [ ] 单次 read < 50ms
- [ ] 单次 update < 100ms
- [ ] 冲突重试 3 次总耗时 < 1s

---

## 4. 测试计划

### 单元测试（pytest）

```python
# test_task_state.py

def test_read_returns_version():
    """读取返回当前 version"""
    result = sh.read("vibex-test")
    assert "version" in result

def test_update_increments_version():
    """正常更新 version++"""
    v1 = sh.read("vibex-test")["version"]
    sh.update("vibex-test", "task1", "done", expect=v1)
    v2 = sh.read("vibex-test")["version"]
    assert v2 == v1 + 1

def test_conflict_detected():
    """version 不匹配时返回 CONFLICT"""
    result = sh.update("vibex-test", "task1", "done", expect=999)
    assert result["status"] == "CONFLICT"

def test_retry_on_conflict():
    """冲突自动重试成功"""
    # 模拟并发场景，确保重试逻辑正确
    pass
```

### 并发压测

```bash
# 10 个 agent 同时心跳写入
for i in $(seq 1 10); do
  ./scripts/task_state.sh update vibex-concurrency-test task$i done "agent$i" &
done
wait
# 验证：version 应该是 10，所有 task 状态都是 done
```

---

## 5. 决策

| 提案 | 决策 | 备注 |
|------|------|------|
| CLI + 乐观锁 | ✅ 批准 | 2h 内完成，零依赖，零破坏性 |
| 分 3 阶段（JSON→双路径→SQLite）| ❌ 驳回 | 过度设计，Phase 3 才能真解并发 |
| 直接 SQLite | ❌ 驳回 | 引入依赖，当前场景不需要 |

**下一步**: 阶段一通过，阶段二派发 dev 实现 `task_state.py` + `task_state.sh`

---

*GStack 分析完成 | 问题验证: ✅ | 方案审查: ✅ | 测试计划: ✅*
