# Epic 2 Spec: 设计交接与协作分享

## DB Schema

```sql
CREATE TABLE share_links (
  id TEXT PRIMARY KEY,        -- UUID v4
  project_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL, -- 随机 32 字符
  permission TEXT DEFAULT 'read', -- read | edit
  created_at INTEGER NOT NULL,
  expires_at INTEGER          -- nullable, 7 days default
);

CREATE TABLE collaborators (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_email TEXT NOT NULL,
  permission TEXT DEFAULT 'viewer', -- owner | editor | viewer
  invited_at INTEGER NOT NULL,
  accepted_at INTEGER         -- nullable
);

CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,         -- 用户命名，如 "v1.0 初始设计"
  data TEXT NOT NULL,         -- JSON 序列化完整 canvas 状态
  created_at INTEGER NOT NULL,
  created_by TEXT             -- nullable
);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/projects/:id/share | 生成分享链接 |
| DELETE | /api/share/:token | 撤销分享链接 |
| POST | /api/projects/:id/collaborators | 邀请协作者 |
| DELETE | /api/projects/:id/collaborators/:email | 移除协作者 |
| GET | /api/projects/:id/snapshots | 获取快照列表 |
| POST | /api/projects/:id/snapshots | 创建快照 |
| GET | /api/snapshots/:id | 获取快照详情 |
| GET | /api/snapshots/:id/diff/:otherId | 对比两个快照 |

## Share Link URL Format
```
https://vibex.app/share/{token}
```
只读页面，无 ProjectBar，支持节点查看，不支持编辑。
