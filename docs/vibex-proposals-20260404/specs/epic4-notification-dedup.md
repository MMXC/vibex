# Spec: Epic4 — 通知体验优化

## 概述
解决 Slack 重复通知问题。Reviewer 提案显示相同内容重复发送到 Slack，造成噪音。

## 影响文件
- `~/.openclaw/skills/team-tasks/scripts/slack_notify_templates.py`

---

## Spec E4-F1: Slack 通知去重机制

### 行为
相同 message hash 在 5 分钟内发送到相同 channel 时，跳过重复发送。

### 实现

```python
import hashlib
import time
from pathlib import Path

DEDUP_CACHE = Path('/tmp/slack_notify_dedup.json')
DEDUP_WINDOW = 300  # 5 分钟 = 300 秒

def _load_cache():
    if DEDUP_CACHE.exists():
        try:
            return json.loads(DEDUP_CACHE.read_text())
        except Exception:
            return {}
    return {}

def _save_cache(cache):
    DEDUP_CACHE.write_text(json.dumps(cache, ensure_ascii=False))

def _should_send(channel: str, message: str) -> bool:
    """返回 True 表示应该发送，False 表示应该跳过"""
    now = time.time()
    message_hash = hashlib.md5(message.encode()).hexdigest()
    key = f"{channel}:{message_hash}"
    
    cache = _load_cache()
    
    if key in cache:
        last_sent = cache[key]
        if now - last_sent < DEDUP_WINDOW:
            return False  # 5 分钟内，跳过
    
    # 更新缓存
    cache[key] = now
    # 清理过期条目
    cache = {k: v for k, v in cache.items() if now - v < DEDUP_WINDOW}
    _save_cache(cache)
    return True
```

### 修改 `send` 函数

```python
def send(channel, message, ...):
    dedup_key = f"{channel}:{hashlib.md5(message.encode()).hexdigest()}"
    
    if not _should_send(channel, message):
        print(f"⏭️ Skipped duplicate notification to {channel}")
        return
    
    # 原有的发送逻辑
    ...
```

### 验收

```python
def test_dedup_same_message():
    """相同消息第二次发送应被跳过"""
    cache = _load_cache()
    key = "C0APZP2JX2L:abc123"
    cache[key] = time.time()
    _save_cache(cache)
    
    should_send = _should_send("C0APZP2JX2L", "test message")
    assert should_send == False

def test_dedup_after_5min():
    """5 分钟后同一消息可重新发送"""
    cache = {"C0APZP2JX2L:test": time.time() - 310}  # 310 秒前
    _save_cache(cache)
    
    should_send = _should_send("C0APZP2JX2L", "test")
    assert should_send == True  # 过期后允许发送

def test_dedup_different_channel():
    """不同 channel 同一消息不重复，但各自独立"""
    should_send_c1 = _should_send("C0APZP2JX2L", "same message")
    should_send_c2 = _should_send("C0AGEQD470C", "same message")
    # 第一次发送两个 channel 都应该通过（各自独立）
    # （测试时需要清空缓存）
```

### 边界情况

| 场景 | 预期行为 |
|------|----------|
| 完全相同消息 + 同 channel + 5分钟内 | 跳过 |
| 完全相同消息 + 同 channel + 5分钟后 | 发送 |
| 完全相同消息 + 不同 channel | 各自发送 |
| 消息内容略有不同（如时间戳） | 各自发送 |

---

## 工时

- E4-F1: 1h
- 总计: 1h
