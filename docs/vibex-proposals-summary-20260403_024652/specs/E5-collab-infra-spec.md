# E5 Spec: 协作基础设施

## S5.1 只读分享链接

### DB Schema
```sql
CREATE TABLE share_links (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  permission TEXT DEFAULT 'read',
  created_at INTEGER NOT NULL,
  expires_at INTEGER
);
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/share | 生成分享链接 |
| GET | /api/share/:token | 获取只读项目内容 |

### Share URL
```
https://vibex.app/share/{token}
```

## S5.2 CI 质量仪表盘

### /quality 页面
- 折线图: E2E 通过率（最近 10 次 CI）
- 折线图: TS 错误数趋势
- 表格: 最近 5 次构建详情

### Data Source
GitHub Actions API polling via `scripts/quality-sync.js`

## S5.3 质量报警

### 报警逻辑
```javascript
const latest = getLatestQualityMetrics();
if (latest.e2e_pass_rate < 0.90) {
  sendSlackAlert({
    channel: '#coord',
    message: `⚠️ E2E 通过率低于 90%: ${(latest.e2e_pass_rate * 100).toFixed(1)}%`
  });
}
```

## S5.4 设计版本快照

### DB Schema
```sql
CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### API
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/snapshots | 列表 |
| POST | /api/projects/:id/snapshots | 创建 |
| GET | /api/snapshots/:id | 详情 |

## S5.5 版本对比

### Diff View
- 新增节点: 绿色高亮
- 删除节点: 红色高亮
- 修改节点: 黄色高亮
- 边变化: 同色规则
