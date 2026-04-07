# Epic 3 Spec: 端内 Feedback 收集机制

## DB Schema

```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  project_id TEXT,            -- nullable for anonymous
  user_id TEXT,
  type TEXT NOT NULL,         -- bug | feature | ux | other
  description TEXT NOT NULL,
  url TEXT NOT NULL,          -- 反馈时的页面 URL
  phase TEXT,                 -- context | flow | component
  screenshot_url TEXT,        -- nullable, 最多 5MB
  contact TEXT,               -- nullable email
  status TEXT DEFAULT 'pending', -- pending | reviewed | resolved
  github_issue_id TEXT,       -- nullable
  created_at INTEGER NOT NULL
);
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/feedback | 提交反馈 |
| GET | /api/feedback | PM 查看反馈列表（需权限） |
| PATCH | /api/feedback/:id | 更新状态 |

## Slack Webhook Payload

```json
{
  "text": "🆕 新 Feedback",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*类型*: Bug\n*页面*: /canvas?phase=flow\n*描述*: 导出 JSON 后格式错误\n*时间*: 2026-04-03 10:30"
      }
    }
  ]
}
```

## GitHub Issue Creation

```bash
gh issue create \
  --title "[Feedback] Bug: 导出 JSON 格式错误" \
  --body "反馈类型: Bug\n页面: /canvas?phase=flow\n描述: ...\n反馈时间: ...\n反馈来源: 端内 Feedback 按钮" \
  --label "feedback"
```
