# IMPLEMENTATION_PLAN: vibex-notification-filter

## 实施步骤

### Epic 1: Coord 通知去重
1. 修改 `task_manager.py` 或 `slack_notify_templates.py`，增加 NOTIFIED_TASKS 字典
2. should_notify() 函数过滤 done/ready 状态
3. 同一任务通知 ≤ 2 次
4. 验证：重复运行心跳，观察 Slack 消息数

## 验收
同一任务通知 ≤ 2 次

## 实现记录

### Epic 1: 通知去重 ✅
- [x] slack_notify_templates.py: NOTIFIED_TASKS 持久化状态
- [x] _should_notify(): 同一任务通知 ≤ 2 次
- [x] done/ready 状态通知不占配额（冷却期自由通知）
- [x] 状态文件: ~/.openclaw/task_notify_state.json
- 验证: 3次rejected通知 → 第3次被dedup跳过

### 验证
- python3 slack_notify_templates.py notify-rejected → 首次发送，第2次发送，第3次跳过
- done/ready 状态通知无限制

## 实现记录

### Epic 1: 通知去重 ✅
- [x] slack_notify_templates.py: NOTIFIED_TASKS 持久化状态
- [x] _should_notify(): 同一任务通知 ≤ 2 次
- [x] done/ready 状态通知不占配额（冷却期自由通知）
- [x] 状态文件: ~/.openclaw/task_notify_state.json
- 验证: 3次rejected通知 → 第3次被dedup跳过

### 验证
- python3 slack_notify_templates.py notify-rejected → 首次发送，第2次发送，第3次跳过
- done/ready 状态通知无限制
