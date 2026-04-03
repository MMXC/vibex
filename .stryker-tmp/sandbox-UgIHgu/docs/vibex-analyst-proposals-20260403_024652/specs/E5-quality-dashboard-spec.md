# Epic 5 Spec: 质量仪表盘与趋势追踪

## DB Schema

```sql
CREATE TABLE quality_metrics (
  id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL,     -- GitHub Actions run ID
  branch TEXT NOT NULL,
  commit_sha TEXT NOT NULL,
  e2e_pass_rate REAL,         -- 0.0 - 1.0
  e2e_total INTEGER,
  e2e_passed INTEGER,
  ts_errors INTEGER DEFAULT 0,
  test_coverage REAL,         -- 0.0 - 1.0
  build_time_seconds INTEGER,
  created_at INTEGER NOT NULL
);
```

## Data Source

GitHub Actions REST API:
```
GET /repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs
GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs
GET /repos/{owner}/{repo}/actions/runs/{run_id}/artifacts (for test results)
```

轮询脚本: `scripts/quality-sync.js`，在每次 main 分支 CI 完成后触发。

## Alert Logic

```javascript
const latest = getLatestQualityMetrics();
if (latest.e2e_pass_rate < 0.90) {
  sendSlackAlert({
    channel: '#coord',
    message: `⚠️ E2E 通过率低于 90%: ${(latest.e2e_pass_rate * 100).toFixed(1)}%`,
    build_url: latest.build_url
  });
}
```

报警去重: 检查 `quality_alerts` 表，上次报警时间距今 > 24h 才发送。

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/quality/trend | 获取趋势数据（最近 10 次） |

## Trend Response Shape

```json
{
  "e2eTrend": [
    { "date": "2026-03-27", "passRate": 0.95 },
    { "date": "2026-03-28", "passRate": 0.88 },
    ...
  ],
  "tsErrorTrend": [...],
  "lastUpdated": "2026-04-03T02:00:00Z"
}
```
