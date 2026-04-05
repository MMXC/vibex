# Implementation Plan: Internal Tools Integration

| Epic | 工时 | 交付物 |
|------|------|--------|
| E1: dedup API | 1h | dedup_api.py |
| E2: coord 集成 | 2h | scheduler.py 修改 |
| E3: 告警通知 | 1h | alert.py |
| **合计** | **4h** | |

## 任务分解
| Task | 文件 | 验证 |
|------|------|------|
| E1: API | scripts/dedup_api.py | curl -X POST localhost:8765/dedup |
| E2: coord | coord/scheduler.py | 派发生成时调用 |
| E3: 告警 | coord/alert.py | Slack webhook |

## DoD
- [x] dedup API 存在 — `scripts/dedup_api.py` ✅ commit `e3b1e324`
- [x] coord 派生前调用 dedup — `init_project.sh` 调用 `dedup_check.py` ✅ commit `36ab6f4f`
- [ ] 重复提案告警发送（E3）
