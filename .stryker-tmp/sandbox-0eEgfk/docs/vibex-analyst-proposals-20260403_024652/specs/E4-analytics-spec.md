# Epic 4 Spec: 设计产物分析指标体系

## DB Schema

```sql
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,   -- 匿名化项目 ID
  event_name TEXT NOT NULL,   -- canvas_phase_entered | node_created | flow_completed | export_triggered
  event_data TEXT,            -- JSON: { phase?, node_type?, format? }
  created_at INTEGER NOT NULL
);
```

## Event Types

| Event | Payload | Trigger |
|-------|---------|---------|
| canvas_phase_entered | `{ phase: 'context' \| 'flow' \| 'component' }` | TabBar 切换 |
| node_created | `{ type: string, phase: string }` | 节点创建 |
| flow_completed | `{ duration_minutes: number }` | 所有 flow 节点 confirmed |
| export_triggered | `{ format: 'json' \| 'markdown' \| 'code' }` | 导出按钮点击 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/analytics/track | 接收埋点事件（支持 batch） |
| GET | /api/analytics/summary | 获取聚合指标 |

## Summary Response Shape

```json
{
  "projectCompletionRate": 0.42,
  "avgNodesPerProject": 8.3,
  "phaseDistribution": {
    "context": 0.35,
    "flow": 0.45,
    "component": 0.20
  },
  "exportFormats": {
    "json": 0.60,
    "markdown": 0.30,
    "code": 0.10
  },
  "period": "7d"
}
```

## Privacy

- 不记录用户 ID、IP、Cookie
- project_id 为一次性随机 UUID，每次新建项目生成
- 数据保留 90 天后自动清理
