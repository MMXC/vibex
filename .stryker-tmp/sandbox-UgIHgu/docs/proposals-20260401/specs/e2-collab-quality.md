# Spec: E2 - 协作质量防护

## 概述
防护 3 类协作质量风险：越权编辑、路径不一致、重复通知。

## F2.1: JSON 越权编辑拦截

### 问题
Agent 可以在不持有文件锁的情况下 `update done`，导致虚假完成。

### 规格
- 文件: `task_manager.py update`
- 逻辑: `update` 时读取 task JSON 的 `lock.holder`，不匹配则抛出 `LockRequired` 异常
- 异常: `SystemExit(1)` + 消息 `LockRequired: <agent> does not hold lock for <project>/<stage>`

### 验收
```python
# e2-s1 验收测试（Python pytest）
def test_update_without_lock_raises():
    # setup: 创建任务 + 锁归另一 agent
    lock_holder = "dev"
    current_agent = "pm"
    with pytest.raises(SystemExit) as exc:
        task_update(project, stage, current_agent, ...)
    assert "LockRequired" in str(exc.value)
```

---

## F2.2: 自检报告路径规范

### 问题
各 agent 自检报告路径不统一（有的在 `proposals/`，有的在根目录）。

### 规格
- 规范路径: `proposals/YYYYMMDD/<agent>-proposals-YYYYMMDD.md`
- 验证: 路径必须在 `proposals/YYYYMMDD/` 目录下
- 不合规时: `task_manager.py` 写入时抛出 `PathValidationError`

### 验收
```typescript
// e2-s2 验收
const reportPath = 'proposals/20260401/dev-proposals-20260401.md';
const regex = /^proposals\/\d{8}\/[a-z]+-proposals-\d{8}\.md$/;
expect(regex.test(reportPath)).toBe(true);
```

---

## F2.3: 重复通知过滤

### 问题
Feishu 通知因重试机制产生大量重复消息。

### 规格
- 去重策略: 内容 hash (SHA256) 去重
- 窗口: 30 分钟内相同 hash 不重复发送
- 存储: 内存 Map（hash → timestamp）

### 验收
```typescript
// e2-s3 验收
const seen = new Map<string, number>();
const now = Date.now();
const hash = sha256(content);
// 第一次发送
expect(isDuplicate(hash, now, seen)).toBe(false);
seen.set(hash, now);
// 20min 后同内容
expect(isDuplicate(hash, now + 20*60*1000, seen)).toBe(false);
// 35min 后同内容（超出30min窗口，应视为新消息）
expect(isDuplicate(hash, now + 35*60*1000, seen)).toBe(true);
```
