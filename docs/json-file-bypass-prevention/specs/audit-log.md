# Spec: Audit Log Format

## File Location

```
/root/.openclaw/audit/<YYYYMMDD>.jsonl
```

## Entry Format

```json
{
  "time": "2026-03-31T03:17:00.000Z",
  "action": "update",
  "project": "json-file-bypass-prevention",
  "stage": "design-architecture",
  "status": "done",
  "session_key": "agent:architect:main",
  "agent_id": "architect",
  "hostname": "iZuf65icsqaf0z2br172ooZ",
  "details": {}
}
```

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| time | ISO8601 | Yes | Timestamp |
| action | string | Yes | Action type (update, verify, etc.) |
| project | string | Yes | Project name |
| stage | string | Yes | Stage name |
| status | string | Yes | Status (done, rejected, etc.) |
| session_key | string | Yes | Session identifier |
| agent_id | string | Yes | Agent identifier |
| hostname | string | No | Host name |
| details | object | No | Additional details |

## Retention

- Files older than 90 days should be archived
- Archive location: `/root/.openclaw/audit/archive/`
