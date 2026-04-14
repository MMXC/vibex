# Specs: E2 SLA Mechanism

## Integration: task_manager.py

### SLA Behavior
| Event | SLA Action |
|-------|-----------|
| task claim | sla-deadline = now + 24h，写入 task JSON |
| task update (done) | 清除/标记 sla-deadline fulfilled |
| task update (failed) | 保留 sla-deadline 供参考 |
| sla-deadline exceeded | 心跳脚本检测 → 通知 #coord |

### Task JSON Schema Addition
```json
{
  "sla_deadline": "2026-04-15T12:00:00+08:00",
  "sla_fulfilled": false
}
```

### Verification
- [ ] `task_manager.py claim` 后 JSON 包含 sla-deadline
- [ ] `task_manager.py status` 显示 sla-deadline 列
- [ ] sla-deadline 格式: ISO 8601 带时区
- [ ] 心跳脚本可读取 sla-deadline 并判断超时
- [ ] 超时通知推送到 #coord Slack 频道
